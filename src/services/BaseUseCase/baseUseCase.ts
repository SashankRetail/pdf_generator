import { prisma } from "../../prismaConfig";
import hbs from "handlebars";
import Parse from "xml-js";
import html_to_pdf from "html-pdf-node";
import HttpError from "standard-http-error";
import { create as storageService } from "../FileStorageServices/AwsStorage";
import { PDFDocument } from "pdf-lib";
import hummus from "hummus";
import memoryStreams from "memory-streams";
import path from "path";
import NotificationServices from "../../services/Email/notificationService";
const fs = require("fs").promises;

hbs.registerHelper("inc", function (value, _options) {
  return parseInt(value) + 1;
});

export async function GenerateBookingFormAsPdf(data: object, logoBuffer) {
  try {
    const htmlFile = await (await getBuffer("bookingFrom.html")).toString();
    const htmlContinueFile = await (
      await getBuffer("bookingFromContinue.html")
    ).toString();
    const pdf1 = await getGeneratedPdf(data, htmlFile);
    const pdf2 = await getGeneratedPdf(data, htmlContinueFile);
    const pdfBuffer = await combinePDFBuffers(pdf1, pdf2);
    const size = {
      x: 33,
      y: 800,
      width: 130,
      height: 33,
    };
    return await addLogoToPdf(logoBuffer, pdfBuffer, size);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getGeneratedPdf(data, htmlFile) {
  try {
    const template = hbs.compile(htmlFile, { strict: true });
    const html = template(data);
    return await html_to_pdf.generatePdf(
      { content: html },
      {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        format: "A4",
        printBackground: true,
        margin: { top: "1.5cm", right: "1cm", bottom: "0cm", left: "1cm" },
      }
    );
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}

export async function addLogoToPdf(logoBuffer, existingPdfBytes, size) {
  try {
    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pngImage = await pdfDoc.embedPng(logoBuffer);
    const pages = await pdfDoc.getPages();
    for await (const page of pages) {
      await page.drawImage(pngImage, size);
    }
    const pdfBytes = await pdfDoc.save();
    await Buffer.from(pdfBytes).toString("base64");
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}

export async function combinePDFBuffers(firstBuffer, secondBuffer) {
  const outStream = new memoryStreams.WritableStream();
  try {
    const firstPDFStream = new hummus.PDFRStreamForBuffer(firstBuffer);
    const secondPDFStream = new hummus.PDFRStreamForBuffer(secondBuffer);
    const pdfWriter = hummus.createWriterToModify(
      firstPDFStream,
      new hummus.PDFStreamForResponse(outStream)
    );
    pdfWriter.appendPDFPagesFromPDF(secondPDFStream);
    pdfWriter.end();
    const newBuffer = outStream.toBuffer();
    outStream.end();
    await Buffer.from(newBuffer).toString("base64");
    return newBuffer;
  } catch (error) {
    outStream.end();
    console.log(error);
    throw new HttpError(500, "Error during PDF combination: " + error.message);
  }
}

export async function UploadFileOnS3(attachment) {
  const key = attachment.key;
  const fileObj = await storageService({
    accessKeyId: process.env.awsAccessKeyId,
    secretAccessKey: process.env.awsSecretAccessKey,
    region: process.env.awsRegion,
    bucket: process.env.awsBucket,
  }).uploadDocumentBuffer(key, attachment.contentType, attachment.base64);
  console.log(fileObj);
  const attachmentObj: {
    filekey: string;
    location: string;
    contenttype: string;
    user?: number;
    customer?: number;
    ispreorpost?: number;
    momid?: number;
    commentid?: number;
    leadid?: string;
    opportunityid?: string;
    displayname?: string;
    created_at?: Date;
  } = {
    filekey: key,
    location: fileObj.Location,
    contenttype: attachment.contentType,
    customer: attachment.customerid,
    user: attachment.userid,
    ispreorpost: attachment.ispreorpost,
    leadid: attachment.leadid,
    opportunityid: attachment.opportunityid,
    momid: attachment.momid,
    commentid: attachment.commentid,
    displayname: attachment.displayname,
    created_at: new Date(),
  };
  const saveToDb = await prisma.dc_attachments.upsert({
    where: {
      location: attachmentObj.location,
    },
    update: attachmentObj,
    create: attachmentObj,
  });
  console.log(saveToDb);
  return fileObj;
}

export const deleteBlob = async (keys) => {
  return storageService({
    accessKeyId: process.env.awsAccessKeyId,
    secretAccessKey: process.env.awsSecretAccessKey,
    region: process.env.awsRegion,
    bucket: process.env.awsBucket,
  }).deleteFromAws(keys);
};

export async function getBuffer(key) {
  return storageService({
    accessKeyId: process.env.awsAccessKeyId,
    secretAccessKey: process.env.awsSecretAccessKey,
    region: process.env.awsRegion,
    bucket: process.env.awsBucket,
  }).getBuffer(key);
}

//#region XMLToPDF
export async function XmlToPdf(xmlObj) {
  try {
    const {
      file,
      type,
      discount,
      customerId,
      opportunityId,
      leadid,
      displayname,
    } = xmlObj;
    let pdfName;
    const attachmentObj = await prisma.dc_attachments.findFirst({
      where: {
        location: file,
      },
    });
    let _commonRoomList = [];
    const xml: any = await getBuffer(attachmentObj.filekey);
    const result = await Parse.xml2json(xml, {
      compact: true,
      spaces: 4,
    });
    const mainObj = JSON.parse(result);
    // modular/siteService
    const clientName = mainObj.XML.Order.Head.CONTACT_ADDRESS1._text;
    // modular/siteService fixed Discount
    const absoluteDiscount = parseInt(
      mainObj.XML.Order.Head.CUSTOM_INFO5._text
    );
    // Populating data for modular response
    if (type === "modularXml") {
      pdfName = `${customerId}_${clientName}modular_myQuote.pdf`;
    }
    // Populating data for modular response
    else if (type === "siteServiceXml") {
      pdfName = `${customerId}_${clientName}site_myQuote.pdf`;
    }
    // roomsList Object with names, prices and metadata
    _commonRoomList = getRoomListArrayFromXmlData(mainObj, _commonRoomList);
    // generate pdf in base64 & upload to blob.
    const Obj = {
      parsedData: mainObj,
      roomsArray: _commonRoomList,
      discount: discount,
      absoluteDiscount,
      opportunityId,
      clientOrProjectName: clientName,
    };
    const bufferWithoutLogo = await generatePDF(Obj);
    const logoBuffer = await getBuffer("logo/Logo.png");
    const size = {
      x: 50,
      y: 750,
      width: 160,
      height: 50,
    };
    const pdfBuffer = await addLogoToPdf(logoBuffer, bufferWithoutLogo, size);
    const ObjS3Details = {
      key: pdfName,
      contentType: "application/pdf",
      base64: pdfBuffer,
      leadid,
      displayname,
    };
    // PDF base64 uploading to s3 bucket.
    const toS3 = await UploadFileOnS3(ObjS3Details);
    return {
      roomList: _commonRoomList,
      s3Location: toS3,
      clientName: clientName,
    };
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}
//#endregion

//#region Pdf Generation
export async function generatePDF(_data) {
  try {
    const {
      parsedData,
      roomsArray,
      discount,
      absoluteDiscount,
      isPmFeeIncluded,
      cityPmFee,
      clientOrProjectName,
    } = _data;
    //#region Proposal & Expiry dates
    function isLeapYear(year) {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }
    function getDaysInMonth(year, month) {
      return [
        31,
        isLeapYear(year) ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
      ][month];
    }
    function addMonths(date, value) {
      const d = new Date(date);
      const n = date.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + value);
      d.setDate(Math.min(n, getDaysInMonth(d.getFullYear(), d.getMonth())));
      return d;
    }
    function formatDate(input) {
      const datePart = input.toString().split("-");
      return `${datePart[2]}-${datePart[1]}-${datePart[0]}`;
    }
    const currentDate = formatDate(new Date().toISOString().slice(0, 10));
    const nextMonth = formatDate(
      addMonths(new Date(), 1).toISOString().slice(0, 10)
    );
    //#endregion

    // Populating tables with roomwise prices, discount and Gst;
    let sum = 0,
      discountAmount = 0,
      afterDiscount = 0,
      gst = 0,
      finalTotal = 0;
    let pmFee = 0;
    roomsArray.forEach((element) => {
      sum += +element.roomPrice;
    });
    discountAmount = (sum * discount) / 100;
    afterDiscount = sum - (absoluteDiscount + discountAmount);
    if (cityPmFee && isPmFeeIncluded) {
      pmFee = (sum * 7) / 100;
      afterDiscount += pmFee;
    }
    gst = (afterDiscount * 18) / 100;
    finalTotal = afterDiscount + +gst;
    // Object to be passed into the handlebars html template.
    const Obj = {
      DATES: {
        proposalDate: currentDate,
        expiryDate: nextMonth,
      },
      PARSE_XML: parsedData,
      ROOMS: roomsArray,
      clientOrProjectName,
      PRICE_PROPS: {
        sum: parseFloat(sum.toFixed(2)) || 0,
        gst: parseFloat(gst.toFixed(2)) || 0,
        ...(pmFee && {
          pmFee: parseInt(pmFee.toFixed(2)),
        }),
        subTotal: parseFloat(afterDiscount.toFixed(2)),
        finalTotal: parseFloat(finalTotal.toFixed(2)),
        absoluteDiscount,
        discountPercent: discount,
        discountAmount: discountAmount.toFixed(2),
      },
    };

    //#region  Use while deploying to aws
    const htmlFile = await fs.readFile(
      path.join(`${process.cwd()}/src/domain/pdf`, "template.html"),
      "utf8"
    );

    const template = await hbs.compile(htmlFile);
    //#endregion

    //#region Handlebar helpers
    // handlebar helper for hide/show discount div.
    hbs.registerHelper("discount", function (discountt, opt) {
      return discountt === 0 ? opt.inverse(this) : opt.fn(this);
    });
    // handlebar helper for replacing nulls with --.
    hbs.registerHelper("parsedData", function (data, opt) {
      return data ? opt.fn(this) : opt.inverse(this);
    });
    // handlebar helper for incrementing index
    hbs.registerHelper("inc", function (value, _options) {
      return parseInt(value) + 1;
    });
    // handlebar helper for quantity check in each component
    hbs.registerHelper("quant", function (value, opt) {
      return value ? opt.fn(this) : opt.inverse(this);
    });
    //handlebar helper for totalCompCost check in component
    hbs.registerHelper("compCost", function (value, opt) {
      return value ? opt.fn(this) : opt.inverse(this);
    });
    //handlebar helper for 7% pm value
    hbs.registerHelper("pmFees", function (value, opt) {
      return value ? opt.fn(this) : opt.inverse(this);
    });
    //#endregion
    const finalHtml = await template(Obj);
    const pdfResponse = await html_to_pdf.generatePdf(
      { content: finalHtml, timeout: 0 },
      {
        format: "A4",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        printBackground: true,
        displayHeaderFooter: true,
        margin: { top: "4cm", bottom: "1cm", left: "1cm", right: "1cm" },
        headerTemplate: `<span style="display: flex;margin-left: 1em; margin-right: 1em;
            font-size: 16px;justify-content: space-between;width: 300mm">
            <span style="margin-left: 2em;">
            </span><h5 style="margin-right:1em">MORE ROOM FOR JOY</h5></span>`,
        footerTemplate: `<div style="text-align: right;width: 297mm;font-size: 8px;">
          <span style="margin-right: 1cm"><span class="pageNumber">
          </span> of <span class="totalPages"></span></span></div>`,
      }
    );
    return pdfResponse.toString("base64");
  } catch (error) {
    console.log(570, error);
    throw error;
  }
}
//#endregion

//#region roomList Object Create.
//#region Get room Names
export function getRoomNames(builderList) {
  try {
    const roomsArr = [];
    let count = 1;
    let roomNameObj;
    let roomNameFromSplit;
    let _list = [];
    if (!Array.isArray(builderList)) {
      _list.push(builderList);
    } else {
      _list = builderList;
    }
    _list.forEach((element) => {
      if (count === Math.floor(element.hierarchicalPos._text)) {
        roomNameFromSplit = element.PVarString._text.split("ROOMNAME:=");
        if (!roomNameFromSplit[1]) {
          throw new Error(
            "Room name not found. Please upload appropriate Xml!"
          );
        }
        roomNameObj = roomNameFromSplit[1];
        roomsArr.push(roomNameObj);
        count++;
      }
    });
    return roomsArr;
  } catch (error) {
    throw new HttpError(500, error);
  }
}
//#endregion

// generate roomList from xml data.
export function getRoomListArrayFromXmlData(xmlJsonObj, roomList) {
  try {
    const builderList = xmlJsonObj.XML.Order.BuilderList.Set;
    let _list = [];
    if (!Array.isArray(builderList)) {
      _list.push(builderList);
    } else {
      _list = builderList;
    }
    let roomsArr = [];
    roomsArr = getRoomNames(_list);
    roomList = addRoomNamesAndReturnRoomList(roomList, roomsArr);
    roomList = addComponentDataToRoomListAndReturn(roomList, _list);
    return roomList;
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}

// Adding roomnames to RoomList array.
export function addRoomNamesAndReturnRoomList(roomList, roomsArr) {
  try {
    let obj;
    for (const room of roomsArr) {
      obj = {
        custRoomName: "",
        roomPrice: "",
        roomCost: "",
        compData: [],
        roomName: "",
        totalQuantity: "",
      };
      obj.custRoomName = room;
      obj.roomName = room;
      roomList.push(obj);
    }
    return roomList;
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}

// Adding component Meta data for each room in roomList.
export function addComponentDataToRoomListAndReturn(roomList, compSet) {
  try {
    let compObj;
    roomList.forEach((room, index) => {
      let price = 0,
        totalQuantity = 0;
      compSet.forEach((comp) => {
        compObj = {
          componentCost: 0,
          description: "",
          componentName: "",
          componentImage: "",
          componentIndex: "",
          quantity: 0,
          totalCompCost: 0,
        };
        if (Math.floor(comp.hierarchicalPos._text) === index + 1) {
          compObj.componentIndex = comp.hierarchicalPos._text;
          compObj.componentCost = +comp.ARTICLE_PRICE_INFO1._text;
          compObj.componentName = comp.ARTICLE_TEXT_INFO1._text;
          compObj.description = comp.ARTICLE_TEXT_INFO2._text;
          compObj.componentImage = comp.ARTICLE_IMAGE._text
            ? comp.ARTICLE_IMAGE._text
            : "";
          compObj.quantity = +comp.Count._text;
          compObj.totalCompCost = +compObj.quantity * +compObj.componentCost;
          room.compData.push(compObj);
          price += +compObj.totalCompCost;
          totalQuantity += compObj.quantity;
          return;
        }
      });
      room.roomPrice = price.toFixed(2);
      room.roomCost = price.toFixed(2);
      room.totalQuantity = totalQuantity;
    });
    return roomList;
  } catch (error) {
    console.log(error);
    throw new HttpError(500, error);
  }
}
//#endregion

export const triggerEmailNotification = async (
  to,
  subject,
  content,
  cc,
  attachments = null
) => {
  const notificationService = new NotificationServices();
  return notificationService.sendEmail(
    null,
    to,
    subject,
    content,
    cc,
    null,
    attachments
  );
};

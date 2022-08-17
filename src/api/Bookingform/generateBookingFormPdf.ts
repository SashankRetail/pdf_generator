import httpError from "standard-http-error";
import {
  GenerateBookingFormAsPdf,
  getBuffer,
  UploadFileOnS3,
} from "../../services/BaseUseCase/baseUseCase";

export const generateBookingFormPdf = async (req, _res) => {
  try {
    const logoBuffer = await getBuffer("logo/Logo.png");
    const pdfBuffer = await GenerateBookingFormAsPdf(req.body, logoBuffer);
    const fileName = `BookingForm/${req.body.dcCode}-bookingForm.pdf`;
    const response = await UploadFileOnS3({
      key: fileName,
      contentType: "application/pdf",
      base64: pdfBuffer,
      leadid: req.body.leadId,
      customer: req.body.customerId,
      displayname: "Booking Form",
    });
    return {
      code: 200,
      message: "success",
      data: response ? response : {},
    };
  } catch (error) {
    console.log(error);
    throw new httpError(500, error);
  }
};

import httpError from "standard-http-error";
import { prisma } from "../../prismaConfig";
import {
  generatePDF,
  getBuffer,
  addLogoToPdf,
  UploadFileOnS3,
} from "../../services/BaseUseCase/baseUseCase";
import { triggerEmailNotification } from "../../services/BaseUseCase/baseUseCase";
import {
  proposalOpportunityEmailTemplate,
  proposalProjectEmailTemplate,
} from "../../templates/emailTemplate";
import { addPdfToMilestone } from "../../domain/utilities";
export const generateProposalPdf = async (req, _res) => {
  try {
    const _args = req.body;
    const bufferWithoutLogo = await generatePDF(_args);
    const logoBuffer = await getBuffer("logo/Logo.png");
    const size = {
      x: 50,
      y: 750,
      width: 160,
      height: 50,
    };
    const pdfBuffer = await addLogoToPdf(logoBuffer, bufferWithoutLogo, size);

    const ObjS3Details = {
      key: _args.pdfName,
      contentType: "application/pdf",
      base64: pdfBuffer,
      leadid: _args.leadId,
      displayname: _args.displayName,
      opportunityid: _args.opportunityId,
    };
    // PDF base64 uploading to s3 bucket.
    const pdfUrl = await UploadFileOnS3(ObjS3Details);
    if (_args.quoteId) {
      const quoteData = {};
      if (_args.displayName === "Modular Quotation") {
        quoteData["quote_link__c"] = pdfUrl.Location;
      }
      if (_args.displayName === "Site Service Quotation") {
        quoteData["site_services_pdf__c"] = pdfUrl.Location;
      }
      await prisma.quote.update({
        where: {
          postgres_id__c: _args.quoteId,
        },
        data: quoteData,
      });
      console.log("first email triggered");
      await triggerEmailNotification(
        // "sashank@partner.designcafe.com",
        _args.designerEmail,
        "Proposal Pdf Generated",
        proposalOpportunityEmailTemplate(
          _args.designerName,
          _args.opportunityName,
          `${process.env.urlForDDUI}/leads/completed-details?table=completed_leads&sfid=${_args.leadId}&oppourtunityId=${_args.opportunityId}`
        ),
        null
      );
    }

    if (_args.projectId) {
      const urlIntoMilestone = {
        filekey: _args.pdfName,
        contenttype: "application/pdf",
        location: pdfUrl.Location,
      };
      const projectMeta = await prisma.dc_projects.findFirst({
        where: {
          id: _args.projectId,
        },
        include: {
          designer: true,
        },
      });
      await addPdfToMilestone(projectMeta, _args.quoteType, urlIntoMilestone);
      const designerName = [
        projectMeta.designer.firstname,
        projectMeta.designer.middlename,
        projectMeta.designer.lastname,
      ].join(" ");
      await triggerEmailNotification(
        // "sashank@partner.designcafe.com",
        projectMeta.designer.designcafeemail,
        "Proposal Pdf Generated",
        proposalProjectEmailTemplate(
          designerName,
          projectMeta.projectname,
          `${process.env.urlForDDUI}/projects/${_args.projectId}`
        ),
        null
      );
    }
    console.log("success");
    return {
      code: 200,
      message: "success",
    };
  } catch (error) {
    console.log(error);
    throw new httpError(500, error);
  }
};

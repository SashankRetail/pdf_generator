import { prisma } from "../prismaConfig";

export const addPdfToMilestone = async (_project, _checklistType, _file) => {
  const filesChecklistData = _project?.milestones?.attributes?.files_checklist;
  filesChecklistData.forEach((val) => {
    if (val.length !== 0 && val?.checklist_string === _checklistType) {
      val.filekey = _file.key;
      val.fileurl = _file.location;
      val.contentType = _file.contentType;
      const res = getApprovalStatus(val.approval_from_customer);
      val.approvalstatus = res.status;
      val.sentondate = res.sentOnDate;
      val.uploadedon = new Date();
      val.created_at = new Date();
      val.updated_at = new Date();
    }
  });
  _project.milestones.attributes.files_checklist = filesChecklistData;
  const dataObj = {
    milestones: _project.milestones,
  };
  const quoteObj = {};
  if (_checklistType === "Modular Quotation") {
    dataObj["quotelink"] = _file.location;
    quoteObj["modularpdflocation"] = _file.location;
  }
  if (_checklistType === "Site Services Quotation") {
    dataObj["siteservicepdflink"] = _file.location;
    quoteObj["siteservicepdflocation"] = _file.location;
  }
  await prisma.dc_project_quotes.update({
    where: { id: _project.quoteid },
    data: quoteObj,
  });
  await prisma.dc_projects.update({
    where: { id: _project.id },
    data: dataObj,
  });
};

export const getApprovalStatus = (approvalRequiredstatus) => {
  let status, sentOnDate;
  if (approvalRequiredstatus) {
    status = "Pending Approval";
    sentOnDate = new Date();
  } else {
    status = null;
    sentOnDate = null;
  }
  return { status, sentOnDate };
};

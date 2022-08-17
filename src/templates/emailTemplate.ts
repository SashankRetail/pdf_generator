export const proposalOpportunityEmailTemplate = (
  designer,
  opportunityName,
  opportunityUrl
) => {
  return `
    Hi ${designer}, <br>
    Quote has been added for your opportunity ${opportunityName}.
    Click on the link below to view opportunity and quote details. <br>
    ${opportunityUrl} <br>
    -Team DC
   `;
};

export const proposalProjectEmailTemplate = (
  designer,
  projectName,
  projectUrl
) => {
  return `
      Hi ${designer}, <br>
      Quote has been added for your project ${projectName}.
      Click on the link below to view project and quote details. <br>
      ${projectUrl} <br>
      -Team DC
     `;
};

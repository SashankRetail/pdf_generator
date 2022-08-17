import { GraphQLClient } from "graphql-request";
import { webhookMutation } from "./utility";
export const webhookCallbackApi = async (req, _res) => {
  try {
    const requestData = {
      body: req.body,
    };
    const chanllengeData = req.body;
    if (chanllengeData.challenge) {
      console.log("Received verification callback");
      return {
        status: 200,
        smartsheetHookResponse: chanllengeData.challenge,
      };
    } else if (chanllengeData.events) {
      const graphQLClient = new GraphQLClient(process.env.DDAPPLICATION, {});
      // pdfGenerateMutation
      const response = await graphQLClient.request(
        webhookMutation,
        requestData
      );
      return {
        code: response.webHookCallBack.code,
        message: response.webHookCallBack.message,
      };
    } else if (chanllengeData.newWebHookStatus) {
      return {
        sendStatus: 200,
      };
    } else {
      console.log(`Received unknown callback: ${chanllengeData}`);
      return {
        sendStatus: 200,
      };
    }
  } catch (error) {
    console.log(error);
    return { code: 500, message: error };
  }
};

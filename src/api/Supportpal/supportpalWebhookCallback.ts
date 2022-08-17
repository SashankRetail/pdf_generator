import { GraphQLClient } from "graphql-request";
import { supportpalWebhookQuery } from "./utility";
export const supportpalWebhookCallbackApi = async (req, _res) => {
  try {

    const ticketID = parseInt(req.query.id)
    const requestData = {
      ticket_id: ticketID
    }

    const graphQLClient = new GraphQLClient(process.env.DDAPPLICATION, {});
    const response = await graphQLClient.request(
      supportpalWebhookQuery,
      requestData
    );

    return {
      code: response.webHookTicket.code,
      message: response.webHookTicket.message,
    };

  } catch (error) {
    console.log(error);
    return { code: 500, message: error };
  }
};

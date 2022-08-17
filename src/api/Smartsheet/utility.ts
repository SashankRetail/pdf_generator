import { gql } from "graphql-request";
export const webhookMutation = gql`
  mutation WebHookCallBack($body: JSON) {
    webHookCallBack(body: $body) {
      code
      message
    }
  }
`;

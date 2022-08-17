import { gql } from "graphql-request";
export const supportpalWebhookQuery = gql`
query Query($ticket_id: Int!) {
  webHookTicket(ticket_id: $ticket_id) {
    code
    message
  }
}
`;

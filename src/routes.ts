import * as express from "express";
import bookingFormPdfRouter from "./api/Bookingform/routes";
import proposalPdfRouter from "./api/Quotes/routes";
import webhookMutationRouter from "./api/Smartsheet/routes";
import supportpalWebhook from "./api/Supportpal/routes";

const routes = express.Router();

routes.use("/", bookingFormPdfRouter);
routes.use("/", proposalPdfRouter);
routes.use("/", webhookMutationRouter);
routes.use("/", supportpalWebhook);

export default routes;

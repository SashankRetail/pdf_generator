import * as express from "express";
import { supportpalWebhookCallbackApi } from "./supportpalWebhookCallback";

const router = express.Router();
router.get("/supportpal-hook", async (req, res) => {
  const data = await supportpalWebhookCallbackApi(req, res);
  res.send(data);
});

export default router;

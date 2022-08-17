import * as express from "express";
import { webhookCallbackApi } from "./webhookCallback";
const router = express.Router();

router.post("/webhookMutation", async (req, res) => {
  const data = await webhookCallbackApi(req, res);
  res.send(data);
});

export default router;

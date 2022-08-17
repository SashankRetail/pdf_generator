import * as express from "express";
import { generateBookingFormPdf } from "./generateBookingFormPdf";

const router = express.Router();

router.put("/generateBookingFormPdf", async (req, res) => {
  res.send(await generateBookingFormPdf(req, res));
});

export default router;

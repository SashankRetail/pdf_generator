import * as express from "express";
import { generateProposalPdf } from "./generateProposalPdf";

const router = express.Router();

router.put("/generateProposalPdf", async (req, res) => {
  res.send(await generateProposalPdf(req, res));
});

export default router;

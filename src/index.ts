import express from "express";
import routes from "./routes";
import config from "./config";
import cors from "cors";
require("dotenv").config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use("/", routes);

app.listen(config.PORT, () => {
  console.log("Server started at http://localhost:" + config.PORT);
});

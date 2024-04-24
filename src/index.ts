import express, { Application, Request, Response, NextFunction } from "express";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { env } from "process";
import { connectMongooseClient } from "./connections/mongoConnect";
import limiter from "./helpers/rateLimitHelper";

const app: Application = express();

// setting which path i want the limiter to be applied at
app.use("/v1/auth", limiter(4));
app.use("/v1/property", limiter(20));

// app.use("/v1/property", limiter);
app.use(express.json());
dayjs().format();
dotenv.config();

connectMongooseClient();

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello World!");
});

const userRoute = require("./routes/users");
const propertyRoute = require("./routes/property");

app.use("/v1/auth", userRoute);
app.use("/v1/property", propertyRoute);

const PORT = env.PORT || 3000;
app.listen(PORT, () => console.log("Server is running on port: ", PORT));

import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
const app: Application = express();
dayjs().format();
// Progect Name: firstexpress
//cluster name: expressdb
// Username: aqibdotjs
// Password: Liveandlive7
// mongodb+srv://aqibdotjs:<password>@expressdb.lpxdmqu.mongodb.net/
// connection to mongo DB atlas
mongoose
  .connect(
    "mongodb+srv://aqibdotjs:xMqczyHzFZtiI8Gl@expressdb.lpxdmqu.mongodb.net/?retryWrites=true&w=majority&appName=expressdb"
  )
  .then(() => {
    console.log("connected to db");
  })
  .catch(() => {
    console.log("connection failed");
  });

const greet: string = "Jello!";

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send(greet);
});
// connecting to server
app.listen(3000, () => console.log("Server is running!"));

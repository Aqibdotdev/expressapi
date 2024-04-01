import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import { User } from "./models/user";
import dotenv from "dotenv";
const app: Application = express();
app.use(express.json());
dayjs().format();
dotenv.config();
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
// Sign Up
app.post("/v1/auth/signup", async (req: Request, res: Response) => {
  try {
    const user = req.body; //getting user data from body

    const { name, email, password } = user;
    const checkIfEmailExist = await User.findOne({
      email: email,
    });
    // console.log(checkIfEmailExist);
    if (checkIfEmailExist) {
      res.status(400).json({ message: "Email already exist" });
      return;
    }
    const newUser = await User.create({ name, email, password });
    res.status(200).json({
      message: "User Created.",
      user: newUser,
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
});
// Signin
app.post(
  "/v1/auth/signin",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.body;
      const { email, password } = user;
      const checkIfUserExist = await User.findOne({
        email: email,
      });
      console.log(checkIfUserExist);
      if (!checkIfUserExist) {
        res.status(404).json({ message: "User does not exist." });
        return;
      }
      let isPasswordMatched;
      if (checkIfUserExist) {
        isPasswordMatched = checkIfUserExist.password === password;
      }
      if (!isPasswordMatched) {
        res.status(400).json({ message: "Invalid password" });
        return;
      }
      // JWT
      const jwtToken = jwt.sign(
        {
          _id: checkIfUserExist?._id,
          email: checkIfUserExist?.email,
          name: checkIfUserExist.name,
        },
        process.env.ACCESS_TOKEN_SECRET as any
      );
      res
        .status(200)
        .json({ message: "Successfully login", jwtToken: jwtToken });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);
// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as any,
    (error: any, user: any) => {
      if (error) return res.sendStatus(403);
      req.body = user;
      next();
    }
  );
}
// connecting to server
app.listen(3000, () => console.log("Server is running!"));

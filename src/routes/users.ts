import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "../models/user";

const router = express.Router();

// router.post('/v1/ss', (req: Request, res: Response) => {

// });

// Sign Up
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const user = req.body; //getting user data from body

    console.log(user);

    const { name, email, password } = user;
    const checkIfEmailExist = await User.findOne({
      email: email,
    });

    if (checkIfEmailExist) {
      res.status(400).json({ message: "Email already exist" });
      return;
    }
    //hashing password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log(newUser + " newUser");
    console.log(password + "  su p");
    // /
    const jwtToken = jwt.sign(
      {
        name: name,
        email: email,
        _id: newUser?._id,
      },
      process.env.ACCESS_TOKEN_SECRET as any,
      { expiresIn: "10m" }
    );
    //  /
    res.status(200).json({
      message: "User Created.",
      user: newUser,
      jwtToken: jwtToken,
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
});
// Signin
router.post("/signin", async (req: any, res: Response) => {
  console.log(req.body);
  const user = req.body;
  const { email, password } = user;
  try {
    const checkIfUserExist = await User.findOne({
      email: email,
    });
    console.log(checkIfUserExist + "chekuser");
    if (!checkIfUserExist) {
      return res.status(404).json({ message: "User does not exist." });
    }
    let isPasswordMatched;
    if (checkIfUserExist) {
      isPasswordMatched = await bcrypt.compare(
        password,
        checkIfUserExist.password
      );
    }
    if (!isPasswordMatched) {
      return res.status(401).json({ message: "Invalid password" });
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
    res.status(200).json({ message: "Successfully login", jwtToken: jwtToken });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

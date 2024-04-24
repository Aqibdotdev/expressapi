import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export default function authenticateToken(
  req: any,
  res: any,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"]; // getting header

  console.log(authHeader + " auth");
  console.log(req.headers + " Header");

  const token = authHeader && authHeader.split(" ")[1]; //getting token from header
  if (token == null) return res.status(401).json({ message: "token empty" });

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as any,
    (error: any, user: any) => {
      if (error) return res.sendStatus(403);

      req.createdBy = user.email;
      console.log("createdBy: ", req.createdBy);
      next(); //to move on from middleware
    }
  );
}

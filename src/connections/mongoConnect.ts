import mongoose from "mongoose";

export const connectMongooseClient = () =>
  mongoose
    .connect(process.env.MONGO_DB_URL || "")
    .then(() => {
      console.log("connected to db");
    })
    .catch(() => {
      console.log("connection failed");
    });

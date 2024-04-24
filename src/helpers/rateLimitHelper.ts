import rateLimit from "express-rate-limit";

// setting limiter
const limiter = (limit: number) =>
  rateLimit({
    max: limit,
    windowMs: 60 * 60 * 1000,
    message: "Access limit reached, kindly try after 1 Hr",
  });

export default limiter;

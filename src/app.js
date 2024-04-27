import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use(
  express.json({
    limit: "20kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// All Routes

import userRouter from "./routes/user.routes.js";

// Route Declaration

app.use("/api/users",userRouter)












export { app };

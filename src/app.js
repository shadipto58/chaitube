import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET, POST, DELETE , PATCH , PUT",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// All Routes

import userRouter from "./routes/user.routes.js";

// Route Declaration

app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Chaitube");
});

export { app };

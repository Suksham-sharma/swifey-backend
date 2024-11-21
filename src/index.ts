// Required dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

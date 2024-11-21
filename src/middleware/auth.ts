import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../utils/helpers";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const userInfo = verifyAuthToken(token);

  if (!userInfo.id) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = userInfo.id;

  next();
};

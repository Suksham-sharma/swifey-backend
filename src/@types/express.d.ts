// give express global a type of user
import { Request } from "express";

declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      role?: string;
    }
  }
}

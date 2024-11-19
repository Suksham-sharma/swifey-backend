import { Router } from "express";
import { Request, Response } from "express";
import { userRegisterData } from "../dtos/auth-dto";
import { registerUser } from "../controllers/auth-controller";

export const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const registerUserPayload = userRegisterData.safeParse(req.body);
    if (!registerUserPayload.success) {
      throw new Error("Invalid format , not Valid");
    }

    const registeredUser = await registerUser(registerUserPayload.data);
    res.json({ registeredUser, message: "User registered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

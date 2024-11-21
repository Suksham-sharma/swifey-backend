import { Router } from "express";
import { Request, Response } from "express";
import { userRegisterData, userSignInData } from "../dtos/auth-dto";
import { registerUser, signInUser } from "../controllers/auth-controller";

export const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const registerUserPayload = userRegisterData.safeParse(req.body);
    if (!registerUserPayload.success) {
      throw new Error("Invalid format , not Valid");
    }

    const registeredUser = await registerUser(registerUserPayload.data);
    if (!registeredUser.status) {
      throw new Error(registeredUser.error);
    }
    res.json({ registeredUser, message: "User registered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const signinUserPayload = userSignInData.safeParse(req.body);
    if (!signinUserPayload.success) {
      throw new Error("Invalid format , not Valid");
    }

    const signedInUser = await signInUser(signinUserPayload.data);
    if (!signedInUser.status) {
      throw new Error(signedInUser.error);
    }
    res.json({ signedInUser, message: "User signed in successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

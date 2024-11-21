import { Router } from "express";
import { Request, Response } from "express";
import {
  dislikeUser,
  getAllUsers,
  getPotentialMatches,
  getUserMatches,
  likeUser,
} from "../controllers/user-controllers";
import { authenticateToken } from "../middleware/auth";

export const userRouter = Router();

userRouter.get(
  "/potential-matches/:userId",
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const potentialMatches = await getPotentialMatches(userId);
      res.json({ potentialMatches });
    } catch (error: any) {
      res.status(400).json({ message: "Internal Server Error " });
    }
  }
);

userRouter.get("/all", async (req: Request, res: Response) => {
  try {
    const allUsers = await getAllUsers();
    res.json({ allUsers });
  } catch (error: any) {
    res.status(400).json({ message: "Internal Server Error " });
  }
});

userRouter.post(
  "/like/:potentialId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const potentialId = req.params.potentialId;

      const likeResponse = await likeUser(userId, potentialId);

      if (!likeResponse) {
        throw new Error("Internal Server Error");
      }

      if (!likeResponse.isMatch) {
        res.json({
          message: "User liked successfully",
          action: "like",
          potentialId: potentialId,
          userId: userId,
        });
        return;
      }

      if (likeResponse.user) {
        res.json({ "User got a match": likeResponse.user, action: "matched" });
      }
    } catch (error: any) {
      res.json(400).json({ message: "Internal Server Error " });
    }
  }
);

userRouter.post(
  "/dislike/:potentialId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const potentialId = req.params.potentialId;

      const dislikedResponse = await dislikeUser(userId, potentialId);
      res.json(dislikedResponse);
    } catch (error: any) {
      res.json(500).json({ error: "Internal Server Error" });
    }
  }
);

userRouter.get(
  "/matches",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      console.log(userId);

      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userMatches = await getUserMatches(userId);
      console.log(userMatches);

      res.json({ data: userMatches });
    } catch (error: any) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

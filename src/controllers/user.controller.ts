import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { RegisterUserDTO } from "../types/user";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../errors/AppError";

export const userController = {
  register: async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const user: RegisterUserDTO = { username, email, password };

    const result = await userService.register(user);

    sendSuccess(res, "User Created Successfully", result, 201);
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await userService.login(email, password);

    sendSuccess(res, "Logined", result);
  },

  googleLogin: async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== "string") {
      throw new AppError("idToken is required", 400);
    }

    const result = await userService.googleLogin(idToken);

    sendSuccess(res, "Google login successful", result, 200);
  },


  getUserForPublicProfile: async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) throw new AppError("Invalid username", 400);

    const result = await userService.getUserForPublicProfile(
      username.toString(),
    );

    sendSuccess(res, "user fetched successfully.", result);
  },

  verifyEmail: async (req: Request, res: Response) => {
    const { token } = req.query;

    const result = await userService.verifyEmail(String(token));

    sendSuccess(res, "Email Verified", result);
  },

  getMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return;
    const result = await userService.getMe(userId);

    sendSuccess(res, "user Fetched successfully", result);
  },

  updateMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) return;
    const result = await userService.updateMe(userId, req.body, req?.file);
    sendSuccess(res, "user updated successfully", result);
  },
};

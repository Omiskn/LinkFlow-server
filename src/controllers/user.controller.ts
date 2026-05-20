import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { RegisterUserDTO } from "../types/user";
import { sendSuccess } from "../utils/apiResponse";

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

    sendSuccess(res, "Logined", result, 200);
  },

  verifyEmail: async (req: Request, res: Response) => {
    const { token } = req.query;

    const result = await userService.verifyEmail(String(token));

    sendSuccess(res, "Email Verified", result, 200);
  },

  getMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return;

    const result = await userService.getMe(userId);

    sendSuccess(res, "user Fetched successfully", result, 200);
  },

  updateMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) return;
    console.log("file :", req?.file, req.body);
    const result = await userService.updateMe(userId, req.body, req?.file);
    sendSuccess(res, "user updated successfully", result, 200);
  },
};

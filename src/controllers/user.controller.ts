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
    // res.status(201).json(result);
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await userService.login(email, password);

    sendSuccess(res, "Logined", result, 200);
    // res.status(200).json(result);
  },
};

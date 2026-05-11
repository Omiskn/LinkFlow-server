import { userRepository } from "../repositories/user.repository";
import { AppError } from "../errors/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { RegisterUserDTO } from "../types/user";

export const userService = {
  register: async ({ username, email, password }: RegisterUserDTO) => {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("Email already exists", 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await userRepository.create({
      username,
      email,
      password_hash: hashedPassword,
      display_name: username,
    });

    const token = generateToken(user.user_id);

    return {
      user,
      token,
    };
  },

  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password_hash) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordCorrect = await comparePassword(
      password,
      user.password_hash
    );

    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken(user.user_id);

    return {
      user,
      token,
    };
  },
};

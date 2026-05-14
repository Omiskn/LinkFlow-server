import type { users } from "../generated/prisma/client";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../errors/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { RegisterUserDTO } from "../types/user";
import { settingsService } from "./settings.service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertRegisterInput({ username, email, password }: RegisterUserDTO) {
  if (
    typeof username !== "string" ||
    username.trim().length < 2 ||
    username.length > 50
  ) {
    throw new AppError("Username must be between 2 and 50 characters", 400);
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    throw new AppError("Invalid email address", 400);
  }
  if (typeof password !== "string" || password.length < 10) {
    throw new AppError("Password must be at least 10 characters", 400);
  }
}

function toPublicUser(user: users) {
  const { password_hash: _omit, ...rest } = user;
  return rest;
}

export const userService = {
  register: async (input: RegisterUserDTO) => {
    assertRegisterInput(input);
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

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

    await settingsService.ensureRow(user.user_id);

    const token = generateToken(user.user_id);

    return {
      user: toPublicUser(user),
      token,
    };
  },

  login: async (email: string, password: string) => {
    if (typeof email !== "string" || typeof password !== "string") {
      throw new AppError("Invalid credentials", 401);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user || !user.password_hash) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordCorrect = await comparePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken(user.user_id);

    await settingsService.ensureRow(user.user_id);

    return {
      user: toPublicUser(user),
      token,
    };
  },
};

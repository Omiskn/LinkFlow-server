import type { users } from "../generated/prisma/client";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../errors/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { RegisterUserDTO, UserDTO } from "../types/user";
import { settingsService } from "./settings.service";

import crypto from "crypto";
import { emailService } from "./email.service";
import { env } from "../config/env";
import { uploadImage } from "../utils/uploadImage";

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

    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("Email already exists", 400);
    }

    const hashedPassword = await hashPassword(input.password);

    // 🔑 generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const user = await userRepository.create({
      username,
      email,
      password_hash: hashedPassword,
      display_name: username,
      verification_token: verificationToken,
      verification_expires: verificationExpires,
      is_verified: false,
    });

    await settingsService.ensureRow(user.user_id);

    // 🔗 link
    const verifyLink = `${env.FRONTEND_URL}/verify_email?token=${verificationToken}`;

    await emailService.sendVerificationEmail(email, verifyLink);

    return {
      message: "User created. Please verify your email.",
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

    if (!user.is_verified) {
      throw new AppError("Please verify your email first", 403);
    }

    const token = generateToken(user.user_id);

    await settingsService.ensureRow(user.user_id);

    return {
      user: toPublicUser(user),
      token,
    };
  },

  getMe: async (userId: number) => {
    const user = await userRepository.findById(userId);

    if (!user) throw new AppError("Invalid token", 400);

    return { user: toPublicUser(user) };
  },

  updateMe: async (
    userId: number,
    data: UserDTO,
    file: Express.Multer.File | undefined,
  ) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Invalid token", 400);
    let imageUrl: string | undefined;

    if (file) imageUrl = await uploadImage(file);

    const updatedUser = await userRepository.updateById(userId, {
      ...data,
      profile_image: imageUrl,
      updated_at: new Date(),
    });

    return { user: toPublicUser(updatedUser) };
  },

  verifyEmail: async (token: string) => {
    const user = await userRepository.findByVerificationToken(token);

    if (!user) {
      throw new AppError("Invalid token", 400);
    }

    if (user.verification_expires && user.verification_expires < new Date()) {
      throw new AppError("Token expired", 400);
    }

    await userRepository.updateById(user.user_id, {
      is_verified: true,
      verification_token: null,
      verification_expires: null,
    });

    return {
      message: "Email verified successfully",
    };
  },
};

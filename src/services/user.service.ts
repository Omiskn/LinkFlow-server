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
import { linkRepositories } from "../repositories/link.repository";
import { googleAuthService } from "./googleAuth.service";
import { passwordResetRepository } from "../repositories/passwordReset.repository";



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

// function toPublicUserProfile(user: users) {
//   const { display_name, bio, email, profile_image } = user;
//   return rest;
// }

export const userService = {
  register: async (input: RegisterUserDTO) => {
    assertRegisterInput(input);

    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();

    const existingUser = await userRepository.findUser({ email });

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
    const user = await userRepository.findUser({ email: normalizedEmail });

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

  getUserForPublicProfile: async (username: string) => {
    const user = await userRepository.findUser({ username });
    if (!user) throw new AppError("Invalid credentials", 401);

    const { display_name, bio, email, profile_image } = user;
    const links = await linkRepositories.findLinksForSpecificUser(
      user.user_id,
      true,
    );

    const filteredLinks = links.map((link) => ({
      id: link.link_id,
      title: link.title,
      url: link.url,
      icon: link.icon,
    }));

    return {
      user: { display_name, bio, email, profile_image, links: filteredLinks },
    };
  },

  getMe: async (userId: number) => {
    const user = await userRepository.findUser({ user_id: userId });

    if (!user) throw new AppError("Invalid token", 400);

    return { user: toPublicUser(user) };
  },

  updateMe: async (
    userId: number,
    data: UserDTO,
    file: Express.Multer.File | undefined,
  ) => {
    const user = await userRepository.findUser({ user_id: userId });
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

  googleLogin: async (idToken: string) => {
    const claims = await googleAuthService.verifyIdToken(idToken);
    const email = claims.email.trim().toLowerCase();

    // 1. Check if user already exists by google_id
    let user = await userRepository.findByGoogleId(claims.googleId);

    if (user) {
      user = await userRepository.updateById(user.user_id, {
        last_login_at: new Date(),
        updated_at: new Date(),
      });
      await settingsService.ensureRow(user.user_id);
      const token = generateToken(user.user_id);
      return { user: toPublicUser(user), token };
    }

    // 2. Check if user exists by email (safe linking because email is verified by Google)
    const existingByEmail = await userRepository.findUser({ email });

    if (existingByEmail) {
      user = await userRepository.updateById(existingByEmail.user_id, {
        google_id: claims.googleId,
        is_verified: true,
        last_login_at: new Date(),
        updated_at: new Date(),
        profile_image: existingByEmail.profile_image || claims.picture || null,
        display_name: existingByEmail.display_name || claims.name || existingByEmail.username,
      });

      await settingsService.ensureRow(user.user_id);
      const token = generateToken(user.user_id);
      return { user: toPublicUser(user), token };
    }

    // 3. User does not exist, create new user
    let baseUsername = (claims.name || email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);

    if (baseUsername.length < 2) {
      baseUsername = `user_${claims.googleId.slice(-6)}`;
    }

    let username = baseUsername;
    let counter = 1;
    while (await userRepository.findUser({ username })) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      username = `${baseUsername.slice(0, 25)}_${suffix}`;
      counter++;
      if (counter > 10) {
        username = `user_${Date.now().toString().slice(-8)}`;
        break;
      }
    }

    user = await userRepository.create({
      username,
      email,
      provider: "google",
      google_id: claims.googleId,
      display_name: claims.name || username,
      profile_image: claims.picture || null,
      is_verified: true,
      last_login_at: new Date(),
    });

    await settingsService.ensureRow(user.user_id);
    const token = generateToken(user.user_id);

    return {
      user: toPublicUser(user),
      token,
    };
  },

  forgotPassword: async (email: string) => {
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      throw new AppError("Invalid email address", 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findUser({ email: normalizedEmail });

    if (!user) {
      // Prevent email enumeration
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Delete previous tokens for this user
    await passwordResetRepository.deleteByUserId(user.user_id);

    // Generate crypto token and store its sha256 hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await passwordResetRepository.create({
      token: tokenHash,
      user_id: user.user_id,
      expire_at: expireAt,
    });

    const resetLink = `${env.FRONTEND_URL}/reset_password?token=${rawToken}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, resetLink);
    } catch (error) {
      console.error("Failed to dispatch password reset email:", error);
    }

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  },

  resetPassword: async (rawToken: string, newPassword: string) => {
    if (!rawToken || typeof rawToken !== "string") {
      throw new AppError("Invalid or missing reset token", 400);
    }
    if (typeof newPassword !== "string" || newPassword.length < 10) {
      throw new AppError("Password must be at least 10 characters", 400);
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken.trim())
      .digest("hex");

    const record = await passwordResetRepository.findByToken(tokenHash);

    if (!record) {
      throw new AppError("Invalid or expired password reset link", 400);
    }

    if (record.expire_at && record.expire_at < new Date()) {
      await passwordResetRepository.deleteByToken(tokenHash);
      throw new AppError("Password reset link has expired", 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password and invalidate all reset tokens for user
    await userRepository.updateById(record.user_id, {
      password_hash: hashedPassword,
      updated_at: new Date(),
    });

    await passwordResetRepository.deleteByUserId(record.user_id);

    return {
      message: "Password has been successfully updated. You can now login.",
    };
  },
};



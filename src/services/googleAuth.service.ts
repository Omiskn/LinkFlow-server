import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export type GoogleUserPayload = {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
};

export const googleAuthService = {
  verifyIdToken: async (idToken: string): Promise<GoogleUserPayload> => {
    if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
      throw new AppError("Invalid Google ID token provided", 400);
    }

    const trimmedToken = idToken.trim();

    // 1. Try google-auth-library if installed
    try {
      // @ts-ignore - optional dependency
      const googleAuth: any = await import("google-auth-library");
      if (googleAuth?.OAuth2Client) {

        const client = new googleAuth.OAuth2Client(env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: trimmedToken,
          audience: env.GOOGLE_CLIENT_ID || undefined,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
          throw new AppError("Invalid Google token payload", 401);
        }
        if (!payload.email_verified) {
          throw new AppError("Google account email is not verified", 403);
        }
        return {
          googleId: payload.sub,
          email: payload.email.toLowerCase(),
          name: payload.name || undefined,
          picture: payload.picture || undefined,
          emailVerified: Boolean(payload.email_verified),
        };
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // If module not found or library throws, fallback to official Google tokeninfo endpoint
    }

    // 2. Official Google tokeninfo verification endpoint
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmedToken)}`
      );

      if (!response.ok) {
        throw new AppError("Failed to verify Google token with Google servers", 401);
      }

      const data = (await response.json()) as {
        iss?: string;
        sub?: string;
        aud?: string;
        azp?: string;
        email?: string;
        email_verified?: string | boolean;
        name?: string;
        picture?: string;
        exp?: string | number;
      };

      // Validate issuer
      const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
      if (!data.iss || !validIssuers.includes(data.iss)) {
        throw new AppError("Invalid Google token issuer", 401);
      }

      // Validate audience if GOOGLE_CLIENT_ID is configured
      if (env.GOOGLE_CLIENT_ID) {
        const audienceMatches =
          data.aud === env.GOOGLE_CLIENT_ID || data.azp === env.GOOGLE_CLIENT_ID;
        if (!audienceMatches) {
          throw new AppError("Google token audience mismatch", 401);
        }
      }

      // Validate expiration
      if (data.exp) {
        const expMs = Number(data.exp) * 1000;
        if (Date.now() >= expMs) {
          throw new AppError("Google token has expired", 401);
        }
      }

      // Validate user identifiers
      if (!data.sub || !data.email) {
        throw new AppError("Google token missing required user claims", 401);
      }

      const isVerified =
        data.email_verified === "true" || data.email_verified === true;
      if (!isVerified) {
        throw new AppError("Google email is not verified", 403);
      }

      return {
        googleId: data.sub,
        email: data.email.toLowerCase(),
        name: data.name,
        picture: data.picture,
        emailVerified: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Google authentication verification service unavailable", 503);
    }
  },
};

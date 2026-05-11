declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        jti?: string;
      };
    }
  }
}

export {};

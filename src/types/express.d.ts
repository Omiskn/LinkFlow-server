declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        jti?: string;
      };
      file?: Express.Multer.File | undefined;
    }
  }
}

export {};

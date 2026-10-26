import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { googleAuthService } from "../services/googleAuth.service";
import { linkService } from "../services/link.service";
import { userService } from "../services/user.service";
import { AppError } from "../errors/AppError";

describe("Google Authentication Token Verification", () => {
  it("rejects empty token", async () => {
    await assert.rejects(
      async () => {
        await googleAuthService.verifyIdToken("");
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  it("rejects non-string token", async () => {
    await assert.rejects(
      async () => {
        await googleAuthService.verifyIdToken(null as any);
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });
});

describe("Links Reordering Validation", () => {
  it("rejects empty array", async () => {
    await assert.rejects(
      async () => {
        await linkService.reorderLinks(1, []);
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /non-empty array/i);
        return true;
      }
    );
  });

  it("rejects non-array input", async () => {
    await assert.rejects(
      async () => {
        await linkService.reorderLinks(1, "invalid" as any);
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  it("rejects invalid or negative link IDs", async () => {
    await assert.rejects(
      async () => {
        await linkService.reorderLinks(1, [-1, 2]);
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /positive integer/i);
        return true;
      }
    );
  });

  it("rejects duplicate link IDs in reorder array", async () => {
    await assert.rejects(
      async () => {
        await linkService.reorderLinks(1, [2, 2, 3]);
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /duplicate link ids/i);
        return true;
      }
    );
  });
});

describe("Forgot and Reset Password Flow", () => {
  it("rejects invalid email address format", async () => {
    await assert.rejects(
      async () => {
        await userService.forgotPassword("not-an-email");
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  it("prevents email enumeration by returning success message for non-existent user", async () => {
    const res = await userService.forgotPassword("does-not-exist-9999@example.com");
    assert.equal(
      res.message,
      "If an account with that email exists, a password reset link has been sent."
    );
  });

  it("rejects resetPassword with missing token", async () => {
    await assert.rejects(
      async () => {
        await userService.resetPassword("", "StrongPass123!");
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  it("rejects resetPassword with weak password (<10 chars)", async () => {
    await assert.rejects(
      async () => {
        await userService.resetPassword("sometoken", "short");
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /at least 10 characters/i);
        return true;
      }
    );
  });
});

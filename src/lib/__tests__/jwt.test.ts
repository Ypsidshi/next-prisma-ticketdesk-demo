import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { createSessionToken, verifySessionToken } from "../jwt";

describe("jwt session token", () => {
  it("подписывает и проверяет токен", async () => {
    const token = await createSessionToken({ id: "user_test", role: Role.MANAGER });
    const verified = await verifySessionToken(token);
    expect(verified.userId).toBe("user_test");
    expect(verified.role).toBe(Role.MANAGER);
  });
});

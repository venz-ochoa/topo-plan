import { describe, it, expect } from "vitest";
import { friendly } from "./errors.js";

describe("friendly", () => {
  it("keeps the short messages our own database functions write for people", () => {
    expect(
      friendly({ code: "P0001", message: "Only admins can make invites" }),
    ).toBe("Only admins can make invites");
  });

  it("hides row level security details", () => {
    const e = {
      code: "42501",
      message: 'new row violates row-level security policy for table "invites"',
    };
    expect(friendly(e)).toBe("You are not allowed to do that.");
  });

  it("hides errors it does not know, so nothing internal is shown", () => {
    const text = friendly({
      code: "XX000",
      message: "connection to server at 10.0.0.5 failed",
    });
    expect(text).toMatch(/something went wrong/i);
    expect(text).not.toMatch(/10\.0\.0\.5/);
  });

  it("does not say whether an email already has an account", () => {
    const a = friendly({
      code: "user_already_exists",
      message: "User already registered",
    });
    const b = friendly({
      code: "email_exists",
      message: "A user with this email address has already been registered",
    });
    expect(a).toBe(b);
    expect(a).not.toMatch(/already/i);
  });

  it("explains a lost connection", () => {
    expect(friendly(new TypeError("Failed to fetch"))).toMatch(
      /reach the server/i,
    );
  });

  it("copes with nothing at all", () => {
    expect(friendly(null)).toMatch(/something went wrong/i);
  });
});

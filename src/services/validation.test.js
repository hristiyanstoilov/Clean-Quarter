import { describe, it, expect } from "vitest";
import { rules } from "./validation.js";

describe("Password validation edge cases", () => {
  it("should fail if password is too short", () => {
    expect(rules.password("Abc12")).toBe("Паролата трябва да е поне 8 символа");
  });
  it("should fail if missing uppercase", () => {
    expect(rules.password("abcdefg1")).toBe("Паролата трябва да съдържа главна буква");
  });
  it("should fail if missing lowercase", () => {
    expect(rules.password("ABCDEFG1")).toBe("Паролата трябва да съдържа малка буква");
  });
  it("should fail if missing digit", () => {
    expect(rules.password("Abcdefgh")).toBe("Паролата трябва да съдържа число");
  });
  it("should pass for strong password", () => {
    expect(rules.password("Abcdefg1")).toBeNull();
  });
});

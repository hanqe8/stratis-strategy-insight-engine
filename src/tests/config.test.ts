import { describe, expect, it } from "vitest";
import { isDuplicateOption, normalizeOption } from "../lib/config";

describe("config option validation", () => {
  it("normalizes whitespace", () => {
    expect(normalizeOption("  In   Review  ")).toBe("In Review");
  });

  it("detects duplicates case-insensitively", () => {
    expect(isDuplicateOption("draft", ["Draft", "Recommended"], 1)).toBe(true);
    expect(isDuplicateOption("Archived", ["Draft", "Recommended"], 1)).toBe(false);
  });

  it("detects duplicates regardless of spaces", () => {
    expect(isDuplicateOption("User Provided", ["Official", "UserProvided"])).toBe(true);
    expect(isDuplicateOption("MarketEntry", ["Market Entry", "Platform Strategy"])).toBe(true);
  });
});

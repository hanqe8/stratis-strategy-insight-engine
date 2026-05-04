import { describe, expect, it } from "vitest";
import { estimateTokens } from "../lib/documentIngestion";

describe("document ingestion helpers", () => {
  it("estimates tokens conservatively", () => {
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("123456789")).toBe(3);
  });
});

import { z } from "zod";
import { safeJsonParse } from "./json-parser";

const schema = z.object({ name: z.string(), age: z.number() });

describe("safeJsonParse", () => {
  it("parses valid JSON directly on the first attempt", () => {
    const result = safeJsonParse('{"name":"Ana","age":30}', schema);
    expect(result).toEqual({
      success: true,
      data: { name: "Ana", age: 30 },
    });
  });

  it("extracts JSON via regex on retry when wrapped in extra text", () => {
    const content =
      'Sure, here is the JSON:\n{"name":"Ana","age":30}\nHope that helps!';
    const result = safeJsonParse(content, schema);
    expect(result).toEqual({
      success: true,
      data: { name: "Ana", age: 30 },
    });
  });

  it("fails safely (success: false) when no valid JSON can be found", () => {
    const result = safeJsonParse("not json at all", schema, 2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("fails safely (success: false) when JSON is valid but fails schema validation", () => {
    const result = safeJsonParse('{"name":"Ana"}', schema, 1);
    expect(result.success).toBe(false);
  });
});

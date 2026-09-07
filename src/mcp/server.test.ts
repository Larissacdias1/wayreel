import { handleListTools, handleCallTool } from "./server";

describe("mcp/server", () => {
  describe("handleListTools", () => {
    it("lists the searchFlights tool", async () => {
      const result = await handleListTools();
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0]?.name).toBe("searchFlights");
    });
  });

  describe("handleCallTool", () => {
    it("calls searchFlights and returns a FlightSearchResult as text content", async () => {
      const response = await handleCallTool({
        params: {
          name: "searchFlights",
          arguments: {
            origin: "GRU",
            destination: "AGP",
            departure_date: "2026-10-01",
            passengers: 1,
          },
        },
      });

      expect(response.content).toHaveLength(1);
      expect(response.content[0]?.type).toBe("text");
      const parsed = JSON.parse(response.content[0]!.text);
      expect(parsed.success).toBe(true);
      expect(parsed.options).toHaveLength(3);
    });

    it("throws for an unknown tool name", async () => {
      await expect(
        handleCallTool({ params: { name: "notARealTool" } }),
      ).rejects.toThrow("Unknown tool: notARealTool");
    });
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { renderLightMarkdown } from "./markdown";

// renderToStaticMarkup works in Node without a DOM (jsdom isn't configured
// in this project — jest.config.cjs uses testEnvironment: "node"), so the
// output is asserted as HTML rather than by comparing React element trees.
function render(text: string): string {
  return renderToStaticMarkup(renderLightMarkdown(text) as never);
}

describe("renderLightMarkdown", () => {
  it("renders plain text as a single paragraph", () => {
    expect(render("Hello world")).toBe("<p>Hello world</p>");
  });

  it("renders **bold** text as <strong>", () => {
    expect(render("I recommend **Setenil**.")).toBe(
      "<p>I recommend <strong>Setenil</strong>.</p>",
    );
  });

  it("renders a block of '- item' lines as a bullet list", () => {
    const result = render(
      "- economy: $169 USD (Turkish Airlines)\n- premium: $969 USD (LATAM Airlines)",
    );
    expect(result).toBe(
      "<ul><li>economy: $169 USD (Turkish Airlines)</li><li>premium: $969 USD (LATAM Airlines)</li></ul>",
    );
  });

  it("splits multiple paragraphs (blank-line separated) into separate blocks", () => {
    expect(render("First paragraph.\n\nSecond paragraph.")).toBe(
      "<p>First paragraph.</p><p>Second paragraph.</p>",
    );
  });

  it("renders a real buildFinalMessage-shaped message (bold destination + bullet flight list)", () => {
    const message =
      "I recommend **Setenil de las Bodegas**. It is romantic.\n\n- economy: $169 USD (Turkish Airlines)\n- premium: $969 USD (LATAM Airlines)\n\nIndicative prices, subject to change. Verify at the time of purchase.";

    expect(render(message)).toBe(
      "<p>I recommend <strong>Setenil de las Bodegas</strong>. It is romantic.</p>" +
        "<ul><li>economy: $169 USD (Turkish Airlines)</li><li>premium: $969 USD (LATAM Airlines)</li></ul>" +
        "<p>Indicative prices, subject to change. Verify at the time of purchase.</p>",
    );
  });
});

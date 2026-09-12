// src/ui/markdown.ts
// Renders the "light markdown" the agent produces (docs/PROMPTS.md Section 1:
// "Use light markdown... Maximum 3 paragraphs per message"), observed in
// practice as **bold** text and "- item" bullet lists only (see
// src/agent/nodes.ts's buildFinalMessage/buildFlightOptionsSummary).
//
// [DECISION REQUIRED resolved with user input, #138] no markdown-rendering
// library is documented or installed anywhere in the project (WAYREEL.md
// Section 4's stack table has no entry for it). Per user decision: a small
// custom parser handling only what the system prompt actually produces
// (bold + bullet lists), rather than adding a new dependency (e.g.
// react-markdown) for a "light markdown" subset that doesn't need a full
// CommonMark parser.

import { Fragment, createElement, type ReactNode } from "react";

function renderInlineBold(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return createElement(
        "strong",
        { key: `${keyPrefix}-${index}` },
        boldMatch[1],
      );
    }
    return createElement(Fragment, { key: `${keyPrefix}-${index}` }, part);
  });
}

function isBulletBlock(block: string): boolean {
  const lines = block.split("\n").filter((line) => line.trim() !== "");
  return lines.length > 0 && lines.every((line) => line.startsWith("- "));
}

export function renderLightMarkdown(text: string): ReactNode {
  const blocks = text.split(/\n\n+/).filter((block) => block !== "");

  return createElement(
    Fragment,
    null,
    blocks.map((block, blockIndex) => {
      const blockKey = `block-${blockIndex}`;
      if (isBulletBlock(block)) {
        const items = block
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => line.replace(/^- /, ""));
        return createElement(
          "ul",
          { key: blockKey },
          items.map((item, itemIndex) =>
            createElement(
              "li",
              { key: `${blockKey}-item-${itemIndex}` },
              renderInlineBold(item, `${blockKey}-item-${itemIndex}`),
            ),
          ),
        );
      }
      return createElement(
        "p",
        { key: blockKey },
        renderInlineBold(block, blockKey),
      );
    }),
  );
}

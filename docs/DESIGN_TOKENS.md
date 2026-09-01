# Wayreel — Design Tokens

Authorial synthesis based on docs/VISUAL_REFERENCES.md (not a copy of any single reference). Recorded as ADR-028.

## Color

| Token          | Value   | Use                                                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| bg-base        | #14100c | main background (near-black, warm bias)                                                                        |
| bg-surface     | #1f1913 | cards/panels, one step above the background                                                                    |
| text-primary   | #f5efe6 | main text (warm white)                                                                                         |
| text-secondary | #a89a8a | supporting text                                                                                                |
| accent         | #ffb37a | CTA/highlight — same value as the ambient light already frozen in Section 11 (map.setLight), reused on purpose |
| accent-text    | #14100c | text on top of the accent background                                                                           |

## Typography

| Token        | Font                    | Weight  | Use                          |
| ------------ | ----------------------- | ------- | ---------------------------- |
| font-display | Fraunces (Google Fonts) | 500     | heading on the REVEAL screen |
| font-body    | Inter (Google Fonts)    | 400/500 | chat, general UI             |
| font-mono    | DM Mono (Google Fonts)  | 400     | HUD overlay (Section 11.4)   |

Scale (desktop / mobile ~55%): 80px / 48px / 32px / 20px / 16px / 14px

## Spacing

8pt scale: 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96px

## Motion

- Flythrough waypoints: already frozen in Section 11.1 (3000-4000ms) —
  do not change.
- UI transitions (outside the flythrough): 200ms fast, 400ms base,
  800ms slow.

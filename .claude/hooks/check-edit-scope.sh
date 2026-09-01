#!/bin/bash
# PreToolUse hook (Edit|Write) — bloqueia edicao fora de src/, e2e/, docs/ e
# arquivos de config na raiz, sem aprovacao manual. Ver WAYREEL.md ADR-025.
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

REL_PATH="$FILE_PATH"
if [[ -n "${CLAUDE_PROJECT_DIR:-}" && "$FILE_PATH" == "$CLAUDE_PROJECT_DIR"/* ]]; then
  REL_PATH="${FILE_PATH#"$CLAUDE_PROJECT_DIR"/}"
fi

BASENAME=$(basename -- "$REL_PATH")
case "$BASENAME" in
  .env|.env.*)
    if [ "$BASENAME" != ".env.example" ]; then
      jq -n '{
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "Edicao/acesso a .env bloqueado — segredo nunca deve ser tocado pelo agente (ADR-025, docs/SECURITY.md)."
        }
      }'
      exit 2
    fi
    ;;
esac

case "$REL_PATH" in
  src/*|e2e/*|docs/*)
    exit 0
    ;;
  */*)
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Edicao fora de src/, e2e/, docs/ ou arquivos de config na raiz requer aprovacao manual (ADR-025, WAYREEL.md)."
      }
    }'
    exit 2
    ;;
  *)
    exit 0
    ;;
esac

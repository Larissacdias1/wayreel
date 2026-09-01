#!/bin/bash
# PreToolUse hook (Bash) — bloqueia comandos destrutivos sem aprovacao manual.
# Ver WAYREEL.md ADR-025 (hooks nativos como barreira de aprovacao real).
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

block() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 2
}

if [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -Eiq '\brm\b[^|;&]*(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)|--recursive[^|;&]*--force|--force[^|;&]*--recursive'; then
  block "Comando rm -rf (ou equivalente) bloqueado — requer aprovacao manual (ADR-025, WAYREEL.md)."
fi

if echo "$COMMAND" | grep -Eiq '\bgit\b[^|;&]*\bpush\b[^|;&]*(--force\b|--force-with-lease\b|[[:space:]]-f\b)'; then
  block "git push --force bloqueado — requer aprovacao manual (ADR-025, WAYREEL.md)."
fi

if echo "$COMMAND" | grep -Eiq '\bDROP[[:space:]]+(TABLE|DATABASE|SCHEMA|INDEX)\b'; then
  block "Comando SQL DROP bloqueado — requer aprovacao manual (ADR-025, WAYREEL.md)."
fi

if echo "$COMMAND" | grep -Eiq '\bDELETE[[:space:]]+FROM\b' && ! echo "$COMMAND" | grep -Eiq '\bWHERE\b'; then
  block "DELETE sem WHERE bloqueado — requer aprovacao manual (ADR-025, WAYREEL.md)."
fi

if echo "$COMMAND" | grep -Eiq '(^|[;&|[:space:]])\.env(\.[a-zA-Z0-9_-]+)?([[:space:]]|$)' && ! echo "$COMMAND" | grep -Eiq '\.env\.example'; then
  block "Acesso a .env via terminal bloqueado — segredo nunca deve ser lido/manipulado pelo agente (ADR-025, docs/SECURITY.md)."
fi

exit 0

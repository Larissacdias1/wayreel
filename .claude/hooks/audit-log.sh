#!/bin/bash
# PostToolUse hook — registra Bash/Edit/Write executados, para auditoria
# (segunda camada de defesa, ADR-025 WAYREEL.md). Nunca bloqueia.
INPUT=$(cat)
LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude"
mkdir -p "$LOG_DIR"
echo "$(date -u +%FT%TZ) $INPUT" >>"$LOG_DIR/audit.log"
exit 0

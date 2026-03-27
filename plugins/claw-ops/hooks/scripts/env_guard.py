#!/usr/bin/env python3
"""
env-file-guard hook for Claude Code.

Reads tool input from stdin (JSON with tool_name and tool_input),
checks if the operation targets .env files or contains credential-related patterns.

Exit codes:
  0 - Safe, no protected patterns detected
  2 - Warning, protected pattern detected (prints JSON warning to stdout)
"""

import json
import re
import sys


# Patterns that indicate .env file operations
ENV_FILE_PATTERNS = [
    r"\.env\b",           # .env, .env.local, .env.production, etc.
    r"\.env\..*",         # .env.example, .env.template, etc.
]

# Patterns that indicate credential-related content
CREDENTIAL_PATTERNS = [
    r"BEARER_TOKEN",
    r"API_KEY",
    r"SECRET",
    r"credentials",
    r"PRIVATE_KEY",
    r"PASSWORD",
    r"ACCESS_KEY",
    r"BOT_TOKEN",
    r"APP_TOKEN",
]

# Compile all patterns (case-insensitive)
ENV_RE = [re.compile(p, re.IGNORECASE) for p in ENV_FILE_PATTERNS]
CRED_RE = [re.compile(p, re.IGNORECASE) for p in CREDENTIAL_PATTERNS]


def check_text(text: str) -> str | None:
    """Check text against protected patterns. Returns match description or None."""
    for pattern in ENV_RE:
        match = pattern.search(text)
        if match:
            return f".env file detected: '{match.group()}'"

    for pattern in CRED_RE:
        match = pattern.search(text)
        if match:
            return f"Credential pattern detected: '{match.group()}'"

    return None


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            sys.exit(0)

        data = json.loads(raw)
    except (json.JSONDecodeError, Exception):
        # If we can't parse input, allow the operation
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    # Collect all text fields to inspect based on tool type
    texts_to_check = []

    if tool_name == "Bash":
        command = tool_input.get("command", "")
        texts_to_check.append(command)

    elif tool_name in ("Edit", "Write"):
        file_path = tool_input.get("file_path", "")
        texts_to_check.append(file_path)
        # For Edit, also check old_string and new_string for credential patterns
        old_string = tool_input.get("old_string", "")
        new_string = tool_input.get("new_string", "")
        content = tool_input.get("content", "")
        if old_string:
            texts_to_check.append(old_string)
        if new_string:
            texts_to_check.append(new_string)
        if content:
            texts_to_check.append(content)

    else:
        # Unknown tool, allow
        sys.exit(0)

    # Check all collected texts
    for text in texts_to_check:
        if not text:
            continue
        result = check_text(text)
        if result:
            warning = {
                "decision": "warn",
                "message": (
                    f"env-file-guard: {result} in {tool_name} operation. "
                    f"Modifying .env files or credentials requires extra caution. "
                    f"Ensure you are not accidentally exposing secrets or overwriting production credentials."
                ),
            }
            print(json.dumps(warning))
            sys.exit(2)

    # All clear
    sys.exit(0)


if __name__ == "__main__":
    main()

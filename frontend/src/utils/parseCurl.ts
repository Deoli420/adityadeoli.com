/**
 * Parse a cURL command string into structured endpoint data.
 *
 * Handles common cURL flags:
 *   -X / --request   → HTTP method
 *   -H / --header    → headers (extracted but not all used)
 *   -d / --data / --data-raw / --data-binary → request body
 *   -u / --user      → basic auth header
 *   --compressed     → ignored
 *   -k / --insecure  → ignored
 *   -L / --location  → ignored (redirect follow)
 *
 * The URL is extracted from the positional argument.
 */

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  /** Suggested name derived from URL path */
  suggestedName: string;
}

/**
 * Tokenize a cURL command respecting quoted strings.
 * Handles single quotes, double quotes, and backslash escapes.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && !inSingle) {
      // In double quotes or unquoted, backslash escapes next char
      if (inDouble) {
        const next = input[i + 1];
        // In double quotes, only certain chars are escapable
        if (next === '"' || next === "\\" || next === "$" || next === "`") {
          escaped = true;
          continue;
        }
        current += ch;
        continue;
      }
      escaped = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if ((ch === " " || ch === "\t" || ch === "\n") && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Derive a human-friendly name from a URL.
 * e.g., "https://api.example.com/v1/users" → "Example — GET /v1/users"
 */
function deriveName(url: string, method: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(api\.|www\.)/, "");
    const domain = host.split(".")[0];
    const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
    const path = parsed.pathname === "/" ? "/" : parsed.pathname;
    return `${domainName} — ${method} ${path}`;
  } catch {
    return `${method} endpoint`;
  }
}

/**
 * Parse a cURL command string.
 *
 * @throws {Error} if the input is not a valid cURL command
 */
export function parseCurl(input: string): ParsedCurl {
  // Normalize: strip leading/trailing whitespace, handle line continuations
  const normalized = input
    .trim()
    .replace(/\\\n/g, " ")  // backslash-newline continuation
    .replace(/\\\r\n/g, " ")
    .replace(/`\n/g, " ")   // PowerShell backtick continuation
    .replace(/\s+/g, " ");  // collapse whitespace

  // Must start with "curl"
  if (!normalized.toLowerCase().startsWith("curl")) {
    throw new Error("Input must be a cURL command (should start with 'curl')");
  }

  const tokens = tokenize(normalized);

  let url = "";
  let method = "";
  const headers: Record<string, string> = {};
  let body: string | null = null;

  let i = 1; // skip "curl"
  while (i < tokens.length) {
    const token = tokens[i];

    // HTTP method
    if (token === "-X" || token === "--request") {
      method = tokens[++i]?.toUpperCase() ?? "GET";
      i++;
      continue;
    }

    // Headers
    if (token === "-H" || token === "--header") {
      const headerStr = tokens[++i] ?? "";
      const colonIdx = headerStr.indexOf(":");
      if (colonIdx > 0) {
        const key = headerStr.slice(0, colonIdx).trim();
        const val = headerStr.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
      i++;
      continue;
    }

    // Data / body
    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-urlencode"
    ) {
      body = tokens[++i] ?? null;
      i++;
      continue;
    }

    // Basic auth
    if (token === "-u" || token === "--user") {
      const credentials = tokens[++i] ?? "";
      headers["Authorization"] =
        "Basic " + btoa(credentials);
      i++;
      continue;
    }

    // Flags to ignore (they take no argument)
    if (
      token === "--compressed" ||
      token === "-k" ||
      token === "--insecure" ||
      token === "-L" ||
      token === "--location" ||
      token === "-s" ||
      token === "--silent" ||
      token === "-S" ||
      token === "--show-error" ||
      token === "-v" ||
      token === "--verbose" ||
      token === "-i" ||
      token === "--include" ||
      token === "-g" ||
      token === "--globoff"
    ) {
      i++;
      continue;
    }

    // Flags to ignore that take an argument
    if (
      token === "-o" ||
      token === "--output" ||
      token === "--connect-timeout" ||
      token === "--max-time" ||
      token === "-m" ||
      token === "--retry" ||
      token === "--cookie" ||
      token === "-b" ||
      token === "--cookie-jar" ||
      token === "-c" ||
      token === "--user-agent" ||
      token === "-A" ||
      token === "--cacert" ||
      token === "--capath" ||
      token === "-E" ||
      token === "--cert" ||
      token === "--key"
    ) {
      i += 2; // skip flag + its value
      continue;
    }

    // URL (positional argument — not starting with -)
    if (!token.startsWith("-") && !url) {
      url = token;
      i++;
      continue;
    }

    // --url flag
    if (token === "--url") {
      url = tokens[++i] ?? "";
      i++;
      continue;
    }

    // Unknown flag — skip
    i++;
  }

  if (!url) {
    throw new Error("No URL found in the cURL command");
  }

  // Infer method if not explicitly set
  if (!method) {
    method = body ? "POST" : "GET";
  }

  return {
    url,
    method,
    headers,
    body,
    suggestedName: deriveName(url, method),
  };
}

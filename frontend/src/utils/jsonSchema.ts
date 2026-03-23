/**
 * Infer a basic JSON Schema from a JavaScript value.
 * Used to auto-capture expected response schemas.
 */
export function inferJsonSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length > 0 ? inferJsonSchema(value[0]) : {},
    };
  }
  switch (typeof value) {
    case "string": return { type: "string" };
    case "number": return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    case "boolean": return { type: "boolean" };
    case "object": {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        properties[k] = inferJsonSchema(v);
        if (v !== null && v !== undefined) required.push(k);
      }
      return { type: "object", properties, required };
    }
    default: return {};
  }
}

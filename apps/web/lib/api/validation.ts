export interface JsonSchema {
  $ref?: string;
  type?: string;
  const?: unknown;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  format?: string;
}

export interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Validate the JSON Schema keywords used by the checked-in OpenAPI contract. */
export function validateSchema(schema: JsonSchema, value: unknown, schemas: Record<string, JsonSchema>, loc: (string | number)[] = []): ValidationIssue[] {
  if (schema.$ref) return validateSchema(schemas[schema.$ref.split("/").at(-1)!], value, schemas, loc);
  const invalid = (msg: string): ValidationIssue[] => [{ loc, msg, type: "value_error" }];
  if (schema.anyOf) {
    return schema.anyOf.some((branch) => validateSchema(branch, value, schemas, loc).length === 0)
      ? [] : invalid("Nilai tidak sesuai schema.");
  }
  if ("const" in schema && value !== schema.const) return invalid("Nilai tidak didukung.");
  if (schema.enum && !schema.enum.includes(value)) return invalid("Pilihan tidak didukung.");
  switch (schema.type) {
    case "null": return value === null ? [] : invalid("Nilai harus null.");
    case "string":
      if (typeof value !== "string") return invalid("Nilai harus berupa teks.");
      if (schema.minLength !== undefined && [...value].length < schema.minLength) return invalid("Teks terlalu pendek.");
      if (schema.maxLength !== undefined && [...value].length > schema.maxLength) return invalid("Teks terlalu panjang.");
      if (schema.format === "uuid" && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) return invalid("UUID tidak valid.");
      return [];
    case "integer":
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isInteger(value))) return invalid("Angka tidak valid.");
      if ((schema.minimum !== undefined && value < schema.minimum) ||
          (schema.maximum !== undefined && value > schema.maximum) ||
          (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) ||
          (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum)) return invalid("Angka di luar batas.");
      return [];
    case "boolean": return typeof value === "boolean" ? [] : invalid("Nilai harus boolean.");
    case "array":
      if (!Array.isArray(value)) return invalid("Nilai harus berupa daftar.");
      if (schema.minItems !== undefined && value.length < schema.minItems) return invalid("Daftar terlalu pendek.");
      if (schema.maxItems !== undefined && value.length > schema.maxItems) return invalid("Daftar terlalu panjang.");
      return schema.items ? value.flatMap((item, index) => validateSchema(schema.items!, item, schemas, [...loc, index])) : [];
    case "object": {
      if (value === null || typeof value !== "object" || Array.isArray(value)) return invalid("Nilai harus berupa objek.");
      const object = value as Record<string, unknown>;
      const issues: ValidationIssue[] = [];
      for (const field of schema.required ?? []) {
        if (!(field in object)) issues.push({ loc: [...loc, field], msg: "Field wajib diisi.", type: "missing" });
      }
      for (const [field, item] of Object.entries(object)) {
        const property = schema.properties?.[field];
        if (property) issues.push(...validateSchema(property, item, schemas, [...loc, field]));
        else if (schema.additionalProperties === false) issues.push({ loc: [...loc, field], msg: "Field tidak didukung.", type: "extra_forbidden" });
        else if (typeof schema.additionalProperties === "object") issues.push(...validateSchema(schema.additionalProperties, item, schemas, [...loc, field]));
      }
      return issues;
    }
    default: return [];
  }
}

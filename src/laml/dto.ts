import { z } from "zod";

// Base schemas
export const FieldKindSchema = z.enum([
  "text",
  "number",
  "integer",
  "boolean",
  "constant",
  "object",
  "array",
  "comment",
]);
export type FieldKind = z.infer<typeof FieldKindSchema>;

export const BaseFieldOptionsSchema = z.object({
  description: z.string().optional(),
  isOptional: z.boolean().optional(),
});
export type BaseFieldOptions = z.infer<typeof BaseFieldOptionsSchema>;

// Base Field schemas
export const BaseFieldSchema = z.object({
  kind: FieldKindSchema,
});

export const CommentFieldSchema = z.object({
  kind: z.literal("comment"),
  comment: z.string(),
});
export type CommentField = z.infer<typeof CommentFieldSchema>;

// Base Regular Field schema
export const BaseRegularFieldSchema = BaseFieldSchema.extend({
  name: z.string(),
  description: z.string().optional(),
  isOptional: z.boolean().optional(),
});

// Regular field types
export const TextFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal(FieldKindSchema.Values.text),
});
export type TextField = z.infer<typeof TextFieldSchema>;

export const NumberFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal(FieldKindSchema.Values.number),
});
export type NumberField = z.infer<typeof NumberFieldSchema>;

export const IntegerFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal(FieldKindSchema.Values.integer),
});
export type IntegerField = z.infer<typeof IntegerFieldSchema>;

export const BooleanFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal(FieldKindSchema.Values.boolean),
});
export type BooleanField = z.infer<typeof BooleanFieldSchema>;

export const ArrayFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal(FieldKindSchema.Values.array),
  type: z.union([
    z.literal(FieldKindSchema.Values.text),
    z.literal(FieldKindSchema.Values.number),
    z.literal(FieldKindSchema.Values.integer),
    z.literal(FieldKindSchema.Values.boolean),
    z.literal(FieldKindSchema.Values.constant),
  ]),
  constants: z.array(z.string()).optional(),
});
export type ArrayField = z.infer<typeof ArrayFieldSchema>;

export const ConstantFieldOptionsSchema = BaseFieldOptionsSchema.extend({
  values: z.array(z.string()),
});
export type ConstantFieldOptions = z.infer<typeof ConstantFieldOptionsSchema>;

export const ConstantFieldSchema = BaseRegularFieldSchema.extend({
  kind: z.literal("constant"),
  values: z.array(z.string()),
});
export type ConstantField = z.infer<typeof ConstantFieldSchema>;

// Recursive type definitions
export interface ObjectField extends z.infer<typeof BaseRegularFieldSchema> {
  kind: "object";
  attributes: AnyField[];
}

export const ObjectFieldOptionsSchema = BaseFieldOptionsSchema.extend({
  attributes: z.lazy(() => z.array(AnyFieldSchema)),
});
export type ObjectFieldOptions = z.infer<typeof ObjectFieldOptionsSchema>;

// Create a basic schema that will be extended for proper recursion
const ObjectFieldBaseSchema = BaseRegularFieldSchema.extend({
  kind: z.literal("object"),
});

// Define AnyField type
export type AnyField =
  | TextField
  | NumberField
  | IntegerField
  | BooleanField
  | ConstantField
  | ObjectField
  | ArrayField
  | CommentField;

// Now define the schemas with lazy recursion
export const ObjectFieldSchema: z.ZodType<ObjectField> =
  ObjectFieldBaseSchema.extend({
    attributes: z.lazy(() => z.array(AnyFieldSchema)),
  }) as z.ZodType<ObjectField>;

export const AnyFieldSchema: z.ZodType<AnyField> = z.lazy(() =>
  z.union([
    TextFieldSchema,
    NumberFieldSchema,
    IntegerFieldSchema,
    BooleanFieldSchema,
    ConstantFieldSchema,
    ObjectFieldSchema,
    ArrayFieldSchema,
    CommentFieldSchema,
  ]),
);

export const ProtocolSchema = z.object({
  fields: z.array(AnyFieldSchema),
  indent: z.string(),
});
export type Protocol = z.infer<typeof ProtocolSchema>;

function fieldToSchema(field: AnyField): z.ZodTypeAny {
  switch (field.kind) {
    case "text":
      return z.string();
    case "number":
      return z.number();
    case "integer":
      return z.number().int();
    case "boolean":
      return z.boolean();
    case "constant":
      return z.enum([...field.values] as [string, ...string[]]);
    case "array":
      return z
        .array(fieldToSchema({ ...field, kind: field.type } as AnyField))
        .nonempty();
    case "object":
      return fieldsToObjectSchema(field.attributes);
    default:
      throw new Error(`Unsupported kind ${field.kind}`);
  }
}

function fieldsToObjectSchema(fields: AnyField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.kind === "comment") {
      continue;
    }
    let s = fieldToSchema(f);
    if (f.isOptional) {
      s = s.optional();
    }
    shape[f.name] = s;
  }
  return z.object(shape);
}

export function protocolToSchema(protocol: Protocol) {
  return fieldsToObjectSchema(protocol.fields);
}

export const LAMLPrimitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.boolean()])),
]);
export type LAMLPrimitiveValue = z.infer<typeof LAMLPrimitiveValueSchema>;

const LAMLValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([LAMLPrimitiveValueSchema, LAMLObjectSchema]),
);
export type LAMLValue = LAMLPrimitiveValue | LAMLObject;

export const LAMLObjectSchema = z.record(LAMLValueSchema);
export interface LAMLObject {
  [key: string]: LAMLValue;
}

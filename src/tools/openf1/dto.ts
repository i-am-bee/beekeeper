import { DateStringSchema } from "@/base/dto.js";
import { z } from "zod";

// meeting_key: 1263,
// session_key: 9963,
// location: "Montréal",
// date_start: "2025-06-15T18:00:00+00:00",
// date_end: "2025-06-15T20:00:00+00:00",
// session_type: "Race",
// session_name: "Race",
// country_key: 46,
// country_code: "CAN",
// country_name: "Canada",
// circuit_key: 23,
// circuit_short_name: "Montreal",
// gmt_offset: "-04:00:00",
// year: 2025

export const SessionTypeEnumSchema = z.enum(["Practice", "Qualifying", "Race"]);
export type SessionTypeEnum = z.infer<typeof SessionTypeEnumSchema>;

export const SessionPositionTypeEnumSchema = SessionTypeEnumSchema.extract([
  "Qualifying",
  "Race",
]);
export type SessionPositionTypeEnum = z.infer<
  typeof SessionPositionTypeEnumSchema
>;

export const SessionDetailSchema = z.object({
  session_id: z.number(), // Mapped to session_key in the API
  grand_prix_id: z.number(), // Mapped to meeting_key in the API
  location: z.string(),
  date_start: DateStringSchema, // Mapped to date_start in the API
  date_end: DateStringSchema, // Mapped to date_end in the API
  session_type: z.string(), // Mapped to session_type in the API
  session_name: z.string(), // Mapped to session_name in the API
  country_id: z.number(), // Mapped to country_key in the API
  country_code: z.string(), // Mapped to country_code in the API
  country_name: z.string(), // Mapped to country_name in the API
  circuit_id: z.number(), // Mapped to circuit_key in the API
  circuit_short_name: z.string(), // Mapped to circuit_short_name in the API
  gmt_offset: z.string(), // Mapped to gmt_offset in the API
  year: z.number(), // Mapped to year in the API
});
export type SessionDetail = z.infer<typeof SessionDetailSchema>;

export const SessionRefSchema = SessionDetailSchema.pick({
  session_id: true,
  session_name: true,
  session_type: true,
});
export type SessionRef = z.infer<typeof SessionRefSchema>;

export const DriverDetailSchema = z.object({
  driver_id: z.number(), // Mapped to driver_number in the API
  broadcast_name: z.string(),
  full_name: z.string(),
  name_acronym: z.string(),
  team_name: z.string(),
  team_colour: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  headshot_url: z.string().url(),
  country_code: z.string().nullable(),
});
export type DriverDetail = z.infer<typeof DriverDetailSchema>;

export const DriverRefSchema = DriverDetailSchema.pick({
  driver_id: true,
  full_name: true,
});

export const PositionSchema = z.object({
  position: z.number(), // Mapped to position in the API
  driver: DriverRefSchema, // Mapped to driver in the API
  // time: z.string().nullable(), // Mapped to time in the API, can be
});
export type Position = z.infer<typeof PositionSchema>;

export const GrandPrixDetailSchema = z.object({
  grand_prix_id: z.number(),
  name: z.string(),
  official_name: z.string(),
  circuit: z.string(),
  date: DateStringSchema,
  country: z.string(),
  location: z.string(),
  sessions: z.array(SessionRefSchema),
});
export type GrandPrixDetail = z.infer<typeof GrandPrixDetailSchema>;

export const GrandPrixRefSchema = GrandPrixDetailSchema.pick({
  grand_prix_id: true,
  name: true,
  date: true,
});
export type GrandPrixRef = z.infer<typeof GrandPrixRefSchema>;

export const SeasonDetailSchema = z.object({
  season_id: z.number(), // Same as year
  year: z.number(),
  state: z.enum(["active", "completed"]),
  // winner: z.string().optional(),
  grands_prix: z.array(GrandPrixRefSchema),
});
export type SeasonDetail = z.infer<typeof SeasonDetailSchema>;

export const SeasonSchema = SeasonDetailSchema.pick({
  season_id: true,
  year: true,
  state: true,
});
export type Season = z.infer<typeof SeasonSchema>;

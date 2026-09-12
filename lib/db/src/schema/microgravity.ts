import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const organizationsTable = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  organizationType: text("organization_type").notNull(),
  country: text("country").notNull(),
  city: text("city"),
  foundedYear: integer("founded_year"),
  website: text("website"),
  description: text("description").notNull().default("Not available"),
  commercialFocus: text("commercial_focus"),
});

export const platformsTable = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  platformType: text("platform_type").notNull(),
  operator: text("operator").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull().default("Not available"),
});

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  missionType: text("mission_type").notNull(),
  missionNumber: text("mission_number"),
  launchDate: date("launch_date", { mode: "string" }),
  returnDate: date("return_date", { mode: "string" }),
  launchVehicle: text("launch_vehicle").notNull().default("Not available"),
  destination: text("destination").notNull().default("Not available"),
  platformId: integer("platform_id").notNull().references(() => platformsTable.id),
  description: text("description").notNull().default("Not available"),
});

export const experimentsTable = pgTable("experiments", {
  id: serial("id").primaryKey(),
  experimentCode: text("experiment_code").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id),
  missionId: integer("mission_id").references(() => missionsTable.id),
  platformId: integer("platform_id").notNull().references(() => platformsTable.id),
  principalInvestigator: text("principal_investigator").notNull().default("Not available"),
  country: text("country").notNull(),
  year: integer("year"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  domain: text("domain").notNull(),
  subdomain: text("subdomain"),
  researchQuestion: text("research_question").notNull(),
  hypothesis: text("hypothesis").notNull(),
  objective: text("objective").notNull(),
  biologicalSystem: text("biological_system").notNull().default("Not available"),
  materialSystem: text("material_system").notNull().default("Not available"),
  hardware: text("hardware").notNull().default("Not available"),
  experimentalMethod: text("experimental_method").notNull().default("Not available"),
  microgravityDurationHours: numeric("microgravity_duration_hours"),
  gravityEnvironment: text("gravity_environment").notNull().default("Microgravity; exact profile not available"),
  controlGroup: text("control_group").notNull().default("Not available"),
  earthControlAvailable: boolean("earth_control_available"),
  mechanisms: text("mechanisms").array().notNull().default([]),
  resultSummary: text("result_summary").notNull(),
  resultSignificance: text("result_significance").notNull(),
  commercialApplication: text("commercial_application").notNull().default("Not yet identified"),
  commercialMarket: text("commercial_market").notNull().default("Not yet quantified"),
  potentialCustomer: text("potential_customer").notNull().default("Not available"),
  trl: integer("trl"),
  commercialized: boolean("commercialized").notNull().default(false),
  commercializationStatus: text("commercialization_status").notNull().default("Not available"),
  commercialRelevanceScore: integer("commercial_relevance_score"),
  scoreBreakdown: jsonb("score_breakdown").$type<{
    microgravityAdvantage: number;
    marketPotential: number;
    experimentalEvidence: number;
    commercializationPath: number;
    industryDemand: number;
    ipPotential: number;
  }>(),
  confidence: text("confidence").notNull().default("Low"),
  verificationStatus: text("verification_status").notNull().default("Needs Verification"),
  sourceCount: integer("source_count").notNull().default(0),
  lastVerifiedAt: date("last_verified_at", { mode: "string" }),
  whyThisMatters: text("why_this_matters").notNull(),
  technologyIds: integer("technology_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const technologiesTable = pgTable("technologies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  technologyCategory: text("technology_category").notNull(),
  description: text("description").notNull(),
  mechanism: text("mechanism").notNull(),
  trl: integer("trl"),
  commercialRelevance: integer("commercial_relevance"),
  applicationSummary: text("application_summary").notNull().default("Not available"),
});

export const sourcesTable = pgTable("sources", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceName: text("source_name").notNull(),
  url: text("url"),
  publisher: text("publisher"),
  publicationDate: date("publication_date", { mode: "string" }),
  accessDate: date("access_date", { mode: "string" }),
  sourceQuality: text("source_quality").notNull(),
  verificationStatus: text("verification_status").notNull(),
  experimentId: integer("experiment_id").references(() => experimentsTable.id),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  missionId: integer("mission_id").references(() => missionsTable.id),
  notes: text("notes").notNull(),
});

export const opportunitiesTable = pgTable("commercial_opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description").notNull(),
  domain: text("domain").notNull(),
  market: text("market").notNull(),
  microgravityAdvantage: text("microgravity_advantage").notNull(),
  problem: text("problem").notNull(),
  whyMicrogravity: text("why_microgravity").notNull(),
  evidence: text("evidence").notNull(),
  potentialCustomers: text("potential_customers").notNull(),
  existingCompetitors: text("existing_competitors").notNull(),
  marketSize: text("market_size").notNull().default("Not yet quantified"),
  trl: integer("trl"),
  stage: text("stage").notNull(),
  researchActivity: integer("research_activity").notNull(),
  commercialActivity: integer("commercial_activity").notNull(),
  opportunityScore: integer("opportunity_score").notNull(),
  confidence: text("confidence").notNull(),
  commercializationPathway: text("commercialization_pathway").notNull(),
  risks: text("risks").notNull(),
  assumptions: text("assumptions").notNull(),
  experimentIds: integer("experiment_ids").array().notNull().default([]),
  sourceIds: integer("source_ids").array().notNull().default([]),
});

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true });
export const insertPlatformSchema = createInsertSchema(platformsTable).omit({ id: true });
export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true });
export const insertExperimentSchema = createInsertSchema(experimentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTechnologySchema = createInsertSchema(technologiesTable).omit({ id: true });
export const insertSourceSchema = createInsertSchema(sourcesTable).omit({ id: true });
export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true });

export type Organization = typeof organizationsTable.$inferSelect;
export type Platform = typeof platformsTable.$inferSelect;
export type Mission = typeof missionsTable.$inferSelect;
export type Experiment = typeof experimentsTable.$inferSelect;
export type Technology = typeof technologiesTable.$inferSelect;
export type Source = typeof sourcesTable.$inferSelect;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type ScoreBreakdown = NonNullable<Experiment["scoreBreakdown"]> & { total: number; confidence: string };
export type JsonObject = Record<string, unknown>;
export type ZodInput<T extends z.ZodTypeAny> = z.infer<T>;
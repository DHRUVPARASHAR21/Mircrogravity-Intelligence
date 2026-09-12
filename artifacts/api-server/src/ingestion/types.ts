import type { InsertExperiment, InsertSource } from "@workspace/db";

export type NormalizedExperiment = InsertExperiment & {
  source: Omit<InsertSource, "experimentId">;
};

export interface DataSourceAdapter {
  readonly name: string;
  fetch(): Promise<unknown>;
  parse(raw: unknown): unknown[];
  normalize(records: unknown[]): NormalizedExperiment[];
  validate(records: NormalizedExperiment[]): { valid: NormalizedExperiment[]; errors: string[] };
  save(records: NormalizedExperiment[]): Promise<{ imported: number; rejected: number }>;
}
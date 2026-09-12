import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  experimentsTable,
  missionsTable,
  opportunitiesTable,
  organizationsTable,
  platformsTable,
  sourcesTable,
  technologiesTable,
} from "@workspace/db";
import {
  GetAnalyticsOverviewResponse,
  GetDomainAnalyticsResponse,
  GetExperimentParams,
  GetExperimentResponse,
  GetMissionParams,
  GetMissionResponse,
  GetOrganizationParams,
  GetOrganizationResponse,
  GetOrganizationAnalyticsResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetPlatformAnalyticsResponse,
  GetTechnologyParams,
  GetTechnologyResponse,
  GetTimelineAnalyticsResponse,
  GetWhiteSpaceAnalyticsResponse,
  GlobalSearchQueryParams,
  GlobalSearchResponse,
  ListExperimentsQueryParams,
  ListExperimentsResponse,
  ListMissionsQueryParams,
  ListMissionsResponse,
  ListOrganizationsQueryParams,
  ListOrganizationsResponse,
  ListOpportunitiesQueryParams,
  ListOpportunitiesResponse,
  ListPlatformsResponse,
  ListSourcesQueryParams,
  ListSourcesResponse,
  ListTechnologiesQueryParams,
  ListTechnologiesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const notFound = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], label: string) =>
  res.status(404).json({ error: `${label} not found` });

function pagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), total };
}

function summary(row: {
  experiment: typeof experimentsTable.$inferSelect;
  organization: typeof organizationsTable.$inferSelect;
  mission: typeof missionsTable.$inferSelect | null;
  platform: typeof platformsTable.$inferSelect;
}) {
  return {
    id: row.experiment.id,
    experimentCode: row.experiment.experimentCode,
    name: row.experiment.name,
    organizationName: row.organization.name,
    organizationId: row.organization.id,
    missionName: row.mission?.name ?? null,
    platformName: row.platform.name,
    year: row.experiment.year,
    domain: row.experiment.domain,
    subdomain: row.experiment.subdomain,
    country: row.experiment.country,
    durationHours: row.experiment.microgravityDurationHours ? Number(row.experiment.microgravityDurationHours) : null,
    trl: row.experiment.trl,
    commercialRelevance: row.experiment.commercialRelevanceScore,
    confidence: row.experiment.confidence,
    verificationStatus: row.experiment.verificationStatus,
  };
}

function sourceView(source: typeof sourcesTable.$inferSelect) {
  return {
    id: source.id,
    sourceName: source.sourceName,
    sourceType: source.sourceType,
    url: source.url,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    accessDate: source.accessDate,
    verificationStatus: source.verificationStatus,
    sourceQuality: source.sourceQuality,
    notes: source.notes,
  };
}

async function experimentRows(where?: ReturnType<typeof and>) {
  const rows = await db
    .select()
    .from(experimentsTable)
    .innerJoin(organizationsTable, eq(experimentsTable.organizationId, organizationsTable.id))
    .leftJoin(missionsTable, eq(experimentsTable.missionId, missionsTable.id))
    .innerJoin(platformsTable, eq(experimentsTable.platformId, platformsTable.id))
    .where(where);
  return rows.map((row) => ({
    experiment: row.experiments,
    organization: row.organizations,
    mission: row.missions,
    platform: row.platforms,
  }));
}

router.get("/experiments", async (req, res, next) => {
  try {
    const query = ListExperimentsQueryParams.parse(req.query);
    const filters = [
      query.search ? or(ilike(experimentsTable.name, `%${query.search}%`), ilike(experimentsTable.shortDescription, `%${query.search}%`), ilike(experimentsTable.domain, `%${query.search}%`)) : undefined,
      query.domain ? eq(experimentsTable.domain, query.domain) : undefined,
      query.subdomain ? eq(experimentsTable.subdomain, query.subdomain) : undefined,
      query.organizationId ? eq(experimentsTable.organizationId, query.organizationId) : undefined,
      query.country ? eq(experimentsTable.country, query.country) : undefined,
      query.platformId ? eq(experimentsTable.platformId, query.platformId) : undefined,
      query.yearFrom ? gte(experimentsTable.year, query.yearFrom) : undefined,
      query.yearTo ? lte(experimentsTable.year, query.yearTo) : undefined,
      query.trlMin ? gte(experimentsTable.trl, query.trlMin) : undefined,
      query.commercialized !== undefined ? eq(experimentsTable.commercialized, query.commercialized) : undefined,
      query.mechanism ? sql`${query.mechanism} = ANY(${experimentsTable.mechanisms})` : undefined,
    ].filter(Boolean) as NonNullable<ReturnType<typeof and>>[];
    const where = filters.length ? and(...filters) : undefined;
    const [{ value: total }] = await db.select({ value: count() }).from(experimentsTable).where(where);
    const orderBy = query.sort === "year" ? desc(experimentsTable.year) : query.sort === "name" ? asc(experimentsTable.name) : desc(experimentsTable.commercialRelevanceScore);
    const rows = await experimentRows(where);
    const start = (query.page - 1) * query.pageSize;
    const items = rows.sort((a, b) => {
      if (query.sort === "name") return a.experiment.name.localeCompare(b.experiment.name);
      if (query.sort === "year") return (b.experiment.year ?? 0) - (a.experiment.year ?? 0);
      return (b.experiment.commercialRelevanceScore ?? 0) - (a.experiment.commercialRelevanceScore ?? 0);
    }).slice(start, start + query.pageSize).map(summary);
    void orderBy;
    res.json(ListExperimentsResponse.parse({ items, pagination: pagination(query.page, query.pageSize, Number(total)) }));
  } catch (error) {
    next(error);
  }
});

router.get("/experiments/:id", async (req, res, next) => {
  try {
    const { id } = GetExperimentParams.parse(req.params);
    const rows = await experimentRows(eq(experimentsTable.id, id));
    const row = rows[0];
    if (!row) {
      notFound(res, "Experiment");
      return;
    }
    const [sources, relatedRows, organizations, technologies, opportunities] = await Promise.all([
      db.select().from(sourcesTable).where(eq(sourcesTable.experimentId, id)),
      experimentRows(and(eq(experimentsTable.domain, row.experiment.domain), sql`${experimentsTable.id} <> ${id}`)),
      db.select().from(organizationsTable).where(eq(organizationsTable.id, row.experiment.organizationId)),
      db.select().from(technologiesTable).where(row.experiment.technologyIds.length ? inArray(technologiesTable.id, row.experiment.technologyIds) : sql`false`),
      db.select().from(opportunitiesTable),
    ]);
    const relatedOpportunity = opportunities.find((item) => (item.experimentIds ?? []).includes(id)) ?? null;
    const score = row.experiment.scoreBreakdown ?? {
      microgravityAdvantage: 0,
      marketPotential: 0,
      experimentalEvidence: 0,
      commercializationPath: 0,
      industryDemand: 0,
      ipPotential: 0,
    };
    const total = row.experiment.commercialRelevanceScore ?? 0;
    const response = {
      ...summary(row),
      shortDescription: row.experiment.shortDescription,
      fullDescription: row.experiment.fullDescription,
      objective: row.experiment.objective,
      researchQuestion: row.experiment.researchQuestion,
      hypothesis: row.experiment.hypothesis,
      hardware: row.experiment.hardware,
      biologicalSystem: row.experiment.biologicalSystem,
      materialSystem: row.experiment.materialSystem,
      experimentalMethod: row.experiment.experimentalMethod,
      gravityEnvironment: row.experiment.gravityEnvironment,
      controlGroup: row.experiment.controlGroup,
      earthControlAvailable: row.experiment.earthControlAvailable,
      mechanisms: row.experiment.mechanisms,
      resultSummary: row.experiment.resultSummary,
      resultSignificance: row.experiment.resultSignificance,
      commercialApplication: row.experiment.commercialApplication,
      commercialMarket: row.experiment.commercialMarket,
      potentialCustomer: row.experiment.potentialCustomer,
      commercializationStatus: row.experiment.commercializationStatus,
      scoreBreakdown: { total, confidence: row.experiment.confidence, ...score },
      sources: sources.map(sourceView),
      relatedExperiments: relatedRows.slice(0, 6).map(summary),
      relatedOrganizations: organizations.map((item) => ({ id: item.id, name: item.name, organizationType: item.organizationType, country: item.country, experimentCount: 0, domainCount: 0, commercialFocus: item.commercialFocus })),
      relatedTechnologies: technologies.map((item) => ({ id: item.id, name: item.name, technologyCategory: item.technologyCategory, mechanism: item.mechanism, description: item.description, trl: item.trl, commercialRelevance: item.commercialRelevance })),
      relatedOpportunity: relatedOpportunity ? {
        id: relatedOpportunity.id,
        title: relatedOpportunity.title,
        domain: relatedOpportunity.domain,
        market: relatedOpportunity.market,
        stage: relatedOpportunity.stage,
        researchActivity: relatedOpportunity.researchActivity,
        commercialActivity: relatedOpportunity.commercialActivity,
        opportunityScore: relatedOpportunity.opportunityScore,
        confidence: relatedOpportunity.confidence,
      } : null,
      whyThisMatters: row.experiment.whyThisMatters,
    };
    res.json(GetExperimentResponse.parse(response));
  } catch (error) {
    next(error);
  }
});

router.get("/organizations", async (req, res, next) => {
  try {
    const query = ListOrganizationsQueryParams.parse(req.query);
    const rows = await db.select().from(organizationsTable).where(query.search ? ilike(organizationsTable.name, `%${query.search}%`) : undefined);
    const items = await Promise.all(rows.map(async (organization) => {
      const experiments = await db.select().from(experimentsTable).where(eq(experimentsTable.organizationId, organization.id));
      return { id: organization.id, name: organization.name, organizationType: organization.organizationType, country: organization.country, experimentCount: experiments.length, domainCount: new Set(experiments.map((item) => item.domain)).size, commercialFocus: organization.commercialFocus };
    }));
    const start = (query.page - 1) * query.pageSize;
    res.json(ListOrganizationsResponse.parse({ items: items.slice(start, start + query.pageSize), pagination: pagination(query.page, query.pageSize, items.length) }));
  } catch (error) {
    next(error);
  }
});

router.get("/organizations/:id", async (req, res, next) => {
  try {
    const { id } = GetOrganizationParams.parse(req.params);
    const organization = (await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)))[0];
    if (!organization) {
      notFound(res, "Organization");
      return;
    }
    const rows = await experimentRows(eq(experimentsTable.organizationId, id));
    const response = {
      id: organization.id, name: organization.name, organizationType: organization.organizationType, country: organization.country,
      experimentCount: rows.length, domainCount: new Set(rows.map((row) => row.experiment.domain)).size, commercialFocus: organization.commercialFocus,
      description: organization.description, website: organization.website, foundedYear: organization.foundedYear,
      experiments: rows.map(summary), publications: [], patents: [],
    };
    res.json(GetOrganizationResponse.parse(response));
  } catch (error) {
    next(error);
  }
});

router.get("/missions", async (req, res, next) => {
  try {
    const query = ListMissionsQueryParams.parse(req.query);
    const rows = await db.select({ mission: missionsTable, platform: platformsTable }).from(missionsTable).innerJoin(platformsTable, eq(missionsTable.platformId, platformsTable.id));
    const items = await Promise.all(rows.map(async ({ mission, platform }) => ({ id: mission.id, name: mission.name, missionType: mission.missionType, missionNumber: mission.missionNumber, launchDate: mission.launchDate, returnDate: mission.returnDate, platformName: platform.name, experimentCount: (await db.select({ value: count() }).from(experimentsTable).where(eq(experimentsTable.missionId, mission.id)))[0]?.value ?? 0 })));
    const filtered = query.search ? items.filter((item) => item.name.toLowerCase().includes(query.search!.toLowerCase()) || item.platformName.toLowerCase().includes(query.search!.toLowerCase())) : items;
    const start = (query.page - 1) * query.pageSize;
    res.json(ListMissionsResponse.parse({ items: filtered.slice(start, start + query.pageSize), pagination: pagination(query.page, query.pageSize, filtered.length) }));
  } catch (error) {
    next(error);
  }
});

router.get("/missions/:id", async (req, res, next) => {
  try {
    const { id } = GetMissionParams.parse(req.params);
    const row = (await db.select({ mission: missionsTable, platform: platformsTable }).from(missionsTable).innerJoin(platformsTable, eq(missionsTable.platformId, platformsTable.id)).where(eq(missionsTable.id, id)))[0];
    if (!row) {
      notFound(res, "Mission");
      return;
    }
    const rows = await experimentRows(eq(experimentsTable.missionId, id));
    res.json(GetMissionResponse.parse({ id: row.mission.id, name: row.mission.name, missionType: row.mission.missionType, missionNumber: row.mission.missionNumber, launchDate: row.mission.launchDate, returnDate: row.mission.returnDate, platformName: row.platform.name, experimentCount: rows.length, destination: row.mission.destination, launchVehicle: row.mission.launchVehicle, description: row.mission.description, experiments: rows.map(summary) }));
  } catch (error) {
    next(error);
  }
});

router.get("/platforms", async (_req, res, next) => {
  try {
    const rows = await db.select().from(platformsTable);
    const items = await Promise.all(rows.map(async (platform) => ({ id: platform.id, name: platform.name, platformType: platform.platformType, operator: platform.operator, country: platform.country, description: platform.description, experimentCount: Number((await db.select({ value: count() }).from(experimentsTable).where(eq(experimentsTable.platformId, platform.id)))[0]?.value ?? 0) })));
    res.json(ListPlatformsResponse.parse(items));
  } catch (error) {
    next(error);
  }
});

router.get("/technologies", async (req, res, next) => {
  try {
    const query = ListTechnologiesQueryParams.parse(req.query);
    const rows = await db.select().from(technologiesTable).where(query.search ? or(ilike(technologiesTable.name, `%${query.search}%`), ilike(technologiesTable.technologyCategory, `%${query.search}%`)) : undefined);
    res.json(ListTechnologiesResponse.parse(rows.map((item) => ({ id: item.id, name: item.name, technologyCategory: item.technologyCategory, mechanism: item.mechanism, description: item.description, trl: item.trl, commercialRelevance: item.commercialRelevance }))));
  } catch (error) {
    next(error);
  }
});

router.get("/technologies/:id", async (req, res, next) => {
  try {
    const { id } = GetTechnologyParams.parse(req.params);
    const technology = (await db.select().from(technologiesTable).where(eq(technologiesTable.id, id)))[0];
    if (!technology) {
      notFound(res, "Technology");
      return;
    }
    const rows = await experimentRows(sql`${experimentsTable.technologyIds} @> ARRAY[${id}]::int[]`);
    res.json(GetTechnologyResponse.parse({ id: technology.id, name: technology.name, technologyCategory: technology.technologyCategory, mechanism: technology.mechanism, description: technology.description, trl: technology.trl, commercialRelevance: technology.commercialRelevance, experiments: rows.map(summary), organizations: [...new Set(rows.map((row) => row.organization.name))], publications: [], patents: [], applications: [technology.applicationSummary] }));
  } catch (error) {
    next(error);
  }
});

router.get("/opportunities", async (req, res, next) => {
  try {
    const query = ListOpportunitiesQueryParams.parse(req.query);
    const filters = [query.search ? or(ilike(opportunitiesTable.title, `%${query.search}%`), ilike(opportunitiesTable.description, `%${query.search}%`)) : undefined, query.domain ? eq(opportunitiesTable.domain, query.domain) : undefined, query.market ? eq(opportunitiesTable.market, query.market) : undefined, query.stage ? eq(opportunitiesTable.stage, query.stage) : undefined].filter(Boolean) as NonNullable<ReturnType<typeof and>>[];
    const where = filters.length ? and(...filters) : undefined;
    const rows = await db.select().from(opportunitiesTable).where(where);
    const start = (query.page - 1) * query.pageSize;
    const items = rows.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(start, start + query.pageSize).map((item) => ({ id: item.id, title: item.title, domain: item.domain, market: item.market, stage: item.stage, researchActivity: item.researchActivity, commercialActivity: item.commercialActivity, opportunityScore: item.opportunityScore, confidence: item.confidence }));
    res.json(ListOpportunitiesResponse.parse({ items, pagination: pagination(query.page, query.pageSize, rows.length) }));
  } catch (error) {
    next(error);
  }
});

router.get("/opportunities/:id", async (req, res, next) => {
  try {
    const { id } = GetOpportunityParams.parse(req.params);
    const item = (await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, id)))[0];
    if (!item) {
      notFound(res, "Opportunity");
      return;
    }
    const rows = item.experimentIds.length ? await experimentRows(sql`${experimentsTable.id} = ANY(ARRAY[${sql.join(item.experimentIds.map((value) => sql`${value}`), sql`, `)}]::int[])`) : [];
    const sources = item.sourceIds.length ? await db.select().from(sourcesTable).where(inArray(sourcesTable.id, item.sourceIds)) : [];
    res.json(GetOpportunityResponse.parse({ id: item.id, title: item.title, domain: item.domain, market: item.market, stage: item.stage, researchActivity: item.researchActivity, commercialActivity: item.commercialActivity, opportunityScore: item.opportunityScore, confidence: item.confidence, description: item.description, problem: item.problem, whyMicrogravity: item.whyMicrogravity, evidence: item.evidence, potentialCustomers: item.potentialCustomers, existingCompetitors: item.existingCompetitors, marketSize: item.marketSize, trl: item.trl, commercializationPathway: item.commercializationPathway, risks: item.risks, assumptions: item.assumptions, experiments: rows.map(summary), sources: sources.map(sourceView) }));
  } catch (error) {
    next(error);
  }
});

router.get("/sources", async (req, res, next) => {
  try {
    const query = ListSourcesQueryParams.parse(req.query);
    const rows = await db.select().from(sourcesTable).where(and(query.search ? or(ilike(sourcesTable.sourceName, `%${query.search}%`), ilike(sourcesTable.notes, `%${query.search}%`)) : undefined, query.experimentId ? eq(sourcesTable.experimentId, query.experimentId) : undefined));
    res.json(ListSourcesResponse.parse(rows.map(sourceView)));
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const query = GlobalSearchQueryParams.parse(req.query);
    const term = `%${query.q}%`;
    const [experiments, organizations, missions, technologies, opportunities] = await Promise.all([
      db.select({ id: experimentsTable.id, title: experimentsTable.name, subtitle: experimentsTable.shortDescription, year: experimentsTable.year, domain: experimentsTable.domain }).from(experimentsTable).where(or(ilike(experimentsTable.name, term), ilike(experimentsTable.shortDescription, term), ilike(experimentsTable.domain, term))),
      db.select({ id: organizationsTable.id, title: organizationsTable.name, subtitle: organizationsTable.description }).from(organizationsTable).where(or(ilike(organizationsTable.name, term), ilike(organizationsTable.description, term))),
      db.select({ id: missionsTable.id, title: missionsTable.name, subtitle: missionsTable.description }).from(missionsTable).where(or(ilike(missionsTable.name, term), ilike(missionsTable.description, term))),
      db.select({ id: technologiesTable.id, title: technologiesTable.name, subtitle: technologiesTable.description }).from(technologiesTable).where(or(ilike(technologiesTable.name, term), ilike(technologiesTable.description, term))),
      db.select({ id: opportunitiesTable.id, title: opportunitiesTable.title, subtitle: opportunitiesTable.description }).from(opportunitiesTable).where(or(ilike(opportunitiesTable.title, term), ilike(opportunitiesTable.description, term))),
    ]);
    const results = [
      ...experiments.map((item) => ({ type: "experiment" as const, ...item, relevance: 100 })),
      ...organizations.map((item) => ({ type: "organization" as const, ...item, year: null, domain: null, relevance: 80 })),
      ...missions.map((item) => ({ type: "mission" as const, ...item, year: null, domain: null, relevance: 75 })),
      ...technologies.map((item) => ({ type: "technology" as const, ...item, year: null, domain: null, relevance: 85 })),
      ...opportunities.map((item) => ({ type: "opportunity" as const, ...item, year: null, domain: null, relevance: 90 })),
    ].slice(0, query.limit);
    res.json(GlobalSearchResponse.parse(results));
  } catch (error) {
    next(error);
  }
});

async function overview() {
  const [[{ value: experiments }], [{ value: organizations }], [{ value: platforms }]] = await Promise.all([
    db.select({ value: count() }).from(experimentsTable),
    db.select({ value: count() }).from(organizationsTable),
    db.select({ value: count() }).from(platformsTable),
  ]);
  const countryRows = await db.select({ country: experimentsTable.country }).from(experimentsTable);
  const domains = await domainAnalytics();
  const timeline = await timelineAnalytics();
  const topOrganizations = await organizationAnalytics();
  const platformMix = await platformAnalytics();
  const topOpportunities = await db.select().from(opportunitiesTable).orderBy(desc(opportunitiesTable.opportunityScore)).limit(5);
  const whiteSpaces = await whiteSpaceAnalytics();
  return {
    experiments: Number(experiments),
    organizations: Number(organizations),
    countries: new Set(countryRows.map((row) => row.country)).size,
    platforms: Number(platforms),
    domains,
    timeline,
    topOrganizations,
    topOpportunities: topOpportunities.map((item) => ({ id: item.id, title: item.title, domain: item.domain, market: item.market, stage: item.stage, researchActivity: item.researchActivity, commercialActivity: item.commercialActivity, opportunityScore: item.opportunityScore, confidence: item.confidence })),
    platformMix,
    whiteSpaces,
  };
}

async function domainAnalytics() {
  const rows = await db.select({ label: experimentsTable.domain, value: count() }).from(experimentsTable).groupBy(experimentsTable.domain).orderBy(desc(count()));
  return rows.map((row) => ({ label: row.label, value: Number(row.value) }));
}
async function timelineAnalytics() {
  const rows = await db.select({ label: sql<string>`COALESCE(${experimentsTable.year}, 0)::text`, value: count() }).from(experimentsTable).groupBy(experimentsTable.year).orderBy(asc(experimentsTable.year));
  return rows.map((row) => ({ label: row.label === "0" ? "Unknown" : row.label, value: Number(row.value) }));
}
async function organizationAnalytics() {
  const rows = await db.select({ id: organizationsTable.id, label: organizationsTable.name, value: count(experimentsTable.id) }).from(organizationsTable).leftJoin(experimentsTable, eq(experimentsTable.organizationId, organizationsTable.id)).groupBy(organizationsTable.id).orderBy(desc(count(experimentsTable.id))).limit(8);
  return rows.map((row) => ({ id: row.id, label: row.label, value: Number(row.value), secondaryValue: null }));
}
async function platformAnalytics() {
  const rows = await db.select({ id: platformsTable.id, label: platformsTable.name, value: count(experimentsTable.id) }).from(platformsTable).leftJoin(experimentsTable, eq(experimentsTable.platformId, platformsTable.id)).groupBy(platformsTable.id).orderBy(desc(count(experimentsTable.id)));
  return rows.map((row) => ({ id: row.id, label: row.label, value: Number(row.value), secondaryValue: null }));
}
async function whiteSpaceAnalytics() {
  const rows = await db.select().from(opportunitiesTable).orderBy(desc(opportunitiesTable.opportunityScore));
  return rows.map((item) => ({ id: item.id, label: item.title, researchActivity: item.researchActivity, marketPotential: Math.min(100, item.opportunityScore + 5), opportunityScore: item.opportunityScore, quadrant: item.researchActivity <= 2 && item.opportunityScore >= 70 ? "White space" : item.researchActivity > 2 && item.opportunityScore >= 70 ? "Established opportunity" : "Early / unproven" }));
}

router.get("/analytics/overview", async (_req, res, next) => {
  try { res.json(GetAnalyticsOverviewResponse.parse(await overview())); } catch (error) { next(error); }
});
router.get("/analytics/domains", async (_req, res, next) => {
  try { res.json(GetDomainAnalyticsResponse.parse(await domainAnalytics())); } catch (error) { next(error); }
});
router.get("/analytics/timeline", async (_req, res, next) => {
  try { res.json(GetTimelineAnalyticsResponse.parse(await timelineAnalytics())); } catch (error) { next(error); }
});
router.get("/analytics/organizations", async (_req, res, next) => {
  try { res.json(GetOrganizationAnalyticsResponse.parse(await organizationAnalytics())); } catch (error) { next(error); }
});
router.get("/analytics/platforms", async (_req, res, next) => {
  try { res.json(GetPlatformAnalyticsResponse.parse(await platformAnalytics())); } catch (error) { next(error); }
});
router.get("/analytics/white-spaces", async (_req, res, next) => {
  try { res.json(GetWhiteSpaceAnalyticsResponse.parse(await whiteSpaceAnalytics())); } catch (error) { next(error); }
});

export default router;
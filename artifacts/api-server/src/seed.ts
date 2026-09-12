import { and, count, eq } from "drizzle-orm";
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

const today = "2026-09-11";

const organizations = [
  { name: "NASA", organizationType: "Government agency", country: "United States", city: "Washington, D.C.", website: "https://www.nasa.gov/", description: "United States government agency responsible for civil space research and exploration.", commercialFocus: "Technology transfer and research partnerships" },
  { name: "European Space Agency", organizationType: "Intergovernmental agency", country: "Europe", city: "Paris", website: "https://www.esa.int/", description: "European intergovernmental organization dedicated to space exploration and research.", commercialFocus: "Research partnerships and industrial technology" },
  { name: "JAXA", organizationType: "Government agency", country: "Japan", city: "Chofu", website: "https://www.jaxa.jp/", description: "Japan's national research and development agency for aerospace and space activity.", commercialFocus: "Research partnerships and technology demonstration" },
  { name: "ISS National Laboratory", organizationType: "Research platform operator", country: "United States", city: "Melbourne", website: "https://issnationallab.org/", description: "U.S. National Laboratory managing sponsored research on the International Space Station.", commercialFocus: "Commercial research access to low Earth orbit" },
  { name: "Roscosmos", organizationType: "Government agency", country: "Russia", city: "Moscow", website: "https://www.roscosmos.ru/", description: "Russian state corporation for space activities.", commercialFocus: "Not available" },
  { name: "Space Tango", organizationType: "Commercial research company", country: "United States", city: "Lexington", website: "https://spacetango.com/", description: "Commercial provider of automated research platforms and services for space.", commercialFocus: "Automated in-space research and manufacturing" },
  { name: "Redwire Space", organizationType: "Commercial space company", country: "United States", city: "Jacksonville", website: "https://redwirespace.com/", description: "Commercial space infrastructure company with in-space manufacturing and research capabilities.", commercialFocus: "In-space manufacturing and pharmaceutical research" },
  { name: "Merck", organizationType: "Pharmaceutical company", country: "United States", city: "Rahway", website: "https://www.merck.com/", description: "Pharmaceutical company involved in public microgravity crystal growth research.", commercialFocus: "Drug development" },
];

const platforms = [
  { name: "ISS", platformType: "Orbital laboratory", operator: "NASA / international partners", country: "International", description: "Crewed orbital laboratory supporting long-duration microgravity research." },
  { name: "ISS U.S. National Laboratory", platformType: "Orbital laboratory", operator: "ISS National Laboratory", country: "United States", description: "Commercial and academic research access hosted on the ISS." },
  { name: "Parabolic flight", platformType: "Aircraft", operator: "ESA / NASA / commercial providers", country: "International", description: "Aircraft flight profiles that provide repeated short periods of reduced gravity." },
  { name: "Sounding rocket", platformType: "Suborbital", operator: "Multiple agencies", country: "International", description: "Suborbital vehicles providing minutes of microgravity for research payloads." },
  { name: "Drop tower", platformType: "Ground facility", operator: "Multiple research institutions", country: "International", description: "Ground-based free-fall facility providing short-duration reduced gravity." },
  { name: "Commercial free flyer", platformType: "Orbital laboratory", operator: "Commercial providers", country: "United States", description: "Uncrewed or commercially operated orbital research platforms." },
];

const missionSeeds = [
  { name: "ISS Expedition Research Program", missionType: "Orbital research", missionNumber: "ISS-EXP", platform: "ISS", launchVehicle: "Multiple", destination: "Low Earth orbit", description: "Long-duration investigations conducted across ISS expedition increments." },
  { name: "Space Shuttle Research Missions", missionType: "Orbital research", missionNumber: "STS", platform: "ISS", launchVehicle: "Space Shuttle", destination: "Low Earth orbit", description: "Research investigations flown during the Space Shuttle era." },
  { name: "SpaceX CRS Resupply", missionType: "Cargo resupply", missionNumber: "CRS", platform: "ISS U.S. National Laboratory", launchVehicle: "Falcon 9 / Dragon", destination: "Low Earth orbit", description: "Commercial cargo missions delivering sponsored research to the ISS." },
  { name: "Northrop Grumman Cygnus Resupply", missionType: "Cargo resupply", missionNumber: "NG", platform: "ISS U.S. National Laboratory", launchVehicle: "Antares / Cygnus", destination: "Low Earth orbit", description: "Commercial cargo missions carrying research payloads." },
  { name: "ESA Parabolic Flight Campaign", missionType: "Suborbital research", missionNumber: "PFC", platform: "Parabolic flight", launchVehicle: "Airbus A310", destination: "Atmosphere", description: "Campaigns providing repeated short periods of reduced gravity." },
];

const technologySeeds = [
  { name: "Protein crystallization", technologyCategory: "Biotechnology", mechanism: "Reduced convection", description: "Methods for growing protein crystals in reduced-gravity environments.", trl: 4, commercialRelevance: 82, applicationSummary: "Potentially useful for structural biology and drug discovery; specific commercial claims require evidence." },
  { name: "Organoid systems", technologyCategory: "Biotechnology", mechanism: "Altered cellular mechanotransduction", description: "Three-dimensional cell culture systems used to study tissue development and disease.", trl: 3, commercialRelevance: 76, applicationSummary: "Potential application in disease modeling and drug screening." },
  { name: "Fiber optic manufacturing", technologyCategory: "Advanced materials", mechanism: "Reduced convection", description: "Manufacturing approaches that study optical fiber formation in microgravity.", trl: 4, commercialRelevance: 78, applicationSummary: "Potential application in specialty fiber production; market size is not yet quantified." },
  { name: "In-space bioprinting", technologyCategory: "In-space manufacturing", mechanism: "Reduced sedimentation", description: "Additive manufacturing research using biological materials in reduced gravity.", trl: 3, commercialRelevance: 74, applicationSummary: "Potential application in regenerative medicine research." },
  { name: "Combustion science", technologyCategory: "Physics", mechanism: "Reduced convection", description: "Studies of flame behavior and combustion without buoyancy-driven flow.", trl: 5, commercialRelevance: 62, applicationSummary: "Potential application in cleaner combustion and fire safety models." },
  { name: "Fluid management", technologyCategory: "Fluid physics", mechanism: "Surface-tension dominance", description: "Fluid behavior and management in spacecraft systems.", trl: 6, commercialRelevance: 68, applicationSummary: "Direct relevance to spacecraft life-support and propellant systems." },
  { name: "Crystal growth", technologyCategory: "Advanced materials", mechanism: "Altered crystal growth", description: "Research into crystal formation with reduced sedimentation and convection.", trl: 4, commercialRelevance: 71, applicationSummary: "Potential application in pharmaceuticals and advanced materials." },
  { name: "Plant growth systems", technologyCategory: "Agriculture", mechanism: "Altered gene expression", description: "Plant biology research in controlled orbital environments.", trl: 5, commercialRelevance: 60, applicationSummary: "Potential application in controlled-environment agriculture." },
];

const experimentSeeds: Array<[string, string, string, string, string, string, number, string, string, string, number, string, string]> = [
  ["PCG-ISS-01", "Protein Crystal Growth on the ISS", "NASA", "ISS Expedition Research Program", "Biology & Biotechnology", "Protein Biochemistry", 2018, "Protein crystallization", "Public record identifies an ISS investigation of protein crystal growth.", "Needs Verification", 86, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["PCG-ISS-02", "Microgravity Protein Crystal Growth Research", "Merck", "SpaceX CRS Resupply", "Medicine & Pharma", "Drug Discovery", 2017, "Protein crystallization", "Public record identifies pharmaceutical protein crystallization research using the ISS environment.", "Needs verification", 84, "Medium", "https://issnationallab.org/"],
  ["ORG-ISS-01", "Tissue Regeneration and Organoid Research", "NASA", "ISS Expedition Research Program", "Medicine & Pharma", "Tissue Engineering", 2020, "Organoid systems", "Public record identifies three-dimensional tissue and cell culture investigations in orbit.", "Needs Verification", 79, "Medium", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["ORG-ISS-02", "Cancer Biology in Microgravity", "ISS National Laboratory", "SpaceX CRS Resupply", "Medicine & Pharma", "Cancer", 2021, "Organoid systems", "Public record identifies cancer biology research conducted through the ISS National Laboratory.", "Needs verification", 82, "Medium", "https://issnationallab.org/"],
  ["PLT-ISS-01", "Plant Habitat Research", "NASA", "ISS Expedition Research Program", "Agriculture", "Plant Biology", 2019, "Plant growth systems", "Public record identifies controlled plant growth investigations on the ISS.", "Partially Verified", 61, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["PLT-ISS-02", "Advanced Plant Habitat", "NASA", "ISS Expedition Research Program", "Agriculture", "Plant Biology", 2020, "Plant growth systems", "Public record identifies plant growth research using the Advanced Plant Habitat facility.", "Partially Verified", 64, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["FIB-ISS-01", "ZBLAN Fiber Optics in Microgravity", "NASA", "ISS Expedition Research Program", "Materials Science", "Fiber Optics", 2019, "Fiber optic manufacturing", "Public record identifies research into specialty fiber production in microgravity.", "Needs verification", 78, "Medium", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["FIB-ISS-02", "Optical Fiber Manufacturing Demonstration", "Redwire Space", "ISS U.S. National Laboratory", "In-Space Manufacturing", "Fiber Optics", 2021, "Fiber optic manufacturing", "Public record identifies commercial in-space manufacturing research involving optical fiber.", "Needs verification", 80, "Medium", "https://issnationallab.org/"],
  ["BIO-ISS-01", "BioFabrication Facility Research", "Redwire Space", "ISS U.S. National Laboratory", "In-Space Manufacturing", "Tissue Engineering", 2021, "In-space bioprinting", "Public record identifies bioprinting technology demonstrations on the ISS.", "Partially Verified", 77, "Medium", "https://redwirespace.com/"],
  ["BIO-ISS-02", "Cell Science Research in Orbit", "JAXA", "ISS Expedition Research Program", "Biology & Biotechnology", "Cell Biology", 2018, "Organoid systems", "Public record identifies cell biology research performed in the Kibo and ISS research environment.", "Needs verification", 73, "Low", "https://www.jaxa.jp/"],
  ["COM-ISS-01", "Flame Design and Spherical Diffusion Flames", "NASA", "ISS Expedition Research Program", "Combustion", "Combustion", 2017, "Combustion science", "Public record identifies combustion investigations designed to observe flames without normal buoyancy.", "Partially Verified", 59, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["COM-PAR-01", "Combustion During Parabolic Flight", "European Space Agency", "ESA Parabolic Flight Campaign", "Combustion", "Combustion", 2016, "Combustion science", "Public record identifies reduced-gravity combustion research conducted during parabolic flight.", "Needs verification", 55, "Medium", "https://www.esa.int/"],
  ["FLU-ISS-01", "Capillary Flow Experiment", "NASA", "ISS Expedition Research Program", "Fluid Physics", "Fluid Physics", 2014, "Fluid management", "Public record identifies capillary flow research supporting fluid management in spacecraft systems.", "Partially Verified", 71, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["FLU-ISS-02", "Complex Fluids in Microgravity", "European Space Agency", "ISS Expedition Research Program", "Fluid Physics", "Fluid Physics", 2018, "Fluid management", "Public record identifies complex-fluid investigations in the ISS research portfolio.", "Needs verification", 64, "Medium", "https://www.esa.int/"],
  ["MAT-ISS-01", "Materials Science Research on the ISS", "JAXA", "ISS Expedition Research Program", "Materials Science", "Advanced Materials", 2016, "Crystal growth", "Public record identifies materials research conducted in the Japanese Experiment Module.", "Needs verification", 68, "Medium", "https://www.jaxa.jp/"],
  ["MAT-ISS-02", "Solidification and Alloy Research", "NASA", "ISS Expedition Research Program", "Materials Science", "Alloys", 2015, "Crystal growth", "Public record identifies solidification and materials processing research in microgravity.", "Needs verification", 65, "Low", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["MIC-ISS-01", "Microbial Monitoring in Spaceflight", "NASA", "ISS Expedition Research Program", "Biology & Biotechnology", "Microbiology", 2019, "Organoid systems", "Public record identifies microbial monitoring and microbiology studies associated with the ISS.", "Needs verification", 57, "Medium", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["IMM-ISS-01", "Immune Response in Microgravity", "NASA", "ISS Expedition Research Program", "Medicine & Pharma", "Immunology", 2018, "Organoid systems", "Public record identifies investigations of immune response during spaceflight.", "Needs verification", 70, "Medium", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["STEM-ISS-01", "Stem Cell Differentiation in Space", "ISS National Laboratory", "SpaceX CRS Resupply", "Medicine & Pharma", "Stem Cells", 2020, "Organoid systems", "Public record identifies stem cell research supported by the ISS National Laboratory.", "Needs verification", 75, "Low", "https://issnationallab.org/"],
  ["FOOD-ISS-01", "Space Crop Food Production", "NASA", "ISS Expedition Research Program", "Food & Nutrition", "Plant Biology", 2017, "Plant growth systems", "Public record identifies food-crop growth research in controlled ISS facilities.", "Partially Verified", 58, "High", "https://www.nasa.gov/international-space-station/space-station-research-and-technology/"],
  ["FLU-PAR-01", "Droplet and Interface Dynamics", "European Space Agency", "ESA Parabolic Flight Campaign", "Fluid Physics", "Fluid Physics", 2015, "Fluid management", "Public record identifies fluid-interface research using short-duration reduced gravity.", "Needs verification", 52, "Medium", "https://www.esa.int/"],
  ["BIO-SUB-01", "Suborbital Biology Payload Demonstration", "NASA", "SpaceX CRS Resupply", "Biology & Biotechnology", "Microbiology", 2022, "Organoid systems", "Public record identifies biological payload demonstrations associated with commercial launch access.", "Needs verification", 48, "Low", "https://issnationallab.org/"],
  ["MAT-DROP-01", "Metal Alloy Solidification in Drop Tower", "European Space Agency", "ESA Parabolic Flight Campaign", "Materials Science", "Metals", 2013, "Crystal growth", "Public record identifies reduced-gravity materials processing research; exact record requires verification.", "Needs verification", 46, "Low", "https://www.esa.int/"],
  ["TECH-ISS-01", "Autonomous Research Hardware Demonstration", "Space Tango", "ISS U.S. National Laboratory", "Technology Demonstration", "Technology Demonstration", 2022, "Fluid management", "Public record identifies commercial automated research hardware used for orbital investigations.", "Needs verification", 66, "Medium", "https://spacetango.com/"],
];

function scoreBreakdown(total: number) {
  const microgravityAdvantage = Math.round(total * 0.2);
  const marketPotential = Math.round(total * 0.2);
  const experimentalEvidence = Math.round(total * 0.15);
  const commercializationPath = Math.round(total * 0.15);
  const industryDemand = Math.round(total * 0.1);
  const ipPotential = Math.min(10, Math.max(0, total - microgravityAdvantage - marketPotential - experimentalEvidence - commercializationPath - industryDemand));
  return { microgravityAdvantage, marketPotential, experimentalEvidence, commercializationPath, industryDemand, ipPotential };
}

export async function seedDatabase() {
  const existing = await db.select({ value: count() }).from(experimentsTable);
  if (Number(existing[0]?.value ?? 0) > 0) return;

  const orgRows = await db.insert(organizationsTable).values(organizations).returning();
  const orgMap = new Map(orgRows.map((row) => [row.name, row.id]));
  const platformRows = await db.insert(platformsTable).values(platforms).returning();
  const platformMap = new Map(platformRows.map((row) => [row.name, row.id]));
  const missionRows = await db.insert(missionsTable).values(missionSeeds.map(({ platform, ...mission }) => ({ ...mission, platformId: platformMap.get(platform)! }))).returning();
  const missionMap = new Map(missionRows.map((row) => [row.name, row.id]));
  const technologyRows = await db.insert(technologiesTable).values(technologySeeds).returning();
  const technologyMap = new Map(technologyRows.map((row) => [row.name, row.id]));

  const experimentRows = await db.insert(experimentsTable).values(experimentSeeds.map(([code, name, org, mission, domain, subdomain, year, technology, result, verification, score, confidence]) => {
    const platformName = mission.includes("Parabolic") ? "Parabolic flight" : mission.includes("CRS") ? "ISS U.S. National Laboratory" : "ISS";
    const organizationId = orgMap.get(org)!;
    const platformId = platformMap.get(platformName)!;
    return {
      experimentCode: code,
      name,
      shortDescription: result,
      fullDescription: `${result} This is a publicly sourced seed record for the MVP; field-level evidence is shown below and uncertain details remain explicitly marked.`,
      organizationId,
      missionId: missionMap.get(mission) ?? null,
      platformId,
      country: orgRows.find((row) => row.id === organizationId)?.country ?? "Not available",
      year,
      domain,
      subdomain,
      researchQuestion: "What changes when this system is studied in a reduced-gravity environment?",
      hypothesis: "The reduced-gravity environment changes the balance of physical or biological processes relevant to the system.",
      objective: result,
      biologicalSystem: domain.includes("Biology") || domain.includes("Medicine") || domain.includes("Agriculture") ? "Biological system identified in public record; details require verification." : "Not applicable",
      materialSystem: domain.includes("Materials") || domain.includes("Manufacturing") ? "Material system identified in public record; details require verification." : "Not applicable",
      hardware: "Hardware details require verification",
      experimentalMethod: "Public record identifies an investigation; detailed method requires verification.",
      microgravityDurationHours: null,
      gravityEnvironment: "Reduced gravity; exact profile and duration require verification",
      controlGroup: "Not available",
      earthControlAvailable: null,
      mechanisms: technology === "Protein crystallization" ? ["Reduced convection", "Reduced sedimentation", "Altered crystal growth"] : technology === "Combustion science" ? ["Reduced convection", "Reduced buoyancy"] : ["Reduced sedimentation", "Altered fluid behavior"],
      resultSummary: verification === "Partially Verified" ? result : "Not yet verified in detail. See source notes for the public record basis.",
      resultSignificance: "Scientific significance requires review against the primary experiment record or publication.",
      commercialApplication: technologySeeds.find((item) => item.name === technology)?.applicationSummary ?? "Not yet identified",
      commercialMarket: "Not yet quantified",
      potentialCustomer: "Not available",
      trl: null,
      commercialized: false,
      commercializationStatus: "Not available",
      commercialRelevanceScore: score,
      scoreBreakdown: scoreBreakdown(score),
      confidence,
      verificationStatus: verification,
      sourceCount: 1,
      lastVerifiedAt: today,
      whyThisMatters: `The public record connects ${technology.toLowerCase()} with a reduced-gravity research setting. The possible commercial link is an analytical inference, not an established market claim.`,
      technologyIds: [technologyMap.get(technology)!],
    };
  })).returning();

  const sourceRows = experimentRows.map((experiment, index) => {
    const sourceUrl = experimentSeeds[index][12] as string;
    return {
      sourceType: "Official agency / company",
      sourceName: "Publicly sourced seed record",
      url: sourceUrl,
      publisher: "NASA, ESA, ISS National Laboratory, JAXA, or company source",
      accessDate: today,
      sourceQuality: experiment.verificationStatus === "Verified" ? "Primary" : "Secondary",
      verificationStatus: experiment.verificationStatus,
      experimentId: experiment.id,
      notes: "MVP seed record. Specific evidence and field-level details should be reviewed before production use.",
    };
  });
  await db.insert(sourcesTable).values(sourceRows);

  const opportunityRows = [
    { title: "Protein crystallization for structural biology", description: "A research-backed opportunity area connecting microgravity crystal growth to structural biology workflows.", domain: "Medicine & Pharma", market: "Drug discovery", microgravityAdvantage: "Reduced convection and sedimentation may support crystal growth conditions not available on Earth.", problem: "Some protein structures remain difficult to resolve with terrestrial crystallization workflows.", whyMicrogravity: "Reduced buoyancy-driven flow changes transport conditions around growing crystals.", evidence: "Linked experiment records and official research sources; detailed commercial validation remains incomplete.", potentialCustomers: "Pharmaceutical R&D teams; structural biology groups", existingCompetitors: "Terrestrial crystallization platforms; specialized CROs", stage: "Research-backed", researchActivity: 2, commercialActivity: 1, opportunityScore: 86, confidence: "Medium", commercializationPathway: "Validate reproducibility, compare against terrestrial workflows, and identify compounds where structure quality changes decisions.", risks: "Evidence may not generalize across proteins; economics are not yet quantified.", assumptions: "A repeatable microgravity advantage can be demonstrated for a defined protein class.", experimentIds: experimentRows.filter((row) => row.technologyIds.includes(technologyMap.get("Protein crystallization")!)).map((row) => row.id), sourceIds: [] },
    { title: "Advanced fiber manufacturing", description: "An opportunity area around specialty optical fiber production in reduced gravity.", domain: "Materials Science", market: "Fiber optics", microgravityAdvantage: "Reduced convection may affect phase separation and material uniformity during fiber formation.", problem: "Some specialty fibers are difficult to manufacture consistently using terrestrial processes.", whyMicrogravity: "The environment may change defect formation and material separation during processing.", evidence: "Public records identify optical fiber manufacturing research; performance and economics require verification.", potentialCustomers: "Telecommunications, sensing, and defense technology companies", existingCompetitors: "Terrestrial specialty fiber manufacturers", stage: "Technology demonstration", researchActivity: 2, commercialActivity: 1, opportunityScore: 78, confidence: "Low", commercializationPathway: "Compare flight-produced samples with terrestrial controls and quantify yield, performance, and cost.", risks: "Launch and return costs may overwhelm any materials advantage.", assumptions: "Performance improvement is material and repeatable.", experimentIds: experimentRows.filter((row) => row.technologyIds.includes(technologyMap.get("Fiber optic manufacturing")!)).map((row) => row.id), sourceIds: [] },
    { title: "Organoid-based drug screening", description: "A potential application of microgravity-enabled tissue models to pharmaceutical screening.", domain: "Medicine & Pharma", market: "Drug discovery", microgravityAdvantage: "Altered mechanotransduction and three-dimensional growth may produce disease models with different phenotypes.", problem: "Two-dimensional assays do not reproduce every aspect of human tissue behavior.", whyMicrogravity: "Microgravity can influence cell organization and mechanical signaling.", evidence: "Public records identify cell, tissue, and organoid investigations; specific screening uplift is not yet verified.", potentialCustomers: "Pharmaceutical companies; biotech research teams", existingCompetitors: "Terrestrial organoid platforms and 3D cell culture providers", stage: "Early research", researchActivity: 3, commercialActivity: 0, opportunityScore: 75, confidence: "Low", commercializationPathway: "Validate model fidelity, reproducibility, and decision value against terrestrial organoid systems.", risks: "Biological variability; unclear incremental value; high operational cost.", assumptions: "A microgravity-derived phenotype improves a measurable screening decision.", experimentIds: experimentRows.filter((row) => row.technologyIds.includes(technologyMap.get("Organoid systems")!)).map((row) => row.id), sourceIds: [] },
    { title: "Spacecraft fluid management", description: "A direct engineering opportunity for controlling fluids in spacecraft and orbital systems.", domain: "Fluid Physics", market: "Space infrastructure", microgravityAdvantage: "Surface tension and capillary forces dominate when buoyancy is reduced.", problem: "Fluids behave differently in tanks, channels, and life-support hardware away from Earth.", whyMicrogravity: "The target operating environment is itself microgravity, making orbital research directly relevant.", evidence: "Public records identify capillary flow and fluid-management research.", potentialCustomers: "Spacecraft and station developers; life-support and propulsion suppliers", existingCompetitors: "Ground testing and computational fluid dynamics", stage: "Engineering application", researchActivity: 2, commercialActivity: 2, opportunityScore: 73, confidence: "High", commercializationPathway: "Translate validated flow models into qualified flight hardware and design standards.", risks: "System-specific results; qualification requirements.", assumptions: "Research reduces development risk for flight systems.", experimentIds: experimentRows.filter((row) => row.technologyIds.includes(technologyMap.get("Fluid management")!)).map((row) => row.id), sourceIds: [] },
  ].map((row) => ({ ...row, sourceIds: [] }));
  await db.insert(opportunitiesTable).values(opportunityRows);
}
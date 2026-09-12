import { DataSourceAdapter, type NormalizedExperiment } from "./types";

/**
 * Local adapter used by the development seed. Keeping this boundary explicit
 * means NASA, ESA, ISS National Laboratory, and publication adapters can be
 * added without making live APIs a runtime dependency.
 */
export class DemoSeedAdapter implements DataSourceAdapter {
  readonly name = "local-demo-seed";

  async fetch() {
    return [];
  }

  parse(raw: unknown[]) {
    return raw;
  }

  normalize(records: unknown[]) {
    return records as NormalizedExperiment[];
  }

  validate(records: NormalizedExperiment[]) {
    const errors: string[] = [];
    const valid = records.filter((record, index) => {
      if (!record.experimentCode || !record.name || !record.organizationId || !record.platformId) {
        errors.push(`Row ${index + 1}: experimentCode, name, organizationId, and platformId are required.`);
        return false;
      }
      return true;
    });
    return { valid, errors };
  }

  async save(records: NormalizedExperiment[]) {
    return { imported: records.length, rejected: 0 };
  }
}

export class NASAAdapter extends DemoSeedAdapter {
  readonly name = "nasa-public-sources";
}

export class ESAAdapter extends DemoSeedAdapter {
  readonly name = "esa-public-sources";
}

export class ISSNationalLaboratoryAdapter extends DemoSeedAdapter {
  readonly name = "iss-national-laboratory-public-sources";
}

export class PublicationsAdapter extends DemoSeedAdapter {
  readonly name = "publications";
}
# Microgravity Intelligence data dictionary

This document describes the normalized research and commercial intelligence model. The database is the source of truth; the frontend only renders API responses.

## Verification vocabulary

| Value | Definition |
| --- | --- |
| `Verified` | Directly supported by a primary source or multiple corroborating sources. |
| `Partially Verified` | The record is supported, but one or more important fields still need primary-source confirmation. |
| `Needs Verification` | A public record exists, but the specific detail has not yet been confirmed. |
| `Unverified` | A placeholder or imported record that has not been checked. |

## Core entities

### `organizations`

| Field | Type | Definition | Allowed values / source requirement |
| --- | --- | --- | --- |
| `id` | integer | Stable identifier. | Database-generated. |
| `name` | text | Organization or institution name. | Required; use the public name. |
| `organization_type` | text | Government agency, company, university, or platform operator. | Controlled vocabulary recommended. |
| `country` | text | Country or region associated with the organization. | Required; use `Not available` when unclear. |
| `city` | text | Headquarters or relevant city. | Optional. |
| `founded_year` | integer | Publicly documented founding year. | Optional; never infer. |
| `website` | text | Official website. | Optional; do not fabricate URLs. |
| `description` | text | Short factual profile. | Source-backed. |
| `commercial_focus` | text | Commercial relevance or research focus. | Analytical or source-backed; label uncertainty. |

### `platforms`

| Field | Type | Definition | Allowed values / source requirement |
| --- | --- | --- | --- |
| `name` | text | Research platform name. | Required. |
| `platform_type` | text | Orbital laboratory, aircraft, suborbital, drop tower, or other. | Controlled vocabulary. |
| `operator` | text | Operator or operating consortium. | Source-backed. |
| `country` | text | Operator country or international. | Required. |
| `description` | text | Factual description of the platform. | Source-backed. |

### `missions`

| Field | Type | Definition | Allowed values / source requirement |
| --- | --- | --- | --- |
| `name` | text | Mission, expedition, campaign, or flight series. | Required. |
| `mission_type` | text | Orbital research, cargo resupply, parabolic flight, suborbital, or other. | Controlled vocabulary. |
| `mission_number` | text | Public mission identifier. | Optional; never infer. |
| `launch_date` / `return_date` | date | Calendar dates. | Optional; use `Not available` in UI when absent. |
| `launch_vehicle` | text | Vehicle used. | Source-backed. |
| `destination` | text | Destination or operating environment. | Source-backed. |
| `platform_id` | integer | Related research platform. | Foreign key. |

### `experiments`

| Field | Type | Definition | Source requirement |
| --- | --- | --- | --- |
| `experiment_code` | text | Stable human-readable record key. | Required and unique. |
| `name` | text | Public experiment or investigation name. | Required; do not invent. |
| `short_description` | text | One-line factual description. | Must be traceable. |
| `full_description` | text | Longer factual record with uncertainty labels. | Must be traceable. |
| `organization_id` | integer | Performing or sponsoring organization. | Foreign key. |
| `mission_id` / `platform_id` | integer | Flight context. | Foreign keys; nullable only when unknown. |
| `principal_investigator` | text | Named investigator. | Use `Not available` when absent. |
| `country` | text | Organization or study country. | Required; source-backed. |
| `year` | integer | Research or flight year. | Nullable; never estimate. |
| `domain` / `subdomain` | text | Research taxonomy. | Use controlled taxonomy below. |
| `research_question` | text | What the investigation was trying to determine. | Source-backed or explicitly marked as interpretation. |
| `hypothesis` | text | Stated or reconstructed hypothesis. | Clearly label reconstruction. |
| `objective` | text | Factual objective. | Source-backed. |
| `biological_system` / `material_system` | text | System studied. | Use `Not available` when absent. |
| `hardware` | text | Flight or laboratory hardware. | Source-backed. |
| `experimental_method` | text | Method used. | Source-backed. |
| `microgravity_duration_hours` | numeric | Duration in reduced gravity. | Use null when unknown. |
| `gravity_environment` | text | Microgravity, partial gravity, parabolic, drop tower, etc. | Source-backed. |
| `control_group` / `earth_control_available` | text / boolean | Terrestrial or control comparison. | Use null or `Not available` when unknown. |
| `mechanisms` | text array | Physical or biological mechanisms relevant to the experiment. | Controlled vocabulary. |
| `result_summary` | text | Directly reported result, not analyst inference. | Use `Not yet verified` when not confirmed. |
| `result_significance` | text | Scientific meaning. | Separate source fact from interpretation. |
| `commercial_application` | text | Possible application. | Analytical inference, never presented as fact. |
| `commercial_market` | text | Market category. | Use `Not yet quantified` when no source-backed estimate exists. |
| `potential_customer` | text | Potential buyer category. | Use `Not available` when unknown. |
| `trl` | integer | Technology readiness level. | Only when source-backed. |
| `commercialized` | boolean | Whether commercialization is documented. | Default false; do not infer from interest. |
| `commercialization_status` | text | Stage of commercialization. | Source-backed or `Not available`. |
| `commercial_relevance_score` | integer | Normalized analytical score from public evidence. | Never claim objective truth. |
| `score_breakdown` | JSON | Component values and weighting inputs. | Must be explainable in methodology. |
| `confidence` | text | Confidence in the analytical score. | `High`, `Medium`, or `Low`. |
| `verification_status` | text | Record-level verification state. | See verification vocabulary. |
| `source_count` | integer | Number of linked evidence sources. | Database-derived. |
| `last_verified_at` | date | Last review date. | Required for reviewed records. |
| `why_this_matters` | text | Analyst bridge from finding to advantage to application. | Clearly analytical. |

### `technologies`

Technology records connect mechanisms to experiment portfolios. `trl` and `commercial_relevance` are nullable and must not be populated from guesswork.

### `sources`

Every experiment should have at least one source. Store the exact URL, source type, publisher, access date, quality, verification state, and notes describing what the source supports.

### `commercial_opportunities`

Opportunity records are analytical groupings, not proven businesses. `market_size` defaults to `Not yet quantified`. `research_activity`, `commercial_activity`, and `opportunity_score` must come from database-backed records and documented heuristics.

## Taxonomy

Primary domains:

- Biology & Biotechnology
- Medicine & Pharma
- Materials Science
- Fluid Physics
- Combustion
- Physics
- Agriculture
- Food & Nutrition
- In-Space Manufacturing
- Semiconductor & Electronics
- Earth Observation / Remote Sensing
- Technology Demonstration
- Other

Mechanisms:

- Reduced sedimentation
- Reduced convection
- Reduced buoyancy
- Reduced hydrostatic pressure
- Altered fluid behavior
- Surface-tension dominance
- Reduced shear
- Altered cellular mechanotransduction
- Altered gene expression
- Altered differentiation
- Altered crystal growth
- Altered phase separation
- Altered material properties
- Radiation exposure
- Other

## Data-entry rules

1. Never invent experiment results, customers, market sizes, patents, TRLs, revenue, or mission details.
2. Use `Not available`, `Not yet quantified`, or `Needs verification` instead of filling gaps with estimates.
3. Keep direct source facts visually separate from intelligence analysis.
4. Attach a source to every factual experiment record.
5. Use the import template for new records and review every `Needs Verification` row before publishing it as verified.
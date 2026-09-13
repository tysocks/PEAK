# PEAK Ground-Up Architecture Rethink and Implementation Plan

## Executive Summary

PEAK has the right strategic starting point for a small hardware team: it is lightweight, local-first, Git-backed, offline-capable, and focused on parts, projects, revisions, linked CAD/documents, and BOM relationships. That is a strong niche. Most commercial PLM systems solve far more than PEAK needs today, but they also reveal the capabilities that become table stakes once product data becomes operationally important: governed change, configuration control, approvals, auditability, impact analysis, quality workflows, supplier collaboration, permissions, integrations, reporting, and trustworthy search.

If I were rebuilding PEAK from the ground up, I would keep the local-first desktop philosophy but change the core architecture from "static UI plus Git file edits" to a domain-driven product data platform with an explicit service layer, schema validation, indexed local database, workflow engine, append-only audit log, and integration adapters. Git would remain an excellent sync, review, and backup mechanism, but it should not be the only consistency model or workflow boundary.

The recommended north star:

- PEAK is the local-first PLM system of record for Launch Canada hardware product data.
- Product data is governed by versioned schemas and domain services, not by UI rendering code.
- Every change is validated, attributable, reviewable, reversible, and exportable.
- The desktop app works offline, then synchronizes through GitHub when available.
- Integrations with Onshape, Google Drive, GitHub, and future ERP/MRP tools are adapters around the core model, not special cases inside UI code.

## Current PEAK Assessment

Based on the repository, PEAK currently consists of:

- An Electron shell in `electron/`.
- A browser UI in `app/`.
- A local Node runner in `runner/`.
- JSON product data stored in a separate Product-Data repository.
- GitHub sync and workflow actions performed through local Git and GitHub CLI.

This is a good prototype architecture. It is easy to understand, easy to run, and can operate offline. The main architectural risk is that PEAK is now carrying real PLM responsibilities while still shaped like a prototype.

Current strengths:

- Local-first usage with offline viewing and editing.
- Simple, inspectable JSON product data.
- Git history and GitHub pull requests for product data review.
- Clear initial domain: projects, parts, revisions, maturity, release state, linked documents, linked CAD, BOMs, where-used, reports, and settings.
- Low deployment burden compared with enterprise PLM.
- Good fit for a team that needs practical product data control before it needs enterprise process overhead.

Current deficiencies:

- Domain logic is concentrated in a large client script, making product rules hard to test, reuse, and enforce consistently.
- Git is doing too much: sync, storage history, workflow review, conflict handling, and audit trail.
- There is no dedicated domain service layer for parts, BOMs, lifecycle transitions, numbering, validation, release rules, or permissions.
- JSON data has a documented shape, but the application lacks a strong schema/migration/compatibility system.
- Workflow states exist, but approvals, signoffs, responsibilities, evidence, and impact analysis are still thin compared with PLM expectations.
- BOM management is present, but configuration management, alternates/substitutes, effectivity, released baselines, and eBOM/mBOM separation are not yet modeled.
- Where-used exists as a derived view, but change impact analysis is not a first-class capability.
- Search is useful for registry lookup but not yet a governed product knowledge layer with faceting, saved queries, duplicate detection, classification, or natural-language assist.
- Integrations are mostly links rather than synchronized, validated, bidirectional product relationships.
- Reporting is basic and not yet tied to operational KPIs, quality metrics, release readiness, overdue approvals, unresolved changes, or BOM health.
- There is no clear automated test strategy around the highest-risk product data operations.
- Permissions and roles are not first-class. A local user with repo access can effectively perform many actions.

## Comparison to Commercial PLM Systems

PEAK should not try to copy enterprise PLM wholesale. Windchill, Teamcenter, Autodesk Fusion Manage, and Arena PLM/QMS are built for companies with broader scale, stricter compliance, supplier networks, manufacturing handoff, and cross-functional governance. But they show the missing layers PEAK will need as it matures.

| Capability | PEAK Today | Commercial PLM Pattern | Gap |
| --- | --- | --- | --- |
| Product data system of record | Git-backed JSON product registry | Central governed product data platform | PEAK needs stronger domain services, validation, indexes, and migrations. |
| BOM management | Basic BOM tree, quantity edits, where-used | Multi-view BOMs, redlining, mass change, variant/effectivity, supplier traceability | PEAK needs released BOM baselines, structured change impact, alternates, and configuration rules. |
| Change management | Release/maturity transitions using direct pushes or PRs | Change requests/orders/tasks, approvals, audit trails, dependency tracking | PEAK needs formal ECO/ECR objects and approval evidence. |
| Workflow | Hardcoded state transitions | Configurable workflow engine with roles, gates, notifications, and escalation | PEAK needs explicit workflow definitions and role-based transitions. |
| CAD/document integration | Links to Onshape, Drive, work instructions | Managed CAD/PDM vault, visualization, document control, markup, version binding | PEAK needs adapter-backed object links with revision/version resolution. |
| Quality | Not first-class | NCR, CAPA, FMEA, SCAR, audit, nonconformance workflows | PEAK needs a lightweight quality module or integration path. |
| Supplier collaboration | Not first-class | Controlled external access, supplier parts, quotes, approved manufacturer/vendor data | PEAK needs supplier/manufacturer metadata and external collaboration boundaries. |
| Requirements | Not first-class | Requirement objects, verification links, approval and traceability | PEAK needs requirements-to-part and requirements-to-test traceability for critical systems. |
| Reporting | Counts and simple export | Dashboards, KPIs, release readiness, compliance, cost, quality, change throughput | PEAK needs operational dashboards and data health reports. |
| Search/classification | Keyword search and filters | Classification, duplicate detection, metadata-driven search, AI assist | PEAK needs normalized metadata and an index/search service. |
| Scale/deployment | Local Electron app | SaaS/on-prem enterprise platform | PEAK should keep local-first but add robust sync, conflict, and indexing. |

Relevant market signals:

- PTC Windchill positions PLM around connected product data, workflows, BOM management, engineering change/configuration management, CAD/PDM integration, quality, supplier collaboration, compliance, and end-to-end traceability. Source: [PTC Windchill](https://www.ptc.com/en/products/windchill).
- Siemens Teamcenter emphasizes digital twin/thread, cross-business collaboration, lifecycle process automation, AI assistance, SaaS/on-prem deployment flexibility, and a single source of product information. Source: [Siemens Teamcenter](https://www.siemens.com/en-us/products/teamcenter/).
- Autodesk Fusion Manage emphasizes cloud PLM, collaborative BOM editing, change/release management, task management, supplier collaboration, quality management, NPI, requirements, process templates, dashboards, and open APIs. Source: [Autodesk Fusion Manage](https://www.autodesk.com/products/fusion-360/fusion-manage).

The practical conclusion: PEAK's biggest deficiency is not that it lacks every enterprise feature. The deficiency is that its current architecture does not yet make core PLM guarantees enforceable.

## Product Principles for a Rebuild

1. Keep PEAK lightweight.
   The product should feel closer to a fast engineering tool than an enterprise portal.

2. Preserve local-first behavior.
   Offline access is a real differentiator. PEAK should remain useful at a test site, shop floor, launch range, or workshop without internet.

3. Make product data governance explicit.
   Part numbers, revisions, releases, BOMs, approvals, and lifecycle transitions need enforceable rules outside the UI.

4. Treat Git as a sync and review transport, not the domain model.
   Git is excellent for history and collaboration, but PEAK needs application-level transactions, validation, and conflict resolution.

5. Prefer adapters over embedded integrations.
   Onshape, Drive, GitHub, ERP/MRP, and future tools should connect through clear ports and adapters.

6. Build toward a digital thread, not just a registry.
   PEAK should connect requirements, design objects, parts, BOMs, changes, builds, tests, nonconformances, and release evidence.

## Recommended Target Architecture

```text
+---------------------------------------------------------------+
|                         PEAK Desktop UI                        |
|  Search | Parts | BOM | Change | Projects | Quality | Reports  |
+-------------------------------+-------------------------------+
                                | typed local API
+-------------------------------v-------------------------------+
|                       PEAK Application API                     |
|  commands | queries | validation | permissions | transactions   |
+-------------------------------+-------------------------------+
                                |
+-------------------------------v-------------------------------+
|                         Domain Services                        |
| PartService | BomService | ChangeService | WorkflowService      |
| ProjectService | DocumentService | QualityService | Search       |
+-------------------------------+-------------------------------+
                                |
+-------------------------------v-------------------------------+
|                        Local Data Layer                        |
| SQLite/IndexedDB cache | JSON snapshots | audit event log        |
| schema registry | migration engine | search index                |
+-------------------------------+-------------------------------+
                                |
+-------------------------------v-------------------------------+
|                     Sync and Integration Layer                  |
| GitHub adapter | Onshape adapter | Drive adapter | CSV/API       |
| conflict resolution | import/export | webhook-ready contracts     |
+---------------------------------------------------------------+
```

### 1. UI Layer

Recommended changes:

- Move from a single large browser script to modular UI views and shared components.
- Use a typed frontend stack such as TypeScript with Vite, React/Svelte, or a disciplined vanilla module structure if avoiding a framework remains important.
- Keep the UI dense and functional: search, tree navigation, property panels, BOM grids, workflow panels, and reports.
- Make all mutations go through application commands. The UI should never directly rewrite product records.
- Add optimistic updates only after command validation succeeds locally.

Primary UI modules:

- `SearchView`
- `PartView`
- `BomView`
- `ChangeView`
- `ProjectView`
- `QualityView`
- `ReportsView`
- `SettingsView`
- shared table/grid/form/property components

### 2. Application API

Create a local API boundary between the UI and product data. This can remain in the local runner initially.

Example command/query shape:

```text
commands/
  CreatePart
  CreateRevision
  UpdatePartProperties
  UpdateBom
  SubmitChangeRequest
  ApproveChange
  ReleaseRevision
  ObsoleteRevision
  LinkDocument
  ImportCsv

queries/
  SearchParts
  GetPart
  GetBomTree
  GetWhereUsed
  GetChangeImpact
  GetReleaseReadiness
  GetProjectDashboard
```

Rules:

- Commands validate and persist changes.
- Queries read from indexes and projections.
- Every command writes an audit event.
- Every command returns a structured result with affected objects, warnings, and next actions.

### 3. Domain Model

Make these objects first-class:

- `Project`
- `Part`
- `PartRevision`
- `BomLine`
- `DocumentLink`
- `CadObjectLink`
- `ChangeRequest`
- `ChangeOrder`
- `WorkflowTask`
- `Approval`
- `Requirement`
- `Build`
- `TestEvidence`
- `Nonconformance`
- `Supplier`
- `ManufacturerPart`
- `User`
- `Role`
- `AuditEvent`

Recommended model boundaries:

- Stable part identity belongs to `Part`.
- Revision-specific design state belongs to `PartRevision`.
- BOM lines belong to a specific revision or controlled configuration, not vaguely to the part as a whole.
- Released revisions are immutable except through controlled supersession, obsolescence, or correction workflows.
- Lifecycle state and maturity should be separate but related state machines.
- Change objects should own the transition from draft/release candidate to released.

### 4. Storage Layer

Recommended approach:

- Use SQLite as the local operational store for indexes, transactions, and queries.
- Keep JSON files as canonical export/sync artifacts during the transition.
- Add an append-only audit/event log for every mutation.
- Generate product data snapshots from the domain store.
- Continue syncing through GitHub, but sync validated snapshots and audit bundles rather than ad hoc UI edits.

Why SQLite:

- Works locally and offline.
- Gives transactions and constraints.
- Supports fast search/filter/report queries.
- Avoids scanning every JSON file for every derived view.
- Can still export clean JSON for review, archival, and Git history.

Suggested local storage layout:

```text
Product-Data/
  peak.db
  manifest.json
  exports/
    parts/
    projects.json
    changes/
  audit/
    2026/
  schemas/
  attachments-index.json
```

Migration-friendly alternative:

- Phase 1: Keep JSON canonical, build SQLite as a derived cache.
- Phase 2: Commands update JSON through domain services and also update SQLite.
- Phase 3: SQLite/event log becomes canonical locally, JSON is generated for review/export.

### 5. Schema and Migration System

Add versioned schemas for every persisted object:

```text
schemas/
  peak.part.v1.json
  peak.part-revision.v1.json
  peak.bom-line.v1.json
  peak.change-request.v1.json
  peak.change-order.v1.json
  peak.project.v1.json
```

Requirements:

- Validate on load.
- Validate before save.
- Produce human-readable validation errors.
- Include schema migrations and data repair scripts.
- Provide `peak doctor` to inspect data health.
- Refuse release if required release fields, links, approvers, or BOM integrity checks fail.

### 6. Workflow and Change Management

Replace hardcoded workflow behavior with a small workflow engine.

Initial workflow objects:

- `ChangeRequest`: problem, intent, affected items, requester, priority.
- `ChangeOrder`: approved implementation plan, affected revisions/BOMs/docs, approvers, release decision.
- `WorkflowTask`: assigned work item or approval.
- `Approval`: actor, role, decision, timestamp, comment, evidence.

Minimum workflow gates:

- Draft part creation: direct save allowed.
- Submit release candidate: validate required metadata, BOM integrity, linked documents, owner.
- Release: requires change order, approvals, audit event, immutable released baseline.
- Obsolete: requires impact review and approval.
- BOM change after release: requires new revision or controlled change order.

Workflow definitions should be data-driven:

```yaml
revision_release:
  from: release_candidate
  to: released
  required_roles:
    - responsible_engineer
    - project_approver
  checks:
    - part_metadata_complete
    - bom_has_no_cycles
    - no_unresolved_external_links
    - change_order_approved
```

### 7. BOM and Configuration Management

Recommended improvements:

- Bind BOMs to part revisions.
- Add immutable released BOM baselines.
- Add BOM redlines inside change orders.
- Add quantity, unit, find number, reference designator, notes, alternates, substitutes, make/buy, supplier/manufacturer metadata.
- Add cycle detection.
- Add impact analysis: "what changes if this part revision changes?"
- Add compare views: draft vs released, revision A vs B, proposed ECO vs current release.
- Add eBOM/mBOM extension points, even if mBOM is not implemented immediately.

Required BOM checks:

- No missing internal children unless explicitly marked external.
- No cycles.
- No obsolete child in a releasable parent unless waived.
- No draft child in a released parent unless explicitly allowed by policy.
- Units are valid.
- Quantities are positive.
- All child references resolve to a specific revision or approved floating policy.

### 8. Search, Classification, and Reporting

Recommended improvements:

- Build a normalized search index from the domain store.
- Add faceted filters for project, lifecycle, maturity, owner, tags, supplier, document state, release readiness, and data health.
- Add saved searches.
- Add duplicate/similar part detection using normalized names, tags, and classification.
- Add release readiness reports.
- Add BOM health reports.
- Add change throughput and approval aging reports.
- Add CSV/JSON exports for every report.

Future AI-assisted features should be bounded and auditable:

- Natural-language search over indexed metadata.
- Change summary generation from controlled diff.
- Duplicate part suggestions.
- Release checklist explanations.

AI should assist engineers, not silently mutate product records.

### 9. Integrations

Design integrations as adapters:

```text
integrations/
  github/
  onshape/
  google-drive/
  csv/
  future-erp/
  future-mrp/
```

GitHub:

- Sync product data snapshots.
- Create review branches for change orders.
- Link PRs to PEAK change objects.
- Pull remote state with conflict analysis.

Onshape:

- Resolve document/workspace/version/element IDs.
- Bind PEAK part revisions to Onshape versions, not just URLs.
- Detect stale links.
- Optionally pull metadata thumbnails, part names, and release states.

Google Drive:

- Resolve file IDs and permissions.
- Bind documents to revisions/change orders.
- Detect missing or inaccessible documents.

CSV/API:

- Keep import/export, but route imports through validation commands.
- Produce import preview, mapping, validation errors, and rollback.

### 10. Permissions and Identity

Add a local role model even before server-side authentication exists.

Suggested roles:

- Viewer
- Contributor
- Responsible Engineer
- Project Approver
- Release Manager
- Admin

Permissions should gate:

- Creating projects.
- Creating parts.
- Editing released objects.
- Submitting release candidates.
- Approving change orders.
- Releasing or obsoleting revisions.
- Managing settings and integrations.

For a local-first app, identity can initially come from Git config, GitHub CLI auth, or a local user profile. The key is to record who performed each action and why.

### 11. Testing and Quality Strategy

Add tests before the architecture grows much further.

Priority tests:

- Schema validation.
- Part number generation and uniqueness.
- Revision sorting and creation.
- Lifecycle transition rules.
- BOM add/remove/reorder/quantity behavior.
- BOM cycle detection.
- Where-used and impact analysis.
- JSON import/export round trips.
- Git sync command construction and failure handling.
- Migration tests for real Product-Data samples.

Recommended tooling:

- Unit tests for domain services.
- Contract tests for runner API commands.
- Playwright or equivalent for core desktop/web workflows.
- Fixture Product-Data repositories for migration/regression tests.
- `peak doctor` command in CI.

## Implementation Roadmap

### Phase 0: Stabilize the Current Prototype

Goal: reduce risk before larger redesign.

Tasks:

- Add a technical architecture decision record documenting the current constraints.
- Add automated tests around current validation, revision, BOM, and workflow behavior.
- Extract pure domain helpers from `app/app.js` into modules that can be tested.
- Add JSON schema validation for current `manifest.json`, `projects.json`, part properties, and revision properties.
- Add `peak doctor` to validate a Product-Data checkout.
- Add smoke tests for `npm run web` and core UI flows.

Exit criteria:

- Current behavior is covered enough to refactor safely.
- Product data can be validated independently of the UI.
- Known invalid BOM/revision/project cases are reported clearly.

### Phase 1: Introduce the Application API Boundary

Goal: move mutations out of UI code.

Tasks:

- Define command/query contracts.
- Move create/edit/save/workflow operations into the runner or shared domain modules.
- Make the UI call commands rather than directly assembling product files.
- Return structured validation errors and warnings.
- Add audit event writing for every mutation.
- Keep JSON file format unchanged for compatibility.

Exit criteria:

- UI is mostly a command/query consumer.
- Product data rules are enforced outside the UI.
- Every mutation creates an audit entry.

### Phase 2: Add Schema Registry, Migrations, and Data Health

Goal: make product data durable and evolvable.

Tasks:

- Create versioned schemas for all persisted objects.
- Add migration runner.
- Add data health reports in the UI.
- Add import preview and repair suggestions.
- Add release-blocking validation checks.

Exit criteria:

- Product data has explicit versions.
- PEAK can load old data, migrate it, and report issues.
- Release actions cannot bypass critical validation.

### Phase 3: Build the Local Data Store and Index

Goal: make PEAK fast, queryable, and transaction-safe.

Tasks:

- Add SQLite local store.
- Build projections for search, BOM tree, where-used, release readiness, and reports.
- Keep JSON canonical during this phase.
- Add rebuild-index command from Product-Data.
- Add conflict detection for remote sync.

Exit criteria:

- Search/reporting no longer depends on repeated JSON scans.
- PEAK can rebuild local state from Product-Data.
- Sync conflicts are detected and explained before overwrite.

### Phase 4: Formalize Change Management

Goal: make release governance first-class.

Tasks:

- Add Change Request and Change Order objects.
- Add approval tasks and role-based signoff.
- Add BOM redline/change-set model.
- Link GitHub PRs to change orders.
- Add release baseline creation.
- Add change impact reports.

Exit criteria:

- Released revisions and BOMs are immutable baselines.
- Release requires an approved change object.
- Users can see why a change happened, who approved it, and what it affected.

### Phase 5: Strengthen BOM and Configuration Management

Goal: move from BOM editing to configuration control.

Tasks:

- Bind BOMs to explicit part revisions.
- Add BOM compare and redline views.
- Add alternates/substitutes.
- Add effectivity fields or reserve schema support.
- Add eBOM-to-mBOM extension points.
- Add release policy checks for child states and obsolete parts.

Exit criteria:

- PEAK can answer "what exact product configuration was released?"
- BOM edits after release are controlled through revisions/change orders.
- Change impact is reliable enough for engineering review.

### Phase 6: Integrations as Product Data Adapters

Goal: turn links into governed relationships.

Tasks:

- Add Onshape adapter with document/version/element parsing and validation.
- Add Drive adapter with file ID and permission validation.
- Add GitHub adapter that maps PRs/branches to change objects.
- Add integration health checks.
- Add sync logs and retry behavior.

Exit criteria:

- Broken or stale links are visible.
- PEAK knows which external version supports a released revision.
- Integration failures do not corrupt product data.

### Phase 7: Quality, Requirements, and Manufacturing Readiness

Goal: expand from engineering registry to lightweight PLM.

Tasks:

- Add requirements objects and traceability links.
- Add build/test evidence.
- Add NCR/CAPA-lite quality workflows.
- Add supplier/manufacturer metadata.
- Add release readiness dashboards by project.
- Add export formats for downstream ERP/MRP/manufacturing.

Exit criteria:

- PEAK supports a digital thread from requirement to part to BOM to change to test/build evidence.
- Teams can see whether a product is ready to manufacture, not merely whether a part exists.

## Recommended Repository Shape

```text
app/
  src/
    views/
    components/
    api/
    state/
    styles/
runner/
  src/
    api/
    commands/
    queries/
    integrations/
    sync/
core/
  domain/
    parts/
    bom/
    changes/
    workflows/
    projects/
    documents/
    quality/
  schemas/
  migrations/
  validation/
  audit/
tests/
  unit/
  integration/
  fixtures/
docs/
  architecture/
  decisions/
  data-model/
```

If PEAK stays framework-free, `app/src` can still be modular ES modules. The most important change is not the frontend framework; it is the separation between UI, commands, domain services, storage, and integrations.

## Priority Recommendations

Highest priority:

1. Extract domain rules from UI code.
2. Add schema validation and product data health checks.
3. Add tests for parts, revisions, BOMs, and workflow transitions.
4. Add an application command/query boundary.
5. Add audit events for every mutation.

Next priority:

1. Introduce SQLite/indexed local store.
2. Formalize change request/change order objects.
3. Bind BOMs to revisions and create release baselines.
4. Add role-based approval workflow.
5. Add GitHub PR to change-order linking.

Later priority:

1. Onshape and Drive adapters.
2. Quality and requirements modules.
3. Supplier/manufacturer data.
4. AI-assisted search, duplicate detection, and change summaries.
5. ERP/MRP export or integration.

## Risks and Tradeoffs

Risk: overbuilding PEAK into enterprise PLM.

Mitigation: keep workflows configurable but small, and implement only the modules needed by Launch Canada.

Risk: losing the simplicity of Git-backed JSON.

Mitigation: keep JSON export/import and Git review as visible, inspectable artifacts even if SQLite becomes the operational store.

Risk: migration breaks existing product data.

Mitigation: build schema validation, migration tests, and `peak doctor` before changing storage semantics.

Risk: workflow slows engineering down.

Mitigation: keep drafts fast and direct; reserve heavier approval only for release, obsolescence, and released BOM changes.

Risk: integrations become brittle.

Mitigation: isolate integrations behind adapters and make stale/missing external data visible but non-destructive.

## Success Metrics

Technical:

- Domain logic covered by unit tests.
- Product-Data checkout passes schema validation.
- Index rebuild is deterministic.
- Import/export round trips preserve product records.
- Released objects are immutable except through controlled workflows.

Operational:

- Engineers can find parts and BOMs faster than in Drive/GitHub alone.
- Release candidates show clear readiness status.
- Approvers can review exact changes and impacted objects.
- Users can answer who changed what, when, why, and under which approval.
- Product data remains usable offline.

PLM maturity:

- PEAK becomes the trusted source for parts, revisions, released BOMs, and change history.
- External systems are linked by stable object IDs and versions.
- Change impact is visible before release.
- Quality/manufacturing handoff has enough structure to reduce ambiguity.

## Bottom Line

PEAK should stay opinionated, local-first, and lightweight. Its opportunity is not to become a cheaper clone of Windchill or Teamcenter. Its opportunity is to become a focused engineering PLM for a hardware team that values speed, offline access, transparent data, and Git-native collaboration.

The ground-up rearchitecture should therefore focus on one thing above all: move PEAK from a product registry prototype to a governed product data platform. Once product data rules, auditability, schemas, workflows, and integration boundaries are solid, the rest of the PLM capabilities can grow in a controlled way.

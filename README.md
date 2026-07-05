# PEAK

PEAK is a lightweight, offline-capable desktop product registry for hardware
teams. It tracks projects, parts, maturity, revisions, linked design documents,
linked CAD objects, and bill-of-material relationships.

The app is implemented as an Electron desktop shell around a browser UI and a
small local runner. The runner serves the static PEAK files and performs trusted
workstation actions that browser JavaScript cannot do, such as committing and
pushing the product data Git repository with the user's existing Git
credentials.

## Current Status

PEAK is usable as a local registry prototype. It supports local editing against
the selected product data folder, which should be the local Git checkout pushed
to the production remote. Draft part edits are saved locally and then pushed by
the PEAK local runner to `Launch-Canada/Product-Data` using the workstation's
normal Git authentication. Workflow transitions can either push directly to
`main` or create a GitHub pull request through the local runner.

## Repository Layout

```text
app/
  index.html      App shell and static markup
  styles.css      Layout, dark UI theme, panes, tables, context menu
  app.js          App state, rendering, local folder persistence, interactions
  config.js       Local app configuration stub
runner/
  server.mjs      Local server and Git runner for pushes and workflow PRs
electron/
  main.mjs        Electron shell that starts the runner and opens PEAK
  preload.mjs     Safe desktop bridge for native folder selection
package.json      Local runner scripts
peak.config.example.json
                  Example local runner product-data path config
dev.md            Development notes and product direction
README.md         This guide
```

Part data is intentionally not stored in this app repository. Local PR6 part
data lives in a separate Product-Data repository checkout.

```text
https://github.com/Launch-Canada/Product-Data
```

That data repository uses one folder per part. Each folder contains one fixed
part-properties document plus one or more revision-properties documents:

```text
manifest.json
projects.json
parts/
  ELEC-0001/
    ELEC-0001.json
    ELEC-0001^A.json
  MECH-0001/
    MECH-0001.json
    MECH-0001^A.json
  ...
```

## Quick Start

Install dependencies once, then start the PEAK desktop app:

```powershell
cd "C:\Users\tyler\Documents\CLAUDE\PLM"
npm install
npm start
```

On Windows, `Start PEAK.bat` starts the same Electron app.

The runner no longer defaults to a workstation-specific product-data path. It
uses the first available configuration source:

1. `PEAK_PRODUCT_DATA_DIR` environment variable.
2. Local `peak.config.json` copied from `peak.config.example.json`.
3. A portable `Product-Data` folder beside or inside the PEAK checkout.

When running the installed desktop app, the selected Product-Data folder is
stored in the user's PEAK app data folder. When running only the web runner,
`peak.config.json` is ignored by Git so each workstation can point PEAK at its
own local Product-Data checkout.

To run the browser-served development version instead of Electron:

```powershell
npm run web
```

Then open:

```text
http://127.0.0.1:8765/
```

The Electron shell starts the same local runner, opens PEAK in a desktop
window, and uses a native folder picker to configure the Product-Data checkout.

Open Settings, choose the Setup tab, and select the local product data folder.
For production data, select the local checkout of
`Launch-Canada/Product-Data`.

PEAK reads `manifest.json` and the referenced `parts/` files directly from that
folder. Project metadata is read from `projects.json`. Product changes are
written back to the same folder so they can be committed and pushed to the
remote from the local Git checkout.

Workflow pull requests use GitHub CLI through the local runner. In PEAK, open
Settings > Setup and click `Connect GitHub`; PEAK opens the browser login flow,
copies the one-time code to the clipboard, and detects when GitHub is connected.

## Using PEAK

PEAK is organized around the left navigation rail.

### Search

Search is the home view. It lists every part across every project.

You can:

- Search by part number, description, owner, tag, linked document, or linked CAD
  record.
- Filter by lifecycle state.
- Filter by project.
- Select a row to preview details.
- Double-click a part to open its part view.
- Right-click a part to open the context menu.

The right-click menu includes:

- `Open`
- `Open in New Tab`
- `Edit`

`Open` loads a read-only part view. `Edit` loads the same part in edit mode.

### Part View

Part view is read-only by default.

The part view contains:

- BOM Structure on the left.
- Part details on the right.

The read-only view shows part number, description, project, lifecycle state,
revision, owner, edited dates, Drive link, Onshape link, where-used data, BOM
count, and notes.

To edit a part, return to Search, right-click the part, and choose `Edit`.

### Edit Part Mode

Edit mode is entered through the Search row context menu.

Edit mode supports:

- Editing the part number.
- Editing the part description.
- Changing the project assignment.
- Changing lifecycle state.
- Editing revision.
- Editing last-edited owner.
- Editing Google Drive and Onshape links.
- Editing notes.
- Adding BOM children.
- Removing BOM children.
- Changing BOM quantities.

Changes are saved with the `Save Part` button. BOM edits are saved immediately
when add, remove, or quantity update actions are used.

### Create

Create is a single-pane workflow view with three entry points:

- `Create New Item`
- `Create Item from Source`
- `Create Revision`

`Create New Item` opens a draft item form with:

- Selecting a project.
- Generating a project-specific part number.
- Overriding the generated part number if needed.
- Entering the part name.
- Creating the part in `Draft` state with revision `A`.

`Create Item from Source` uses the same required fields and adds a mandatory
`Based On` field. The `Based On` value must reference an existing part or
revision.

`Create Revision` requires an existing part selection and creates the next
available draft revision for that part. New draft revisions are linked back to
the previous revision through `based_on`.

The minimum required properties for a part are:

- `Part No`
- `Name`
- `Project`

Providing only these three values is enough to create a valid draft part. PEAK
will default the new record to revision `A`, release status `draft`, part
maturity `development`, and empty optional link/BOM/attachment collections.

Before a draft is created, the intended workflow is:

- Compare the local data repository with the remote.
- Pull the remote if the local copy is behind.
- Validate project, part number, and part name.
- Push the draft object directly to the remote.

Draft creation does not require a merge request. Draft edit saves write the
selected product data folder, then call the local PEAK runner to run `git add`,
`git commit`, and `git push` in the product data repository. This uses the same
Git Credential Manager or SSH setup that works from a normal terminal.

Part numbers use the project code format:

```text
CODE-00001
```

For example:

```text
PFS-00001
```

### Projects

Projects are treated like folders.

The Projects view shows:

- Project name.
- Project code.
- Owner.
- Approvers.
- Part count.
- Description.

You can create new project folders and save updates to project metadata.

### Sync

Sync is the GitHub workflow view.

It includes actions for:

- Pulling the latest `main` branch.
- Preparing a branch and merge request for local changes.
- Importing a parts CSV.
- Exporting a migration CSV.
- Exporting a full PEAK JSON working-copy snapshot.

Browser JavaScript cannot safely execute Git commands directly. Draft edit
pushes and workflow transitions now go through the local PEAK runner. Draft edit
saves and Release Candidate transitions commit and push directly. Released,
Obsolete, and product-maturity transitions create a branch, push it, and open a
GitHub pull request using `gh pr create`.

The migration CSV export writes one row per part revision. The JSON export keeps
the full loaded product data snapshot, including stable part properties, revision
properties, BOMs, links, attachments, authoring fields, and local draft records.

CSV import accepts a header row with the required columns. Header spelling is
forgiving, so `Part No`, `Part Number`, `part_no`, and similar variants are
treated as the part number column. Imported parts are created as local draft
revision `A` items.

Example CSV:

```csv
Part No,Name,Project
PFS-00042,Injector Test Fitting,PR6 Feed System
ELEC-00420,Telemetry Breakout Board,PR6 Propulsion Controller
```

### Report

Report shows a left-side report selector and a main report results table.

Current report rows include:

- Total parts.
- Lifecycle state counts.
- Project counts.
- External link counts.

Report results use the same filter state as Search.

### Settings

Settings is a local configuration view.

Current settings include:

- Product data folder.
- Default owner.
- Offline mode.

The folder handle is stored by the browser using IndexedDB. Browser permission
may need to be renewed after restarting the browser.

## Local Persistence

PEAK stores product records in the selected product data folder.

The product data folder includes:

- Part edits.
- New parts.
- BOM edits.
- Project records.

Browser local storage is still used for workstation preferences and UI state.

Important storage keys include:

```text
peakProductDataFolderName
peakHasLocalChanges
peakBomColumnWidths
peakDefaultOwner
```

Older browser-only project records may exist in the legacy `peakProjects`
local-storage key. When `projects.json` is missing, PEAK uses that key only as a
migration fallback before writing project metadata into the product data folder.

When local changes exist, the Sync rail icon shows a pending-change badge.

## Column and Pane Resizing

Most tabular views support column resizing by dragging column header edges.

Supported table views include:

- Search
- Create
- Projects
- Sync
- Report
- Settings
- Part details

BOM Structure and Edit BOM Structure also support resizing their columns.

Navigation and detail panes can be resized with the vertical pane handles where
the current view exposes panes.

## Data Model

Parts are stored as folders in the data repository. The stable part document is
named with the part number, and each revision document is named with the part
number plus revision:

```text
parts/<PART_NUMBER>/<PART_NUMBER>.json
parts/<PART_NUMBER>/<PART_NUMBER>^<REVISION>.json
```

For example:

```text
parts/ELEC-0001/ELEC-0001.json
parts/ELEC-0001/ELEC-0001^A.json
```

The app loads `manifest.json`, fetches each stable part document, then fetches
each revision document listed by that part. Project metadata is stored in
`projects.json`. The manifest format is:

```json
{
  "schema": "peak.parts.manifest.v2",
  "updated_at": "2026-06-18",
  "projects": "projects.json",
  "parts": [
    "parts/ELEC-0001/ELEC-0001.json",
    "parts/MECH-0001/MECH-0001.json"
  ]
}
```

The project metadata format is:

```json
{
  "schema": "peak.projects.v1",
  "updated_at": "2026-06-19",
  "projects": [
    {
      "name": "PR6 Feed System",
      "key": "PFS",
      "owner": "engineering@example.com",
      "approvers": ["Avery Chen", "Maya Patel"],
      "description": "PR6 Feed System project records"
    }
  ]
}
```

Stable part properties remain fixed across revisions:

- `part_number`
- `name`
- `description`
- `project`
- `traceability`
- `maturity`
- `onshape`
- `work_instructions`
- `file_links`
- `tags`
- `revisions`

Revision properties are unique to a specific object such as `ELEC-0001^A`:

- `revision`
- `release_status`
- `owner`
- `created_by`
- `created_at`
- `updated_by`
- `updated_at`
- `approvers`
- `bom`
- `attachments`
- `activity_history`
- `change_summary`

Each revision keeps its own `activity_history` list. Activity entries include an
`action`, `actor`, `performed_at` timestamp, and `detail` string for events such
as `create`, `updated_properties`, `updated_maturity`, `updated_revision`,
`created_revision`, and `updated_attachments`.

PEAK flattens those documents into openable revision objects. For example,
`ELEC-0001^A` can be searched, opened, and linked independently while remaining
connected to the stable `ELEC-0001` part record.

Lifecycle states are:

```text
draft
release_candidate
released
obsolete
```

Older fixture data using `in_review` is still tolerated and displayed as
`release candidate`.

## Offline Use

PEAK is intended to work without internet access for ordinary registry viewing
and local editing.

Internet access is only required for GitHub pushes, GitHub pull request
creation, and any future authenticated integrations such as Google Drive or
Onshape APIs.

## Updating PEAK

After the GitHub remote is configured, update PEAK with:

```powershell
git pull origin main
```

Workflow pull requests require GitHub CLI authentication. Use the `Connect
GitHub` button in Settings > Setup; if a workflow action needs authentication,
PEAK shows the same action inline beside the workflow error.

## Desktop Packaging

PEAK is packaged with Electron Builder:

```powershell
npm run pack
npm run dist
```

`npm run pack` creates an unpacked desktop build for local verification.
`npm run dist` creates a Windows NSIS installer with Start Menu and desktop
shortcuts. Packaging keeps the app files unpacked so the spawned local runner
can execute normally.

## Development Notes

The PEAK UI intentionally avoids a frontend build step for now. Keep UI changes
compatible with plain browser JavaScript, HTML, and CSS unless the project is
deliberately moved to a framework. Runner functionality belongs under `runner/`
and should use local workstation capabilities rather than browser-only APIs.

When editing:

- Keep the app usable through `npm start` and the local runner.
- Keep the browser-served runner usable through `npm run web`.
- Preserve offline behavior.
- Avoid third-party runtime packages unless they clearly simplify the runner or
  future Electron packaging.
- Keep local working-copy persistence intact.
- Treat GitHub sync as a local runner responsibility.

## Remote

GitHub repository:

```text
https://github.com/Launch-Canada/PEAK
```

# PEAK

PEAK is a lightweight, offline-capable product registry for hardware teams. It
tracks projects, parts, lifecycle state, revisions, linked design documents,
linked CAD objects, and bill-of-material relationships in a browser-based app.

The app is currently implemented as a static web application. It can be opened
from a shortcut or served from a small local HTTP server without installing a
framework, package manager, database, or build tool. Product data is read from
a local folder selected in the app.

## Current Status

PEAK is usable as a local registry prototype. It supports local editing against
the selected product data folder, which should be the local Git checkout pushed
to the production remote. GitHub sync is represented in the UI, but the actual pull, branch,
commit, push, merge request creation, and approver assignment workflow still
requires a future local bridge or backend service.

## Repository Layout

```text
app/
  index.html      App shell and static markup
  styles.css      Layout, dark UI theme, panes, tables, context menu
  app.js          App state, rendering, local folder persistence, interactions
  config.js       Local app configuration stub
dev.md            Development notes and product direction
README.md         This guide
```

Part data is intentionally not stored in this app repository. Local PR6 part
data lives in a separate repository:

```text
C:\Users\tyler\Documents\PROJECTS\PR6 - PLM
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

Serve this app repository:

```powershell
cd "C:\Users\tyler\Documents\CLAUDE\PLM"
py -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/app/index.html
```

Open Settings, choose the Setup tab, and select the local product data folder.
For PR6 production data, select:

```text
C:\Users\tyler\Documents\PROJECTS\PR6 - PLM
```

PEAK reads `manifest.json` and the referenced `parts/` files directly from that
folder. Project metadata is read from `projects.json`. Product changes are
written back to the same folder so they can be committed and pushed to the
remote from the local Git checkout.

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

Draft creation does not require a merge request. The browser app records this
workflow in the UI, but actual Git pull/push operations still require a local
Git bridge or backend because browser JavaScript cannot safely run Git commands
directly.

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

Sync is the planned GitHub workflow view.

It includes actions for:

- Pulling the latest `master` branch.
- Preparing a branch and merge request for local changes.
- Importing a parts CSV.
- Exporting a migration CSV.
- Exporting a full PEAK JSON working-copy snapshot.

At the moment, browser JavaScript cannot safely execute Git commands directly.
The Sync page therefore records the desired workflow and indicates that a local
Git bridge or backend service is required for actual GitHub operations.

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
- `manufacturers`
- `revisions`

Revision properties are unique to a specific object such as `ELEC-0001^A`:

- `revision`
- `release_status`
- `lifecycle_state`
- `owner`
- `created_by`
- `created_at`
- `updated_by`
- `updated_at`
- `approvers`
- `bom`
- `attachments`
- `change_summary`

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

Internet access is only required for future GitHub synchronization and any
future authenticated integrations such as Google Drive or Onshape APIs.

## Updating PEAK

After the GitHub remote is configured, update the app with:

```powershell
git pull origin main
```

If a future sync bridge is added, PEAK should expose this through the Sync view.

## Development Notes

This app intentionally avoids a build step for now. Keep changes compatible with
plain browser JavaScript, HTML, and CSS unless the project is deliberately moved
to a framework.

When editing:

- Keep the app usable from a static local shortcut.
- Preserve offline behavior.
- Do not depend on third-party runtime packages.
- Keep local working-copy persistence intact.
- Treat GitHub sync as a bridge/backend responsibility.

## Remote

GitHub repository:

```text
https://github.com/Launch-Canada/PEAK
```

# PEAK

PEAK is a lightweight, offline-capable product registry for hardware teams. It
tracks projects, parts, lifecycle state, revisions, linked design documents,
linked CAD objects, and bill-of-material relationships in a browser-based app.

The app is currently implemented as a static web application. It can be opened
from a shortcut or served from a small local HTTP server without installing a
framework, package manager, database, or build tool.

## Current Status

PEAK is usable as a local registry prototype. It supports local editing and
stores unsynced changes in browser storage so work is not lost when the app is
closed. GitHub sync is represented in the UI, but the actual pull, branch,
commit, push, merge request creation, and approver assignment workflow still
requires a future local bridge or backend service.

## Repository Layout

```text
app/
  index.html      App shell and static markup
  styles.css      Layout, dark UI theme, panes, tables, context menu
  app.js          App state, rendering, local persistence, interactions
  config.js       Data URL configuration
  data.js         Embedded fallback fixture data
dist/
  peak-data.json  Local JSON fixture used by the static app
dev.md            Development notes and product direction
README.md         This guide
```

## Quick Start

Open the app directly:

```text
app\index.html
```

For the most reliable local behavior, serve the repository over HTTP:

```powershell
py -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/app/index.html
```

The app reads fixture data from:

```text
dist/peak-data.json
```

If that fetch is unavailable, it falls back to the embedded fixture in:

```text
app/data.js
```

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

Create is a single-pane part creation view.

Create supports:

- Selecting a project.
- Generating a project-specific part number.
- Entering a part description.
- Adding optional Google Drive and Onshape links.
- Adding notes.
- Creating the part in `Draft` state with revision `V1`.

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

At the moment, browser JavaScript cannot safely execute Git commands directly.
The Sync page therefore records the desired workflow and indicates that a local
Git bridge or backend service is required for actual GitHub operations.

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

- Data URL.
- Default owner.
- Offline mode.

Settings are saved in browser local storage.

## Local Persistence

PEAK stores unsynced working changes in browser local storage.

The local working copy includes:

- Part edits.
- New parts.
- Project metadata.
- BOM edits.
- BOM column widths.
- Settings.

This means changes survive closing and reopening PEAK on the same browser and
same local origin.

Important storage keys include:

```text
peakPartsWorkingCopy
peakHasLocalChanges
peakProjects
peakBomColumnWidths
peakDefaultOwner
peakDataUrl
```

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

Parts are stored as JSON objects. A part generally includes:

- `part_number`
- `name`
- `description`
- `project`
- `lifecycle_state`
- `revision`
- `owner`
- `created_at`
- `updated_at`
- `documents`
- `onshape`
- `manufacturers`
- `approvers`
- `bom`

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

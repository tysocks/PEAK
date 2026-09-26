# PEAK

PEAK is a lightweight desktop product registry for hardware teams. It manages
projects, parts, revisions, lifecycle status, linked engineering records, BOMs,
history, and Git-backed product-data workflows.

PEAK 2.0 is a Windows Electron application with a Notion-style UI. The desktop
shell starts a local runner that reads and writes a separate Product-Data Git
checkout and performs Git operations using the current Windows user's configured
credentials.

## Release files

Build PEAK 2.1.0 locally with `npm run dist`, or download from the
[GitHub releases page](https://github.com/Launch-Canada/PEAK/releases) when published.

The Windows release contains:

- `PEAK-Setup-2.1.0.exe` — interactive per-user installer.
- `win-unpacked/PEAK.exe` — unpacked application for release verification.

The installer creates Start Menu and desktop shortcuts and allows the user to
choose the installation directory. The release is currently unsigned, so
Windows SmartScreen may show an unrecognized-publisher warning.

## System requirements

- Windows 10 or Windows 11.
- Git available on `PATH`.
- A local clone of a compatible Product-Data repository.
- Git credentials with access to that repository for pull and push operations.
- GitHub CLI (`gh`) when using GitHub authentication or workflow pull requests.

## Installation

1. Close any running copy of PEAK.
2. Run `PEAK-Setup-2.1.0.exe`.
3. If Windows SmartScreen appears, verify the installer came from the expected
   release source, select **More info**, then **Run anyway**.
4. Choose the installation directory and complete installation.
5. Start PEAK from the desktop shortcut or Start Menu.

PEAK installs per user by default. A typical installation is under:

```text
%LOCALAPPDATA%\Programs\PEAK
```

## First-run setup

A new PEAK installation starts with no Product-Data folders. Registry data and
Git operations are unavailable until at least one folder is added. PEAK does
not ship a workstation path or silently discover a Product-Data folder.

### 1. Prepare Product-Data

Clone an existing Product-Data repository, or create an empty folder and let
PEAK initialize it. An existing checkout must contain at least:

```text
manifest.json
projects.json
parts\
```

Example clone:

```powershell
git clone https://github.com/ORGANIZATION/Product-Data.git C:\Engineering\Product-Data
```

### 2. Add directories

1. Open **Settings** from the left navigation.
2. Open the **Directory** tab.
3. Use **+** to add a Product-Data checkout or an empty folder.
4. An empty folder becomes a new local Product-Data repository.
5. PEAK reads Git `origin` from that folder's `.git`. A purple cloud badge
   appears when a remote is configured.

Switch the active folder from **Inbox > Remotes**. Swapping closes open
workspace tabs and reloads that repository.

Pull, push, and workflow operations remain blocked when the active folder has
no Git origin.

### 3. Connect GitHub

For GitHub-hosted repositories and pull-request workflows:

1. Install GitHub CLI from <https://cli.github.com/>.
2. In **Settings > Directory**, select **Connect** if GitHub is not connected.
3. Complete the browser authentication flow.
4. Return to PEAK and confirm the status reports connected.

## Using PEAK

### Search and parts

- Search by part number, name, description, project, revision, lifecycle state,
  owner, tag, or linked record.
- Select a result to preview it; double-click to open it.
- Draft revisions can be edited. Controlled lifecycle transitions are available
  from the Workflow tab.

### BOM structure

- BOM columns default to **Item, Name, Qty, Rev, Status**.
- Drag column headers to reorder them and drag dividers to resize them.
- Drag the BOM pane divider to resize the structure pane. Its stored width is
  shared by read-only and edit modes and is capped at 50% of the workspace.
- In edit mode, right-click an assembly or the BOM root and select **Add
  Component**. Search for the component and accept it by clicking the result or
  pressing Enter.
- Change quantity directly in the Qty field.
- Right-click a direct component and select **Delete Component** to remove it.

### Git behavior

- Draft saves commit Product-Data changes and push the current branch.
- Direct workflow transitions commit and push after rebasing on the configured
  remote branch.
- Pull-request workflows create a branch, push it, and invoke GitHub CLI.
- PEAK never stores Product-Data inside the application installation directory.

## Local configuration and data

The Product-Data checkout remains wherever the user cloned it. PEAK's local
configuration and Chromium UI state are stored under:

```text
%APPDATA%\peak-desktop
```

This directory contains the selected-folder configuration, local storage,
IndexedDB data, appearance preferences, BOM column preferences, and other
workstation state. Uninstalling the application does not necessarily delete this
directory, because preserving user settings is standard installer behavior.

No user-specific absolute path is included in the application or installer.

## Clean uninstall and brand-new-user test

Use this procedure when validating the release as though it were installed by a
new user. Deleting `%APPDATA%\peak-desktop` is essential; uninstalling alone may
leave the previous settings available to a later installation.

### A. Record anything you need

1. Note the current Product Data Folder and remote if they will be needed later.
2. Ensure the Product-Data checkout has no uncommitted work:

   ```powershell
   git -C "C:\path\to\Product-Data" status
   ```

3. Commit or otherwise preserve any intended Product-Data changes. The cleanup
   below does not delete the Product-Data checkout, but checking it avoids
   confusing application state with repository state.

### B. Remove the existing application

1. Exit PEAK. Confirm no `PEAK.exe` process remains in Task Manager.
2. Open **Windows Settings > Apps > Installed apps**.
3. Find **PEAK** and select **Uninstall**.
4. Complete the uninstaller.
5. If PEAK is not listed, run the uninstaller directly if present:

   ```powershell
   & "$env:LOCALAPPDATA\Programs\PEAK\Uninstall PEAK.exe"
   ```

### C. Remove all persisted PEAK state

Run the following in PowerShell after PEAK is closed:

```powershell
$peakUserData = Join-Path $env:APPDATA "peak-desktop"
$peakInstall = Join-Path $env:LOCALAPPDATA "Programs\PEAK"

if (Test-Path -LiteralPath $peakUserData) {
  Remove-Item -LiteralPath $peakUserData -Recurse -Force
}

if (Test-Path -LiteralPath $peakInstall) {
  Remove-Item -LiteralPath $peakInstall -Recurse -Force
}
```

Then remove stale shortcuts if they remain:

```powershell
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "PEAK.lnk"
$startShortcut = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\PEAK.lnk"

if (Test-Path -LiteralPath $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
}

if (Test-Path -LiteralPath $startShortcut) {
  Remove-Item -LiteralPath $startShortcut -Force
}
```

Do not delete the separate Product-Data checkout unless the test specifically
requires a freshly cloned data repository.

### D. Install and verify clean first run

1. Run the new `PEAK-Setup-2.1.0.exe` installer.
2. Start PEAK.
3. Open **Settings > Directory** before selecting anything.
4. Confirm:
   - The directory list is empty.
   - No parts or projects have loaded.
   - Pull, push, and workflow operations cannot run.
   - No previous appearance, BOM widths, column order, or owner preference has
     returned.
5. Add a Product-Data checkout or an empty folder.
6. Confirm data loads. If the folder has Git `origin`, a purple cloud badge
   appears. Local-only folders have no remote until one is added in Git.
7. Pull `main` and confirm the status succeeds.
8. Open a draft part and test a property edit, BOM add, quantity edit, and BOM
   removal.
9. Push a controlled test change and confirm it appears on the expected remote.
10. Test a workflow transition appropriate for the selected test record.
11. Close and reopen PEAK and confirm the selected folder, remote, and UI
    preferences now persist for this installed user.

## Development

Requirements: Node.js 20 or newer and npm.

From the repository root:

```powershell
npm install
npm start
```

Run the local web version:

```powershell
npm run web
```

Create release artifacts:

```powershell
npm run pack
npm run dist
```

Artifacts are written to `dist/`, which is ignored by Git. Local development
configuration may be supplied through `PEAK_PRODUCT_DATA_DIR` or an ignored
`peak.config.json`; neither is packaged into the release.

## Repository layout

```text
app/                 Browser UI and styling
electron/            Electron shell and native folder-selection bridge
runner/              Local HTTP and Git runner
package.json         Application metadata and Electron Builder configuration
peak.config.example.json
README.md
```

Application source: <https://github.com/Launch-Canada/PEAK>

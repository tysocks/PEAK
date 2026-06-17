const searchInput = document.querySelector("#searchInput");
const searchSuggestions = document.querySelector("#searchSuggestions");
const stateFilter = document.querySelector("#stateFilter");
const projectFilter = document.querySelector("#projectFilter");
const partsList = document.querySelector("#partsList");
const partDetail = document.querySelector("#partDetail");
const recordCount = document.querySelector("#recordCount");
const workspaceHeading = document.querySelector("#workspaceHeading");
const navigationTree = document.querySelector("#navigationTree");
const navigatorTitle = document.querySelector("#navigatorTitle");
const tableHead = document.querySelector("#tableHead");
const resultsTitle = document.querySelector("#resultsTitle");
const workspace = document.querySelector(".workspace");
const navItems = document.querySelectorAll("[data-nav-mode]");
const repoBadge = document.querySelector("#repoBadge");
const partContextMenu = document.querySelector("#partContextMenu");
const collapseNavButton = document.querySelector("[data-collapse-nav]");
const collapsePropertiesButton = document.querySelector("[data-collapse-properties]");

let parts = [];
let selectedPartNumber = null;
let openedPartNumber = null;
let selectedBomPartNumber = null;
let activeNavMode = "home";
let activePartEditMode = false;
let activeResultView = "grid";
let activePropertyTab = "summary";
let isNavigatorCollapsed = false;
let isPropertiesCollapsed = false;
let statusMessage = "";
let hasRepoChanges = loadHasLocalChanges();
let connections = loadConnections();
let customProjects = loadProjects();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stateLabel(state) {
  const normalized = String(state ?? "");
  if (normalized === "in_review") {
    return "release candidate";
  }
  return normalized.replaceAll("_", " ");
}

async function loadParts() {
  let loadedParts = null;
  const dataUrl = window.PEAK_DATA_URL || window.PLM_DATA_URL;
  const localParts = loadWorkingCopy();

  if (dataUrl && window.location.protocol !== "file:") {
    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      loadedParts = await response.json();
    } catch (error) {
      console.warn(`Could not load PEAK data from ${dataUrl}; using embedded fixture data.`, error);
    }
  }

  if (!loadedParts) {
    loadedParts = window.PEAK_DATA || window.PLM_DATA;
  }

  if (localParts) {
    loadedParts = localParts;
    hasRepoChanges = true;
  }

  if (!Array.isArray(loadedParts)) {
    throw new Error("PEAK data must be a JSON array");
  }

  const invalidPart = loadedParts.find((part) => !part?.part_number || !part?.name);
  if (invalidPart) {
    throw new Error("PEAK data records must include part_number and name");
  }

  parts = loadedParts.sort((a, b) => a.part_number.localeCompare(b.part_number));
  selectedPartNumber = parts[0]?.part_number ?? null;
  renderProjectOptions();
  initRoute();
}

function initRoute() {
  const partFromUrl = new URLSearchParams(window.location.search).get("part");
  if (partFromUrl && parts.some((part) => part.part_number === partFromUrl)) {
    openedPartNumber = partFromUrl;
    selectedBomPartNumber = partFromUrl;
    selectedPartNumber = partFromUrl;
    activeNavMode = "part";
    activePartEditMode = new URLSearchParams(window.location.search).get("edit") === "1";
  }
}

function renderApp() {
  document.title = "PEAK Registry";
  if (activeNavMode === "part") {
    renderOpenedPartWorkspace();
  } else {
    renderSearchWorkspace();
  }
  enableColumnResizing();
  enableBomColumnResizing();
  syncChrome();
}

function renderSearchWorkspace() {
  const visibleParts = filteredParts();
  if (activeNavMode === "home" && !visibleParts.some((part) => part.part_number === selectedPartNumber)) {
    selectedPartNumber = visibleParts[0]?.part_number ?? null;
  }

  recordCount.textContent = pageStatus(visibleParts);
  navigatorTitle.textContent = pageNavigatorTitle();
  resultsTitle.textContent = searchTitle();
  workspaceHeading.textContent = pageHeading();
  document.querySelector(".eyebrow").textContent = pageDescription();

  renderNavigationTree();
  renderMainRows(visibleParts);
  renderPageDetail();
}

function searchTitle() {
  if (activeNavMode === "create") {
    return "Create";
  }
  if (activeNavMode === "projects") {
    return "Projects";
  }
  if (activeNavMode === "sync") {
    return "Sync";
  }
  if (activeNavMode === "report") {
    return "Report";
  }
  if (activeNavMode === "settings") {
    return "Settings";
  }
  return activeResultView === "props" ? "Object Properties" : "Search Results";
}

function renderMainRows(visibleParts) {
  if (activeNavMode === "create") {
    renderCreateRows();
    return;
  }
  if (activeNavMode === "projects") {
    renderProjectRows();
    return;
  }
  if (activeNavMode === "sync") {
    renderSyncRows();
    return;
  }
  if (activeNavMode === "report") {
    renderReportRows(visibleParts);
    return;
  }
  if (activeNavMode === "settings") {
    renderSettingsRows();
    return;
  }
  renderObjectRows(visibleParts);
}

function pageHeading() {
  const headings = {
    home: "Search",
    create: "Create",
    projects: "Projects",
    sync: "Sync",
    report: "Report",
    settings: "Settings"
  };
  return headings[activeNavMode] || "Search";
}

function pageDescription() {
  const descriptions = {
    home: "Search all parts across every project.",
    create: "Create draft parts with project-specific part numbers.",
    projects: "Browse project folders, owners, approvers, and part counts.",
    sync: "Pull updates or prepare a branch and merge request for review.",
    report: "Select a report and review filtered registry results.",
    settings: "Configure local PEAK behavior for this workstation."
  };
  if (activeNavMode === "part") {
    return "Edit part details and bill of materials.";
  }
  return descriptions[activeNavMode] || descriptions.home;
}

function pageNavigatorTitle() {
  const titles = {
    create: "Create",
    projects: "Projects",
    sync: "Sync",
    report: "Reports",
    settings: "Settings"
  };
  return titles[activeNavMode] || "Navigator";
}

function pageStatus(visibleParts) {
  if (statusMessage) {
    return statusMessage;
  }
  if (activeNavMode === "create") {
    return `${projects().length} projects available`;
  }
  if (activeNavMode === "projects") {
    return `${parts.length} parts / ${projects().length} projects`;
  }
  if (activeNavMode === "report") {
    return `${visibleParts.length} records in report scope`;
  }
  if (activeNavMode === "sync") {
    return hasRepoChanges ? "Browser edits pending" : "No browser edits pending";
  }
  if (activeNavMode === "settings") {
    return "Local configuration";
  }
  return `${visibleParts.length} of ${parts.length} records`;
}

function renderPageDetail() {
  if (activeNavMode === "create") {
    renderCreateDetail();
    return;
  }
  if (activeNavMode === "projects") {
    renderProjectsDetail();
    return;
  }
  if (activeNavMode === "sync") {
    partDetail.innerHTML = `<section class="propertySection"><h3>Sync</h3><p class="description">Sync requires a local bridge because browser JavaScript cannot run Git commands directly. This page shows the required pull and merge request workflow.</p></section>`;
    return;
  }
  if (activeNavMode === "report") {
    partDetail.innerHTML = `<section class="propertySection"><h3>Reports</h3><p class="description">Report rows use the same filters as search. Use the navigator to scope by lifecycle state.</p></section>`;
    return;
  }
  if (activeNavMode === "settings") {
    renderSettingsDetail();
    return;
  }
  renderSearchDetail();
}

function renderOpenedPartWorkspace() {
  const rootPart = getOpenedPart();
  const selectedPart = getSelectedBomPart();

  if (!rootPart || !selectedPart) {
    tableHead.innerHTML = "";
    partsList.innerHTML = '<tr><td class="emptyCell">Could not open this part</td></tr>';
    partDetail.innerHTML = '<p class="empty">Could not open this part</p>';
    return;
  }

  document.title = `${rootPart.part_number} - PEAK Registry`;
  recordCount.textContent = `Opened ${rootPart.part_number} / ${rootPart.revision}`;
  workspaceHeading.textContent = rootPart.name;
  document.querySelector(".eyebrow").textContent = pageDescription();
  navigatorTitle.textContent = activePartEditMode ? "Edit BOM Structure" : "BOM Structure";
  resultsTitle.textContent = activePartEditMode ? `${selectedPart.part_number} Edit` : `${selectedPart.part_number} Details`;

  renderBomTree();
  if (activePartEditMode) {
    renderPartEditorRows(selectedPart);
  } else {
    renderPartReadonlyRows(rootPart, selectedPart);
  }
  partDetail.innerHTML = "";
}

function matchesSearch(part, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    part.part_number,
    part.name,
    part.description,
    part.project,
    part.lifecycle_state,
    part.revision,
    part.owner,
    ...(part.tags ?? []),
    ...(part.documents ?? []).flatMap((document) => [document.type, document.title]),
    ...(part.onshape ?? []).flatMap((reference) => [reference.type, reference.title])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function filteredParts() {
  const query = searchInput.value.trim();
  const state = stateFilter.value;
  const project = projectFilter.value;
  return parts.filter(
    (part) =>
      matchesSearch(part, query) &&
      (!state || lifecycleMatches(part.lifecycle_state, state)) &&
      (!project || part.project === project)
  );
}

function lifecycleMatches(actual, expected) {
  if (actual === expected) {
    return true;
  }
  return expected === "release_candidate" && actual === "in_review";
}

function searchMatches(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  return parts.filter((part) => matchesSearch(part, trimmed)).slice(0, 8);
}

function getOpenedPart() {
  return parts.find((part) => part.part_number === openedPartNumber);
}

function getSelectedBomPart() {
  return parts.find((part) => part.part_number === (selectedBomPartNumber || openedPartNumber));
}

function renderObjectRows(visibleParts) {
  tableHead.innerHTML =
    activeResultView === "props"
      ? `
        <tr>
          <th scope="col">Object</th>
          <th scope="col">Name</th>
          <th scope="col">Properties</th>
          <th scope="col">Relations</th>
          <th scope="col">Owner</th>
          <th scope="col">Modified</th>
        </tr>
      `
      : `
        <tr>
          <th scope="col">Object</th>
          <th scope="col">Name</th>
          <th scope="col">Project</th>
          <th scope="col">Revision</th>
          <th scope="col">State</th>
          <th scope="col">Last Modified</th>
        </tr>
      `;

  if (visibleParts.length === 0) {
    partsList.innerHTML = '<tr><td class="emptyCell" colspan="6">No matching parts</td></tr>';
    return;
  }

  partsList.innerHTML = visibleParts
    .map((part) => {
      const active = part.part_number === selectedPartNumber ? " active" : "";
      if (activeResultView === "props") {
        const relationCount =
          (part.documents ?? []).length + (part.onshape ?? []).length + (part.bom ?? []).length + (part.manufacturers ?? []).length;
        return `
          <tr class="objectRow propsRow${active}" data-part-number="${escapeHtml(part.part_number)}" tabindex="0">
            <td><span class="objectIcon" aria-hidden="true"></span><span class="objectId">${escapeHtml(part.part_number)}</span></td>
            <td>${escapeHtml(part.name)}</td>
            <td>${escapeHtml(part.project || "Unassigned")} | ${escapeHtml(stateLabel(part.lifecycle_state))} | Rev ${escapeHtml(part.revision)}</td>
            <td>${escapeHtml(relationCount)} linked records</td>
            <td>${escapeHtml(part.owner)}</td>
            <td>${escapeHtml(part.updated_at)}</td>
          </tr>
        `;
      }

      return `
        <tr class="objectRow${active}" data-part-number="${escapeHtml(part.part_number)}" tabindex="0">
          <td><span class="objectIcon" aria-hidden="true"></span><span class="objectId">${escapeHtml(part.part_number)}</span></td>
          <td>${escapeHtml(part.name)}</td>
          <td>${escapeHtml(part.project || "Unassigned")}</td>
          <td>${escapeHtml(part.revision)}</td>
          <td><span class="stateText ${escapeHtml(part.lifecycle_state)}">${escapeHtml(stateLabel(part.lifecycle_state))}</span></td>
          <td>${escapeHtml(part.updated_at)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderReportRows(visibleParts) {
  const projectCounts = countBy(visibleParts, "project");
  const stateCounts = countBy(visibleParts, "lifecycle_state");
  const linkCount = visibleParts.reduce(
    (total, part) => total + (part.documents ?? []).length + (part.onshape ?? []).length,
    0
  );
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Report</th>
      <th scope="col">Value</th>
      <th scope="col">Detail</th>
      <th scope="col">Scope</th>
      <th scope="col">Owner</th>
      <th scope="col">Updated</th>
    </tr>
  `;
  partsList.innerHTML = `
    ${metricRow("Total Parts", visibleParts.length, `${parts.length} in registry`, "Current filters")}
    ${metricRow("Lifecycle States", Object.keys(stateCounts).length, formatCounts(stateCounts, stateLabel), "Current filters")}
    ${metricRow("Projects", Object.keys(projectCounts).length, formatCounts(projectCounts), "Current filters")}
    ${metricRow("External Links", linkCount, "Google Drive and Onshape references", "Current filters")}
  `;
}

function renderCreateRows() {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Field</th>
      <th scope="col">Value</th>
      <th scope="col">Required</th>
      <th scope="col">Action</th>
    </tr>
  `;
  const projectOptions = projects()
    .map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
    .join("");
  const selectedProject = projectFilter.value || projects()[0] || "Unassigned Project";
  const generatedPartNumber = nextProjectPartNumber(selectedProject);
  partsList.innerHTML = `
    <tr>
      <td>Project</td>
      <td><select class="tableInput" id="newPartProject">${projectOptions}</select></td>
      <td>Yes</td>
      <td>Project code drives generated part number</td>
    </tr>
    <tr>
      <td>Part Number</td>
      <td><input class="tableInput" id="newPartNumber" value="${escapeHtml(generatedPartNumber)}"></td>
      <td>Yes</td>
      <td><button class="iconButton" type="button" data-generate-part-number>Generate</button></td>
    </tr>
    <tr>
      <td>Description</td>
      <td><input class="tableInput" id="newPartName" value=""></td>
      <td>Yes</td>
      <td>Name of the part</td>
    </tr>
    <tr>
      <td>Google Drive Link</td>
      <td><input class="tableInput" id="newPartDriveUrl" value=""></td>
      <td>No</td>
      <td>Optional document link</td>
    </tr>
    <tr>
      <td>Onshape Link</td>
      <td><input class="tableInput" id="newPartOnshapeUrl" value=""></td>
      <td>No</td>
      <td>Optional CAD link</td>
    </tr>
    <tr>
      <td>Notes</td>
      <td><input class="tableInput" id="newPartDescription" value=""></td>
      <td>No</td>
      <td><button class="iconButton primaryAction formAction" type="button" data-submit-create>Create Part</button></td>
    </tr>
  `;
  const projectSelect = document.querySelector("#newPartProject");
  if (projectSelect && projects().includes(selectedProject)) {
    projectSelect.value = selectedProject;
  }
}

function renderCreateDetail() {
  partDetail.innerHTML = "";
}

function renderProjectRows() {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Project</th>
      <th scope="col">Code</th>
      <th scope="col">Owner</th>
      <th scope="col">Approvers</th>
      <th scope="col">Parts</th>
      <th scope="col">Description</th>
      <th scope="col">Action</th>
    </tr>
  `;
  const existing = projects()
    .map(
      (project) => {
        const approvers = projectApprovers(project);
        return `
        <tr class="projectFolder">
          <td><span class="folderIcon" aria-hidden="true"></span>${escapeHtml(project)}</td>
          <td><input class="tableInput" data-edit-project="${escapeHtml(project)}" data-field="key" value="${escapeHtml(projectKey(project))}"></td>
          <td><input class="tableInput" data-edit-project="${escapeHtml(project)}" data-field="owner" value="${escapeHtml(projectOwner(project))}"></td>
          <td><input class="tableInput" data-edit-project="${escapeHtml(project)}" data-field="approvers" value="${escapeHtml(approvers.join(", "))}"></td>
          <td>${parts.filter((part) => part.project === project).length}</td>
          <td><input class="tableInput" data-edit-project="${escapeHtml(project)}" data-field="description" value="${escapeHtml(projectDescription(project))}"></td>
          <td><button class="iconButton primaryAction formAction" type="button" data-save-project="${escapeHtml(project)}">Save</button></td>
        </tr>
      `;
      }
    )
    .join("");
  partsList.innerHTML = `
    <tr>
      <td><input class="tableInput" id="newProjectName" value="" placeholder="New project"></td>
      <td><input class="tableInput" id="newProjectKey" value="${escapeHtml(nextProjectKey())}"></td>
      <td><input class="tableInput" id="newProjectOwner" value="engineering@example.com"></td>
      <td><input class="tableInput" id="newProjectApprovers" value=""></td>
      <td>0</td>
      <td><input class="tableInput" id="newProjectDescription" value=""></td>
      <td><button class="iconButton primaryAction formAction" type="button" data-submit-project>Create Project</button></td>
    </tr>
    ${existing}
  `;
}

function renderProjectsDetail() {
  partDetail.innerHTML = "";
}

function renderPartEditorRows(part) {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Field</th>
      <th scope="col">Value</th>
      <th scope="col">Notes</th>
    </tr>
  `;
  const drive = (part.documents ?? [])[0]?.url || "";
  const onshape = (part.onshape ?? [])[0]?.url || "";
  partsList.innerHTML = `
    ${partEditorRow("Part Number", "part_number", part.part_number, "Unique object identifier")}
    ${partEditorRow("Part Description", "name", part.name, "Name of the part")}
    ${partEditorSelectRow("Project", "project", part.project, projects(), "Project folder assignment")}
    ${partEditorSelectRow("State", "lifecycle_state", part.lifecycle_state === "in_review" ? "release_candidate" : part.lifecycle_state, ["draft", "release_candidate", "released", "obsolete"], "Draft, Release Candidate, Released, Obsolete")}
    ${partEditorRow("Revision", "revision", part.revision || "V1", "V-series drafts, letters for released revisions")}
    ${partEditorRow("Last Edited By", "owner", part.owner, "Last user to update this component")}
    ${partEditorRow("Google Drive Link", "driveUrl", drive, "Linked document")}
    ${partEditorRow("Onshape Link", "onshapeUrl", onshape, "Linked CAD object")}
    ${partEditorRow("Notes", "description", part.description || "", "Internal part notes")}
    <tr>
      <td>Save</td>
      <td><button class="iconButton primaryAction formAction" type="button" data-save-open-part="${escapeHtml(part.part_number)}">Save Part</button></td>
      <td>Updates the current browser session</td>
    </tr>
  `;
}

function renderPartReadonlyRows(rootPart, selectedPart) {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Field</th>
      <th scope="col">Value</th>
      <th scope="col">Notes</th>
    </tr>
  `;
  const drive = (selectedPart.documents ?? [])[0]?.url || "";
  const onshape = (selectedPart.onshape ?? [])[0]?.url || "";
  partsList.innerHTML = `
    ${partReadonlyRow("Part Number", selectedPart.part_number, "Unique object identifier")}
    ${partReadonlyRow("Part Description", selectedPart.name, "Name of the part")}
    ${partReadonlyRow("Project", selectedPart.project, "Project folder assignment")}
    ${partReadonlyRow("State", stateLabel(selectedPart.lifecycle_state), "Lifecycle state")}
    ${partReadonlyRow("Revision", selectedPart.revision || "V1", "Current revision")}
    ${partReadonlyRow("Last Edited By", selectedPart.owner, "Last user to update this component")}
    ${partReadonlyRow("Last Edited Date", selectedPart.updated_at, "Date of last edit")}
    ${partReadonlyRow("Created Date", selectedPart.created_at, "Date created")}
    ${partReadonlyLinkRow("Google Drive Link", drive, "Linked document")}
    ${partReadonlyLinkRow("Onshape Link", onshape, "Linked CAD object")}
    ${partReadonlyRow("Where Used", whereUsed(selectedPart).map((part) => part.part_number).join(", ") || "None", "Parent BOMs containing this part")}
    ${partReadonlyRow("BOM Items", (selectedPart.bom ?? []).length, selectedPart.part_number === rootPart.part_number ? "Opened part structure" : "Selected component structure")}
    ${partReadonlyRow("Notes", selectedPart.description || "Not set", "Internal part notes")}
  `;
}

function partReadonlyRow(label, value, notes) {
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value || "Not set")}</td>
      <td>${escapeHtml(notes)}</td>
    </tr>
  `;
}

function partReadonlyLinkRow(label, url, notes) {
  const value = url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>` : "Not set";
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${value}</td>
      <td>${escapeHtml(notes)}</td>
    </tr>
  `;
}

function partEditorRow(label, field, value, notes) {
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td><input class="tableInput" data-open-part-field="${escapeHtml(field)}" value="${escapeHtml(value || "")}"></td>
      <td>${escapeHtml(notes)}</td>
    </tr>
  `;
}

function partEditorSelectRow(label, field, value, options, notes) {
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>
        <select class="tableInput" data-open-part-field="${escapeHtml(field)}">
          ${options.map((option) => `<option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(field === "lifecycle_state" ? stateLabel(option) : option)}</option>`).join("")}
        </select>
      </td>
      <td>${escapeHtml(notes)}</td>
    </tr>
  `;
}

function renderSyncRows() {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Action</th>
      <th scope="col">Status</th>
      <th scope="col">Command</th>
      <th scope="col">Result</th>
    </tr>
  `;
  partsList.innerHTML = `
    ${syncRow("Pull latest master", "Ready", "git pull origin master", "Requires local Git bridge", "pull")}
    ${syncRow("Push merge request", hasRepoChanges ? "Ready" : "No local changes", "branch + commit + push + MR", "Creates review request for approvers when backend is connected", "push")}
  `;
}

function syncRow(action, status, command, result, mode) {
  return `
    <tr>
      <td><button class="iconButton primaryAction formAction" type="button" data-sync-action="${escapeHtml(mode)}">${escapeHtml(action)}</button></td>
      <td>${escapeHtml(status)}</td>
      <td><code>${escapeHtml(command)}</code></td>
      <td>${escapeHtml(result)}</td>
    </tr>
  `;
}

function renderSettingsRows() {
  tableHead.innerHTML = `
    <tr>
      <th scope="col">Setting</th>
      <th scope="col">Value</th>
      <th scope="col">Notes</th>
    </tr>
  `;
  partsList.innerHTML = `
    <tr>
      <td>Data URL</td>
      <td><input class="tableInput" id="settingsDataUrl" value="${escapeHtml(window.PEAK_DATA_URL || "")}"></td>
      <td>Static JSON fixture or local backend endpoint</td>
    </tr>
    <tr>
      <td>Default Owner</td>
      <td><input class="tableInput" id="settingsDefaultOwner" value="${escapeHtml(localStorage.getItem("peakDefaultOwner") || "engineering@example.com")}"></td>
      <td>Used for newly created parts and projects</td>
    </tr>
    <tr>
      <td>Offline Mode</td>
      <td><select class="tableInput" id="settingsOffline"><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></td>
      <td>PEAK remains usable without internet except GitHub sync</td>
    </tr>
    <tr>
      <td colspan="3"><button class="iconButton primaryAction formAction" type="button" data-save-settings>Save Settings</button></td>
    </tr>
  `;
}

function renderSettingsDetail() {
  partDetail.innerHTML = "";
}

function allDriveDocuments() {
  return parts.flatMap((part) => part.documents ?? []);
}

function allOnshapeDocuments() {
  return parts.flatMap((part) => part.onshape ?? []);
}

function metricRow(metric, value, detail, scope) {
  return `<tr><td>${escapeHtml(metric)}</td><td>${escapeHtml(value)}</td><td>${escapeHtml(detail)}</td><td>${escapeHtml(scope)}</td><td>engineering@example.com</td><td>${new Date().toISOString().slice(0, 10)}</td></tr>`;
}

function renderSearchDetail() {
  const part = parts.find((candidate) => candidate.part_number === selectedPartNumber);
  if (!part) {
    partDetail.innerHTML = "";
    return;
  }

  partDetail.innerHTML = `
    <div class="propertyHeader">
      <div>
        <p class="objectType">${escapeHtml(part.project || "Unassigned project")} item revision</p>
        <h2>${escapeHtml(part.name)}</h2>
        <p class="objectUid">${escapeHtml(part.part_number)} / ${escapeHtml(part.revision)}</p>
      </div>
    </div>
    ${propertyTabs()}
    ${renderPropertyBody(part)}
  `;
}

function renderOpenedPartDetail(rootPart, selectedPart) {
  partDetail.innerHTML = `
    <div class="propertyHeader openedHeader">
      <div>
        <p class="objectType">${selectedPart.part_number === rootPart.part_number ? "Opened item" : "BOM component"}</p>
        <h2>${escapeHtml(selectedPart.name)}</h2>
        <p class="objectUid">${escapeHtml(selectedPart.part_number)} / Rev ${escapeHtml(selectedPart.revision)} | ${escapeHtml(selectedPart.project || "Unassigned project")}</p>
      </div>
      <a class="openTabLink" href="${escapeHtml(partUrl(selectedPart.part_number))}" target="_blank" rel="noopener noreferrer">Open in browser tab</a>
    </div>
    ${propertyTabs()}
    ${renderPropertyBody(selectedPart)}
  `;
}

function propertyTabs() {
  return `
    <div class="propertyTabs" aria-label="Property sections">
      <button class="propertyTab${activePropertyTab === "summary" ? " active" : ""}" type="button" data-property-tab="summary">Summary</button>
      <button class="propertyTab${activePropertyTab === "properties" ? " active" : ""}" type="button" data-property-tab="properties">Properties</button>
      <button class="propertyTab${activePropertyTab === "relations" ? " active" : ""}" type="button" data-property-tab="relations">Relations</button>
    </div>
  `;
}

function renderPropertyBody(part) {
  if (activePropertyTab === "properties") {
    return `
      <section class="propertySection">
        <h3>Core Properties</h3>
        <dl class="propertyGrid">
          ${property("Item ID", part.part_number)}
          ${property("Name", part.name)}
          ${property("Revision", part.revision)}
          ${property("Lifecycle State", stateLabel(part.lifecycle_state))}
          ${property("Project", part.project)}
          ${property("Owner", part.owner)}
          ${property("Created", part.created_at)}
          ${property("Modified", part.updated_at)}
          ${property("Tags", (part.tags ?? []).join(", "))}
        </dl>
      </section>
      <section class="propertySection">
        <h3>History</h3>
        <div class="referenceList">
          ${historyReference(part.created_at, "Created", `Created by ${part.owner}`)}
          ${historyReference(part.updated_at, "Updated", part.change_summary || "Record metadata updated")}
        </div>
      </section>
      <section class="propertySection">
        <h3>Previous Revisions</h3>
        <div class="referenceList">
          ${historyReference(part.revision, "Current revision", part.updated_at)}
          ${historyReference("-", part.revision === "A" ? "Pre-release working copy" : `Revision before ${part.revision}`, "No prior released revision in registry")}
        </div>
      </section>
    `;
  }

  if (activePropertyTab === "relations") {
    return `
      <div class="relationStack">
        ${referenceSection("Components", part.bom ?? [], bomReference)}
        ${referenceSection("Files", [...(part.documents ?? []), ...(part.onshape ?? [])], fileReference)}
        ${referenceSection("Where Used", whereUsed(part), whereUsedReference)}
        ${referenceSection("Manufacturers", part.manufacturers ?? [], manufacturerReference)}
      </div>
    `;
  }

  return `
    <section class="propertySection">
      <h3>Summary</h3>
      <p class="description">${escapeHtml(part.description || "Not set")}</p>
      <p class="description">${escapeHtml(part.change_summary || "")}</p>
    </section>
    <section class="propertySection">
      <h3>Status</h3>
      <dl class="propertyGrid">
        ${property("Lifecycle State", stateLabel(part.lifecycle_state))}
        ${property("Owner", part.owner)}
        ${property("Revision", part.revision)}
        ${property("Components", (part.bom ?? []).length)}
        ${property("Files", (part.documents ?? []).length + (part.onshape ?? []).length)}
        ${property("Approvers", (part.approvers ?? []).length)}
      </dl>
    </section>
    ${referenceSection("Approvers", part.approvers ?? [], approverReference)}
  `;
}

function property(label, value) {
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${escapeHtml(value || "Not set")}</dd>
  `;
}

function referenceSection(title, records, renderer) {
  const body = records.length ? records.map(renderer).join("") : '<p class="empty">None</p>';
  return `
    <section class="propertySection">
      <h3>${escapeHtml(title)}</h3>
      <div class="referenceList">${body}</div>
    </section>
  `;
}

function bomReference(item) {
  const child = parts.find((part) => part.part_number === item.child_part_number);
  return `
    <article class="reference">
      <strong><button class="linkButton" type="button" data-part-number="${escapeHtml(item.child_part_number)}">${escapeHtml(item.child_part_number)}</button></strong>
      <p>${escapeHtml(child?.name ?? "External component")} | ${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</p>
    </article>
  `;
}

function fileReference(record) {
  const title = record.title;
  const type = record.type;
  const id = record.google_drive_file_id || record.document_id || record.workspace_id || "No identifier";
  return `
    <article class="reference">
      <strong><a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></strong>
      <p>${escapeHtml(type)} | ${escapeHtml(id)}</p>
    </article>
  `;
}

function manufacturerReference(item) {
  const identifiers = [item.manufacturer_part_number, item.vendor, item.vendor_part_number]
    .filter(Boolean)
    .join(" | ");
  return `
    <article class="reference">
      <strong>${escapeHtml(item.name)}</strong>
      <p>${escapeHtml(identifiers || "No identifiers")}</p>
    </article>
  `;
}

function approverReference(item) {
  return `
    <article class="reference">
      <strong>${escapeHtml(item.name)}</strong>
      <p>${escapeHtml(item.role)} | ${escapeHtml(item.status)}${item.date ? ` | ${escapeHtml(item.date)}` : ""}</p>
    </article>
  `;
}

function whereUsedReference(parent) {
  return `
    <article class="reference">
      <strong><button class="linkButton" type="button" data-part-number="${escapeHtml(parent.part_number)}">${escapeHtml(parent.part_number)}</button></strong>
      <p>${escapeHtml(parent.name)} | ${escapeHtml(parent.project || "Unassigned project")}</p>
    </article>
  `;
}

function historyReference(object, title, detail) {
  return `
    <article class="reference">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(object)} | ${escapeHtml(detail)}</p>
    </article>
  `;
}

function whereUsed(part) {
  return parts.filter((candidate) =>
    (candidate.bom ?? []).some((item) => item.child_part_number === part.part_number)
  );
}

function countBy(records, key) {
  return records.reduce((counts, record) => {
    const value = record[key] || "Not set";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts, labeler = (value) => value) {
  return Object.entries(counts)
    .map(([value, count]) => `${labeler(value)}: ${count}`)
    .join(" | ");
}

function renderNavigationTree() {
  const states = ["draft", "release_candidate", "released", "obsolete"];
  const projectNames = projects();
  const selectedPart = parts.find((part) => part.part_number === selectedPartNumber);

  if (activeNavMode === "create") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Create</p>
        <button class="treeNode root" type="button" data-focus-create="true">New Draft Part</button>
        <button class="treeNode" type="button" data-generate-part-number>Generate Part Number</button>
      </div>
    `;
    return;
  }

  if (activeNavMode === "projects") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Projects</p>
        <button class="treeNode root" type="button" data-focus-project="true">Create Project Folder</button>
        ${projectNames.map((project) => `<button class="treeNode" type="button" data-filter-project="${escapeHtml(project)}">${escapeHtml(project)}</button>`).join("")}
      </div>
    `;
    return;
  }

  if (activeNavMode === "report") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Reports</p>
        <button class="treeNode root" type="button" data-clear-filters="true">Registry summary</button>
        <button class="treeNode" type="button" data-filter-state="draft">Draft parts</button>
        <button class="treeNode" type="button" data-filter-state="release_candidate">Release candidates</button>
        <button class="treeNode" type="button" data-filter-state="released">Released parts</button>
      </div>
    `;
    return;
  }

  if (activeNavMode === "sync") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Sync</p>
        <button class="treeNode root" type="button" data-sync-action="pull">Pull master</button>
        <button class="treeNode" type="button" data-sync-action="push">Create merge request</button>
      </div>
    `;
    return;
  }

  if (activeNavMode === "settings") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Settings</p>
        <button class="treeNode root" type="button" data-focus-settings="true">Local Settings</button>
      </div>
    `;
    return;
  }

  navigationTree.innerHTML = `
    <div class="treeGroup">
      <button class="treeNode root" type="button" data-clear-filters="true">All Components</button>
      ${selectedPart ? `<button class="treeNode" type="button" data-clear-filters="true">Selected: ${escapeHtml(selectedPart.part_number)}</button>` : ""}
    </div>
    <div class="treeGroup">
      <p>Saved Searches</p>
      ${states
        .map((state) => {
          const count = parts.filter((part) => lifecycleMatches(part.lifecycle_state, state)).length;
          return `<button class="treeNode" type="button" data-filter-state="${escapeHtml(state)}">${escapeHtml(stateLabel(state))} (${count})</button>`;
        })
        .join("")}
    </div>
    <div class="treeGroup">
      <p>Projects</p>
      ${projectNames
        .map((project) => {
          const count = parts.filter((part) => part.project === project).length;
          return `<button class="treeNode" type="button" data-filter-project="${escapeHtml(project)}">${escapeHtml(project)} (${count})</button>`;
        })
        .join("")}
    </div>
  `;
}

function renderBomTree() {
  const rootPart = getOpenedPart();
  if (!rootPart) {
    navigationTree.innerHTML = '<div class="treeEmpty">No part open</div>';
    return;
  }

  const childRows = renderBomChildren(rootPart, 1, new Set([rootPart.part_number]));
  const partOptions = parts
    .filter((part) => part.part_number !== rootPart.part_number)
    .map((part) => `<option value="${escapeHtml(part.part_number)}">${escapeHtml(part.part_number)} - ${escapeHtml(part.name)}</option>`)
    .join("");
  navigationTree.innerHTML = `
    <div class="bomGrid" role="treegrid" aria-label="BOM Structure">
      <div class="bomHeader" role="row">
        <span>Item<span class="bomResizeHandle" data-bom-resize-column="0" role="separator" aria-label="Resize item column"></span></span>
        <span>Qty<span class="bomResizeHandle" data-bom-resize-column="1" role="separator" aria-label="Resize quantity column"></span></span>
        <span>Action<span class="bomResizeHandle" data-bom-resize-column="2" role="separator" aria-label="Resize action column"></span></span>
      </div>
      <button class="treeNode bomNode root${selectedBomPartNumber === rootPart.part_number ? " active" : ""}" type="button" data-bom-part-number="${escapeHtml(rootPart.part_number)}" role="row">
        <span class="bomItem">${escapeHtml(rootPart.part_number)}</span>
        <span class="bomName">${escapeHtml(rootPart.name)}</span>
        <span class="bomQty">1 each</span>
      </button>
      ${childRows || '<div class="treeEmpty">No child components</div>'}
      ${
        activePartEditMode
          ? `<div class="bomAddRow">
              <select class="tableInput" id="newBomPart">${partOptions}</select>
              <input class="tableInput" id="newBomQty" value="1">
              <button class="iconButton primaryAction" type="button" data-add-bom>Add</button>
            </div>`
          : ""
      }
    </div>
  `;
}

function renderBomChildren(parentPart, depth, visited) {
  return (parentPart.bom ?? [])
    .map((item) => {
      const child = parts.find((part) => part.part_number === item.child_part_number);
      const active = selectedBomPartNumber === item.child_part_number ? " active" : "";
      const children =
        child && !visited.has(child.part_number)
          ? renderBomChildren(child, depth + 1, new Set([...visited, child.part_number]))
          : "";

      const row = activePartEditMode
        ? `
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" data-bom-part-number="${escapeHtml(item.child_part_number)}" role="row">
            <button class="bomItem linkButton" type="button" data-bom-part-number="${escapeHtml(item.child_part_number)}">${escapeHtml(item.child_part_number)}</button>
            <input class="tableInput bomQtyInput" value="${escapeHtml(item.quantity)}" data-bom-qty="${escapeHtml(item.child_part_number)}">
            <button class="iconButton" type="button" data-remove-bom="${escapeHtml(item.child_part_number)}">Remove</button>
          </div>
        `
        : `
          <button class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" type="button" data-bom-part-number="${escapeHtml(item.child_part_number)}" role="row">
            <span class="bomItem">${escapeHtml(item.child_part_number)}</span>
            <span class="bomName">${escapeHtml(child?.name ?? "External component")}</span>
            <span class="bomQty">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</span>
          </button>
        `;
      return `${row}${children}`;
    })
    .join("");
}

function renderProjectOptions() {
  const projectNames = projects();
  projectFilter.innerHTML = [
    '<option value="">All projects</option>',
    ...projectNames.map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
  ].join("");
}

function projects() {
  return [...new Set([...customProjects.map((project) => project.name), ...parts.map((part) => part.project)].filter(Boolean))].sort();
}

function projectKey(project) {
  const custom = customProjects.find((candidate) => candidate.name === project);
  if (custom?.key) {
    return custom.key;
  }
  const words = project.split(/\s+/).filter(Boolean);
  const prefix = words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
  return prefix || "P";
}

function projectOwner(project) {
  return customProjects.find((candidate) => candidate.name === project)?.owner || "engineering@example.com";
}

function projectDescription(project) {
  return customProjects.find((candidate) => candidate.name === project)?.description || `${project} project records`;
}

function projectApprovers(project) {
  const custom = customProjects.find((candidate) => candidate.name === project);
  if (Array.isArray(custom?.approvers)) {
    return custom.approvers;
  }
  return [...new Set(parts.filter((part) => part.project === project).flatMap((part) => (part.approvers ?? []).map((approver) => approver.name)))];
}

function nextProjectKey() {
  return `PROJ-${String(projects().length + 1).padStart(3, "0")}`;
}

function nextProjectPartNumber(project) {
  const prefix = `${projectKey(project)}-`;
  const numbers = parts
    .map((part) => part.part_number)
    .filter((partNumber) => partNumber.startsWith(prefix))
    .map((partNumber) => Number(partNumber.slice(prefix.length)))
    .filter(Number.isFinite);
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function applyNavMode(mode) {
  statusMessage = "";
  openedPartNumber = null;
  selectedBomPartNumber = null;
  activePartEditMode = false;
  const url = new URL(window.location.href);
  url.searchParams.delete("part");
  url.searchParams.delete("edit");
  window.history.replaceState({}, "", url);
  if (mode === "home") {
    searchInput.value = "";
    stateFilter.value = "";
    projectFilter.value = "";
    activeResultView = "grid";
  }

  if (mode === "create" || mode === "projects" || mode === "sync" || mode === "report" || mode === "settings") {
    searchInput.value = "";
    stateFilter.value = "";
    projectFilter.value = "";
  }
}

function openSelectedPart({ newTab = false, editMode = false } = {}) {
  if (!selectedPartNumber) {
    return;
  }
  const url = partUrl(selectedPartNumber, { editMode });
  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  openedPartNumber = selectedPartNumber;
  selectedBomPartNumber = selectedPartNumber;
  activePartEditMode = editMode;
  activeNavMode = "part";
  window.history.replaceState({}, "", url);
  renderApp();
}

function moveToPart(partNumber, { editMode = false } = {}) {
  if (!parts.some((part) => part.part_number === partNumber)) {
    return;
  }
  selectedPartNumber = partNumber;
  openedPartNumber = partNumber;
  selectedBomPartNumber = partNumber;
  activePartEditMode = editMode;
  activeNavMode = "part";
  window.history.replaceState({}, "", partUrl(partNumber, { editMode }));
  renderApp();
}

function partUrl(partNumber, { editMode = false } = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set("part", partNumber);
  if (editMode) {
    url.searchParams.set("edit", "1");
  } else {
    url.searchParams.delete("edit");
  }
  return url.toString();
}

function syncChrome() {
  const isOpened = activeNavMode === "part";
  const isSinglePane = ["create", "projects", "sync", "settings"].includes(activeNavMode);
  const isReportPane = activeNavMode === "report";
  document.body.classList.toggle("openedPartMode", isOpened);
  document.body.classList.toggle("searchMode", !isOpened);
  workspace.classList.toggle("partWorkspace", isOpened);
  workspace.classList.toggle("singlePaneWorkspace", isSinglePane);
  workspace.classList.toggle("reportWorkspace", isReportPane);
  workspace.classList.toggle("navCollapsed", isNavigatorCollapsed);
  workspace.classList.toggle("propertiesCollapsed", isPropertiesCollapsed);
  collapseNavButton.textContent = isNavigatorCollapsed ? ">" : "<";
  collapseNavButton.title = isNavigatorCollapsed ? "Expand navigator" : "Collapse navigator";
  collapsePropertiesButton.textContent = isPropertiesCollapsed ? "<" : ">";
  collapsePropertiesButton.title = isPropertiesCollapsed ? "Expand details" : "Collapse details";

  navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.navMode === activeNavMode);
  });
  repoBadge.hidden = !hasRepoChanges;
  renderSearchSuggestions();
}

function hidePartContextMenu() {
  partContextMenu.hidden = true;
  partContextMenu.dataset.partNumber = "";
}

function showPartContextMenu(event, partNumber) {
  event.preventDefault();
  selectedPartNumber = partNumber;
  partContextMenu.dataset.partNumber = partNumber;
  partContextMenu.style.left = `${event.clientX}px`;
  partContextMenu.style.top = `${event.clientY}px`;
  partContextMenu.hidden = false;
}

partsList.addEventListener("click", (event) => {
  if (event.target.closest("button, input, select, textarea")) {
    return;
  }
  const row = event.target.closest("[data-part-number]");
  if (!row) {
    return;
  }
  selectedPartNumber = row.dataset.partNumber;
  if (row.dataset.bomPartNumber) {
    selectedBomPartNumber = row.dataset.bomPartNumber;
  }
  if (event.detail >= 2) {
    openSelectedPart();
    return;
  }
  renderApp();
});

partsList.addEventListener("contextmenu", (event) => {
  const row = event.target.closest("[data-part-number]");
  if (!row || activeNavMode !== "home") {
    hidePartContextMenu();
    return;
  }
  showPartContextMenu(event, row.dataset.partNumber);
});

partsList.addEventListener("change", (event) => {
  if (event.target.closest("#newPartProject")) {
    generatePartNumberIntoForm();
  }
});

partsList.addEventListener("dblclick", (event) => {
  if (event.target.closest("button, input, select, textarea")) {
    return;
  }
  const row = event.target.closest("[data-part-number]");
  if (!row) {
    return;
  }
  selectedPartNumber = row.dataset.partNumber;
  if (row.dataset.bomPartNumber) {
    selectedBomPartNumber = row.dataset.bomPartNumber;
  }
  openSelectedPart();
});

partsList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  const row = event.target.closest("[data-part-number]");
  if (!row) {
    return;
  }
  event.preventDefault();
  selectedPartNumber = row.dataset.partNumber;
  if (event.key === "Enter") {
    openSelectedPart({ newTab: true });
  } else {
    renderApp();
  }
});

partDetail.addEventListener("click", (event) => {
  const propertyTab = event.target.closest("[data-property-tab]");
  if (propertyTab) {
    activePropertyTab = propertyTab.dataset.propertyTab;
    renderApp();
    return;
  }

  const button = event.target.closest("[data-part-number]");
  if (!button) {
    return;
  }
  selectedPartNumber = button.dataset.partNumber;
  selectedBomPartNumber = button.dataset.partNumber;
  if (openedPartNumber) {
    renderApp();
  }
});

navigationTree.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-bom], [data-remove-bom], [data-focus-project], [data-focus-create], [data-focus-settings], [data-generate-part-number], [data-sync-action], [data-action], [data-bom-part-number], [data-filter-state], [data-filter-project], [data-clear-filters]");
  if (!button) {
    return;
  }

  if (button.dataset.addBom !== undefined) {
    addBomFromForm();
    return;
  }

  if (button.dataset.removeBom) {
    removeBomItem(button.dataset.removeBom);
    return;
  }

  if (button.dataset.focusProject) {
    document.querySelector("#newProjectName")?.focus();
    return;
  }

  if (button.dataset.focusCreate) {
    document.querySelector("#newPartName")?.focus();
    return;
  }

  if (button.dataset.focusSettings) {
    document.querySelector("#settingsDataUrl")?.focus();
    return;
  }

  if (button.dataset.generatePartNumber !== undefined) {
    generatePartNumberIntoForm();
    return;
  }

  if (button.dataset.syncAction) {
    showSyncAction(button.dataset.syncAction);
    return;
  }

  if (button.dataset.action) {
    runAction(button.dataset.action);
    return;
  }

  if (button.dataset.bomPartNumber) {
    selectedBomPartNumber = button.dataset.bomPartNumber;
    selectedPartNumber = button.dataset.bomPartNumber;
    renderApp();
    return;
  }

  if (button.dataset.clearFilters === "true") {
    stateFilter.value = "";
    projectFilter.value = "";
    searchInput.value = "";
  }

  if (button.dataset.filterState !== undefined) {
    stateFilter.value = button.dataset.filterState;
  }

  if (button.dataset.filterProject !== undefined) {
    projectFilter.value = button.dataset.filterProject;
  }

  renderApp();
});

navigationTree.addEventListener("change", (event) => {
  const quantityInput = event.target.closest("[data-bom-qty]");
  if (!quantityInput) {
    return;
  }
  updateBomQuantity(quantityInput.dataset.bomQty, quantityInput.value);
});

searchInput.addEventListener("input", () => {
  if (openedPartNumber) {
    renderSearchSuggestions();
    return;
  }
  renderApp();
});
searchInput.addEventListener("focus", renderSearchSuggestions);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".searchBox")) {
    searchSuggestions.classList.remove("visible");
  }
  if (!event.target.closest("#partContextMenu")) {
    hidePartContextMenu();
  }
});
searchSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-suggestion-part]");
  if (!button) {
    return;
  }
  moveToPart(button.dataset.suggestionPart);
});
partContextMenu.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-context-action]");
  if (!actionButton) {
    return;
  }
  const partNumber = partContextMenu.dataset.partNumber;
  if (!partNumber) {
    return;
  }
  selectedPartNumber = partNumber;
  hidePartContextMenu();
  if (actionButton.dataset.contextAction === "open") {
    openSelectedPart();
    return;
  }
  if (actionButton.dataset.contextAction === "open-new-tab") {
    openSelectedPart({ newTab: true });
    return;
  }
  if (actionButton.dataset.contextAction === "edit") {
    openSelectedPart({ editMode: true });
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hidePartContextMenu();
  }
});
stateFilter.addEventListener("change", renderApp);
projectFilter.addEventListener("change", renderApp);

collapseNavButton.addEventListener("click", () => {
  isNavigatorCollapsed = !isNavigatorCollapsed;
  renderApp();
});
collapsePropertiesButton.addEventListener("click", () => {
  isPropertiesCollapsed = !isPropertiesCollapsed;
  renderApp();
});

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    activeNavMode = button.dataset.navMode;
    applyNavMode(activeNavMode);
    renderApp();
  });
});

partsList.addEventListener("click", (event) => {
  const createButton = event.target.closest("[data-submit-create]");
  if (createButton) {
    createPartFromForm();
    return;
  }

  const projectButton = event.target.closest("[data-submit-project]");
  if (projectButton) {
    createProjectFromForm();
    return;
  }

  const generateButton = event.target.closest("[data-generate-part-number]");
  if (generateButton) {
    generatePartNumberIntoForm();
    return;
  }

  const saveOpenPartButton = event.target.closest("[data-save-open-part]");
  if (saveOpenPartButton) {
    saveOpenPartFromForm(saveOpenPartButton.dataset.saveOpenPart);
    return;
  }

  const syncButton = event.target.closest("[data-sync-action]");
  if (syncButton) {
    showSyncAction(syncButton.dataset.syncAction);
    return;
  }

  const saveSettingsButton = event.target.closest("[data-save-settings]");
  if (saveSettingsButton) {
    saveSettingsFromForm();
    return;
  }

  const savePartButton = event.target.closest("[data-save-part]");
  if (savePartButton) {
    savePartFromRow(savePartButton.dataset.savePart);
    return;
  }

  const saveProjectButton = event.target.closest("[data-save-project]");
  if (saveProjectButton) {
    saveProjectFromRow(saveProjectButton.dataset.saveProject);
    return;
  }

});

function initPaneResizing() {
  document.querySelectorAll("[data-resize-pane]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 1120px)").matches) {
        return;
      }

      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add("isResizing");

      const pane = handle.dataset.resizePane;
      const startX = event.clientX;
      const styles = getComputedStyle(workspace);
      const startNavWidth = parseFloat(styles.getPropertyValue("--nav-width")) || 250;
      const startPropWidth = parseFloat(styles.getPropertyValue("--prop-width")) || 360;

      function onMove(moveEvent) {
        const delta = moveEvent.clientX - startX;
        const maxPaneWidth = Math.max(80, workspace.getBoundingClientRect().width - 90);
        if (pane === "navigator") {
          workspace.style.setProperty("--nav-width", `${clamp(startNavWidth + delta, 0, maxPaneWidth)}px`);
        } else {
          workspace.style.setProperty("--prop-width", `${clamp(startPropWidth - delta, 0, maxPaneWidth)}px`);
        }
      }

      function onUp(upEvent) {
        handle.releasePointerCapture(upEvent.pointerId);
        document.body.classList.remove("isResizing");
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      }

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  });
}

function enableColumnResizing() {
  const table = document.querySelector(".objectTable");
  const headers = [...tableHead.querySelectorAll("th")];
  if (!table || !headers.length) {
    return;
  }
  const columnWidths = headers.map((header) => Math.max(header.getBoundingClientRect().width || 0, 96));
  let colgroup = table.querySelector("colgroup");
  if (!colgroup || colgroup.children.length !== headers.length) {
    colgroup?.remove();
    colgroup = document.createElement("colgroup");
    headers.forEach(() => colgroup.append(document.createElement("col")));
    table.prepend(colgroup);
  }
  const cols = [...colgroup.children];
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  table.style.width = `${tableWidth}px`;
  table.style.minWidth = `${tableWidth}px`;
  headers.forEach((header, index) => {
    cols[index].style.width = `${columnWidths[index]}px`;
    header.style.width = `${columnWidths[index]}px`;
  });
  headers.forEach((header, index) => {
    if (header.querySelector(".columnResizeHandle")) {
      return;
    }
    const handle = document.createElement("span");
    handle.className = "columnResizeHandle";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", `Resize ${header.textContent.trim()} column`);
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add("isResizing");
      const startX = event.clientX;
      const startWidth = cols[index].getBoundingClientRect().width || header.getBoundingClientRect().width;
      const startTableWidth = table.getBoundingClientRect().width;

      function onMove(moveEvent) {
        const width = clamp(startWidth + moveEvent.clientX - startX, 48, 720);
        const delta = width - startWidth;
        table.style.width = `${Math.max(startTableWidth + delta, width)}px`;
        table.style.minWidth = `${Math.max(startTableWidth + delta, width)}px`;
        cols[index].style.width = `${width}px`;
        header.style.width = `${width}px`;
      }

      function onUp(upEvent) {
        handle.releasePointerCapture(upEvent.pointerId);
        document.body.classList.remove("isResizing");
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      }

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
    header.append(handle);
  });
}

function enableBomColumnResizing() {
  const grid = document.querySelector(".bomGrid");
  const handles = [...document.querySelectorAll("[data-bom-resize-column]")];
  if (!grid || !handles.length) {
    return;
  }
  const saved = loadBomColumnWidths();
  saved.forEach((width, index) => {
    grid.style.setProperty(`--bom-col-${index + 1}`, `${width}px`);
  });
  handles.forEach((handle) => {
    if (handle.dataset.resizeReady === "true") {
      return;
    }
    handle.dataset.resizeReady = "true";
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(handle.dataset.bomResizeColumn);
      const column = handle.parentElement;
      const startWidth = column.getBoundingClientRect().width;
      const startX = event.clientX;
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add("isResizing");

      function onMove(moveEvent) {
        const width = clamp(startWidth + moveEvent.clientX - startX, 48, 720);
        grid.style.setProperty(`--bom-col-${index + 1}`, `${width}px`);
      }

      function onUp(upEvent) {
        handle.releasePointerCapture(upEvent.pointerId);
        document.body.classList.remove("isResizing");
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        saveBomColumnWidths(grid);
      }

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function runAction(action) {
  if (action === "create-part") {
    activeNavMode = "create";
    applyNavMode("create");
    renderApp();
  }
  if (action === "link-drive") {
    linkExternalRecord("documents");
  }
  if (action === "link-onshape") {
    linkExternalRecord("onshape");
  }
  if (action === "github-pull") {
    showSyncAction("pull");
  }
  if (action === "github-push") {
    showSyncAction("push");
  }
}

function createPartFromForm() {
  const values = {
    partNumber: document.querySelector("#newPartNumber")?.value.trim(),
    name: document.querySelector("#newPartName")?.value.trim(),
    project: document.querySelector("#newPartProject")?.value.trim(),
    revision: "V1",
    state: "draft",
    owner: localStorage.getItem("peakDefaultOwner") || "engineering@example.com",
    description: document.querySelector("#newPartDescription")?.value.trim(),
    driveUrl: document.querySelector("#newPartDriveUrl")?.value.trim(),
    onshapeUrl: document.querySelector("#newPartOnshapeUrl")?.value.trim()
  };
  createPartRecord(values);
}

function generatePartNumberIntoForm() {
  const project = document.querySelector("#newPartProject")?.value || projects()[0] || "Unassigned Project";
  const input = document.querySelector("#newPartNumber");
  if (input) {
    input.value = nextProjectPartNumber(project);
  }
}

function createProjectFromForm() {
  const name = document.querySelector("#newProjectName")?.value.trim();
  const key = document.querySelector("#newProjectKey")?.value.trim() || projectKey(name);
  const owner = document.querySelector("#newProjectOwner")?.value.trim() || localStorage.getItem("peakDefaultOwner") || "engineering@example.com";
  const description = document.querySelector("#newProjectDescription")?.value.trim();
  const approvers = (document.querySelector("#newProjectApprovers")?.value || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!name) {
    statusMessage = "Project name is required";
    renderApp();
    return;
  }
  if (projects().includes(name)) {
    statusMessage = `${name} already exists`;
    renderApp();
    return;
  }
  customProjects.push({ name, key, owner, description, approvers });
  persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Created project ${name}`;
  renderApp();
}

function savePartFromRow(originalPartNumber) {
  const part = parts.find((candidate) => candidate.part_number === originalPartNumber);
  if (!part) {
    return;
  }
  const fields = document.querySelectorAll(`[data-edit-part="${CSS.escape(originalPartNumber)}"]`);
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.field, field.value.trim()]));
  if (!values.part_number || !values.name) {
    statusMessage = "Part identifier and name are required";
    renderApp();
    return;
  }
  if (values.part_number !== originalPartNumber && parts.some((candidate) => candidate.part_number === values.part_number)) {
    statusMessage = `${values.part_number} already exists`;
    renderApp();
    return;
  }
  const oldPartNumber = part.part_number;
  part.part_number = values.part_number;
  part.name = values.name;
  part.lifecycle_state = values.lifecycle_state || part.lifecycle_state;
  part.description = values.description;
  part.updated_at = new Date().toISOString().slice(0, 10);
  parts.forEach((candidate) => {
    (candidate.bom ?? []).forEach((item) => {
      if (item.child_part_number === oldPartNumber) {
        item.child_part_number = part.part_number;
      }
    });
  });
  selectedPartNumber = part.part_number;
  parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
  persistLocalChanges();
  statusMessage = `Saved ${part.part_number}`;
  renderApp();
}

function saveProjectFromRow(originalProject) {
  const fields = document.querySelectorAll(`[data-edit-project="${CSS.escape(originalProject)}"]`);
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.field, field.value.trim()]));
  const existing = customProjects.find((project) => project.name === originalProject);
  if (existing) {
    existing.key = values.key || existing.key || projectKey(originalProject);
    existing.owner = values.owner || "engineering@example.com";
    existing.description = values.description || "";
    existing.approvers = (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean);
  } else {
    customProjects.push({
      name: originalProject,
      key: values.key || projectKey(originalProject),
      owner: values.owner || "engineering@example.com",
      description: values.description || "",
      approvers: (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean)
    });
  }
  persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Saved project ${originalProject}`;
  renderApp();
}

function saveOpenPartFromForm(originalPartNumber) {
  const part = parts.find((candidate) => candidate.part_number === originalPartNumber);
  if (!part) {
    return;
  }
  const fields = document.querySelectorAll("[data-open-part-field]");
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.openPartField, field.value.trim()]));
  if (!values.part_number || !values.name || !values.project) {
    statusMessage = "Part number, description, and project are required";
    renderApp();
    return;
  }
  if (values.part_number !== originalPartNumber && parts.some((candidate) => candidate.part_number === values.part_number)) {
    statusMessage = `${values.part_number} already exists`;
    renderApp();
    return;
  }
  const oldPartNumber = part.part_number;
  part.part_number = values.part_number;
  part.name = values.name;
  part.project = values.project;
  part.lifecycle_state = values.lifecycle_state;
  part.revision = values.revision || part.revision;
  part.owner = values.owner || localStorage.getItem("peakDefaultOwner") || "engineering@example.com";
  part.description = values.description || "";
  part.updated_at = new Date().toISOString().slice(0, 10);
  if (values.driveUrl) {
    part.documents = part.documents || [];
    part.documents[0] = {
      type: "linked_file",
      title: `${part.name} Google Drive`,
      google_drive_file_id: driveIdFromUrl(values.driveUrl),
      url: values.driveUrl
    };
  }
  if (values.onshapeUrl) {
    part.onshape = part.onshape || [];
    part.onshape[0] = {
      type: "linked_object",
      title: `${part.name} Onshape`,
      document_id: onshapeDocumentIdFromUrl(values.onshapeUrl),
      workspace_id: "linked-workspace",
      element_id: "linked-element",
      url: values.onshapeUrl
    };
  }
  parts.forEach((candidate) => {
    (candidate.bom ?? []).forEach((item) => {
      if (item.child_part_number === oldPartNumber) {
        item.child_part_number = part.part_number;
      }
    });
  });
  selectedPartNumber = part.part_number;
  selectedBomPartNumber = part.part_number;
  openedPartNumber = part.part_number;
  persistLocalChanges();
  statusMessage = `Saved ${part.part_number}`;
  window.history.replaceState({}, "", partUrl(part.part_number, { editMode: activePartEditMode }));
  renderProjectOptions();
  renderApp();
}

function addBomFromForm() {
  const rootPart = getOpenedPart();
  const childPartNumber = document.querySelector("#newBomPart")?.value;
  const quantity = Number(document.querySelector("#newBomQty")?.value || 1);
  if (!rootPart || !childPartNumber) {
    return;
  }
  rootPart.bom = rootPart.bom || [];
  if (rootPart.bom.some((item) => item.child_part_number === childPartNumber)) {
    statusMessage = `${childPartNumber} is already in the BOM`;
    renderApp();
    return;
  }
  rootPart.bom.push({
    child_part_number: childPartNumber,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit: "each"
  });
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Added ${childPartNumber} to ${rootPart.part_number}`;
  renderApp();
}

function removeBomItem(childPartNumber) {
  const rootPart = getOpenedPart();
  if (!rootPart) {
    return;
  }
  rootPart.bom = (rootPart.bom || []).filter((item) => item.child_part_number !== childPartNumber);
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Removed ${childPartNumber}`;
  renderApp();
}

function updateBomQuantity(childPartNumber, rawQuantity) {
  const rootPart = getOpenedPart();
  const item = rootPart?.bom?.find((candidate) => candidate.child_part_number === childPartNumber);
  const quantity = Number(rawQuantity);
  if (!item || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }
  item.quantity = quantity;
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Updated ${childPartNumber} quantity`;
  renderApp();
}

function showSyncAction(action) {
  if (action === "pull") {
    statusMessage = "Pull requires a local Git bridge: git pull origin master";
  } else {
    statusMessage = "Push requires a local Git bridge to create a branch, commit, push, open an MR, and assign approvers.";
  }
  renderApp();
}

function saveSettingsFromForm() {
  const defaultOwner = document.querySelector("#settingsDefaultOwner")?.value.trim() || "engineering@example.com";
  const dataUrl = document.querySelector("#settingsDataUrl")?.value.trim();
  localStorage.setItem("peakDefaultOwner", defaultOwner);
  localStorage.setItem("peakDataUrl", dataUrl || "");
  statusMessage = "Settings saved locally";
  renderApp();
}

function createPartRecord(values) {
  if (!values.partNumber || !values.name || !values.project || !values.revision || !values.state || !values.owner) {
    statusMessage = "Missing required create fields";
    renderApp();
    return;
  }
  if (parts.some((part) => part.part_number === values.partNumber)) {
    statusMessage = `${values.partNumber} already exists`;
    renderApp();
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const part = {
    part_number: values.partNumber,
    name: values.name,
    description: values.description || "New part created in the PEAK registry UI.",
    category: "general",
    project: values.project,
    lifecycle_state: values.state,
    revision: values.revision,
    owner: values.owner,
    tags: [],
    onshape: [],
    documents: [],
    manufacturers: [],
    approvers: [],
    bom: [],
    change_summary: "Created from registry UI.",
    created_at: today,
    updated_at: today
  };
  if (values.driveUrl) {
    part.documents.push({
      type: "linked_file",
      title: `${values.name} Google Drive`,
      google_drive_file_id: driveIdFromUrl(values.driveUrl),
      url: values.driveUrl
    });
  }
  if (values.onshapeUrl) {
    part.onshape.push({
      type: "linked_object",
      title: `${values.name} Onshape`,
      document_id: onshapeDocumentIdFromUrl(values.onshapeUrl),
      workspace_id: "linked-workspace",
      element_id: "linked-element",
      url: values.onshapeUrl
    });
  }
  parts.push(part);
  parts.sort((a, b) => a.part_number.localeCompare(b.part_number));
  selectedPartNumber = part.part_number;
  persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Created ${part.part_number}`;
  renderApp();
}

function nextPartNumber() {
  const next = parts.length + 1;
  return `PART-${String(next).padStart(4, "0")}`;
}

function linkExternalRecord(kind) {
  const part = parts.find((candidate) => candidate.part_number === selectedPartNumber);
  if (!part) {
    statusMessage = "Select a part before linking";
    renderApp();
    return;
  }

  const label = kind === "documents" ? "Google Drive" : "Onshape";
  const title = prompt(`${label} title`, `${part.name} ${label} Link`);
  if (!title) {
    return;
  }
  const url = prompt(`${label} URL`, kind === "documents" ? "https://drive.google.com/file/d/example/view" : "https://cad.onshape.com/documents/example/w/example/e/example");
  if (!url) {
    return;
  }

  if (kind === "documents") {
    part.documents = part.documents || [];
    part.documents.push({
      type: "linked_file",
      title,
      google_drive_file_id: driveIdFromUrl(url),
      url
    });
  } else {
    part.onshape = part.onshape || [];
    part.onshape.push({
      type: "linked_object",
      title,
      document_id: onshapeDocumentIdFromUrl(url),
      workspace_id: "linked-workspace",
      element_id: "linked-element",
      url
    });
  }

  part.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Linked ${label} to ${part.part_number}`;
  renderApp();
}

function addConnectionFromForm() {
  const name = document.querySelector("#connectionName")?.value.trim();
  const type = document.querySelector("#connectionType")?.value;
  const url = document.querySelector("#connectionUrl")?.value.trim();
  if (!name || !type || !url) {
    statusMessage = "Connection name, type, and folder URL are required";
    renderApp();
    return;
  }
  connections.push({ name, type, url });
  saveConnections();
  statusMessage = `Added ${type === "drive" ? "Google Drive" : "Onshape"} connection`;
  renderApp();
}

function loadConnections() {
  try {
    return JSON.parse(localStorage.getItem("peakConnections") || localStorage.getItem("plmConnections") || "[]");
  } catch {
    return [];
  }
}

function saveConnections() {
  localStorage.setItem("peakConnections", JSON.stringify(connections));
}

function loadWorkingCopy() {
  try {
    const raw = localStorage.getItem("peakPartsWorkingCopy");
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadHasLocalChanges() {
  return localStorage.getItem("peakHasLocalChanges") === "true";
}

function persistLocalChanges() {
  localStorage.setItem("peakPartsWorkingCopy", JSON.stringify(parts));
  localStorage.setItem("peakHasLocalChanges", "true");
  saveProjects();
  hasRepoChanges = true;
}

function loadBomColumnWidths() {
  try {
    const widths = JSON.parse(localStorage.getItem("peakBomColumnWidths") || "[]");
    return Array.isArray(widths) ? widths.filter((width) => Number.isFinite(width) && width > 0) : [];
  } catch {
    return [];
  }
}

function saveBomColumnWidths(grid) {
  const styles = getComputedStyle(grid);
  const widths = [1, 2, 3].map((index) => parseFloat(styles.getPropertyValue(`--bom-col-${index}`))).filter(Number.isFinite);
  localStorage.setItem("peakBomColumnWidths", JSON.stringify(widths));
}

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem("peakProjects") || "[]");
  } catch {
    return [];
  }
}

function saveProjects() {
  localStorage.setItem("peakProjects", JSON.stringify(customProjects));
}

function driveIdFromUrl(url) {
  const match = String(url).match(/\/d\/([^/]+)/);
  return match?.[1] || "linked-drive-file";
}

function onshapeDocumentIdFromUrl(url) {
  const match = String(url).match(/documents\/([^/]+)/);
  return match?.[1] || "linked-onshape-document";
}

function renderSearchSuggestions() {
  if (!openedPartNumber) {
    searchSuggestions.classList.remove("visible");
    searchSuggestions.innerHTML = "";
    return;
  }

  const matches = searchMatches(searchInput.value);
  if (!matches.length) {
    searchSuggestions.classList.remove("visible");
    searchSuggestions.innerHTML = "";
    return;
  }

  searchSuggestions.innerHTML = matches
    .map(
      (part) => `
        <button class="suggestionItem" type="button" data-suggestion-part="${escapeHtml(part.part_number)}" role="option">
          <strong>${escapeHtml(part.part_number)}</strong>
          <span>${escapeHtml(part.name)}</span>
          <small>${escapeHtml(part.project || "Unassigned project")} | ${escapeHtml(stateLabel(part.lifecycle_state))}</small>
        </button>
      `
    )
    .join("");
  searchSuggestions.classList.add("visible");
}

loadParts()
  .then(() => {
    initPaneResizing();
    renderApp();
  })
  .catch((error) => {
    recordCount.textContent = "PEAK data unavailable";
    partsList.innerHTML = '<tr><td class="emptyCell" colspan="6">Could not load part records</td></tr>';
    partDetail.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  });

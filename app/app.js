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
const objectTable = document.querySelector(".objectTable");
const resultsTitle = document.querySelector("#resultsTitle");
const workspace = document.querySelector(".workspace");
const navItems = document.querySelectorAll("[data-nav-mode]");
const repoBadge = document.querySelector("#repoBadge");
const partContextMenu = document.querySelector("#partContextMenu");
const csvImportFile = document.querySelector("#csvImportFile");

let parts = [];
let selectedPartNumber = null;
let openedPartNumber = null;
let selectedBomPartNumber = null;
let activeNavMode = "home";
let activePartEditMode = false;
let activeCreateMode = "hub";
let activeResultView = "grid";
let activePropertyTab = "overview";
let activeSettingsTab = "setup";
let activeColorScheme = localStorage.getItem("peakColorScheme") || "dark";
let activeAccentColor = localStorage.getItem("peakAccentColor") || "teal";
let activeAccentCustomHex = localStorage.getItem("peakAccentCustomHex") || "#35d1a8";
let statusMessage = "";
let hasRepoChanges = loadHasLocalChanges();
let connections = loadConnections();
let customProjects = loadProjects();
let productDataDirectoryHandle = null;
let productDataFolderName = localStorage.getItem("peakProductDataFolderName") || "";

const productDataDbName = "peakProductData";
const productDataStoreName = "handles";

const accentPresets = [
  { id: "teal", name: "Teal", color: "#35d1a8" },
  { id: "emerald", name: "Emerald", color: "#10b981" },
  { id: "sky", name: "Sky", color: "#38bdf8" },
  { id: "cyan", name: "Cyan", color: "#06b6d4" },
  { id: "violet", name: "Violet", color: "#a78bfa" },
  { id: "rose", name: "Rose", color: "#f472b6" },
  { id: "amber", name: "Amber", color: "#fbbf24" },
  { id: "orange", name: "Orange", color: "#f97316" }
];

function applyAppearance(scheme, accent) {
  document.body.classList.toggle("lightMode", scheme === "light");
  document.body.setAttribute("data-accent", accent);
  if (accent === "custom") {
    applyCustomAccentLive(activeAccentCustomHex);
  } else {
    document.body.style.removeProperty("--accent");
    document.body.style.removeProperty("--accent-soft");
    document.body.style.removeProperty("--selected");
  }
}

function applyCustomAccentLive(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.body.style.setProperty("--accent", hex);
  document.body.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.12)`);
  document.body.style.setProperty("--selected", `rgba(${r}, ${g}, ${b}, 0.12)`);
  const rField = document.querySelector("#accentR");
  const gField = document.querySelector("#accentG");
  const bField = document.querySelector("#accentB");
  if (rField) rField.value = r;
  if (gField) gField.value = g;
  if (bField) bField.value = b;
}

function currentAccentHex() {
  if (activeAccentColor === "custom") return activeAccentCustomHex;
  return accentPresets.find((p) => p.id === activeAccentColor)?.color || "#35d1a8";
}

applyAppearance(activeColorScheme, activeAccentColor);

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

function partKey(part) {
  if (!part) {
    return "";
  }
  return part.object_id || `${part.part_number}^${part.revision || "V1"}`;
}

function partObjectLabel(part) {
  return partKey(part);
}

function findPartByKey(identifier) {
  const key = decodeURIComponent(String(identifier || ""));
  if (!key) {
    return undefined;
  }
  return (
    parts.find((part) => partKey(part) === key) ||
    parts.find((part) => part.part_number === key) ||
    parts.find((part) => `${part.part_number}^${part.revision || "V1"}` === key)
  );
}

function latestRevisionForPart(partNumber) {
  const revisions = parts.filter((part) => part.part_number === partNumber);
  return revisions[revisions.length - 1];
}

function asArray(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value.filter((item) => item != null) : [value];
}

async function loadParts() {
  productDataDirectoryHandle = await loadStoredProductDataFolder();
  let loadedParts = [];

  if (productDataDirectoryHandle) {
    try {
      loadedParts = await loadPartsFromProductDataFolder(productDataDirectoryHandle);
      customProjects = await loadProjectsFromProductDataFolder(productDataDirectoryHandle, loadedParts);
      hasRepoChanges = false;
      localStorage.setItem("peakHasLocalChanges", "false");
    } catch (error) {
      console.warn("Could not load PEAK product data from the selected local folder.", error);
      statusMessage = error.message;
    }
  } else {
    statusMessage = "Select a local product data folder in Settings > Setup.";
  }

  if (!Array.isArray(loadedParts)) {
    throw new Error("PEAK product data must be a JSON array");
  }

  const invalidPart = loadedParts.find((part) => !part?.part_number || !part?.name);
  if (invalidPart) {
    throw new Error("PEAK data records must include part_number and name");
  }

  parts = loadedParts.sort((a, b) => partKey(a).localeCompare(partKey(b)));
  selectedPartNumber = partKey(parts[0]) || null;
  renderProjectOptions();
  initRoute();
}

async function loadPartsFromProductDataFolder(directoryHandle) {
  const manifest = await readJsonFromDirectory(directoryHandle, "manifest.json");
  return normalizePartDataPayload(manifest, directoryHandle);
}

async function loadProjectsFromProductDataFolder(directoryHandle, loadedParts = parts) {
  try {
    const payload = await readJsonFromDirectory(directoryHandle, "projects.json");
    return normalizeProjectsPayload(payload);
  } catch (error) {
    if (error.name !== "NotFoundError") {
      console.warn("Could not load PEAK projects.json; inferring projects from part data.", error);
    }
    return mergeProjectRecords(inferProjectsFromParts(loadedParts), loadProjects());
  }
}

function normalizeProjectsPayload(payload) {
  const records = Array.isArray(payload) ? payload : payload?.projects;
  if (!Array.isArray(records)) {
    throw new Error("PEAK projects.json must include a projects array");
  }
  return records.map((project) => ({
    name: String(project.name || "").trim(),
    key: String(project.key || project.code || "").trim(),
    owner: String(project.owner || "").trim(),
    approvers: asArray(project.approvers).map((approver) => String(approver).trim()).filter(Boolean),
    description: String(project.description || "").trim()
  })).filter((project) => project.name);
}

function inferProjectsFromParts(sourceParts) {
  const inferred = new Map();
  asArray(sourceParts).forEach((part) => {
    if (!part.project || inferred.has(part.project)) {
      return;
    }
    inferred.set(part.project, {
      name: part.project,
      key: projectKeyFromName(part.project),
      owner: part.owner || "engineering@example.com",
      approvers: [],
      description: `${part.project} project records`
    });
  });
  return [...inferred.values()];
}

function mergeProjectRecords(primary, secondary) {
  const merged = new Map();
  asArray(primary).forEach((project) => merged.set(project.name, project));
  asArray(secondary).forEach((project) => {
    merged.set(project.name, { ...(merged.get(project.name) || {}), ...project });
  });
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function normalizePartDataPayload(payload, source) {
  if (Array.isArray(payload)) {
    return payload.map((part) => normalizeLegacyPartRecord(part));
  }
  if (!payload || !Array.isArray(payload.parts)) {
    throw new Error("PEAK manifest must include a parts array");
  }
  const loaded = await Promise.all(payload.parts.map((entry) => loadPartManifestEntry(entry, source)));
  return loaded.flat();
}

async function loadPartManifestEntry(entry, source) {
  if (typeof entry === "object" && entry.part_number && entry.name && !entry.revisions) {
    return [normalizeLegacyPartRecord(entry)];
  }
  const partPath = typeof entry === "string" ? entry : entry.path;
  const payload = await readProductJson(source, partPath);
  if (!payload.revisions) {
    return [normalizeLegacyPartRecord(payload)];
  }
  const revisionEntries = await Promise.all(
    asArray(payload.revisions).map(async (revisionEntry) => {
      if (typeof revisionEntry === "object" && (revisionEntry.revision || revisionEntry.object_id)) {
        return revisionEntry;
      }
      const revisionPath = typeof revisionEntry === "string" ? revisionEntry : revisionEntry.path;
      return readProductJson(source, resolveProductPath(partPath, revisionPath));
    })
  );
  return revisionEntries.map((revision) => normalizeRevisionRecord(payload, revision));
}

async function readProductJson(directoryHandle, relativePath) {
  return readJsonFromDirectory(directoryHandle, normalizeProductPath(relativePath));
}

async function readJsonFromDirectory(directoryHandle, relativePath) {
  const fileHandle = await getFileHandleFromPath(directoryHandle, relativePath);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function writeJsonToDirectory(directoryHandle, relativePath, value) {
  const fileHandle = await getFileHandleFromPath(directoryHandle, relativePath, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(value, null, 2)}\n`);
  await writable.close();
}

async function getFileHandleFromPath(directoryHandle, relativePath, options = {}) {
  const segments = normalizeProductPath(relativePath).split("/").filter(Boolean);
  if (!segments.length) {
    throw new Error("Product data path is empty");
  }
  let current = directoryHandle;
  for (const segment of segments.slice(0, -1)) {
    current = await current.getDirectoryHandle(segment, { create: options.create === true });
  }
  return current.getFileHandle(segments.at(-1), { create: options.create === true });
}

function normalizeProductPath(relativePath) {
  return String(relativePath || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function resolveProductPath(basePath, relativePath) {
  const normalizedRelative = normalizeProductPath(relativePath);
  if (normalizedRelative.startsWith("parts/")) {
    return normalizedRelative;
  }
  const baseSegments = normalizeProductPath(basePath).split("/");
  baseSegments.pop();
  return [...baseSegments, normalizedRelative].filter(Boolean).join("/");
}

async function loadStoredProductDataFolder() {
  if (!("indexedDB" in window)) {
    return null;
  }
  const handle = await readProductDataHandle();
  if (!handle) {
    return null;
  }
  productDataFolderName = handle.name || productDataFolderName;
  localStorage.setItem("peakProductDataFolderName", productDataFolderName);
  if ((await verifyProductDataFolderPermission(handle, false)) !== "granted") {
    return null;
  }
  return handle;
}

async function selectProductDataFolder() {
  if (!("showDirectoryPicker" in window)) {
    statusMessage = "This browser does not support selecting local folders. Open PEAK in a Chromium browser.";
    renderApp();
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    if ((await verifyProductDataFolderPermission(handle, true)) !== "granted") {
      statusMessage = "PEAK needs read/write permission for the selected product data folder.";
      renderApp();
      return;
    }
    productDataDirectoryHandle = handle;
    productDataFolderName = handle.name || "Selected folder";
    localStorage.setItem("peakProductDataFolderName", productDataFolderName);
    await saveProductDataHandle(handle);
    await reloadProductDataFromFolder();
  } catch (error) {
    if (error.name !== "AbortError") {
      statusMessage = `Could not select product data folder: ${error.message}`;
      renderApp();
    }
  }
}

async function verifyProductDataFolderPermission(handle, requestWrite) {
  const options = { mode: requestWrite ? "readwrite" : "read" };
  if ((await handle.queryPermission(options)) === "granted") {
    return "granted";
  }
  if (requestWrite) {
    return handle.requestPermission(options);
  }
  return "prompt";
}

function openProductDataDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(productDataDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(productDataStoreName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readProductDataHandle() {
  const db = await openProductDataDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(productDataStoreName, "readonly");
    const request = tx.objectStore(productDataStoreName).get("productDataFolder");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function saveProductDataHandle(handle) {
  const db = await openProductDataDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(productDataStoreName, "readwrite");
    tx.objectStore(productDataStoreName).put(handle, "productDataFolder");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function reloadProductDataFromFolder() {
  parts = (await loadPartsFromProductDataFolder(productDataDirectoryHandle)).sort((a, b) => partKey(a).localeCompare(partKey(b)));
  customProjects = await loadProjectsFromProductDataFolder(productDataDirectoryHandle, parts);
  selectedPartNumber = partKey(parts[0]) || null;
  selectedBomPartNumber = selectedPartNumber;
  openedPartNumber = null;
  hasRepoChanges = false;
  localStorage.setItem("peakHasLocalChanges", "false");
  renderProjectOptions();
  statusMessage = `Loaded product data from ${productDataFolderName}`;
  activeNavMode = "home";
  renderApp();
}

function normalizeLegacyPartRecord(part) {
  const revision = { ...part };
  delete revision.name;
  delete revision.description;
  delete revision.category;
  delete revision.project;
  delete revision.traceability;
  delete revision.maturity;
  delete revision.onshape;
  delete revision.documents;
  delete revision.work_instructions;
  delete revision.file_links;
  delete revision.tags;
  delete revision.manufacturers;
  return normalizeRevisionRecord(
    {
      schema: "peak.part.v1",
      part_number: part.part_number,
      name: part.name,
      description: part.description,
      category: part.category,
      project: part.project,
      traceability: part.traceability,
      maturity: part.maturity || part.lifecycle_state,
      onshape: asArray(part.onshape),
      documents: asArray(part.documents),
      work_instructions: asArray(part.work_instructions),
      file_links: asArray(part.file_links),
      tags: asArray(part.tags),
      manufacturers: asArray(part.manufacturers)
    },
    revision
  );
}

function normalizeRevisionRecord(partProperties, revisionProperties) {
  const partNumber = partProperties.part_number || revisionProperties.part_number;
  const revision = revisionProperties.revision || revisionProperties.rev || "V1";
  return {
    ...revisionProperties,
    part_number: partNumber,
    object_id: revisionProperties.object_id || `${partNumber}^${revision}`,
    revision,
    name: partProperties.name || revisionProperties.name,
    description: partProperties.description || revisionProperties.description,
    category: partProperties.category || revisionProperties.category,
    project: partProperties.project || revisionProperties.project,
    traceability: partProperties.traceability || revisionProperties.traceability,
    maturity: partProperties.maturity || revisionProperties.maturity || revisionProperties.lifecycle_state,
    onshape: asArray(partProperties.onshape || revisionProperties.onshape),
    work_instructions: asArray(partProperties.work_instructions || revisionProperties.work_instructions),
    file_links: asArray(partProperties.file_links || revisionProperties.file_links || partProperties.documents),
    documents: asArray(revisionProperties.attachments || revisionProperties.documents),
    attachments: asArray(revisionProperties.attachments || revisionProperties.documents),
    tags: asArray(partProperties.tags || revisionProperties.tags),
    manufacturers: asArray(partProperties.manufacturers || revisionProperties.manufacturers),
    part_properties: partProperties,
    revision_properties: revisionProperties
  };
}

function mergePartRecords(serverParts, localParts) {
  const merged = new Map();
  asArray(serverParts).forEach((part) => merged.set(partKey(part), part));
  asArray(localParts).forEach((part) => merged.set(partKey(part), part));
  return [...merged.values()];
}

function initRoute() {
  const params = new URLSearchParams(window.location.search);
  const partFromUrl = params.get("object") || params.get("part");
  const revFromUrl = params.get("rev");
  const identifier = revFromUrl && partFromUrl && !partFromUrl.includes("^") ? `${partFromUrl}^${revFromUrl}` : partFromUrl;
  const opened = findPartByKey(identifier);
  if (opened) {
    openedPartNumber = partKey(opened);
    selectedBomPartNumber = partKey(opened);
    selectedPartNumber = partKey(opened);
    activeNavMode = "part";
    activePartEditMode = params.get("edit") === "1";
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
  const visibleGroups = groupedPartResults(visibleParts);
  if (activeNavMode === "home" && !visibleGroups.some((group) => group.part_number === findPartByKey(selectedPartNumber)?.part_number)) {
    selectedPartNumber = partKey(visibleGroups[0]?.representative) || null;
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
  objectTable.classList.toggle("searchGalleryTable", activeNavMode === "home");
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
  return `${groupedPartResults(visibleParts).length} of ${groupedPartResults(parts).length} parts`;
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

  document.title = `${partObjectLabel(rootPart)} - PEAK Registry`;
  recordCount.textContent = `Opened ${partObjectLabel(rootPart)}`;
  workspaceHeading.textContent = rootPart.name;
  document.querySelector(".eyebrow").textContent = pageDescription();
  navigatorTitle.textContent = activePartEditMode ? "Edit BOM Structure" : "BOM Structure";
  resultsTitle.textContent = activePartEditMode ? `${partObjectLabel(selectedPart)} Edit` : `${partObjectLabel(selectedPart)} Details`;

  renderBomTree();
  if (activePartEditMode) {
    renderPartEditorRows(selectedPart);
  } else {
    tableHead.innerHTML = "";
    partsList.innerHTML = "";
  }
  renderOpenedPartDetail(rootPart, selectedPart);
}

function matchesSearch(part, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    part.part_number,
    part.object_id,
    part.name,
    part.description,
    part.project,
    part.lifecycle_state,
    part.revision,
    part.owner,
    ...(part.tags ?? []),
    ...(part.attachments ?? []).flatMap((document) => [document.type, document.title]),
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
  return findPartByKey(openedPartNumber);
}

function getSelectedBomPart() {
  return findPartByKey(selectedBomPartNumber || openedPartNumber);
}

function renderObjectRows(visibleParts) {
  tableHead.innerHTML = "";

  if (visibleParts.length === 0) {
    partsList.innerHTML = '<tr class="galleryRow"><td class="emptyCell" colspan="6">No matching parts</td></tr>';
    return;
  }

  const selectedPart = findPartByKey(selectedPartNumber);
  partsList.innerHTML = groupedPartResults(visibleParts)
    .map((group) => {
      const representative = group.representative;
      const active = selectedPart?.part_number === group.part_number ? " active" : "";
      const releasedRevision = latestReleasedRevision(group.revisions);
      return `
        <tr class="objectRow galleryRow${active}" data-part-number="${escapeHtml(partKey(representative))}" tabindex="0">
          <td colspan="6">
            <div class="galleryItem">
              <span class="objectIcon" aria-hidden="true"></span>
              <div class="galleryItemText">
                <strong>${escapeHtml(group.part_number)}</strong>
                <p>${escapeHtml(representative.name)}</p>
              </div>
              <span class="revisionList">${releasedRevision ? `Released Rev ${escapeHtml(releasedRevision.revision)}` : ""}</span>
              <span class="galleryOpenIcon" aria-hidden="true"></span>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function groupedPartResults(records) {
  const groups = new Map();
  records.forEach((part) => {
    if (!groups.has(part.part_number)) {
      groups.set(part.part_number, []);
    }
    groups.get(part.part_number).push(part);
  });
  return [...groups.entries()]
    .map(([partNumber, revisions]) => ({
      part_number: partNumber,
      revisions: [...revisions].sort((a, b) => String(a.revision || "").localeCompare(String(b.revision || ""))),
      representative: representativeRevision(revisions)
    }))
    .sort((a, b) => a.part_number.localeCompare(b.part_number));
}

function representativeRevision(revisions) {
  return [...revisions].sort((a, b) => partKey(b).localeCompare(partKey(a)))[0];
}

function latestReleasedRevision(revisions) {
  return [...revisions]
    .filter((part) => releaseStatusLabel(part) === "Released")
    .sort((a, b) => {
      const dateCompare = String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
      return dateCompare || String(b.revision || "").localeCompare(String(a.revision || ""));
    })[0];
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
  if (activeCreateMode === "new") {
    renderCreateItemRows({ fromSource: false });
    return;
  }
  if (activeCreateMode === "source") {
    renderCreateItemRows({ fromSource: true });
    return;
  }
  if (activeCreateMode === "revision") {
    renderCreateRevisionRows();
    return;
  }
  if (activeCreateMode === "project") {
    renderCreateProjectRows();
    return;
  }
  renderCreateHubRows();
}

function renderCreateHubRows() {
  tableHead.innerHTML = "";
  partsList.innerHTML = `
    <tr class="createHubRow">
      <td colspan="10">
        <div class="createHub" aria-label="Create options">
          <button class="createTile" type="button" data-create-mode="new">
            <strong>Create New Item</strong>
            <span>Start a new draft part at revision A.</span>
          </button>
          <button class="createTile" type="button" data-create-mode="source">
            <strong>Create from Source</strong>
            <span>Create a related draft from an existing part.</span>
          </button>
          <button class="createTile" type="button" data-create-mode="revision">
            <strong>Create Revision</strong>
            <span>Open the next draft revision for an existing part.</span>
          </button>
          <button class="createTile" type="button" data-create-mode="project">
            <strong>Create Project</strong>
            <span>Add project metadata to the product data repository.</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderCreateItemRows({ fromSource }) {
  tableHead.innerHTML = "";
  const projectOptions = projects()
    .map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
    .join("");
  const selectedProject = projectFilter.value || projects()[0] || "Unassigned Project";
  const generatedPartNumber = nextProjectPartNumber(selectedProject);
  const sourceField = fromSource
    ? `
      <div class="createFormField">
        <div class="createFormMeta">
          <label class="createFormLabel" for="newPartBasedOn">Based On</label>
          <span class="createFormHint">Must reference an existing part number</span>
        </div>
        <input class="tableInput createFormInput" id="newPartBasedOn" value="" placeholder="Existing part number">
      </div>
    `
    : "";
  partsList.innerHTML = `
    <tr class="createFormRow">
      <td colspan="10">
        <div class="createForm">
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newPartProject">Project</label>
              <span class="createFormHint">Project must exist in the registry</span>
            </div>
            <select class="tableInput createFormInput" id="newPartProject">${projectOptions}</select>
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newPartNumber">Part Number</label>
              <span class="createFormHint">Auto-filled with next available number; can be overwritten</span>
            </div>
            <input class="tableInput createFormInput" id="newPartNumber" value="${escapeHtml(generatedPartNumber)}">
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newPartName">Name</label>
              <span class="createFormHint">Name of the part</span>
            </div>
            <input class="tableInput createFormInput" id="newPartName" value="">
          </div>
          ${sourceField}
          <div class="createFormActions">
            <button class="iconButton createActionBtn createCancelBtn" type="button" data-create-mode="hub" title="Cancel" aria-label="Cancel"></button>
            <button class="iconButton primaryAction createActionBtn createSaveBtn" type="button" data-submit-create="${fromSource ? "source" : "new"}" title="Create Draft Item" aria-label="Create Draft Item"></button>
          </div>
        </div>
      </td>
    </tr>
  `;
  const projectSelect = document.querySelector("#newPartProject");
  if (projectSelect && projects().includes(selectedProject)) {
    projectSelect.value = selectedProject;
  }
}

function renderCreateRevisionRows() {
  tableHead.innerHTML = "";
  const partOptions = groupedPartResults(parts)
    .map((group) => `<option value="${escapeHtml(group.part_number)}">${escapeHtml(group.part_number)} - ${escapeHtml(group.representative.name)}</option>`)
    .join("");
  const selectedBase = groupedPartResults(parts)[0]?.part_number || "";
  partsList.innerHTML = `
    <tr class="createFormRow">
      <td colspan="10">
        <div class="createForm">
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="revisionSourcePart">Part</label>
              <span class="createFormHint">Must reference an existing part</span>
            </div>
            <select class="tableInput createFormInput" id="revisionSourcePart">${partOptions}</select>
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newRevisionValue">New Revision</label>
              <span class="createFormHint">Created in draft state</span>
            </div>
            <input class="tableInput createFormInput" id="newRevisionValue" value="${escapeHtml(nextRevisionForPart(selectedBase))}" readonly>
          </div>
          <div class="createFormActions">
            <button class="iconButton createActionBtn createCancelBtn" type="button" data-create-mode="hub" title="Cancel" aria-label="Cancel"></button>
            <button class="iconButton primaryAction createActionBtn createSaveBtn" type="button" data-submit-revision title="Create Draft Revision" aria-label="Create Draft Revision"></button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderCreateProjectRows() {
  tableHead.innerHTML = "";
  partsList.innerHTML = `
    <tr class="createFormRow">
      <td colspan="10">
        <div class="createForm">
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newProjectName">Project Name</label>
              <span class="createFormHint">Must be unique across the registry</span>
            </div>
            <input class="tableInput createFormInput" id="newProjectName" value="" placeholder="Project name">
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newProjectKey">Project Code</label>
              <span class="createFormHint">Used as the part-number prefix</span>
            </div>
            <input class="tableInput createFormInput" id="newProjectKey" value="${escapeHtml(nextProjectKey())}">
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newProjectOwner">Owner</label>
              <span class="createFormHint">Default engineering owner email</span>
            </div>
            <input class="tableInput createFormInput" id="newProjectOwner" value="${escapeHtml(localStorage.getItem("peakDefaultOwner") || "engineering@example.com")}">
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newProjectApprovers">Approvers</label>
              <span class="createFormHint">Comma-separated approver names</span>
            </div>
            <input class="tableInput createFormInput" id="newProjectApprovers" value="" placeholder="Name, name">
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newProjectDescription">Description</label>
              <span class="createFormHint">Short project description</span>
            </div>
            <input class="tableInput createFormInput" id="newProjectDescription" value="">
          </div>
          <div class="createFormActions">
            <button class="iconButton createActionBtn createCancelBtn" type="button" data-create-mode="hub" title="Cancel" aria-label="Cancel"></button>
            <button class="iconButton primaryAction createActionBtn createSaveBtn" type="button" data-submit-project title="Create Project" aria-label="Create Project"></button>
          </div>
        </div>
      </td>
    </tr>
  `;
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
  partsList.innerHTML = existing || '<tr><td class="emptyCell" colspan="7">No projects found</td></tr>';
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
  const drive = (part.file_links ?? [])[0]?.url || "";
  const onshape = (part.onshape ?? [])[0]?.url || "";
  partsList.innerHTML = `
    ${partEditorRow("Part Number", "part_number", part.part_number, "Unique object identifier")}
    ${partEditorRow("Name", "name", part.name, "Stable part name")}
    ${partEditorRow("Description", "description", part.description || "", "Stable part description")}
    ${partEditorSelectRow("Project", "project", part.project, projects(), "Project folder assignment")}
    ${partEditorRow("Traceability", "traceability", part.traceability || "", "Stable traceability value")}
    ${partEditorSelectRow("Part Maturity", "maturity", maturityStageValue(part), ["development", "npi", "production", "sunset", "obsolete"], "Stable lifecycle maturity")}
    ${partEditorRow("Revision", "revision", part.revision || "A", "Revision object identifier")}
    ${partEditorSelectRow("Release Status", "lifecycle_state", part.lifecycle_state === "in_review" ? "release_candidate" : part.lifecycle_state, ["draft", "release_candidate", "released", "obsolete"], "Revision release status")}
    ${partEditorRow("Last Edited By", "owner", part.owner, "Last user to update this component")}
    ${partEditorRow("File Link", "driveUrl", drive, "Stable linked drawing/file")}
    ${partEditorRow("Onshape Link", "onshapeUrl", onshape, "Stable linked CAD object")}
    ${partEditorRow("Revision Description", "change_summary", part.change_summary || "", "Revision change summary")}
    <tr>
      <td>Save</td>
      <td><button class="iconButton primaryAction formAction" type="button" data-save-open-part="${escapeHtml(partKey(part))}">Save Part</button></td>
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
    ${syncRow("Import parts CSV", "Ready", "browser upload", "Creates local Draft Rev A items from Part No, Name, Project", "import-csv")}
    ${syncRow("Export migration CSV", "Ready", "browser download", "Downloads one row per revision", "export-csv")}
    ${syncRow("Export PEAK JSON", "Ready", "browser download", "Downloads full working-copy snapshot", "export-json")}
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
  const tabBar = `
    <tr class="settingsTabRow">
      <td colspan="10">
        <div class="settingsTabs">
          <button class="settingsTab${activeSettingsTab === "setup" ? " active" : ""}" type="button" data-settings-tab="setup">Setup</button>
          <button class="settingsTab${activeSettingsTab === "appearance" ? " active" : ""}" type="button" data-settings-tab="appearance">Appearance</button>
          <button class="settingsTab${activeSettingsTab === "preferences" ? " active" : ""}" type="button" data-settings-tab="preferences">Preferences</button>
        </div>
      </td>
    </tr>
  `;
  if (activeSettingsTab === "setup") {
    tableHead.innerHTML = tabBar + `
      <tr>
        <th scope="col">Setting</th>
        <th scope="col">Value</th>
        <th scope="col">Notes</th>
      </tr>
    `;
    partsList.innerHTML = `
      <tr>
        <td>Product Data Folder</td>
        <td>
          <div class="folderPicker">
            <input class="tableInput folderInput" id="settingsProductDataFolder" value="${escapeHtml(productDataFolderName || "No folder selected")}" readonly>
            <button class="iconButton formAction" type="button" data-select-product-folder title="Select product data folder" aria-label="Select product data folder" data-icon="folder"></button>
          </div>
        </td>
        <td>Local Git folder containing manifest.json and parts/</td>
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
  } else if (activeSettingsTab === "appearance") {
    tableHead.innerHTML = tabBar;
    renderAppearanceTabRows();
  } else {
    tableHead.innerHTML = tabBar + `
      <tr>
        <th scope="col">Setting</th>
        <th scope="col">Value</th>
        <th scope="col">Notes</th>
      </tr>
    `;
    partsList.innerHTML = `
      <tr>
        <td>Default Owner</td>
        <td><input class="tableInput" id="settingsDefaultOwner" value="${escapeHtml(localStorage.getItem("peakDefaultOwner") || "engineering@example.com")}"></td>
        <td>Used for newly created parts and projects</td>
      </tr>
      <tr>
        <td colspan="3"><button class="iconButton primaryAction formAction" type="button" data-save-preferences>Save Preferences</button></td>
      </tr>
    `;
  }
}

function renderAppearanceTabRows() {
  const currentHex = currentAccentHex();
  const r = parseInt(currentHex.slice(1, 3), 16);
  const g = parseInt(currentHex.slice(3, 5), 16);
  const b = parseInt(currentHex.slice(5, 7), 16);
  partsList.innerHTML = `
    <tr>
      <td colspan="10" class="appearanceCell">
        <div class="appearanceSection">
          <div class="appearanceGroup">
            <p class="appearanceLabel">Theme</p>
            <div class="themeToggle">
              <button class="themeButton${activeColorScheme === "light" ? " active" : ""}" type="button" data-theme-mode="light">
                <span class="themeIcon sun" aria-hidden="true"></span>
                Light
              </button>
              <button class="themeButton${activeColorScheme === "dark" ? " active" : ""}" type="button" data-theme-mode="dark">
                <span class="themeIcon moon" aria-hidden="true"></span>
                Dark
              </button>
            </div>
          </div>
          <div class="appearanceGroup">
            <p class="appearanceLabel">Accent Color</p>
            <div class="accentSwatches">
              ${accentPresets.map((preset) => `
                <button class="accentSwatch${activeAccentColor === preset.id ? " active" : ""}"
                        type="button"
                        data-accent-color="${escapeHtml(preset.id)}"
                        style="background: ${preset.color};"
                        title="${escapeHtml(preset.name)}"
                        aria-label="${escapeHtml(preset.name)} accent color"></button>
              `).join("")}
            </div>
            <div class="customColorRow">
              <span class="customColorLabel">Custom</span>
              <input type="color"
                     id="accentColorPicker"
                     class="accentColorPicker${activeAccentColor === "custom" ? " active" : ""}"
                     value="${escapeHtml(currentHex)}"
                     title="Custom accent color"
                     aria-label="Custom accent color">
              <div class="rgbInputGroup">
                <div class="rgbFieldWrap">
                  <span class="rgbFieldLabel">R</span>
                  <input type="number" id="accentR" class="rgbField" min="0" max="255" value="${r}" aria-label="Red channel">
                </div>
                <div class="rgbFieldWrap">
                  <span class="rgbFieldLabel">G</span>
                  <input type="number" id="accentG" class="rgbField" min="0" max="255" value="${g}" aria-label="Green channel">
                </div>
                <div class="rgbFieldWrap">
                  <span class="rgbFieldLabel">B</span>
                  <input type="number" id="accentB" class="rgbField" min="0" max="255" value="${b}" aria-label="Blue channel">
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
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
  const part = findPartByKey(selectedPartNumber);
  if (!part) {
    partDetail.innerHTML = "";
    return;
  }

  partDetail.innerHTML = `
    ${propertyTabs()}
    ${renderPropertyBody(part)}
  `;
}

function renderOpenedPartDetail(rootPart, selectedPart) {
  partDetail.innerHTML = `
    ${propertyTabs()}
    ${renderPropertyBody(selectedPart)}
  `;
}

function propertyTabs() {
  return `
    <div class="propertyTabs" aria-label="Property sections">
      <button class="propertyTab${activePropertyTab === "overview" ? " active" : ""}" type="button" data-property-tab="overview">Overview</button>
      <button class="propertyTab${activePropertyTab === "attachments" ? " active" : ""}" type="button" data-property-tab="attachments">Attachments</button>
      <button class="propertyTab${activePropertyTab === "history" ? " active" : ""}" type="button" data-property-tab="history">History</button>
      <button class="propertyTab${activePropertyTab === "workflow" ? " active" : ""}" type="button" data-property-tab="workflow">Workflow</button>
    </div>
  `;
}

function renderPropertyBody(part) {
  if (activePropertyTab === "attachments") {
    return `
      <div class="relationStack">
        ${referenceSection("Attachments", attachmentsForPart(part), fileReference)}
      </div>
    `;
  }

  if (activePropertyTab === "history") {
    return renderHistoryTab(part);
  }

  if (activePropertyTab === "workflow") {
    return renderWorkflowTab(part);
  }

  return renderOverviewTab(part);
}

function renderOverviewTab(part) {
  return `
    <div class="overviewLayout">
      <div class="overviewColumn">
        ${detailSection("Properties", [
          property("Part No", part.part_number),
          property("Revision", part.revision),
          property("Name", part.name),
          property("Description", part.description || "Not set"),
          property("Revision Description", part.change_summary || "Not set"),
          property("Project", part.project || "Unassigned"),
          property("Traceability", traceabilityLabel(part))
        ])}
        ${detailSection("Specifications", [
          propertyLink("Google Drive Link", documentUrl(part, "drive")),
          propertyLink("Onshape Link", documentUrl(part, "onshape")),
          propertyLink("Work Instructions Link", documentUrl(part, "work"))
        ])}
        ${detailSection("Authoring", [
          property("Release Status", releaseStatusLabel(part)),
          property("Created By", createdBy(part)),
          property("Created Date", part.created_at),
          property("Last Updated By", updatedBy(part)),
          property("Updated Date", part.updated_at),
          propertyHtml("Based On", basedOnLink(part))
        ])}
      </div>
      <div class="overviewColumn">
        ${renderMaturityProgress(part)}
        ${renderRevisionHistory(part)}
      </div>
    </div>
  `;
}

function renderHistoryTab(part) {
  return `
    ${renderRevisionHistory(part)}
    <section class="propertySection">
      <h3>Activity</h3>
      <div class="referenceList">
        ${historyReference(part.created_at || "Unknown", "Created", `Created by ${createdBy(part)}`)}
        ${historyReference(part.updated_at || "Unknown", "Updated", part.change_summary || "Record metadata updated")}
      </div>
    </section>
  `;
}

function renderWorkflowTab(part) {
  return `
    <section class="propertySection">
      <h3>Workflow</h3>
      <dl class="propertyGrid">
        ${property("Release Status", releaseStatusLabel(part))}
        ${property("Lifecycle", maturityStageLabel(part))}
        ${property("Approvers", (part.approvers ?? []).length)}
        ${property("Owner", updatedBy(part))}
      </dl>
    </section>
    ${referenceSection("Approvers", part.approvers ?? [], approverReference)}
  `;
}

function detailSection(title, rows) {
  return `
    <section class="propertySection">
      <h3>${escapeHtml(title)}</h3>
      <dl class="propertyGrid">
        ${rows.join("")}
      </dl>
    </section>
  `;
}

function property(label, value) {
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${escapeHtml(value || "Not set")}</dd>
  `;
}

function propertyLink(label, url) {
  const value = url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>` : "Not set";
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${value}</dd>
  `;
}

function propertyHtml(label, value) {
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${value || "Not set"}</dd>
  `;
}

function traceabilityLabel(part) {
  const parentCount = whereUsed(part).length;
  const childCount = (part.bom ?? []).length;
  if (!parentCount && !childCount) {
    return "Standalone";
  }
  return `${parentCount} parent${parentCount === 1 ? "" : "s"} / ${childCount} child${childCount === 1 ? "" : "ren"}`;
}

function documentUrl(part, kind) {
  if (kind === "onshape") {
    return (part.onshape ?? [])[0]?.url || "";
  }
  const documents = [...(part.file_links ?? []), ...(part.documents ?? []), ...(part.attachments ?? [])];
  const match = documents.find((document) => {
    const haystack = [document.type, document.title, document.name].filter(Boolean).join(" ").toLowerCase();
    if (kind === "drive") {
      return haystack.includes("drive") || String(document.url || "").includes("drive.google.com");
    }
    return haystack.includes("work") || haystack.includes("instruction");
  });
  return match?.url || (kind === "drive" ? documents[0]?.url || "" : "");
}

function attachmentsForPart(part) {
  return [...(part.attachments ?? []), ...(part.documents ?? [])];
}

function createdBy(part) {
  return part.created_by || part.author || part.owner || "Not set";
}

function updatedBy(part) {
  return part.updated_by || part.last_updated_by || part.owner || "Not set";
}

function releaseStatusLabel(part) {
  const state = part.release_status || part.lifecycle_state;
  const labels = {
    draft: "Draft",
    development: "Draft",
    in_review: "Release Candidate",
    release_candidate: "Release Candidate",
    released: "Released",
    production: "Released",
    obsolete: "Obsolete"
  };
  return labels[state] || stateLabel(state);
}

function maturityStageLabel(part) {
  const maturity = String(part.maturity || "").toLowerCase();
  if (maturity === "npi") {
    return "NPI";
  }
  if (maturity === "production") {
    return "Production";
  }
  if (maturity === "sunset") {
    return "Sunset";
  }
  if (maturity === "obsolete") {
    return "Obsolete";
  }
  if (maturity === "development") {
    return "Development";
  }
  const state = String(part.lifecycle_state || "").toLowerCase();
  if (state === "in_review" || state === "release_candidate" || state === "npi") {
    return "NPI";
  }
  if (state === "released" || state === "production") {
    return "Production";
  }
  if (state === "sunset") {
    return "Sunset";
  }
  if (state === "obsolete") {
    return "Obsolete";
  }
  return "Development";
}

function maturityStageValue(part) {
  return maturityStageLabel(part).toLowerCase();
}

function setFirstLinkedRecord(records, fallback, url, title, extra = {}) {
  if (!url) {
    return records || [];
  }
  const next = [...asArray(records)];
  next[0] = {
    ...fallback,
    ...extra,
    title,
    url
  };
  return next;
}

function basedOnLink(part) {
  const basedOn = part.based_on || part.based_on_part_number || part.copied_from || "";
  if (!basedOn) {
    return "Not set";
  }
  return `<button class="linkButton inlineLink" type="button" data-part-number="${escapeHtml(basedOn)}">${escapeHtml(basedOn)}</button>`;
}

function renderMaturityProgress(part) {
  const stages = ["Development", "NPI", "Production", "Sunset", "Obsolete"];
  const activeStage = maturityStageLabel(part);
  const activeIndex = Math.max(0, stages.indexOf(activeStage));

  const items = stages.flatMap((stage, index) => {
    const isComplete = index <= activeIndex;
    const isActive = index === activeIndex;
    const cls = `timelineStep${isComplete ? " complete" : ""}${isActive ? " active" : ""}`;
    const step = `
      <div class="${cls}">
        <div class="timelineStepMarker"><span class="timelineStepDot"></span></div>
        <p class="timelineStepLabel">${escapeHtml(stage)}</p>
      </div>`;
    const connector = index < stages.length - 1
      ? `<div class="timelineConnector${index < activeIndex ? " complete" : ""}"></div>`
      : "";
    return [step, connector];
  });

  return `
    <section class="propertySection">
      <h3>Part Maturity</h3>
      <div class="maturityTimeline" role="progressbar" aria-label="Maturity: ${escapeHtml(activeStage)}" aria-valuenow="${activeIndex}" aria-valuemin="0" aria-valuemax="${stages.length - 1}">
        ${items.join("")}
        <div class="timelineArrow" aria-hidden="true"></div>
      </div>
    </section>
  `;
}

function renderRevisionHistory(part) {
  return `
    <section class="propertySection">
      <h3>Revision History</h3>
      <div class="detailTableWrap">
        <table class="detailTable">
          <thead>
            <tr>
              <th scope="col">Object</th>
              <th scope="col">Release Status</th>
              <th scope="col">Last Updated By</th>
              <th scope="col">Last Updated Date</th>
              <th scope="col">Created By</th>
              <th scope="col">Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${revisionRows(part).map(revisionRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function revisionRows(part) {
  const siblingRevisions = parts.filter((candidate) => candidate.part_number === part.part_number);
  if (siblingRevisions.length > 1 || siblingRevisions[0] === part) {
    return siblingRevisions.map((revisionPart) => ({
      partNumber: revisionPart.part_number,
      objectId: partKey(revisionPart),
      revision: revisionPart.revision,
      status: revisionPart.release_status || revisionPart.lifecycle_state,
      updatedBy: updatedBy(revisionPart),
      updatedAt: revisionPart.updated_at,
      createdBy: createdBy(revisionPart),
      createdAt: revisionPart.created_at
    }));
  }
  const revisions = part.revision_history || part.revisions || [];
  if (Array.isArray(revisions) && revisions.length) {
    return revisions.map((revision) => ({
      partNumber: revision.part_number || part.part_number,
      objectId: revision.object_id || `${revision.part_number || part.part_number}^${revision.revision || revision.rev || part.revision}`,
      revision: revision.revision || revision.rev || part.revision,
      status: revision.release_status || revision.lifecycle_state || part.release_status || part.lifecycle_state,
      updatedBy: revision.updated_by || revision.last_updated_by || updatedBy(part),
      updatedAt: revision.updated_at || revision.updated_date || part.updated_at,
      createdBy: revision.created_by || createdBy(part),
      createdAt: revision.created_at || revision.created_date || part.created_at
    }));
  }
  return [
    {
      partNumber: part.part_number,
      objectId: partKey(part),
      revision: part.revision,
      status: part.release_status || part.lifecycle_state,
      updatedBy: updatedBy(part),
      updatedAt: part.updated_at,
      createdBy: createdBy(part),
      createdAt: part.created_at
    }
  ];
}

function revisionRow(revision) {
  const objectLabel = `${revision.partNumber || "Part"}^${revision.revision || "V1"}`;
  return `
    <tr>
      <td><button class="linkButton" type="button" data-part-number="${escapeHtml(revision.objectId || objectLabel)}">${escapeHtml(objectLabel)}</button></td>
      <td>${escapeHtml(releaseStatusLabel({ lifecycle_state: revision.status, release_status: revision.status }))}</td>
      <td>${escapeHtml(revision.updatedBy || "Not set")}</td>
      <td>${escapeHtml(revision.updatedAt || "Not set")}</td>
      <td>${escapeHtml(revision.createdBy || "Not set")}</td>
      <td>${escapeHtml(revision.createdAt || "Not set")}</td>
    </tr>
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
  const child = resolveBomChild(item);
  const childId = child ? partKey(child) : item.child_object_id || item.child_part_number;
  const childLabel = item.child_revision ? `${item.child_part_number}^${item.child_revision}` : item.child_part_number;
  return `
    <article class="reference">
      <strong><button class="linkButton" type="button" data-part-number="${escapeHtml(childId)}">${escapeHtml(childLabel)}</button></strong>
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
    (candidate.bom ?? []).some((item) => {
      const child = resolveBomChild(item);
      return child ? partKey(child) === partKey(part) : item.child_part_number === part.part_number;
    })
  );
}

function resolveBomChild(item) {
  if (!item) {
    return undefined;
  }
  if (item.child_object_id) {
    return findPartByKey(item.child_object_id);
  }
  if (item.child_revision) {
    return findPartByKey(`${item.child_part_number}^${item.child_revision}`);
  }
  return latestRevisionForPart(item.child_part_number) || findPartByKey(item.child_part_number);
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
  const selectedPart = findPartByKey(selectedPartNumber);

  if (activeNavMode === "create") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Create</p>
        <button class="treeNode${activeCreateMode === "hub" ? " active" : ""}" type="button" data-create-mode="hub">Create Options</button>
        <button class="treeNode${activeCreateMode === "new" ? " active" : ""}" type="button" data-create-mode="new">Create New Item</button>
        <button class="treeNode${activeCreateMode === "source" ? " active" : ""}" type="button" data-create-mode="source">Create from Source</button>
        <button class="treeNode${activeCreateMode === "revision" ? " active" : ""}" type="button" data-create-mode="revision">Create Revision</button>
        <button class="treeNode${activeCreateMode === "project" ? " active" : ""}" type="button" data-create-mode="project">Create Project</button>
      </div>
    `;
    return;
  }

  if (activeNavMode === "projects") {
    navigationTree.innerHTML = `
      <div class="treeGroup">
        <p>Projects</p>
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
      ${selectedPart ? `<button class="treeNode" type="button" data-clear-filters="true">Selected: ${escapeHtml(partObjectLabel(selectedPart))}</button>` : ""}
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

  const childRows = renderBomChildren(rootPart, 1, new Set([partKey(rootPart)]));
  const partOptions = parts
    .filter((part) => partKey(part) !== partKey(rootPart))
    .map((part) => `<option value="${escapeHtml(partKey(part))}">${escapeHtml(partObjectLabel(part))} - ${escapeHtml(part.name)}</option>`)
    .join("");
  navigationTree.innerHTML = `
    <div class="bomGrid" role="treegrid" aria-label="BOM Structure">
      <div class="bomHeader" role="row">
        <span>Item<span class="bomResizeHandle" data-bom-resize-column="0" role="separator" aria-label="Resize item column"></span></span>
        <span>Name<span class="bomResizeHandle" data-bom-resize-column="1" role="separator" aria-label="Resize name column"></span></span>
        <span>Qty<span class="bomResizeHandle" data-bom-resize-column="2" role="separator" aria-label="Resize quantity column"></span></span>
      </div>
      <button class="treeNode bomNode root${selectedBomPartNumber === partKey(rootPart) ? " active" : ""}" type="button" data-bom-part-number="${escapeHtml(partKey(rootPart))}" role="row">
        <span class="bomItem">${escapeHtml(partObjectLabel(rootPart))}</span>
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
      const child = resolveBomChild(item);
      const childId = child ? partKey(child) : item.child_object_id || item.child_part_number;
      const active = selectedBomPartNumber === childId ? " active" : "";
      const children =
        child && !visited.has(partKey(child))
          ? renderBomChildren(child, depth + 1, new Set([...visited, partKey(child)]))
          : "";

      const row = activePartEditMode
        ? `
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" data-bom-part-number="${escapeHtml(childId)}" role="row">
            <button class="bomItem linkButton" type="button" data-bom-part-number="${escapeHtml(childId)}">${escapeHtml(child ? partObjectLabel(child) : item.child_part_number)}</button>
            <input class="tableInput bomQtyInput" value="${escapeHtml(item.quantity)}" data-bom-qty="${escapeHtml(childId)}">
            <button class="iconButton" type="button" data-remove-bom="${escapeHtml(childId)}">Remove</button>
          </div>
        `
        : `
          <button class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" type="button" data-bom-part-number="${escapeHtml(childId)}" role="row">
            <span class="bomItem">${escapeHtml(child ? partObjectLabel(child) : item.child_part_number)}</span>
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
  return projectKeyFromName(project);
}

function projectKeyFromName(project) {
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
  url.searchParams.delete("object");
  url.searchParams.delete("rev");
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
  const part = findPartByKey(partNumber);
  if (!part) {
    return;
  }
  const objectId = partKey(part);
  selectedPartNumber = objectId;
  openedPartNumber = objectId;
  selectedBomPartNumber = objectId;
  activePartEditMode = editMode;
  activeNavMode = "part";
  window.history.replaceState({}, "", partUrl(objectId, { editMode }));
  renderApp();
}

function partUrl(identifier, { editMode = false } = {}) {
  const url = new URL(window.location.href);
  const part = findPartByKey(identifier);
  const objectId = part ? partKey(part) : identifier;
  url.searchParams.delete("part");
  url.searchParams.delete("rev");
  url.searchParams.set("object", objectId);
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
  workspace.classList.toggle("partReadOnlyWorkspace", isOpened && !activePartEditMode);
  workspace.classList.toggle("singlePaneWorkspace", isSinglePane);
  workspace.classList.toggle("reportWorkspace", isReportPane);

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

partsList.addEventListener("input", (event) => {
  if (event.target.matches("#accentColorPicker")) {
    applyCustomAccentLive(event.target.value);
    return;
  }
  if (event.target.matches(".rgbField")) {
    const rVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentR")?.value || "0") || 0));
    const gVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentG")?.value || "0") || 0));
    const bVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentB")?.value || "0") || 0));
    const hex = "#" + [rVal, gVal, bVal].map((v) => v.toString(16).padStart(2, "0")).join("");
    applyCustomAccentLive(hex);
    const picker = document.querySelector("#accentColorPicker");
    if (picker) picker.value = hex;
    return;
  }
});

partsList.addEventListener("change", (event) => {
  if (event.target.closest("#newPartProject")) {
    generatePartNumberIntoForm();
    return;
  }
  if (event.target.closest("#revisionSourcePart")) {
    const revisionInput = document.querySelector("#newRevisionValue");
    if (revisionInput) {
      revisionInput.value = nextRevisionForPart(event.target.value);
    }
    return;
  }
  if (event.target.matches("#accentColorPicker")) {
    activeAccentColor = "custom";
    activeAccentCustomHex = event.target.value;
    applyAppearance(activeColorScheme, "custom");
    localStorage.setItem("peakAccentColor", "custom");
    localStorage.setItem("peakAccentCustomHex", activeAccentCustomHex);
    renderApp();
    return;
  }
  if (event.target.matches(".rgbField")) {
    const rVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentR")?.value || "0") || 0));
    const gVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentG")?.value || "0") || 0));
    const bVal = Math.max(0, Math.min(255, parseInt(document.querySelector("#accentB")?.value || "0") || 0));
    const hex = "#" + [rVal, gVal, bVal].map((v) => v.toString(16).padStart(2, "0")).join("");
    activeAccentColor = "custom";
    activeAccentCustomHex = hex;
    applyAppearance(activeColorScheme, "custom");
    localStorage.setItem("peakAccentColor", "custom");
    localStorage.setItem("peakAccentCustomHex", hex);
    renderApp();
    return;
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
  const button = event.target.closest("[data-add-bom], [data-remove-bom], [data-focus-project], [data-focus-create], [data-focus-settings], [data-generate-part-number], [data-create-mode], [data-sync-action], [data-action], [data-bom-part-number], [data-filter-state], [data-filter-project], [data-clear-filters]");
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
    document.querySelector("#settingsProductDataFolder")?.focus();
    return;
  }

  if (button.dataset.generatePartNumber !== undefined) {
    generatePartNumberIntoForm();
    return;
  }

  if (button.dataset.createMode) {
    activeCreateMode = button.dataset.createMode;
    renderApp();
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
csvImportFile?.addEventListener("change", () => importPartsCsvFile(csvImportFile.files?.[0]));

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    activeNavMode = button.dataset.navMode;
    if (activeNavMode === "create") {
      activeCreateMode = "hub";
    }
    applyNavMode(activeNavMode);
    renderApp();
  });
});

partsList.addEventListener("click", (event) => {
  const createModeButton = event.target.closest("[data-create-mode]");
  if (createModeButton) {
    activeCreateMode = createModeButton.dataset.createMode;
    renderApp();
    return;
  }

  const createButton = event.target.closest("[data-submit-create]");
  if (createButton) {
    createPartFromForm();
    return;
  }

  const revisionButton = event.target.closest("[data-submit-revision]");
  if (revisionButton) {
    createRevisionFromForm();
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

  const importCsvButton = event.target.closest("[data-import-csv]");
  if (importCsvButton) {
    importCsvFromPicker();
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

  const selectProductFolderButton = event.target.closest("[data-select-product-folder]");
  if (selectProductFolderButton) {
    selectProductDataFolder();
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

  const savePreferencesButton = event.target.closest("[data-save-preferences]");
  if (savePreferencesButton) {
    savePreferencesFromForm();
    return;
  }

  const themeModeButton = event.target.closest("[data-theme-mode]");
  if (themeModeButton) {
    activeColorScheme = themeModeButton.dataset.themeMode;
    applyAppearance(activeColorScheme, activeAccentColor);
    localStorage.setItem("peakColorScheme", activeColorScheme);
    renderApp();
    return;
  }

  const accentColorButton = event.target.closest("[data-accent-color]");
  if (accentColorButton) {
    activeAccentColor = accentColorButton.dataset.accentColor;
    applyAppearance(activeColorScheme, activeAccentColor);
    localStorage.setItem("peakAccentColor", activeAccentColor);
    renderApp();
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
      const startResultsWidth = document.querySelector(".resultsPane")?.getBoundingClientRect().width || 240;
      const handleWidth = 12;

      function onMove(moveEvent) {
        const delta = moveEvent.clientX - startX;
        const workspaceWidth = workspace.getBoundingClientRect().width;
        if (pane === "navigator") {
          const maxNavWidth = Math.max(0, workspaceWidth - startResultsWidth - handleWidth);
          workspace.style.setProperty("--nav-width", `${clamp(startNavWidth + delta, 0, maxNavWidth)}px`);
        } else {
          const navWidth = document.querySelector(".navigatorPane")?.getBoundingClientRect().width || startNavWidth;
          const maxResultsWidth = Math.max(0, workspaceWidth - navWidth - handleWidth);
          workspace.style.setProperty("--results-width", `${clamp(startResultsWidth + delta, 0, maxResultsWidth)}px`);
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
    table?.style.removeProperty("width");
    table?.style.removeProperty("min-width");
    table?.querySelector("colgroup")?.remove();
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
  const createMode = document.querySelector("[data-submit-create]")?.dataset.submitCreate || activeCreateMode;
  const values = {
    partNumber: document.querySelector("#newPartNumber")?.value.trim(),
    name: document.querySelector("#newPartName")?.value.trim(),
    project: document.querySelector("#newPartProject")?.value.trim(),
    revision: document.querySelector("#newPartRevision")?.value.trim() || "A",
    state: "draft",
    owner: localStorage.getItem("peakDefaultOwner") || "engineering@example.com",
    description: "",
    driveUrl: "",
    onshapeUrl: "",
    basedOn: document.querySelector("#newPartBasedOn")?.value.trim()
  };
  const validationError = validateDraftCreate(values, { fromSource: createMode === "source" });
  if (validationError) {
    statusMessage = validationError;
    renderApp();
    return;
  }
  const preflight = draftRemotePreflight();
  const created = createPartRecord(values, { render: false });
  if (created) {
    const createdPart = findPartByKey(`${values.partNumber}^${values.revision}`);
    if (createdPart && values.basedOn) {
      const source = findPartByKey(values.basedOn);
      createdPart.based_on = partKey(source);
      createdPart.revision_properties = {
        ...(createdPart.revision_properties || {}),
        based_on: partKey(source)
      };
      persistLocalChanges();
    }
    activeCreateMode = "hub";
    statusMessage = `${preflight} Created draft ${values.partNumber}^${values.revision}; remote draft push requires the local Git bridge.`;
    renderProjectOptions();
    renderApp();
  }
}

function generatePartNumberIntoForm() {
  const project = document.querySelector("#newPartProject")?.value || projects()[0] || "Unassigned Project";
  const input = document.querySelector("#newPartNumber");
  if (input) {
    input.value = nextProjectPartNumber(project);
  }
}

function validateDraftCreate(values, { fromSource }) {
  if (!projects().includes(values.project)) {
    return "Project must exist before creating a part";
  }
  if (!values.partNumber) {
    return "Part number is required";
  }
  if (parts.some((part) => part.part_number === values.partNumber)) {
    return `${values.partNumber} is already in use`;
  }
  if (!values.name) {
    return "Part name is required";
  }
  if (fromSource && !findPartByKey(values.basedOn)) {
    return "Based On must reference an existing part";
  }
  return "";
}

function draftRemotePreflight() {
  return "Remote preflight queued: compare local repo to remote, pull if needed, then push draft directly.";
}

function createRevisionFromForm() {
  const partNumber = document.querySelector("#revisionSourcePart")?.value;
  const source = latestRevisionForPart(partNumber);
  const revision = nextRevisionForPart(partNumber);
  if (!source) {
    statusMessage = "Select an existing part before creating a revision";
    renderApp();
    return;
  }
  if (!revision || parts.some((part) => part.part_number === partNumber && part.revision === revision)) {
    statusMessage = "Next revision is not available";
    renderApp();
    return;
  }
  const preflight = draftRemotePreflight();
  const created = createRevisionRecord(source, revision);
  if (created) {
    activeCreateMode = "hub";
    statusMessage = `${preflight} Created draft ${partNumber}^${revision}; remote draft push requires the local Git bridge.`;
    renderApp();
  }
}

function createProjectFromForm() {
  const name = document.querySelector("#newProjectName")?.value.trim();
  const key = document.querySelector("#newProjectKey")?.value.trim();
  const owner = document.querySelector("#newProjectOwner")?.value.trim();
  const description = document.querySelector("#newProjectDescription")?.value.trim();
  const approvers = (document.querySelector("#newProjectApprovers")?.value || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const missing = [
    ["Project name", name],
    ["Project code", key],
    ["Owner", owner],
    ["Approvers", approvers.length ? "set" : ""],
    ["Description", description]
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label);
  if (missing.length) {
    statusMessage = `Required project fields missing: ${missing.join(", ")}`;
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
  activeCreateMode = "hub";
  statusMessage = `Created project ${name}`;
  renderApp();
}

function savePartFromRow(originalPartNumber) {
  const part = findPartByKey(originalPartNumber);
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
  part.object_id = `${part.part_number}^${part.revision || "V1"}`;
  selectedPartNumber = partKey(part);
  parts.sort((a, b) => partKey(a).localeCompare(partKey(b)));
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
  const part = findPartByKey(originalPartNumber);
  if (!part) {
    return;
  }
  const fields = document.querySelectorAll("[data-open-part-field]");
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.openPartField, field.value.trim()]));
  if (!values.part_number || !values.name || !values.project || !values.revision) {
    statusMessage = "Part number, name, project, and revision are required";
    renderApp();
    return;
  }
  const siblingParts = parts.filter((candidate) => candidate.part_number === part.part_number);
  if (values.part_number !== part.part_number && parts.some((candidate) => candidate.part_number === values.part_number)) {
    statusMessage = `${values.part_number} already exists`;
    renderApp();
    return;
  }
  const oldPartNumber = part.part_number;
  const stableFileLinks = setFirstLinkedRecord(part.file_links, { type: "linked_file", google_drive_file_id: driveIdFromUrl(values.driveUrl) }, values.driveUrl, `${values.name} File`, {
    google_drive_file_id: driveIdFromUrl(values.driveUrl)
  });
  const stableOnshape = setFirstLinkedRecord(part.onshape, { type: "linked_object", document_id: onshapeDocumentIdFromUrl(values.onshapeUrl), workspace_id: "linked-workspace", element_id: "linked-element" }, values.onshapeUrl, `${values.name} Onshape`, {
    document_id: onshapeDocumentIdFromUrl(values.onshapeUrl),
    workspace_id: "linked-workspace",
    element_id: "linked-element"
  });
  siblingParts.forEach((sibling) => {
    sibling.part_number = values.part_number;
    sibling.name = values.name;
    sibling.project = values.project;
    sibling.description = values.description || "";
    sibling.traceability = values.traceability || "";
    sibling.maturity = values.maturity || sibling.maturity || "development";
    sibling.file_links = stableFileLinks;
    sibling.onshape = stableOnshape;
    sibling.part_properties = {
      ...(sibling.part_properties || {}),
      schema: "peak.part.v2",
      part_number: values.part_number,
      name: sibling.name,
      description: sibling.description,
      category: sibling.category || "general",
      project: sibling.project,
      traceability: sibling.traceability,
      maturity: sibling.maturity,
      onshape: sibling.onshape,
      work_instructions: sibling.work_instructions || [],
      file_links: sibling.file_links,
      tags: sibling.tags || [],
      manufacturers: sibling.manufacturers || [],
      revisions: siblingParts.map((revisionPart) => `${values.part_number}^${revisionPart === part ? values.revision : revisionPart.revision || "A"}.json`)
    };
  });
  part.lifecycle_state = values.lifecycle_state;
  part.release_status = values.lifecycle_state;
  part.revision = values.revision || part.revision;
  part.owner = values.owner || localStorage.getItem("peakDefaultOwner") || "engineering@example.com";
  part.change_summary = values.change_summary || "";
  part.updated_at = new Date().toISOString().slice(0, 10);
  part.revision_properties = {
    ...(part.revision_properties || {}),
    schema: "peak.revision.v1",
    object_id: `${values.part_number}^${part.revision || "A"}`,
    part_number: values.part_number,
    revision: part.revision || "A",
    release_status: part.release_status,
    lifecycle_state: part.lifecycle_state,
    owner: part.owner,
    created_by: part.created_by || part.owner,
    created_at: part.created_at,
    updated_by: part.owner,
    updated_at: part.updated_at,
    based_on: part.based_on || null,
    approvers: part.approvers || [],
    bom: part.bom || [],
    attachments: part.attachments || [],
    change_summary: part.change_summary
  };
  parts.forEach((candidate) => {
    (candidate.bom ?? []).forEach((item) => {
      if (item.child_part_number === oldPartNumber) {
        item.child_part_number = part.part_number;
        if (item.child_object_id) {
          item.child_object_id = `${part.part_number}^${item.child_revision || part.revision || "A"}`;
        }
      }
    });
  });
  siblingParts.forEach((sibling) => {
    sibling.object_id = `${sibling.part_number}^${sibling.revision || "A"}`;
  });
  selectedPartNumber = partKey(part);
  selectedBomPartNumber = partKey(part);
  openedPartNumber = partKey(part);
  persistLocalChanges();
  statusMessage = `Saved ${partObjectLabel(part)}`;
  window.history.replaceState({}, "", partUrl(partKey(part), { editMode: activePartEditMode }));
  renderProjectOptions();
  renderApp();
}

function addBomFromForm() {
  const rootPart = getOpenedPart();
  const childObjectId = document.querySelector("#newBomPart")?.value;
  const childPart = findPartByKey(childObjectId);
  const quantity = Number(document.querySelector("#newBomQty")?.value || 1);
  if (!rootPart || !childPart) {
    return;
  }
  rootPart.bom = rootPart.bom || [];
  if (rootPart.bom.some((item) => (resolveBomChild(item) ? partKey(resolveBomChild(item)) === partKey(childPart) : item.child_object_id === partKey(childPart)))) {
    statusMessage = `${partObjectLabel(childPart)} is already in the BOM`;
    renderApp();
    return;
  }
  rootPart.bom.push({
    child_object_id: partKey(childPart),
    child_part_number: childPart.part_number,
    child_revision: childPart.revision,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit: "each"
  });
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Added ${partObjectLabel(childPart)} to ${partObjectLabel(rootPart)}`;
  renderApp();
}

function removeBomItem(childIdentifier) {
  const rootPart = getOpenedPart();
  if (!rootPart) {
    return;
  }
  rootPart.bom = (rootPart.bom || []).filter((item) => {
    const child = resolveBomChild(item);
    return (child ? partKey(child) : item.child_object_id || item.child_part_number) !== childIdentifier;
  });
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Removed ${childIdentifier}`;
  renderApp();
}

function updateBomQuantity(childIdentifier, rawQuantity) {
  const rootPart = getOpenedPart();
  const item = rootPart?.bom?.find((candidate) => {
    const child = resolveBomChild(candidate);
    return (child ? partKey(child) : candidate.child_object_id || candidate.child_part_number) === childIdentifier;
  });
  const quantity = Number(rawQuantity);
  if (!item || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }
  item.quantity = quantity;
  rootPart.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Updated ${childIdentifier} quantity`;
  renderApp();
}

function showSyncAction(action) {
  if (action === "pull") {
    statusMessage = "Pull requires a local Git bridge: git pull origin master";
  } else if (action === "import-csv") {
    importCsvFromPicker();
    return;
  } else if (action === "export-csv") {
    exportPartsCsv();
    return;
  } else if (action === "export-json") {
    exportPartsJson();
    return;
  } else {
    statusMessage = "Push requires a local Git bridge to create a branch, commit, push, open an MR, and assign approvers.";
  }
  renderApp();
}

function saveSettingsFromForm() {
  statusMessage = productDataDirectoryHandle ? `Using product data folder ${productDataFolderName}` : "Select a product data folder to load PEAK data";
  renderApp();
}

function savePreferencesFromForm() {
  const defaultOwner = document.querySelector("#settingsDefaultOwner")?.value.trim() || "engineering@example.com";
  localStorage.setItem("peakDefaultOwner", defaultOwner);
  statusMessage = "Preferences saved";
  renderApp();
}

function createPartRecord(values, options = {}) {
  const shouldRender = options.render !== false;
  if (!values.partNumber || !values.name || !values.project || !values.revision || !values.state || !values.owner) {
    statusMessage = "Missing required create fields";
    if (shouldRender) {
      renderApp();
    }
    return false;
  }
  if (parts.some((part) => part.part_number === values.partNumber)) {
    statusMessage = `${values.partNumber} already exists`;
    if (shouldRender) {
      renderApp();
    }
    return false;
  }
  const today = new Date().toISOString().slice(0, 10);
  const fileLinks = values.driveUrl
    ? [
        {
          type: "linked_file",
          title: `${values.name} File`,
          google_drive_file_id: driveIdFromUrl(values.driveUrl),
          url: values.driveUrl
        }
      ]
    : [];
  const onshapeLinks = values.onshapeUrl
    ? [
        {
          type: "linked_object",
          title: `${values.name} Onshape`,
          document_id: onshapeDocumentIdFromUrl(values.onshapeUrl),
          workspace_id: "linked-workspace",
          element_id: "linked-element",
          url: values.onshapeUrl
        }
      ]
    : [];
  const partProperties = {
    schema: "peak.part.v2",
    part_number: values.partNumber,
    name: values.name,
    description: values.description || "New part created in the PEAK registry UI.",
    category: "general",
    project: values.project,
    traceability: "Not set",
    maturity: "development",
    onshape: onshapeLinks,
    work_instructions: [],
    file_links: fileLinks,
    tags: [],
    manufacturers: [],
    revisions: [`${values.partNumber}^${values.revision}.json`]
  };
  const revisionProperties = {
    schema: "peak.revision.v1",
    object_id: `${values.partNumber}^${values.revision}`,
    part_number: values.partNumber,
    revision: values.revision,
    release_status: values.state,
    lifecycle_state: values.state,
    owner: values.owner,
    created_by: values.owner,
    created_at: today,
    updated_by: values.owner,
    updated_at: today,
    based_on: null,
    approvers: [],
    bom: [],
    attachments: [],
    change_summary: "Created from registry UI."
  };
  const part = {
    ...partProperties,
    ...revisionProperties,
    part_number: values.partNumber,
    object_id: `${values.partNumber}^${values.revision}`,
    name: values.name,
    description: values.description || "New part created in the PEAK registry UI.",
    category: "general",
    project: values.project,
    lifecycle_state: values.state,
    revision: values.revision,
    owner: values.owner,
    tags: [],
    onshape: onshapeLinks,
    file_links: fileLinks,
    documents: [],
    attachments: [],
    manufacturers: [],
    approvers: [],
    bom: [],
    change_summary: "Created from registry UI.",
    created_at: today,
    updated_at: today,
    created_by: values.owner,
    updated_by: values.owner,
    release_status: values.state,
    maturity: "development",
    traceability: "Not set",
    part_properties: partProperties,
    revision_properties: revisionProperties
  };
  parts.push(part);
  parts.sort((a, b) => partKey(a).localeCompare(partKey(b)));
  selectedPartNumber = partKey(part);
  persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Created ${part.part_number}`;
  if (shouldRender) {
    renderApp();
  }
  return true;
}

function createRevisionRecord(source, revision) {
  if (!source || !revision) {
    return false;
  }
  const today = new Date().toISOString().slice(0, 10);
  const owner = localStorage.getItem("peakDefaultOwner") || source.owner || "engineering@example.com";
  const revisionProperties = {
    schema: "peak.revision.v1",
    object_id: `${source.part_number}^${revision}`,
    part_number: source.part_number,
    revision,
    release_status: "draft",
    lifecycle_state: "draft",
    owner,
    created_by: owner,
    created_at: today,
    updated_by: owner,
    updated_at: today,
    based_on: partKey(source),
    approvers: [],
    bom: structuredCloneSafe(source.bom || []),
    attachments: [],
    change_summary: `Draft revision ${revision} created from ${partObjectLabel(source)}.`
  };
  const partProperties = {
    ...(source.part_properties || {}),
    schema: "peak.part.v2",
    part_number: source.part_number,
    name: source.name,
    description: source.description || "",
    category: source.category || "general",
    project: source.project,
    traceability: source.traceability || "Not set",
    maturity: source.maturity || "development",
    onshape: source.onshape || [],
    work_instructions: source.work_instructions || [],
    file_links: source.file_links || [],
    tags: source.tags || [],
    manufacturers: source.manufacturers || [],
    revisions: nextRevisionList(source.part_number, revision)
  };
  const part = {
    ...partProperties,
    ...revisionProperties,
    part_number: source.part_number,
    object_id: `${source.part_number}^${revision}`,
    revision,
    name: source.name,
    description: source.description || "",
    category: source.category || "general",
    project: source.project,
    traceability: source.traceability || "Not set",
    maturity: source.maturity || "development",
    lifecycle_state: "draft",
    release_status: "draft",
    owner,
    onshape: source.onshape || [],
    work_instructions: source.work_instructions || [],
    file_links: source.file_links || [],
    tags: source.tags || [],
    manufacturers: source.manufacturers || [],
    approvers: [],
    bom: revisionProperties.bom,
    documents: [],
    attachments: [],
    created_by: owner,
    created_at: today,
    updated_by: owner,
    updated_at: today,
    based_on: partKey(source),
    change_summary: revisionProperties.change_summary,
    part_properties: partProperties,
    revision_properties: revisionProperties
  };
  parts.push(part);
  parts
    .filter((candidate) => candidate.part_number === source.part_number)
    .forEach((candidate) => {
      candidate.part_properties = {
        ...(candidate.part_properties || {}),
        revisions: partProperties.revisions
      };
    });
  parts.sort((a, b) => partKey(a).localeCompare(partKey(b)));
  selectedPartNumber = partKey(part);
  persistLocalChanges();
  return true;
}

function nextRevisionList(partNumber, revision) {
  const existing = parts
    .filter((part) => part.part_number === partNumber)
    .map((part) => `${part.part_number}^${part.revision || "A"}.json`);
  return [...new Set([...existing, `${partNumber}^${revision}.json`])].sort();
}

function structuredCloneSafe(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function nextRevisionForPart(partNumber) {
  const revisions = parts
    .filter((part) => part.part_number === partNumber)
    .map((part) => String(part.revision || "").trim().toUpperCase())
    .filter(Boolean);
  if (!revisions.length) {
    return "A";
  }
  const highest = revisions.sort(compareRevisionLabels).at(-1);
  return incrementRevisionLabel(highest);
}

function compareRevisionLabels(a, b) {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a.localeCompare(b);
}

function incrementRevisionLabel(revision) {
  const chars = String(revision || "A").toUpperCase().split("");
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    if (chars[index] !== "Z") {
      chars[index] = String.fromCharCode(chars[index].charCodeAt(0) + 1);
      return chars.join("");
    }
    chars[index] = "A";
  }
  return `A${chars.join("")}`;
}

function importCsvFromPicker() {
  csvImportFile?.click();
}

async function importPartsCsvFile(file) {
  if (!file) {
    return;
  }
  try {
    const rows = parseCsv(await file.text());
    const result = importPartsCsvRows(rows);
    statusMessage = `Imported ${result.created} parts${result.skipped ? `, skipped ${result.skipped}` : ""}`;
  } catch (error) {
    statusMessage = error.message;
  } finally {
    if (csvImportFile) {
      csvImportFile.value = "";
    }
    renderProjectOptions();
    renderApp();
  }
}

function importPartsCsvRows(rows) {
  if (!rows.length) {
    throw new Error("CSV file is empty");
  }
  const headers = rows[0].map(csvHeaderKey);
  const partNumberIndex = findCsvColumn(headers, ["partno", "partnumber", "number", "partid", "id"]);
  const nameIndex = findCsvColumn(headers, ["name", "partname"]);
  const projectIndex = findCsvColumn(headers, ["project", "projectname"]);
  if (partNumberIndex < 0 || nameIndex < 0 || projectIndex < 0) {
    throw new Error("CSV must include Part No, Name, and Project columns");
  }

  const owner = localStorage.getItem("peakDefaultOwner") || "engineering@example.com";
  let created = 0;
  let skipped = 0;
  rows.slice(1).forEach((row) => {
    const partNumber = row[partNumberIndex]?.trim();
    const name = row[nameIndex]?.trim();
    const project = row[projectIndex]?.trim();
    if (!partNumber && !name && !project) {
      return;
    }
    if (!partNumber || !name || !project || parts.some((part) => part.part_number === partNumber)) {
      skipped += 1;
      return;
    }
    const wasCreated = createPartRecord(
      {
        partNumber,
        name,
        project,
        revision: "A",
        state: "draft",
        owner,
        description: "",
        driveUrl: "",
        onshapeUrl: ""
      },
      { render: false }
    );
    created += wasCreated ? 1 : 0;
    skipped += wasCreated ? 0 : 1;
  });
  parts.sort((a, b) => partKey(a).localeCompare(partKey(b)));
  return { created, skipped };
}

function findCsvColumn(headers, candidates) {
  return headers.findIndex((header) => candidates.includes(header));
}

function csvHeaderKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }
  return rows;
}

function exportPartsCsv() {
  const headers = [
    "Part No",
    "Revision",
    "Name",
    "Project",
    "Description",
    "Release Status",
    "Maturity",
    "Traceability",
    "Created By",
    "Created Date",
    "Last Updated By",
    "Updated Date"
  ];
  const rows = parts.map((part) => [
    part.part_number,
    part.revision || "A",
    part.name,
    part.project,
    part.description || "",
    part.release_status || part.lifecycle_state || "draft",
    part.maturity || "development",
    part.traceability || "",
    part.created_by || part.owner || "",
    part.created_at || "",
    part.updated_by || part.owner || "",
    part.updated_at || ""
  ]);
  downloadTextFile(`peak-parts-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([headers, ...rows]), "text/csv");
  statusMessage = "Exported migration CSV";
  renderApp();
}

function exportPartsJson() {
  downloadTextFile(
    `peak-working-copy-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ schema: "peak.parts.working-copy.v1", exported_at: new Date().toISOString(), parts }, null, 2),
    "application/json"
  );
  statusMessage = "Exported PEAK JSON";
  renderApp();
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function nextPartNumber() {
  const next = parts.length + 1;
  return `PART-${String(next).padStart(4, "0")}`;
}

function linkExternalRecord(kind) {
  const part = findPartByKey(selectedPartNumber);
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

function loadHasLocalChanges() {
  return localStorage.getItem("peakHasLocalChanges") === "true";
}

function persistLocalChanges() {
  localStorage.setItem("peakHasLocalChanges", "true");
  saveProjects();
  hasRepoChanges = true;
  persistProductDataFolderChanges();
}

async function persistProductDataFolderChanges() {
  if (!productDataDirectoryHandle) {
    statusMessage = "Select a product data folder before saving product changes.";
    return;
  }
  try {
    if ((await verifyProductDataFolderPermission(productDataDirectoryHandle, true)) !== "granted") {
      statusMessage = "PEAK needs write permission for the selected product data folder.";
      renderApp();
      return;
    }
    await writeProductDataSnapshot(productDataDirectoryHandle);
    localStorage.setItem("peakHasLocalChanges", "true");
  } catch (error) {
    console.error("Could not write PEAK product data.", error);
    statusMessage = `Could not write product data: ${error.message}`;
    renderApp();
  }
}

async function writeProductDataSnapshot(directoryHandle) {
  const groups = groupedPartResults(parts);
  const today = new Date().toISOString().slice(0, 10);
  const manifest = {
    schema: "peak.parts.manifest.v2",
    updated_at: today,
    projects: "projects.json",
    parts: groups.map((group) => `parts/${group.part_number}/${group.part_number}.json`)
  };
  await Promise.all(
    groups.map(async (group) => {
      const revisions = group.revisions;
      const partProperties = productPartProperties(group.part_number, revisions);
      await writeJsonToDirectory(directoryHandle, `parts/${group.part_number}/${group.part_number}.json`, partProperties);
      await Promise.all(
        revisions.map((part) => writeJsonToDirectory(directoryHandle, `parts/${group.part_number}/${group.part_number}^${part.revision || "A"}.json`, productRevisionProperties(part)))
      );
    })
  );
  await writeJsonToDirectory(directoryHandle, "projects.json", productProjectsPayload());
  await writeJsonToDirectory(directoryHandle, "manifest.json", manifest);
}

function productProjectsPayload() {
  return {
    schema: "peak.projects.v1",
    updated_at: new Date().toISOString().slice(0, 10),
    projects: projects().map((name) => ({
      name,
      key: projectKey(name),
      owner: projectOwner(name),
      approvers: projectApprovers(name),
      description: projectDescription(name)
    }))
  };
}

function productPartProperties(partNumber, revisions) {
  const representative = representativeRevision(revisions);
  const properties = {
    ...(representative.part_properties || {}),
    schema: "peak.part.v2",
    part_number: partNumber,
    name: representative.name,
    description: representative.description || "",
    category: representative.category || "general",
    project: representative.project,
    traceability: representative.traceability || "Not set",
    maturity: representative.maturity || "development",
    onshape: representative.onshape || [],
    work_instructions: representative.work_instructions || [],
    file_links: representative.file_links || [],
    tags: representative.tags || [],
    manufacturers: representative.manufacturers || [],
    revisions: revisions.map((part) => `${partNumber}^${part.revision || "A"}.json`).sort()
  };
  return removeUndefinedFields(properties);
}

function productRevisionProperties(part) {
  const properties = {
    ...(part.revision_properties || {}),
    schema: "peak.revision.v1",
    object_id: partKey(part),
    part_number: part.part_number,
    revision: part.revision || "A",
    release_status: part.release_status || part.lifecycle_state || "draft",
    lifecycle_state: part.lifecycle_state || part.release_status || "draft",
    owner: part.owner,
    created_by: part.created_by || part.owner,
    created_at: part.created_at,
    updated_by: part.updated_by || part.owner,
    updated_at: part.updated_at,
    based_on: part.based_on || null,
    approvers: part.approvers || [],
    bom: part.bom || [],
    attachments: part.attachments || part.documents || [],
    change_summary: part.change_summary || ""
  };
  return removeUndefinedFields(properties);
}

function removeUndefinedFields(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
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
  if (!productDataDirectoryHandle) {
    localStorage.setItem("peakProjects", JSON.stringify(customProjects));
  }
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

objectTable.addEventListener("click", (event) => {
  const settingsTab = event.target.closest("[data-settings-tab]");
  if (settingsTab && activeNavMode === "settings") {
    activeSettingsTab = settingsTab.dataset.settingsTab;
    renderApp();
  }
});

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

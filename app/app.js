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
let selectedProjectName = "";
let activeNavMode = "home";
let activePartEditMode = false;
let activeAttachmentEditMode = false;
let activeProjectEditMode = false;
let activeCreateMode = "hub";
let activeResultView = "grid";
let activePropertyTab = "overview";
let activeAttachmentDraftCount = 0;
let activeTableSort = { column: "part_number", direction: "asc" };
let tableColumnFilters = {};
let activeHistorySort = { column: "performed_at", direction: "desc" };
let historyColumnFilters = {};
let collapsedBomNodes = new Set();
let activeBomAddParent = "";
let activeSettingsTab = "setup";
let activeColorScheme = localStorage.getItem("peakColorScheme") || "dark";
let activeAccentColor = localStorage.getItem("peakAccentColor") || "teal";
let activeAccentCustomHex = localStorage.getItem("peakAccentCustomHex") || "#35d1a8";
let statusMessage = "";
let workflowFeedback = {};
let githubAuthStatus = null;
let githubAuthChecking = false;
let githubAuthPollingTimer = null;
let hasRepoChanges = loadHasLocalChanges();
let connections = loadConnections();
let customProjects = loadProjects();
let productDataDirectoryHandle = null;
let productDataFolderName = localStorage.getItem("peakProductDataFolderName") || "";
let runnerProductDataDir = "";

const productDataDbName = "peakProductData";
const productDataStoreName = "handles";
const productDataGithubOwner = "Launch-Canada";
const productDataGithubRepo = "Product-Data";
const productDataGithubBranch = "main";
const productDataGithubUrl = `https://github.com/${productDataGithubOwner}/${productDataGithubRepo}`;
const peakRunnerProductDataUrl = "/api/product-data";
const peakRunnerConfigUrl = "/api/config";
const peakRunnerPushUrl = "/api/git/push-draft";
const peakRunnerWorkflowUrl = "/api/git/workflow-transition";
const peakRunnerPullMainUrl = "/api/git/pull-main";
const peakRunnerConfigProductDataFolderUrl = "/api/config/product-data-folder";
const peakRunnerGitHubAuthStatusUrl = "/api/github/auth-status";
const peakRunnerGitHubAuthLoginUrl = "/api/github/auth-login";

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

const tabularColumns = [
  { key: "part_number", label: "Part No", value: (part) => part.part_number },
  { key: "legacy_part_number", label: "Legacy Part No", value: (part) => legacyPartNumberValue(part) },
  { key: "revision", label: "Rev", value: (part) => part.revision || "A" },
  { key: "name", label: "Name", value: (part) => part.name },
  { key: "project", label: "Project", value: (part) => part.project },
  { key: "state", label: "State", value: (part) => releaseStatusLabel(part) },
  { key: "owner", label: "Owner", value: (part) => part.updated_by || part.owner || part.created_by },
  { key: "maturity", label: "Maturity", value: (part) => maturityStageValue(part) },
  { key: "traceability", label: "Traceability", value: (part) => traceabilityValue(part) },
  { key: "created_by", label: "Created By", value: (part) => part.created_by || part.owner },
  { key: "created_at", label: "Created Date", value: (part) => part.created_at },
  { key: "updated_by", label: "Last Edited By", value: (part) => part.updated_by || part.owner },
  { key: "updated_at", label: "Last Edited Date", value: (part) => part.updated_at },
  { key: "description", label: "Description", value: (part) => part.description },
  { key: "revision_description", label: "Revision Description", value: (part) => part.change_summary },
  { key: "google_drive", label: "Google Drive", value: (part) => documentUrl(part, "drive") },
  { key: "onshape", label: "Onshape", value: (part) => documentUrl(part, "onshape") },
  { key: "wi", label: "WI", value: (part) => documentUrl(part, "work") },
  { key: "attachments", label: "Attachments", value: (part) => attachmentsForPart(part).length },
  { key: "bom", label: "BOM Items", value: (part) => asArray(part.bom).length }
];

const historyColumns = [
  { key: "performed_at", label: "Performed", value: (row) => row.performed_at },
  { key: "action", label: "Action", value: (row) => activityActionLabel(row.action) },
  { key: "actor", label: "User", value: (row) => row.actor },
  { key: "part_number", label: "Part No", value: (row) => row.part_number },
  { key: "revision", label: "Rev", value: (row) => row.revision },
  { key: "object_id", label: "Part ID", value: (row) => row.object_id },
  { key: "name", label: "Name", value: (row) => row.name },
  { key: "project", label: "Project", value: (row) => row.project },
  { key: "state", label: "Revision Status", value: (row) => row.state },
  { key: "maturity", label: "Maturity", value: (row) => row.maturity },
  { key: "detail", label: "Detail", value: (row) => row.detail }
];

const revisionWorkflowStates = ["draft", "release_candidate", "released", "obsolete"];
const maturityWorkflowStates = ["development", "npi", "production", "sunset", "obsolete"];

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
  const [rawPartNumber, rawRevision] = key.split("^");
  const canonicalKey = canonicalPartNumber(rawPartNumber || key);
  return (
    parts.find((part) => partKey(part) === key) ||
    parts.find((part) => part.part_number === key) ||
    parts.find((part) => `${part.part_number}^${part.revision || "V1"}` === key) ||
    parts.find((part) => canonicalPartNumber(part.part_number) === canonicalKey && (!rawRevision || String(part.revision || "V1") === rawRevision))
  );
}

function latestRevisionForPart(partNumber) {
  const revisions = parts.filter((part) => part.part_number === partNumber);
  return sortRevisions(revisions).at(-1);
}

function sortRevisions(revisions) {
  return [...revisions].sort((a, b) => compareRevisionLabels(a?.revision, b?.revision));
}

function sortParts(records) {
  return [...records].sort((a, b) => {
    const partCompare = canonicalPartNumber(a?.part_number || "").localeCompare(canonicalPartNumber(b?.part_number || ""));
    return partCompare || compareRevisionLabels(a?.revision, b?.revision);
  });
}

function canonicalPartNumber(value) {
  const raw = String(value || "").trim().toUpperCase();
  const match = raw.match(/^([A-Z0-9]+)-0*(\d+)$/);
  if (!match) {
    return raw;
  }
  return `${match[1]}-${String(Number(match[2]))}`;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareRevisionLabels(a, b) {
  const left = revisionSortParts(a);
  const right = revisionSortParts(b);
  const majorCompare = left.major.localeCompare(right.major);
  if (majorCompare !== 0) {
    return majorCompare;
  }
  return left.minor - right.minor;
}

function revisionSortParts(revision) {
  const match = String(revision || "A").trim().toUpperCase().match(/^([A-Z]+)(\d+)?$/);
  if (!match) {
    return { major: String(revision || ""), minor: 0 };
  }
  return { major: match[1], minor: match[2] ? Number(match[2]) : 0 };
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
  let loadedFromRunner = false;

  try {
    const runnerPayload = await loadPartsFromRunner();
    loadedParts = runnerPayload.parts;
    customProjects = normalizeProjectsPayload(runnerPayload.projects || { projects: [] });
    setProductDataFolderFromRunnerPayload(runnerPayload);
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    loadedFromRunner = true;
  } catch (error) {
    console.info("PEAK runner product data is not available; falling back to browser folder access.", error);
    await syncRunnerConfigDisplay();
  }

  if (!loadedFromRunner && productDataDirectoryHandle) {
    try {
      loadedParts = await loadPartsFromProductDataFolder(productDataDirectoryHandle);
      customProjects = await loadProjectsFromProductDataFolder(productDataDirectoryHandle, loadedParts);
      hasRepoChanges = false;
      localStorage.setItem("peakHasLocalChanges", "false");
    } catch (error) {
      console.warn("Could not load PEAK product data from the selected local folder.", error);
      statusMessage = error.message;
    }
  } else if (!loadedFromRunner) {
    statusMessage = "Select a local product data folder in Settings > Setup.";
  }

  if (!Array.isArray(loadedParts)) {
    throw new Error("PEAK product data must be a JSON array");
  }

  const invalidPart = loadedParts.find((part) => !part?.part_number || !part?.name);
  if (invalidPart) {
    throw new Error("PEAK data records must include part_number and name");
  }

  parts = sortParts(loadedParts);
  selectedPartNumber = partKey(parts[0]) || null;
  renderProjectOptions();
  initRoute();
}

async function loadPartsFromRunner() {
  const response = await fetch(peakRunnerProductDataUrl, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error("PEAK runner product data endpoint is not available");
  }
  const payload = await response.json();
  if (payload.ok === false || !Array.isArray(payload.parts)) {
    throw new Error(payload.message || "PEAK runner did not return product parts");
  }
  return payload;
}

async function syncRunnerConfigDisplay() {
  try {
    const response = await fetch(peakRunnerConfigUrl, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      return null;
    }
    runnerProductDataDir = payload.productDataDir || "";
    if (runnerProductDataDir) {
      productDataFolderName = runnerProductDataDir;
      localStorage.setItem("peakProductDataFolderName", productDataFolderName);
    } else if (!productDataDirectoryHandle) {
      productDataFolderName = "";
      localStorage.removeItem("peakProductDataFolderName");
    }
    return payload;
  } catch {
    return null;
  }
}

function setProductDataFolderFromRunnerPayload(payload) {
  runnerProductDataDir = payload.productDataDir || runnerProductDataDir;
  productDataFolderName = runnerProductDataDir || payload.folderName || productDataFolderName || "Product data runner";
  localStorage.setItem("peakProductDataFolderName", productDataFolderName);
}

async function pullMainFromRunner() {
  const previousSelected = selectedPartNumber;
  const previousOpened = openedPartNumber;
  const previousBom = selectedBomPartNumber;
  statusMessage = `Pulling latest ${productDataGithubBranch} from ${productDataGithubOwner}/${productDataGithubRepo}...`;
  renderApp();
  try {
    const response = await fetch(peakRunnerPullMainUrl, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "Pull from main failed");
    }
    const runnerPayload = await loadPartsFromRunner();
    parts = sortParts(runnerPayload.parts);
    customProjects = normalizeProjectsPayload(runnerPayload.projects || { projects: [] });
    setProductDataFolderFromRunnerPayload(runnerPayload);
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    selectedPartNumber = findPartByKey(previousSelected) ? previousSelected : partKey(parts[0]) || null;
    openedPartNumber = findPartByKey(previousOpened) ? previousOpened : null;
    selectedBomPartNumber = findPartByKey(previousBom) ? previousBom : openedPartNumber || selectedPartNumber;
    renderProjectOptions();
    statusMessage = `Pulled latest main. ${payload.message || payload.lastCommit || ""}`.trim();
  } catch (error) {
    statusMessage = `Pull main failed: ${runnerErrorMessage(error)}`;
  }
  renderApp();
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
    description: String(project.description || "").trim(),
    drive_url: String(project.drive_url || project.google_drive_url || project.driveUrl || "").trim(),
    allow_custom_part_numbers: project.allow_custom_part_numbers === true || project.allowCustomPartNumbers === true
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
      description: `${part.project} project records`,
      drive_url: "",
      allow_custom_part_numbers: false
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
  if (window.peakDesktop?.selectProductDataFolder) {
    await selectProductDataFolderFromDesktop();
    return;
  }
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

async function selectProductDataFolderFromDesktop() {
  try {
    const selection = await window.peakDesktop.selectProductDataFolder();
    if (!selection?.path) {
      return;
    }
    const response = await fetch(peakRunnerConfigProductDataFolderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productDataDir: selection.path })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "Could not configure product data folder");
    }
    productDataDirectoryHandle = null;
    runnerProductDataDir = payload.productDataDir || selection.path || "";
    productDataFolderName = runnerProductDataDir || selection.name || "Product-Data";
    localStorage.setItem("peakProductDataFolderName", productDataFolderName);
    const runnerPayload = await loadPartsFromRunner();
    parts = sortParts(runnerPayload.parts);
    customProjects = normalizeProjectsPayload(runnerPayload.projects || { projects: [] });
    setProductDataFolderFromRunnerPayload(runnerPayload);
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    selectedPartNumber = partKey(parts[0]) || null;
    openedPartNumber = null;
    selectedBomPartNumber = selectedPartNumber;
    renderProjectOptions();
    statusMessage = payload.message || `Using product data folder ${productDataFolderName}`;
    renderApp();
  } catch (error) {
    statusMessage = `Could not select product data folder: ${runnerErrorMessage(error)}`;
    renderApp();
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
  parts = sortParts(await loadPartsFromProductDataFolder(productDataDirectoryHandle));
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
      project: part.project,
      traceability: traceabilityValue(part) || "LOT",
      maturity: part.maturity || part.lifecycle_state,
      onshape: asArray(part.onshape),
      documents: asArray(part.documents),
      work_instructions: asArray(part.work_instructions),
      file_links: asArray(part.file_links),
      tags: asArray(part.tags),
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
    legacy_part_number: partProperties.legacy_part_number || partProperties.legacyPartNumber || revisionProperties.legacy_part_number || revisionProperties.legacyPartNumber || "",
    project: partProperties.project || revisionProperties.project,
    traceability: normalizeTraceability(partProperties.traceability || revisionProperties.traceability),
    maturity: partProperties.maturity || revisionProperties.maturity || revisionProperties.lifecycle_state,
    onshape: asArray(partProperties.onshape || revisionProperties.onshape),
    work_instructions: asArray(partProperties.work_instructions || revisionProperties.work_instructions),
    file_links: asArray(partProperties.file_links || revisionProperties.file_links || partProperties.documents),
    documents: asArray(revisionProperties.attachments || revisionProperties.documents),
    attachments: asArray(revisionProperties.attachments || revisionProperties.documents),
    tags: asArray(partProperties.tags || revisionProperties.tags),
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
    if (activePartEditMode && !isDraftRevision(opened)) {
      activePartEditMode = false;
    }
  }
}

function renderApp() {
  document.title = "PEAK Registry";
  if (activeNavMode === "part") {
    renderOpenedPartWorkspace();
  } else {
    renderSearchWorkspace();
  }
  syncChrome();
  enableColumnResizing();
  enableBomColumnResizing();
  enablePaneResizing();
}

function renderSearchWorkspace() {
  const visibleParts = filteredParts();
  const visibleGroups = groupedPartResults(visibleParts);
  if (activeNavMode === "home" && !visibleGroups.some((group) => group.part_number === findPartByKey(selectedPartNumber)?.part_number)) {
    selectedPartNumber = partKey(visibleGroups[0]?.representative) || null;
  }
  if (activeNavMode === "projects") {
    const projectNames = projects();
    if (!projectNames.includes(selectedProjectName)) {
      selectedProjectName = projectNames[0] || "";
      activeProjectEditMode = false;
    }
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
  if (activeNavMode === "history") {
    return "History";
  }
  if (activeNavMode === "table") {
    return "Parts Table";
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
  objectTable.classList.toggle("searchGalleryTable", activeNavMode === "home" || activeNavMode === "projects");
  if (activeNavMode === "create") {
    renderCreateRows();
    return;
  }
  if (activeNavMode === "projects") {
    renderProjectRows();
    return;
  }
  if (activeNavMode === "history") {
    renderHistoryRows(visibleParts);
    return;
  }
  if (activeNavMode === "table") {
    renderTabularRows(visibleParts);
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
    history: "History",
    table: "Table",
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
    history: "Review activity across every part revision.",
    table: "Review every part revision and property in a sortable table.",
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
    history: "History",
    table: "Table",
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
  if (activeNavMode === "table") {
    return `${tabularParts(visibleParts).length} of ${visibleParts.length} table rows`;
  }
  if (activeNavMode === "history") {
    return `${historyRows(visibleParts).length} history events`;
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
  if (activeNavMode === "history") {
    renderHistoryDetail();
    return;
  }
  if (activeNavMode === "table") {
    renderTabularDetail();
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
  resultsTitle.textContent = activePartEditMode
    ? `${partObjectLabel(selectedPart)} Edit`
    : activeAttachmentEditMode
      ? `${partObjectLabel(selectedPart)} Attachments`
      : `${partObjectLabel(selectedPart)} Details`;

  renderBomTree();
  tableHead.innerHTML = "";
  partsList.innerHTML = "";
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
    revisionStatusValue(part),
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
      (!state || lifecycleMatches(revisionStatusValue(part), state)) &&
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

function renderBasedOnSuggestions(query) {
  const input = document.querySelector("#newPartBasedOn");
  const container = document.querySelector("#basedOnSuggestions");
  if (!container) return;
  const trimmed = query.trim();
  if (!trimmed) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  const matches = groupedPartResults(
    parts.filter((part) => matchesSearch(part, trimmed))
  ).slice(0, 10);
  if (!matches.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.innerHTML = matches
    .map((group) => `
      <button class="suggestionItem" type="button" role="option" data-based-on-part="${escapeHtml(group.part_number)}">
        <span>${escapeHtml(group.part_number)}</span>
        <small>${escapeHtml(group.representative.name)}</small>
      </button>
    `)
    .join("");
  if (input) {
    const rect = input.getBoundingClientRect();
    container.style.top = `${rect.bottom + 4}px`;
    container.style.left = `${rect.left}px`;
    container.style.width = `${rect.width}px`;
  }
  container.hidden = false;
}

function getOpenedPart() {
  return findPartByKey(openedPartNumber);
}

function getSelectedBomPart() {
  return findPartByKey(selectedBomPartNumber || openedPartNumber);
}

function partEditNavigationLocked() {
  return activeNavMode === "part" && activePartEditMode && Boolean(openedPartNumber);
}

function normalizePartIdentifier(identifier) {
  const part = findPartByKey(identifier);
  return part ? partKey(part) : identifier;
}

function preventPartNavigationDuringEdit(targetIdentifier) {
  if (!partEditNavigationLocked()) {
    return false;
  }
  const targetKey = normalizePartIdentifier(targetIdentifier);
  if (!targetKey || targetKey === openedPartNumber) {
    return false;
  }
  selectedPartNumber = openedPartNumber;
  selectedBomPartNumber = openedPartNumber;
  activeAttachmentEditMode = false;
  activeAttachmentDraftCount = 0;
  statusMessage = "Save or cancel the current part edit before opening another part";
  window.history.replaceState({}, "", partUrl(openedPartNumber, { editMode: true }));
  renderApp();
  return true;
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
      revisions: sortRevisions(revisions),
      representative: representativeRevision(revisions)
    }))
    .sort((a, b) => a.part_number.localeCompare(b.part_number));
}

function representativeRevision(revisions) {
  return sortRevisions(revisions).at(-1);
}

function latestReleasedRevision(revisions) {
  return [...revisions]
    .filter((part) => releaseStatusLabel(part) === "Released")
    .sort((a, b) => {
      const dateCompare = String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
      return dateCompare || compareRevisionLabels(b.revision, a.revision);
    })[0];
}

function renderTabularRows(visibleParts) {
  const rows = tabularParts(visibleParts);
  tableHead.innerHTML = `
    <tr class="tabularHeaderRow">
      ${tabularColumns.map(tabularHeaderCell).join("")}
    </tr>
  `;

  if (!rows.length) {
    partsList.innerHTML = `<tr><td class="emptyCell" colspan="${tabularColumns.length}">No matching part rows</td></tr>`;
    return;
  }

  partsList.innerHTML = rows.map((part) => `
    <tr class="objectRow tabularRow${partKey(part) === selectedPartNumber ? " active" : ""}" data-part-number="${escapeHtml(partKey(part))}" tabindex="0">
      ${tabularColumns.map((column) => tabularBodyCell(part, column)).join("")}
    </tr>
  `).join("");
}

function tabularHeaderCell(column) {
  const isSorted = activeTableSort.column === column.key;
  const direction = isSorted ? activeTableSort.direction : "";
  return `
    <th scope="col" class="tabularHeaderCell">
      <button class="tableSortButton${isSorted ? " active" : ""}" type="button" data-table-sort="${escapeHtml(column.key)}" aria-label="Sort ${escapeHtml(column.label)} ${direction === "asc" ? "descending" : "ascending"}">
        <span>${escapeHtml(column.label)}</span>
        <span class="tableSortIndicator" aria-hidden="true">${
          direction === "asc"
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`
            : direction === "desc"
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>`
            : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>`
        }</span>
      </button>
      <input class="tableFilterInput" value="${escapeHtml(tableColumnFilters[column.key] || "")}" data-table-filter="${escapeHtml(column.key)}" placeholder="" aria-label="Filter ${escapeHtml(column.label)}">
    </th>
  `;
}

function tabularBodyCell(part, column) {
  const value = tabularColumnValue(part, column);
  const isLink = ["google_drive", "onshape", "wi"].includes(column.key) && value;
  const content = isLink
    ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
    : escapeHtml(value || "");
  return `<td title="${escapeHtml(value || "")}">${content}</td>`;
}

function tabularParts(sourceParts) {
  const filtered = sourceParts.filter((part) =>
    tabularColumns.every((column) => {
      const filter = String(tableColumnFilters[column.key] || "").trim().toLowerCase();
      if (!filter) {
        return true;
      }
      return String(tabularColumnValue(part, column) || "").toLowerCase().includes(filter);
    })
  );
  const sortColumn = tabularColumns.find((column) => column.key === activeTableSort.column) || tabularColumns[0];
  const direction = activeTableSort.direction === "desc" ? -1 : 1;
  return [...filtered].sort((a, b) => {
    const aValue = tabularColumnValue(a, sortColumn);
    const bValue = tabularColumnValue(b, sortColumn);
    const numeric = Number(aValue) - Number(bValue);
    if (aValue !== "" && bValue !== "" && Number.isFinite(numeric)) {
      return numeric * direction;
    }
    return String(aValue || "").localeCompare(String(bValue || ""), undefined, { numeric: true, sensitivity: "base" }) * direction;
  });
}

function tabularColumnValue(part, column) {
  return column.value(part) ?? "";
}

function renderHistoryRows(visibleParts) {
  const rows = historyRows(visibleParts);
  tableHead.innerHTML = `
    <tr class="tabularHeaderRow">
      ${historyColumns.map(historyHeaderCell).join("")}
    </tr>
  `;

  if (!rows.length) {
    partsList.innerHTML = `<tr><td class="emptyCell" colspan="${historyColumns.length}">No matching history events</td></tr>`;
    return;
  }

  partsList.innerHTML = rows.map((row) => `
    <tr class="objectRow tabularRow${row.object_id === selectedPartNumber ? " active" : ""}" data-part-number="${escapeHtml(row.object_id)}" data-history-part="${escapeHtml(row.object_id)}" tabindex="0">
      ${historyColumns.map((column) => historyBodyCell(row, column)).join("")}
    </tr>
  `).join("");
}

function historyHeaderCell(column) {
  const isSorted = activeHistorySort.column === column.key;
  const direction = isSorted ? activeHistorySort.direction : "";
  return `
    <th scope="col" class="tabularHeaderCell">
      <button class="tableSortButton${isSorted ? " active" : ""}" type="button" data-history-sort="${escapeHtml(column.key)}" aria-label="Sort ${escapeHtml(column.label)} ${direction === "asc" ? "descending" : "ascending"}">
        <span>${escapeHtml(column.label)}</span>
        <span class="tableSortIndicator" aria-hidden="true">${
          direction === "asc"
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`
            : direction === "desc"
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>`
            : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>`
        }</span>
      </button>
      <input class="tableFilterInput" value="${escapeHtml(historyColumnFilters[column.key] || "")}" data-history-filter="${escapeHtml(column.key)}" placeholder="" aria-label="Filter ${escapeHtml(column.label)}">
    </th>
  `;
}

function historyBodyCell(row, column) {
  const value = historyColumnValue(row, column);
  const displayValue = column.key === "performed_at" ? formatActivityTimestamp(value) : value;
  return `<td title="${escapeHtml(displayValue || "")}">${escapeHtml(displayValue || "")}</td>`;
}

function historyRows(sourceParts) {
  const rows = sourceParts.flatMap((part) =>
    activityHistoryForPart(part).map((activity) => ({
      ...activity,
      part_number: part.part_number,
      revision: part.revision || "A",
      object_id: partKey(part),
      name: part.name || "",
      project: part.project || "",
      state: releaseStatusLabel(part),
      maturity: maturityStageLabel(part)
    }))
  );
  const filtered = rows.filter((row) =>
    historyColumns.every((column) => {
      const filter = String(historyColumnFilters[column.key] || "").trim().toLowerCase();
      if (!filter) {
        return true;
      }
      const value = column.key === "performed_at" ? formatActivityTimestamp(historyColumnValue(row, column)) : historyColumnValue(row, column);
      return String(value || "").toLowerCase().includes(filter);
    })
  );
  const sortColumn = historyColumns.find((column) => column.key === activeHistorySort.column) || historyColumns[0];
  const direction = activeHistorySort.direction === "desc" ? -1 : 1;
  return [...filtered].sort((a, b) => {
    const aValue = historyColumnValue(a, sortColumn);
    const bValue = historyColumnValue(b, sortColumn);
    if (sortColumn.key === "performed_at") {
      return String(aValue || "").localeCompare(String(bValue || "")) * direction;
    }
    const numeric = Number(aValue) - Number(bValue);
    if (aValue !== "" && bValue !== "" && Number.isFinite(numeric)) {
      return numeric * direction;
    }
    return String(aValue || "").localeCompare(String(bValue || ""), undefined, { numeric: true, sensitivity: "base" }) * direction;
  });
}

function historyColumnValue(row, column) {
  return column.value(row) ?? "";
}

function renderHistoryDetail() {
  partDetail.innerHTML = `
    <div class="tabularDetailLayout">
      ${historyActionRail()}
    </div>
  `;
}

function historyActionRail() {
  return `
    <aside class="partActionRail" aria-label="History actions">
      ${partActionButton("Pull Remote", "pull-main")}
    </aside>
  `;
}

function renderTabularDetail() {
  partDetail.innerHTML = `
    <div class="tabularDetailLayout">
      ${tabularActionRail()}
    </div>
  `;
}

function tabularActionRail() {
  return `
    <aside class="partActionRail" aria-label="Table actions">
      ${partActionButton("Import Tabular Data", "import-tabular")}
      ${partActionButton("Push Changes", "push-tabular")}
      ${partActionButton("Export Tabular CSV", "export-tabular-csv")}
      ${partActionButton("Export PEAK JSON", "export-tabular-json")}
      ${partActionButton("Pull Main", "pull-main")}
    </aside>
  `;
}

function renderReportRows(visibleParts) {
  const projectCounts = countBy(visibleParts, "project");
  const stateCounts = countBy(visibleParts.map((part) => ({ state: revisionStatusValue(part) })), "state");
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
  const projectOptions = ['<option value="">No project</option>', ...projects()
    .map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project)}</option>`)
  ].join("");
  const selectedProject = projectFilter.value || projects()[0] || "Unassigned Project";
  const generatedPartNumber = nextProjectPartNumber(selectedProject);
  const sourceField = fromSource
    ? `
      <div class="createFormField">
        <div class="createFormMeta">
          <label class="createFormLabel" for="newPartBasedOn">Based On</label>
          <span class="createFormHint">Search by part number or name</span>
        </div>
        <div class="createFormDropWrap">
          <input class="tableInput createFormInput" id="newPartBasedOn" value="" placeholder="Search part number or name" autocomplete="off">
          <div id="basedOnSuggestions" class="createFormSuggestions" role="listbox" hidden></div>
        </div>
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
              <span class="createFormHint">Optional for tooling or non-BOM records</span>
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
  const selectedSource = latestRevisionForPart(selectedBase);
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
              <span class="createFormHint">Computed from the selected part revision</span>
            </div>
            <input class="tableInput createFormInput" id="newRevisionValue" value="${escapeHtml(nextRevisionForPart(selectedSource))}" readonly>
          </div>
          <label class="createCheckboxField">
            <input type="checkbox" id="newRevisionMinor">
            <span>Minor Revision</span>
          </label>
          <div class="createFormMeta createFormFullHint">
            <span class="createFormHint">Major revisions advance A to B. Minor revisions advance A to A01.</span>
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
          <label class="createCheckboxField">
            <input type="checkbox" id="newProjectCustomNumbers">
            <span>Allow custom part numbers</span>
          </label>
          <div class="createFormMeta createFormFullHint">
            <span class="createFormHint">Custom numbers must still be unique and start with the project code.</span>
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
  const projectNames = projects();
  if (!projectNames.includes(selectedProjectName)) {
    selectedProjectName = projectNames[0] || "";
    activeProjectEditMode = false;
  }
  tableHead.innerHTML = "";
  partsList.innerHTML = projectNames.length
    ? projectNames.map(projectGalleryRow).join("")
    : '<tr><td class="emptyCell">No projects found</td></tr>';
}

function renderProjectsDetail() {
  const project = selectedProjectName || projects()[0] || "";
  if (!project) {
    partDetail.innerHTML = '<p class="empty">No project selected</p>';
    return;
  }
  partDetail.innerHTML = `
    <div class="projectDetailLayout">
      <div class="partDetailMain">
        ${renderProjectDetailBody(project)}
      </div>
      ${projectActionRail(project)}
    </div>
  `;
}

function projectGalleryRow(project) {
  const count = parts.filter((part) => part.project === project).length;
  const active = selectedProjectName === project ? " active" : "";
  return `
    <tr class="objectRow galleryRow${active}" data-project-name="${escapeHtml(project)}" tabindex="0">
      <td colspan="6">
        <div class="galleryItem">
          <span class="folderIcon" aria-hidden="true"></span>
          <div class="galleryItemText">
            <strong>${escapeHtml(project)}</strong>
            <p>${escapeHtml(projectDescription(project))}</p>
          </div>
          <span class="revisionList">${count} part${count === 1 ? "" : "s"}</span>
          <span class="galleryOpenIcon" aria-hidden="true"></span>
        </div>
      </td>
    </tr>
  `;
}

function renderProjectDetailBody(project) {
  const editing = activeProjectEditMode;
  return `
    <section class="propertySection">
      <h3>Project</h3>
      <dl class="propertyGrid">
        ${property("Project Name", project)}
        ${editing ? propertyProjectEditInline("Project Code", "key", projectKey(project)) : property("Project Code", projectKey(project))}
        ${editing ? propertyProjectEditInline("Owner", "owner", projectOwner(project)) : property("Owner", projectOwner(project))}
        ${editing ? propertyProjectEditInline("Approvers", "approvers", projectApprovers(project).join(", ")) : property("Approvers", projectApprovers(project).join(", ") || "Not set")}
        ${editing ? propertyProjectEditInline("Google Drive Link", "drive_url", projectDriveUrl(project)) : propertyLink("Google Drive Link", projectDriveUrl(project))}
        ${editing ? propertyProjectToggleInline("Allow Custom Part Numbers", "allow_custom_part_numbers", projectAllowsCustomPartNumbers(project)) : property("Allow Custom Part Numbers", projectAllowsCustomPartNumbers(project) ? "Yes" : "No")}
        ${editing ? propertyProjectEditInline("Description", "description", projectDescription(project), { textarea: true }) : property("Description", projectDescription(project))}
      </dl>
      ${editing ? `
        <div class="partEditActions">
          <button class="iconButton primaryAction formAction" type="button" data-save-selected-project="${escapeHtml(project)}">Save Project</button>
          <button class="iconButton formAction" type="button" data-cancel-project-edit>Cancel</button>
        </div>
      ` : ""}
    </section>
    <section class="propertySection">
      <h3>Project Parts</h3>
      <dl class="propertyGrid">
        ${property("Part Count", parts.filter((part) => part.project === project).length)}
        ${property("Draft Revisions", parts.filter((part) => part.project === project && isDraftRevision(part)).length)}
        ${property("Released Revisions", parts.filter((part) => part.project === project && releaseStatusLabel(part) === "Released").length)}
      </dl>
    </section>
  `;
}

function propertyProjectEditInline(label, field, value, { textarea = false } = {}) {
  const control = textarea
    ? `<textarea class="tableInput propertyInlineTextarea" data-selected-project-field="${escapeHtml(field)}">${escapeHtml(value || "")}</textarea>`
    : `<input class="tableInput propertyInlineInput" data-selected-project-field="${escapeHtml(field)}" value="${escapeHtml(value || "")}">`;
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${control}</dd>
  `;
}

function propertyProjectToggleInline(label, field, checked) {
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>
      <label class="createCheckboxField inlineCheckboxField">
        <input type="checkbox" data-selected-project-field="${escapeHtml(field)}"${checked ? " checked" : ""}>
        <span>Allowed</span>
      </label>
    </dd>
  `;
}

function projectActionRail(project) {
  return `
    <aside class="partActionRail" aria-label="Project actions">
      ${partActionButton("Open Project Folder", "open-project-folder")}
      ${partActionButton("Open Google Drive", "open-project-drive", { disabled: !projectDriveUrl(project) })}
      ${partActionButton("Edit Project", "edit-project", { active: activeProjectEditMode })}
      ${partActionButton("Pull Main", "pull-main")}
    </aside>
  `;
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
    ${partEditorSelectRow("Traceability", "traceability", traceabilityValue(part) || "LOT", traceabilityOptions(), "Stable traceability value")}
    ${partReadonlyRow("Part Maturity", maturityStageLabel(part), "Workflow-controlled part maturity")}
    ${partEditorRow("Revision", "revision", part.revision || "A", "Revision object identifier")}
    ${partReadonlyRow("Release Status", releaseStatusLabel(part), "Workflow-controlled revision release status")}
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
    ${partReadonlyRow("State", releaseStatusLabel(selectedPart), "Revision release status")}
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

function renderSettingsRows() {
  const productDataFolderDisplay = productDataFolderName || "No folder selected";
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
    ensureGitHubAuthStatus();
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
            <input class="tableInput folderInput" id="settingsProductDataFolder" value="${escapeHtml(productDataFolderDisplay)}" readonly>
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
        <td>Product Data Remote</td>
        <td><input class="tableInput" value="${escapeHtml(productDataGithubUrl)}" readonly></td>
        <td>Draft edits push through the local PEAK runner using this machine's Git credentials</td>
      </tr>
      ${githubAuthSettingsRow()}
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

function githubAuthSettingsRow() {
  const status = githubAuthStatus;
  const checking = githubAuthChecking && !status?.authenticated;
  const state = status?.authenticated ? "Connected" : checking ? "Checking..." : "Not connected";
  const detail = status?.authenticated
    ? status.message
    : status?.action || "Connect GitHub to create workflow merge requests.";
  const button = status?.authenticated
    ? `<button class="iconButton formAction" type="button" data-refresh-github-auth>Refresh</button>`
    : `<button class="iconButton primaryAction formAction" type="button" data-connect-github${checking ? " disabled" : ""}>${checking ? "Connecting..." : "Connect GitHub"}</button>`;
  return `
    <tr>
      <td>GitHub Merge Requests</td>
      <td>
        <div class="settingsActionCell">
          <span class="settingsStatus ${status?.authenticated ? "success" : "warning"}">${escapeHtml(state)}</span>
          ${button}
        </div>
      </td>
      <td>${escapeHtml(detail)}</td>
    </tr>
  `;
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
    <div class="searchDetailLayout">
      ${propertyTabs()}
      ${renderPropertyBody(part)}
    </div>
  `;
}

function renderOpenedPartDetail(rootPart, selectedPart) {
  partDetail.innerHTML = `
    <div class="partDetailLayout">
      <div class="partDetailMain">
        ${propertyTabs()}
        ${renderPropertyBody(selectedPart)}
      </div>
      ${partActionRail(selectedPart)}
    </div>
  `;
}

function partActionRail(part) {
  const driveUrl = documentUrl(part, "drive");
  const onshapeUrl = documentUrl(part, "onshape");
  const workUrl = documentUrl(part, "work");
  const canEdit = isDraftRevision(part);
  return `
    <aside class="partActionRail" aria-label="Part actions">
      ${partActionButton("Open Google Drive", "open-drive", { disabled: !driveUrl })}
      ${partActionButton("Open Onshape", "open-onshape", { disabled: !onshapeUrl })}
      ${partActionButton("Open WI", "open-work", { disabled: !workUrl })}
      ${partActionButton("Edit Part", "edit-part", { disabled: !canEdit, active: activePartEditMode })}
      ${partActionButton("Edit Attachments", "edit-attachments", { active: activeAttachmentEditMode })}
      ${partActionButton("Submit to Workflow", "submit-workflow")}
      ${partActionButton("Copy Part ID", "copy-part-id")}
      ${partActionButton("Pull Main", "pull-main")}
    </aside>
  `;
}

function partActionButton(label, action, { disabled = false, active = false } = {}) {
  return `<button class="partActionButton${active ? " active" : ""}" type="button" data-part-action="${escapeHtml(action)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"${disabled ? " disabled" : ""}></button>`;
}

function propertyTabs() {
  return `
    <div class="propertyTabs" aria-label="Property sections">
      <button class="propertyTab${activePropertyTab === "overview" ? " active" : ""}" type="button" data-property-tab="overview">Overview</button>
      <button class="propertyTab${activePropertyTab === "attachments" ? " active" : ""}" type="button" data-property-tab="attachments">Attachments</button>
      <button class="propertyTab${activePropertyTab === "history" ? " active" : ""}" type="button" data-property-tab="history">Relation</button>
      <button class="propertyTab${activePropertyTab === "workflow" ? " active" : ""}" type="button" data-property-tab="workflow">Workflow</button>
    </div>
  `;
}

function renderPropertyBody(part) {
  if (activePropertyTab === "attachments") {
    if (activeAttachmentEditMode) {
      return renderEditableAttachmentsTab(part);
    }
    return `
      <div class="relationStack">
        ${renderAttachmentSections(part)}
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

function renderEditableAttachmentsTab(part) {
  return `
    <div class="attachmentToolbar">
      <button class="iconButton primaryAction attachmentAddButton" type="button" data-add-attachment-field title="Add attachment" aria-label="Add attachment">+</button>
    </div>
    <div class="relationStack">
      ${renderAttachmentSections(part, { editable: true })}
      <section class="propertySection attachmentEditSection">
        <h3>New Attachments</h3>
        <div class="attachmentEditRows" data-attachment-edit-rows>
          ${Array.from({ length: activeAttachmentDraftCount }, (_, index) => attachmentEditRow(index)).join("")}
        </div>
      </section>
      <div class="partEditActions">
        <button class="iconButton primaryAction formAction" type="button" data-save-attachments="${escapeHtml(partKey(part))}">Save Attachments</button>
        <button class="iconButton formAction" type="button" data-cancel-part-edit>Cancel</button>
      </div>
    </div>
  `;
}

function attachmentEditRow(index = 0) {
  return `
    <div class="attachmentEditRow" data-attachment-row>
      <label class="propertyEditField">
        <span>Title</span>
        <input class="tableInput" data-attachment-field="title" placeholder="Attachment title">
      </label>
      <label class="propertyEditField">
        <span>Link</span>
        <input class="tableInput" data-attachment-field="url" placeholder="https://">
      </label>
      <label class="propertyEditField">
        <span>Type</span>
        <select class="tableInput" data-attachment-field="type">
          ${attachmentTypeOptions().map((type) => `<option value="${escapeHtml(type)}"${index === 0 && type === "DRAWING" ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </label>
      <button class="iconButton attachmentRemoveButton attachmentRemoveRowButton" type="button" data-remove-new-attachment title="Remove row" aria-label="Remove row"></button>
    </div>
  `;
}

function attachmentTypeOptions() {
  return [
    "ANALYSIS",
    "ANOMALY ANALYSIS",
    "CAD MODEL",
    "DESIGN REPORT",
    "DRAWING",
    "MATERIAL SPECIFICATION",
    "OTHER ATTACHMENTS",
    "PROCESS SPECIFICATION",
    "SCHEMATIC",
    "SPECIFICATION",
    "TEST PLAN",
    "TEST REPORT",
    "TEST SPECIFICATION",
    "USER MANUAL"
  ];
}

function renderOverviewTab(part) {
  const editing = activePartEditMode && isDraftRevision(part);
  const legacyPartNumber = legacyPartNumberValue(part);
  const propertyRows = [
    property("Part No", part.part_number),
    property("Revision", part.revision),
    editing ? propertyEditInline("Name", "name", part.name) : property("Name", part.name),
    editing ? propertyEditInline("Description", "description", part.description || "", { textarea: true }) : property("Description", part.description || "Not set"),
    editing ? propertyEditInline("Revision Description", "change_summary", part.change_summary || "", { textarea: true }) : property("Revision Description", part.change_summary || "Not set"),
    property("Project", part.project || "Unassigned"),
    editing ? propertyEditSelectInline("Traceability", "traceability", traceabilityValue(part), traceabilityOptions()) : property("Traceability", traceabilityLabel(part))
  ].filter(Boolean);
  return `
    <div class="overviewLayout">
      <div class="overviewColumn">
        ${detailSection("Properties", propertyRows)}
        ${detailSection("Specifications", [
          editing ? propertyEditInline("Google Drive Link", "driveUrl", documentUrl(part, "drive")) : propertyLink("Google Drive Link", documentUrl(part, "drive")),
          editing ? propertyEditInline("Onshape Link", "onshapeUrl", documentUrl(part, "onshape")) : propertyLink("Onshape Link", documentUrl(part, "onshape")),
          editing ? propertyEditInline("Work Instructions Link", "workUrl", documentUrl(part, "work")) : propertyLink("Work Instructions Link", documentUrl(part, "work"))
        ])}
        ${detailSection("Optional Properties", [
          editing ? propertyEditInline("Legacy Number", "legacy_part_number", legacyPartNumber) : property("Legacy Number", legacyPartNumber || "Not set"),
          editing ? propertyEditInline("Cost", "cost", optionalPartPropertyValue(part, "cost")) : property("Cost", optionalPartPropertyValue(part, "cost") || "Not set"),
          editing ? propertyEditInline("Mass", "mass", optionalPartPropertyValue(part, "mass")) : property("Mass", optionalPartPropertyValue(part, "mass") || "Not set")
        ])}
        ${detailSection("Authoring", [
          property("Release Status", releaseStatusLabel(part)),
          property("Created By", createdBy(part)),
          property("Created Date", part.created_at),
          property("Last Updated By", updatedBy(part)),
          property("Updated Date", part.updated_at),
          propertyHtml("Based On", basedOnLink(part))
        ])}
        ${editing ? detailSection("Workflow", [
          property("Part Maturity", maturityStageLabel(part)),
          propertyEditInline("Approvers", "approvers", (part.approvers ?? []).map((approver) => approver.name || approver).join(", "))
        ]) : ""}
        ${editing ? `
          <div class="partEditActions">
            <button class="iconButton primaryAction formAction" type="button" data-save-open-part="${escapeHtml(partKey(part))}">Save Part</button>
            <button class="iconButton formAction" type="button" data-cancel-part-edit>Cancel</button>
          </div>
        ` : ""}
      </div>
      <div class="overviewColumn">
        ${renderMaturityProgress(part)}
        ${renderRevisionHistory(part)}
      </div>
    </div>
  `;
}

function propertyEditInline(label, field, value, { textarea = false } = {}) {
  const control = textarea
    ? `<textarea class="tableInput propertyInlineTextarea" data-open-part-field="${escapeHtml(field)}">${escapeHtml(value || "")}</textarea>`
    : `<input class="tableInput propertyInlineInput" data-open-part-field="${escapeHtml(field)}" value="${escapeHtml(value || "")}">`;
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>${control}</dd>
  `;
}

function propertyEditSelectInline(label, field, value, options) {
  return `
    <dt>${escapeHtml(label)}</dt>
    <dd>
      <select class="tableInput propertyInlineInput" data-open-part-field="${escapeHtml(field)}">
        ${options.map((option) => `<option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(field === "lifecycle_state" ? stateLabel(option) : option)}</option>`).join("")}
      </select>
    </dd>
  `;
}

function traceabilityOptions() {
  return ["SERIAL", "LOT"];
}

function renderHistoryTab(part) {
  const activityItems = activityHistoryForPart(part);
  return `
    ${renderWhereUsedHistory(part)}
    ${renderRevisionHistory(part)}
    <section class="propertySection">
      <h3>Activity</h3>
      ${activityItems.length ? renderActivityHistory(activityItems) : `<p class="empty">No activity recorded for this part.</p>`}
    </section>
  `;
}

function renderActivityHistory(items) {
  const sorted = [...items].sort((a, b) => String(b.performed_at || "").localeCompare(String(a.performed_at || "")));
  return `
    <div class="activityList">
      ${sorted.map((item) => `
        <article class="activityItem">
          <div class="activityMarker" aria-hidden="true"></div>
          <div class="activityBody">
            <div class="activityHeader">
              <strong>${escapeHtml(activityActionLabel(item.action))}</strong>
              <span>${escapeHtml(formatActivityTimestamp(item.performed_at))}</span>
            </div>
            <p>${escapeHtml(item.detail || activityDefaultDetail(item))}</p>
            <small>${escapeHtml(item.actor || "Unknown user")}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderWorkflowTab(part) {
  const maturityTransition = nextMaturityTransition(part);
  const revisionTransition = nextRevisionTransition(part);
  const revertTransition = revisionStatusValue(part) === "release_candidate" ? { to: "draft", mode: "direct", action: "revert" } : null;
  const deleteTransition = isDraftRevision(part) ? { to: "delete", mode: "direct", action: "delete" } : null;
  const maturityRule = maturityWorkflowRule(part, maturityTransition?.to);
  const revisionRule = revisionWorkflowRule(part, revisionTransition?.to);
  const revertRule = revertTransition ? revisionWorkflowRule(part, "draft") : workflowRule([]);
  const deleteRule = deleteTransition ? revisionWorkflowRule(part, "delete") : workflowRule([]);
  return `
    <section class="propertySection workflowSection">
      <h3>Product Maturity</h3>
      ${workflowTimeline(maturityWorkflowStates, maturityStageValue(part), maturityStageText)}
      <dl class="propertyGrid workflowGrid">
        ${property("Current", maturityStageLabel(part))}
        ${property("Scope", part.part_number)}
        ${property("Next", maturityTransition ? maturityStageText(maturityTransition.to) : "No transition available")}
        ${property("Approval", maturityTransition ? "Merge request" : "Complete")}
      </dl>
      ${workflowCriteriaList(maturityRule)}
      ${workflowActionButton(maturityTransition, maturityRule, `Transition to ${maturityTransition ? maturityStageText(maturityTransition.to) : ""}`, "maturity", part)}
      ${workflowFeedbackMessage("maturity", part)}
    </section>
    <section class="propertySection workflowSection">
      <h3>Revision Status</h3>
      ${workflowTimeline(revisionWorkflowStates, revisionStatusValue(part), revisionStatusText)}
      <dl class="propertyGrid workflowGrid">
        ${property("Selected Revision", partObjectLabel(part))}
        ${property("Current", releaseStatusLabel(part))}
        ${property("Next", revisionTransition ? revisionStatusText(revisionTransition.to) : "No transition available")}
        ${property("Approval", revisionTransition?.mode === "direct" ? "Direct remote push" : revisionTransition ? "Merge request" : "Complete")}
      </dl>
      ${workflowCriteriaList(revisionRule)}
      ${workflowActionButtons([
        {
          transition: revisionTransition,
          rule: revisionRule,
          label: revisionTransition?.to === "release_candidate" ? "Set Release Candidate" : `Transition to ${revisionTransition ? revisionStatusText(revisionTransition.to) : ""}`,
          workflow: "revision"
        },
        {
          transition: revertTransition,
          rule: revertRule,
          label: "Revert to Draft",
          workflow: "revision"
        },
        {
          transition: deleteTransition,
          rule: deleteRule,
          label: "Delete Draft Revision",
          workflow: "revision",
          danger: true
        }
      ], part)}
      ${workflowFeedbackMessage("revision", part)}
    </section>
    ${referenceSection("Approvers", part.approvers ?? [], approverReference)}
  `;
}

function workflowTimeline(states, current, labeler) {
  const activeIndex = Math.max(0, states.indexOf(current));
  const items = states.flatMap((state, index) => {
    const isComplete = index <= activeIndex;
    const isActive = index === activeIndex;
    const cls = `timelineStep${isComplete ? " complete" : ""}${isActive ? " active" : ""}`;
    const step = `
      <div class="${cls}">
        <div class="timelineStepMarker"><span class="timelineStepDot"></span></div>
        <p class="timelineStepLabel">${escapeHtml(labeler(state))}</p>
      </div>`;
    const connector = index < states.length - 1
      ? `<div class="timelineConnector${index < activeIndex ? " complete" : ""}"></div>`
      : "";
    return [step, connector];
  });
  return `<div class="maturityTimeline workflowTimeline">${items.join("")}<div class="timelineArrow" aria-hidden="true"></div></div>`;
}

function workflowActionButton(transition, rule, label, workflow, part) {
  if (!transition) {
    return "";
  }
  const feedback = workflowFeedbackFor(workflow, part);
  const isRunning = feedback?.state === "running";
  return `
    <div class="workflowActions">
      <button class="iconButton primaryAction formAction" type="button" data-workflow-action="${escapeHtml(workflow)}" data-workflow-to="${escapeHtml(transition.to)}"${rule.ready && !isRunning ? "" : " disabled"}>${escapeHtml(isRunning ? "Working..." : label)}</button>
    </div>
  `;
}

function workflowActionButtons(actions, part) {
  const buttons = actions
    .filter((action) => action.transition)
    .map((action) => {
      const feedback = workflowFeedbackFor(action.workflow, part);
      const isRunning = feedback?.state === "running";
      const className = action.danger ? "iconButton formAction dangerAction" : "iconButton primaryAction formAction";
      return `<button class="${className}" type="button" data-workflow-action="${escapeHtml(action.workflow)}" data-workflow-to="${escapeHtml(action.transition.to)}"${action.rule.ready && !isRunning ? "" : " disabled"}>${escapeHtml(isRunning ? "Working..." : action.label)}</button>`;
    })
    .join("");
  return buttons ? `<div class="workflowActions">${buttons}</div>` : "";
}

function workflowFeedbackMessage(workflow, part) {
  const feedback = workflowFeedbackFor(workflow, part);
  if (!feedback?.message) {
    return "";
  }
  return `
    <div class="workflowFeedback ${escapeHtml(feedback.state)}" role="status">
      <span>${escapeHtml(feedback.message)}</span>
      ${feedback.action === "connect-github" ? `<button class="iconButton formAction workflowFeedbackAction" type="button" data-workflow-connect-github="${escapeHtml(workflow)}">Connect GitHub</button>` : ""}
    </div>
  `;
}

function workflowFeedbackFor(workflow, part) {
  return workflowFeedback[workflowFeedbackKey(workflow, part)];
}

function setWorkflowFeedback(workflow, part, state, message, options = {}) {
  workflowFeedback = {
    ...workflowFeedback,
    [workflowFeedbackKey(workflow, part)]: {
      state,
      message,
      action: options.action || "",
      updatedAt: Date.now()
    }
  };
}

function workflowFeedbackKey(workflow, part) {
  const scope = workflow === "maturity" ? part?.part_number : partObjectLabel(part);
  return `${workflow}:${scope || "none"}`;
}

function workflowCriteriaList(rule) {
  const items = rule.criteria.map((item) => `
    <li class="${item.met ? "met" : "blocked"}">
      <span class="workflowCriterionIcon" aria-hidden="true"></span>
      <span>${escapeHtml(item.label)}</span>
    </li>
  `).join("");
  return `<ul class="workflowCriteria">${items}</ul>`;
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
  return traceabilityValue(part) || "Not set";
}

function legacyPartNumberValue(part) {
  return String(part?.legacy_part_number || part?.legacyPartNumber || part?.part_properties?.legacy_part_number || part?.part_properties?.legacyPartNumber || "").trim();
}

function optionalPartPropertyValue(part, key) {
  return String(part?.[key] ?? part?.part_properties?.[key] ?? "").trim();
}

function traceabilityValue(part) {
  return normalizeTraceability(part?.traceability);
}

function normalizeTraceability(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "SERIAL" || normalized.includes("SERIAL")) {
    return "SERIAL";
  }
  if (normalized === "LOT" || normalized.includes("LOT") || normalized.includes("BATCH")) {
    return "LOT";
  }
  return "";
}

function documentUrl(part, kind) {
  if (kind === "onshape") {
    return (part.onshape ?? [])[0]?.url || "";
  }
  if (kind === "work") {
    return (part.work_instructions ?? [])[0]?.url || "";
  }
  const documents = [...(part.file_links ?? []), ...(part.documents ?? []), ...(part.attachments ?? [])];
  const match = documents.find((document) => {
    const haystack = [document.type, document.title, document.name].filter(Boolean).join(" ").toLowerCase();
    if (kind === "drive") {
      return haystack.includes("drive") || String(document.url || "").includes("drive.google.com");
    }
    return false;
  });
  return match?.url || (kind === "drive" ? documents[0]?.url || "" : "");
}

function attachmentsForPart(part) {
  const seen = new Set();
  return [...(part.attachments ?? []), ...(part.documents ?? [])].filter((record) => {
    const key = `${record?.url || ""}|${record?.title || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function renderAttachmentSections(part, { editable = false } = {}) {
  const groups = groupedAttachments(part);
  if (!groups.length) {
    return `
      <section class="propertySection attachmentTypeSection">
        <h3>Attachments</h3>
        <p class="description">No attachments linked.</p>
      </section>
    `;
  }
  return groups
    .map(
      ([type, records]) => `
        <section class="propertySection attachmentTypeSection">
          <h3>${escapeHtml(type)}</h3>
          <div class="referenceList">
            ${records.map((record) => fileReference(record, { editable })).join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function groupedAttachments(part) {
  const groups = new Map();
  attachmentsForPart(part).forEach((record) => {
    const type = attachmentTypeLabel(record);
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(record);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function attachmentTypeLabel(record) {
  const raw = String(record?.type || record?.category || "OTHER ATTACHMENTS").trim();
  const normalized = raw
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toUpperCase();
  if (attachmentTypeOptions().includes(normalized)) return normalized;
  if (normalized.includes("ANOMALY") && normalized.includes("ANALYSIS")) return "ANOMALY ANALYSIS";
  if (normalized.includes("ANALYSIS")) return "ANALYSIS";
  if (normalized.includes("CAD") || normalized.includes("ONSHAPE") || normalized.includes("MODEL")) return "CAD MODEL";
  if (normalized.includes("DESIGN") && normalized.includes("REPORT")) return "DESIGN REPORT";
  if (normalized.includes("DRAWING")) return "DRAWING";
  if (normalized.includes("SCHEMATIC")) return "SCHEMATIC";
  if (normalized.includes("TEST") && normalized.includes("PLAN")) return "TEST PLAN";
  if (normalized.includes("TEST") && normalized.includes("SPEC")) return "TEST SPECIFICATION";
  if (normalized.includes("TEST")) return "TEST REPORT";
  if (normalized.includes("MATERIAL") && normalized.includes("SPEC")) return "MATERIAL SPECIFICATION";
  if (normalized.includes("PROCESS") && normalized.includes("SPEC")) return "PROCESS SPECIFICATION";
  if (normalized.includes("SPEC")) return "SPECIFICATION";
  if (normalized.includes("MANUAL")) return "USER MANUAL";
  if (normalized.includes("DRIVE") || normalized.includes("FILE") || normalized.includes("DOCUMENT")) return "DRAWING";
  return "OTHER ATTACHMENTS";
}

function attachmentRecordKey(record) {
  return btoa(unescape(encodeURIComponent(`${record?.url || ""}|${record?.title || record?.name || ""}|${record?.type || ""}`)));
}

function createdBy(part) {
  return part.created_by || part.author || part.owner || "Not set";
}

function updatedBy(part) {
  return part.updated_by || part.last_updated_by || part.owner || "Not set";
}

function activityHistoryForPart(part) {
  const explicit = asArray(part?.activity_history || part?.revision_properties?.activity_history);
  if (explicit.length) {
    return explicit.map(normalizeActivityEntry).filter(Boolean);
  }
  return legacyActivityHistory(part);
}

function legacyActivityHistory(part) {
  if (!part) {
    return [];
  }
  const entries = [];
  if (part.created_at) {
    entries.push(normalizeActivityEntry({
      id: activityId(part, "create", part.created_at),
      action: "create",
      actor: createdBy(part),
      performed_at: part.created_at,
      detail: `Created ${partObjectLabel(part)}`
    }));
  }
  if (part.updated_at && part.updated_at !== part.created_at) {
    entries.push(normalizeActivityEntry({
      id: activityId(part, "updated_properties", part.updated_at),
      action: "updated_properties",
      actor: updatedBy(part),
      performed_at: part.updated_at,
      detail: part.change_summary || `Updated ${partObjectLabel(part)}`
    }));
  }
  return entries;
}

function normalizeActivityEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  return {
    id: entry.id || activityId(entry, entry.action, entry.performed_at),
    action: normalizeActivityAction(entry.action),
    actor: entry.actor || entry.user || entry.updated_by || "Unknown user",
    performed_at: entry.performed_at || entry.timestamp || entry.date || "",
    detail: entry.detail || entry.summary || ""
  };
}

function normalizeActivityAction(action) {
  const normalized = String(action || "").trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
  const actions = {
    create: "create",
    created: "create",
    updated_properties: "updated_properties",
    update_properties: "updated_properties",
    updated_maturity: "updated_maturity",
    update_maturity: "updated_maturity",
    updated_revision: "updated_revision",
    update_revision: "updated_revision",
    created_revision: "created_revision",
    create_revision: "created_revision",
    updated_attachments: "updated_attachments",
    update_attachments: "updated_attachments"
  };
  return actions[normalized] || normalized || "updated_properties";
}

function activityActionLabel(action) {
  const labels = {
    create: "Create",
    updated_properties: "Updated Properties",
    updated_maturity: "Updated Maturity",
    updated_revision: "Updated Revision",
    created_revision: "Created Revision",
    updated_attachments: "Updated Attachments"
  };
  return labels[normalizeActivityAction(action)] || stateLabel(action);
}

function activityDefaultDetail(item) {
  return `${activityActionLabel(item.action)} by ${item.actor || "Unknown user"}`;
}

function formatActivityTimestamp(value) {
  if (!value) {
    return "Unknown time";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function activityTimestamp() {
  return new Date().toISOString();
}

function activityId(part, action, timestamp = activityTimestamp()) {
  const scope = partKey(part) || `${part?.part_number || "part"}^${part?.revision || "rev"}`;
  const random = Math.random().toString(36).slice(2, 8);
  return `${scope}:${normalizeActivityAction(action)}:${String(timestamp).replace(/[^0-9A-Za-z]/g, "")}:${random}`;
}

function appendPartActivity(part, action, detail, options = {}) {
  if (!part) {
    return null;
  }
  const entry = normalizeActivityEntry({
    id: options.id || activityId(part, action, options.performedAt),
    action,
    actor: options.actor || currentEditorName(),
    performed_at: options.performedAt || activityTimestamp(),
    detail
  });
  const explicit = asArray(part.activity_history || part.revision_properties?.activity_history)
    .map(normalizeActivityEntry)
    .filter(Boolean);
  const history = [...explicit, entry].filter(Boolean);
  part.activity_history = history;
  part.revision_properties = {
    ...(part.revision_properties || {}),
    activity_history: history
  };
  return entry;
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

function revisionStatusValue(part) {
  const state = String(part?.release_status || part?.lifecycle_state || "draft").toLowerCase();
  return state === "in_review" ? "release_candidate" : state;
}

function revisionStatusText(state) {
  return releaseStatusLabel({ release_status: state, lifecycle_state: state });
}

function isDraftRevision(part) {
  return revisionStatusValue(part) === "draft";
}

function draftRevisionsForPart(partNumber, { excludeKey = "" } = {}) {
  return parts.filter((part) => part.part_number === partNumber && partKey(part) !== excludeKey && isDraftRevision(part));
}

function isUnreleasedRevision(part) {
  return ["draft", "release_candidate"].includes(revisionStatusValue(part));
}

function unreleasedRevisionsForPart(partNumber, { excludeKey = "" } = {}) {
  return parts.filter((part) => part.part_number === partNumber && partKey(part) !== excludeKey && isUnreleasedRevision(part));
}

function previousRevisionsForPart(part) {
  return sortRevisions(parts.filter((candidate) => candidate.part_number === part.part_number && compareRevisionLabels(candidate.revision, part.revision) < 0));
}

function revisionStatusRank(state) {
  const ranks = {
    draft: 0,
    release_candidate: 1,
    released: 2,
    obsolete: 3
  };
  return ranks[revisionStatusValue({ release_status: state, lifecycle_state: state })] ?? 0;
}

function priorRevisionsAtLeast(part, target) {
  const targetRank = revisionStatusRank(target);
  return previousRevisionsForPart(part).every((revisionPart) => revisionStatusRank(revisionStatusValue(revisionPart)) >= targetRank);
}

function currentEditorName() {
  return localStorage.getItem("peakDefaultOwner") || "engineering@example.com";
}

function maturityStageLabel(part) {
  const maturity = String(part.maturity || "").toLowerCase();
  if (maturity === "npi") {
    return "NPI";
  }
  if (maturity === "production") {
    return "Prod";
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
    return "Prod";
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
  const maturity = String(part?.maturity || "").toLowerCase();
  if (maturity === "npi" || maturity === "production" || maturity === "sunset" || maturity === "obsolete" || maturity === "development") {
    return maturity;
  }
  const state = String(part?.lifecycle_state || "").toLowerCase();
  if (state === "npi") return "npi";
  if (state === "released" || state === "production") return "production";
  if (state === "sunset") return "sunset";
  if (state === "obsolete") return "obsolete";
  return "development";
}

function maturityStageText(state) {
  const labels = {
    development: "Development",
    npi: "NPI",
    production: "Prod",
    sunset: "Sunset",
    obsolete: "Obsolete"
  };
  return labels[state] || stateLabel(state);
}

function nextRevisionTransition(part) {
  const current = revisionStatusValue(part);
  const transitions = {
    draft: { to: "release_candidate", mode: "direct" },
    release_candidate: { to: "released", mode: "mr" },
    released: { to: "obsolete", mode: "mr" }
  };
  return transitions[current] || null;
}

function nextMaturityTransition(part) {
  const current = maturityStageValue(part);
  const transitions = {
    development: { to: "npi", mode: "mr" },
    npi: { to: "production", mode: "mr" },
    production: { to: "sunset", mode: "mr" },
    sunset: { to: "obsolete", mode: "mr" }
  };
  return transitions[current] || null;
}

function revisionWorkflowRule(part, target) {
  if (target === "release_candidate") {
    return workflowRule([
      ["Current revision is Draft", revisionStatusValue(part) === "draft"],
      ["No other unreleased revision exists", unreleasedRevisionsForPart(part.part_number, { excludeKey: partKey(part) }).length === 0],
      ["Previous revisions are at least Release Candidate", priorRevisionsAtLeast(part, target)],
      ["All required properties are set", partPropertiesComplete(part)]
    ]);
  }
  if (target === "draft") {
    return workflowRule([
      ["Current revision is Release Candidate", revisionStatusValue(part) === "release_candidate"]
    ]);
  }
  if (target === "released") {
    return workflowRule([
      ["Current revision is Release Candidate", revisionStatusValue(part) === "release_candidate"],
      ["Previous revisions are at least Released", priorRevisionsAtLeast(part, target)],
      ["Google Drive, Onshape, and WI links are present", allRequiredLinksPresent(part)]
    ]);
  }
  if (target === "obsolete") {
    return workflowRule([
      ["Current revision is Released", revisionStatusValue(part) === "released"],
      ["Previous revisions are Obsolete", priorRevisionsAtLeast(part, target)]
    ]);
  }
  if (target === "delete") {
    return workflowRule([
      ["Current revision is Draft", isDraftRevision(part)]
    ]);
  }
  return workflowRule([]);
}

function maturityWorkflowRule(part, target) {
  if (target === "npi") {
    return workflowRule([
      ["Current maturity is Development", maturityStageValue(part) === "development"],
      ["At least one revision is Released", releasedRevisionsForPart(part.part_number).length > 0]
    ]);
  }
  if (target === "production") {
    return workflowRule([
      ["Current maturity is NPI", maturityStageValue(part) === "npi"],
      ["All required properties are set", partPropertiesComplete(part)]
    ]);
  }
  if (target === "sunset") {
    return workflowRule([
      ["Current maturity is Prod", maturityStageValue(part) === "production"]
    ]);
  }
  if (target === "obsolete") {
    return workflowRule([
      ["Current maturity is Sunset", maturityStageValue(part) === "sunset"]
    ]);
  }
  return workflowRule([]);
}

function workflowRule(pairs) {
  const criteria = pairs.map(([label, met]) => ({ label, met: Boolean(met) }));
  return {
    ready: criteria.every((item) => item.met),
    criteria
  };
}

function partPropertiesComplete(part) {
  return [
    part.part_number,
    part.revision,
    part.name,
    part.description,
    traceabilityValue(part),
    createdBy(part) !== "Not set" ? createdBy(part) : "",
    part.created_at,
    updatedBy(part) !== "Not set" ? updatedBy(part) : "",
    part.updated_at
  ].every((value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized && normalized !== "not set";
  });
}

function allRequiredLinksPresent(part) {
  return ["drive", "onshape", "work"].every((kind) => Boolean(documentUrl(part, kind)));
}

function releasedRevisionsForPart(partNumber) {
  return parts.filter((part) => part.part_number === partNumber && revisionStatusValue(part) === "released");
}

function revisionWorkflowMrTitle(part, target = "") {
  const suffix = target ? ` to ${revisionStatusText(target)}` : "";
  return `${part.part_number}^${part.revision || "A"}${suffix}`;
}

function maturityWorkflowMrTitle(part, maturity) {
  return `${part.part_number} - ${maturityStageText(maturity)}`;
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

function replaceFirstLinkedRecord(records, fallback, url, title, extra = {}) {
  const next = [...asArray(records)];
  if (!url) {
    next.shift();
    return next;
  }
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
  const stages = ["Development", "NPI", "Prod", "Sunset", "Obsolete"];
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
        <table class="detailTable revisionHistoryTable">
          <thead>
            <tr>
              <th scope="col">Object</th>
              <th scope="col">Status</th>
              <th scope="col">Updated By</th>
              <th scope="col">Updated</th>
              <th scope="col">Created By</th>
              <th scope="col">Created</th>
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

function renderWhereUsedHistory(part) {
  const rows = whereUsedRows(part);
  return `
    <section class="propertySection">
      <h3>Where Used</h3>
      ${rows.length ? `
        <div class="detailTableWrap">
          <table class="detailTable revisionHistoryTable">
            <thead>
              <tr>
                <th scope="col">Object</th>
                <th scope="col">Status</th>
                <th scope="col">Updated By</th>
                <th scope="col">Updated</th>
                <th scope="col">Created By</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(whereUsedRow).join("")}
            </tbody>
          </table>
        </div>
      ` : `<p class="empty">Not used in any BOM.</p>`}
    </section>
  `;
}

function whereUsedRows(part) {
  return sortParts(whereUsed(part)).map((parent) => ({
    partNumber: parent.part_number,
    objectId: partKey(parent),
    revision: parent.revision,
    status: parent.release_status || parent.lifecycle_state,
    updatedBy: updatedBy(parent),
    updatedAt: parent.updated_at,
    createdBy: createdBy(parent),
    createdAt: parent.created_at
  }));
}

function whereUsedRow(parent) {
  const objectLabel = `${parent.partNumber || "Part"}^${parent.revision || "V1"}`;
  return `
    <tr>
      <td><button class="linkButton" type="button" data-part-number="${escapeHtml(parent.objectId || objectLabel)}">${escapeHtml(objectLabel)}</button></td>
      <td>${escapeHtml(releaseStatusLabel({ lifecycle_state: parent.status, release_status: parent.status }))}</td>
      <td>${escapeHtml(parent.updatedBy || "Not set")}</td>
      <td>${escapeHtml(parent.updatedAt || "Not set")}</td>
      <td>${escapeHtml(parent.createdBy || "Not set")}</td>
      <td>${escapeHtml(parent.createdAt || "Not set")}</td>
    </tr>
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
      <td><button class="linkButton" type="button" data-part-number="${escapeHtml(revision.objectId || objectLabel)}" data-history-revision="true">${escapeHtml(objectLabel)}</button></td>
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

function fileReference(record, { editable = false } = {}) {
  const title = record.title;
  const removeButton = editable
    ? `<button class="iconButton attachmentRemoveButton" type="button" data-remove-attachment="${escapeHtml(attachmentRecordKey(record))}" title="Remove attachment" aria-label="Remove attachment"></button>`
    : "";
  return `
    <article class="reference">
      <div class="referenceHeader">
        <strong><a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></strong>
        ${removeButton}
      </div>
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
    (candidate.bom ?? []).some((item) => bomItemUsesPart(item, part))
  );
}

function bomItemUsesPart(item, part) {
  if (!item || !part) {
    return false;
  }
  const targetKey = partKey(part);
  const objectChild = item.child_object_id ? findPartByKey(item.child_object_id) : null;
  if (objectChild) {
    return partKey(objectChild) === targetKey;
  }
  if (item.child_object_id && item.child_object_id === targetKey) {
    return true;
  }
  if (item.child_part_number !== part.part_number) {
    return false;
  }
  if (item.child_revision) {
    return String(item.child_revision) === String(part.revision || "V1");
  }
  const child = resolveBomChild(item);
  return child ? partKey(child) === targetKey : true;
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
    navigationTree.innerHTML = "";
    return;
  }

  if (activeNavMode === "table" || activeNavMode === "history") {
    navigationTree.innerHTML = "";
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
          const count = parts.filter((part) => lifecycleMatches(revisionStatusValue(part), state)).length;
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
      ${activePartEditMode && activeBomAddParent === partKey(rootPart) ? renderBomAddRow(rootPart) : ""}
      ${childRows || '<div class="treeEmpty">No child components</div>'}
    </div>
  `;
}

function renderBomAddRow(parentPart) {
  return `
    <div class="treeNode bomNode bomAddRow" data-bom-add-parent="${escapeHtml(partKey(parentPart))}" role="row">
      <input class="tableInput bomAddPartInput" data-bom-add-field="part" placeholder="Part number or Part ID">
      <span class="bomName">New component</span>
      <div class="bomAddControls">
        <input class="tableInput bomQtyInput" data-bom-add-field="quantity" type="number" min="0.001" step="any" value="1">
        <button class="iconButton primaryAction bomAddSaveButton" type="button" data-save-bom-add>Save</button>
        <button class="iconButton bomAddCancelButton" type="button" data-cancel-bom-add>Cancel</button>
      </div>
    </div>
  `;
}

function renderBomChildren(parentPart, depth, visited) {
  return (parentPart.bom ?? [])
    .map((item) => {
      const child = resolveBomChild(item);
      const childId = child ? partKey(child) : item.child_object_id || item.child_part_number;
      const active = selectedBomPartNumber === childId ? " active" : "";
      const hasChildren = Boolean(child?.bom?.length);
      const collapsed = hasChildren && collapsedBomNodes.has(childId);
      const isRootBomChild = partKey(parentPart) === openedPartNumber;
      const canEditThisItem = activePartEditMode && isRootBomChild;
      const children =
        child && hasChildren && !collapsed && !visited.has(partKey(child))
          ? renderBomChildren(child, depth + 1, new Set([...visited, partKey(child)]))
          : "";
      const toggle = hasChildren
        ? `<button class="bomCollapseButton${collapsed ? " collapsed" : ""}" type="button" data-toggle-bom-collapse="${escapeHtml(childId)}" title="${collapsed ? "Expand subassembly" : "Collapse subassembly"}" aria-label="${collapsed ? "Expand subassembly" : "Collapse subassembly"}"></button>`
        : '<span class="bomCollapseSpacer" aria-hidden="true"></span>';

      const row = canEditThisItem
          ? `
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" data-bom-part-number="${escapeHtml(childId)}" role="row" draggable="true">
            <div class="bomItem bomItemCell">${toggle}<button class="linkButton" type="button" data-bom-part-number="${escapeHtml(childId)}">${escapeHtml(child ? partObjectLabel(child) : item.child_part_number)}</button></div>
            <span class="bomName">${escapeHtml(child?.name ?? "External component")}</span>
            <input class="tableInput bomQtyInput" value="${escapeHtml(item.quantity)}" data-bom-qty="${escapeHtml(childId)}">
          </div>
        `
        : `
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" data-bom-part-number="${escapeHtml(childId)}" role="row">
            <div class="bomItem bomItemCell">${toggle}<button class="linkButton" type="button" data-bom-part-number="${escapeHtml(childId)}">${escapeHtml(child ? partObjectLabel(child) : item.child_part_number)}</button></div>
            <span class="bomName">${escapeHtml(child?.name ?? "External component")}</span>
            <span class="bomQty">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</span>
          </div>
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

function projectDriveUrl(project) {
  return customProjects.find((candidate) => candidate.name === project)?.drive_url || "";
}

function projectAllowsCustomPartNumbers(project) {
  return customProjects.find((candidate) => candidate.name === project)?.allow_custom_part_numbers === true;
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
  return `${prefix}${next}`;
}

function applyNavMode(mode) {
  statusMessage = "";
  openedPartNumber = null;
  selectedBomPartNumber = null;
  activePartEditMode = false;
  activeAttachmentEditMode = false;
  activeProjectEditMode = false;
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

  if (mode === "create" || mode === "projects" || mode === "history" || mode === "table" || mode === "report" || mode === "settings") {
    searchInput.value = "";
    stateFilter.value = "";
    projectFilter.value = "";
  }
}

function openSelectedPart({ newTab = false, editMode = false } = {}) {
  if (!selectedPartNumber) {
    return;
  }
  if (!newTab && preventPartNavigationDuringEdit(selectedPartNumber)) {
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
  activeAttachmentEditMode = false;
  activeAttachmentDraftCount = 0;
  activeNavMode = "part";
  window.history.replaceState({}, "", url);
  renderApp();
}

function moveToPart(partNumber, { editMode = false } = {}) {
  if (preventPartNavigationDuringEdit(partNumber)) {
    return;
  }
  const part = findPartByKey(partNumber);
  if (!part) {
    return;
  }
  const objectId = partKey(part);
  selectedPartNumber = objectId;
  openedPartNumber = objectId;
  selectedBomPartNumber = objectId;
  activePartEditMode = editMode;
  activeAttachmentEditMode = false;
  activeAttachmentDraftCount = 0;
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
  const isSinglePane = ["create", "settings"].includes(activeNavMode);
  const isReportPane = activeNavMode === "report";
  const isProjectPane = activeNavMode === "projects";
  const isTablePane = activeNavMode === "table" || activeNavMode === "history";
  const isHomePane = activeNavMode === "home";
  document.body.classList.toggle("openedPartMode", isOpened);
  document.body.classList.toggle("searchMode", !isOpened);
  workspace.classList.toggle("homeWorkspace", isHomePane);
  workspace.classList.toggle("partWorkspace", isOpened);
  workspace.classList.toggle("partReadOnlyWorkspace", isOpened);
  workspace.classList.toggle("singlePaneWorkspace", isSinglePane);
  workspace.classList.toggle("reportWorkspace", isReportPane);
  workspace.classList.toggle("projectWorkspace", isProjectPane);
  workspace.classList.toggle("tabularWorkspace", isTablePane);

  navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.navMode === activeNavMode);
  });
  repoBadge.hidden = !hasRepoChanges;
  renderSearchSuggestions();
}

function hidePartContextMenu() {
  partContextMenu.hidden = true;
  partContextMenu.dataset.partNumber = "";
  partContextMenu.dataset.bomPartNumber = "";
  partContextMenu.dataset.bomParentNumber = "";
  partContextMenu.dataset.menuMode = "";
}

function showPartContextMenu(event, partNumber) {
  event.preventDefault();
  selectedPartNumber = partNumber;
  partContextMenu.dataset.menuMode = "part";
  partContextMenu.dataset.partNumber = partNumber;
  partContextMenu.dataset.bomPartNumber = "";
  partContextMenu.innerHTML = `
    <button type="button" role="menuitem" data-context-action="open">Open</button>
    <button type="button" role="menuitem" data-context-action="open-new-tab">Open in New Tab</button>
    <button type="button" role="menuitem" data-context-action="edit">Edit</button>
  `;
  positionContextMenu(event);
}

function showBomContextMenu(event, childIdentifier) {
  event.preventDefault();
  const rootPart = getOpenedPart();
  const owner = childIdentifier ? findBomItemOwner(childIdentifier) : null;
  const isDirectRootChild = Boolean(owner && rootPart && owner.parent === rootPart);
  partContextMenu.dataset.menuMode = "bom";
  partContextMenu.dataset.partNumber = "";
  partContextMenu.dataset.bomPartNumber = childIdentifier || "";
  partContextMenu.dataset.bomParentNumber = "";
  partContextMenu.innerHTML = `
    <button type="button" role="menuitem" data-context-action="bom-add">Add Component</button>
    ${isDirectRootChild ? '<button type="button" role="menuitem" data-context-action="bom-delete">Delete Component</button>' : ""}
  `;
  positionContextMenu(event);
}

function positionContextMenu(event) {
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
  if (preventPartNavigationDuringEdit(row.dataset.partNumber)) {
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

navigationTree.addEventListener("contextmenu", (event) => {
  if (!activePartEditMode || activeNavMode !== "part" || event.target.closest("input, select")) {
    return;
  }
  if (!event.target.closest(".bomGrid")) {
    return;
  }
  const bomNode = event.target.closest("[data-bom-part-number]");
  const childIdentifier = bomNode?.classList.contains("root") ? "" : bomNode?.dataset.bomPartNumber || "";
  if (childIdentifier) {
    const owner = findBomItemOwner(childIdentifier);
    if (!owner || owner.parent !== getOpenedPart()) {
      event.preventDefault();
      statusMessage = "Open the subassembly to edit its BOM";
      renderApp();
      return;
    }
  }
  showBomContextMenu(event, childIdentifier);
});

partsList.addEventListener("input", (event) => {
  if (event.target.matches("#newPartBasedOn")) {
    renderBasedOnSuggestions(event.target.value);
    return;
  }
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
  if (event.target.closest("#revisionSourcePart, #newRevisionMinor")) {
    updateNewRevisionValue();
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

function updateNewRevisionValue() {
  const partNumber = document.querySelector("#revisionSourcePart")?.value;
  const source = latestRevisionForPart(partNumber);
  const isMinor = document.querySelector("#newRevisionMinor")?.checked === true;
  const revisionInput = document.querySelector("#newRevisionValue");
  if (revisionInput) {
    revisionInput.value = nextRevisionForPart(source, { minor: isMinor });
  }
}

partsList.addEventListener("dblclick", (event) => {
  if (event.target.closest("button, input, select, textarea")) {
    return;
  }
  const row = event.target.closest("[data-part-number]");
  if (!row) {
    return;
  }
  if (preventPartNavigationDuringEdit(row.dataset.partNumber)) {
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
  const projectRow = event.target.closest("[data-project-name]");
  if (projectRow && activeNavMode === "projects") {
    event.preventDefault();
    selectedProjectName = projectRow.dataset.projectName;
    activeProjectEditMode = false;
    renderApp();
    return;
  }
  const row = event.target.closest("[data-part-number]");
  if (!row) {
    return;
  }
  event.preventDefault();
  if (preventPartNavigationDuringEdit(row.dataset.partNumber)) {
    return;
  }
  selectedPartNumber = row.dataset.partNumber;
  if (event.key === "Enter") {
    openSelectedPart({ newTab: true });
  } else {
    renderApp();
  }
});

partDetail.addEventListener("click", (event) => {
  const cancelProjectEdit = event.target.closest("[data-cancel-project-edit]");
  if (cancelProjectEdit) {
    activeProjectEditMode = false;
    renderApp();
    return;
  }

  const saveSelectedProject = event.target.closest("[data-save-selected-project]");
  if (saveSelectedProject) {
    saveSelectedProjectFromDetail(saveSelectedProject.dataset.saveSelectedProject);
    return;
  }

  const removeNewAttachment = event.target.closest("[data-remove-new-attachment]");
  if (removeNewAttachment) {
    removeNewAttachment.closest("[data-attachment-row]")?.remove();
    return;
  }

  const removeAttachment = event.target.closest("[data-remove-attachment]");
  if (removeAttachment) {
    removeAttachment.closest(".reference")?.classList.toggle("isPendingRemoval");
    removeAttachment.toggleAttribute("data-restore-attachment");
    removeAttachment.title = removeAttachment.hasAttribute("data-restore-attachment") ? "Restore attachment" : "Remove attachment";
    removeAttachment.setAttribute("aria-label", removeAttachment.title);
    return;
  }

  const addAttachmentField = event.target.closest("[data-add-attachment-field]");
  if (addAttachmentField) {
    activeAttachmentDraftCount += 1;
    const rows = document.querySelector("[data-attachment-edit-rows]");
    rows?.insertAdjacentHTML("beforeend", attachmentEditRow(activeAttachmentDraftCount - 1));
    return;
  }

  const partAction = event.target.closest("[data-part-action]");
  if (partAction) {
    if (activeNavMode === "projects") {
      handleProjectAction(partAction.dataset.partAction);
      return;
    }
    if (activeNavMode === "table") {
      handleTabularAction(partAction.dataset.partAction);
      return;
    }
    if (activeNavMode === "history") {
      handleHistoryAction(partAction.dataset.partAction);
      return;
    }
    handlePartAction(partAction.dataset.partAction);
    return;
  }

  const cancelPartEdit = event.target.closest("[data-cancel-part-edit]");
  if (cancelPartEdit) {
    activePartEditMode = false;
    activeAttachmentEditMode = false;
    activeAttachmentDraftCount = 0;
    if (openedPartNumber) {
      selectedPartNumber = openedPartNumber;
      selectedBomPartNumber = openedPartNumber;
    }
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }

  const saveOpenPartButton = event.target.closest("[data-save-open-part]");
  if (saveOpenPartButton) {
    handleSaveOpenPart(saveOpenPartButton.dataset.saveOpenPart);
    return;
  }

  const saveAttachmentsButton = event.target.closest("[data-save-attachments]");
  if (saveAttachmentsButton) {
    handleSaveAttachments(saveAttachmentsButton.dataset.saveAttachments);
    return;
  }

  const propertyTab = event.target.closest("[data-property-tab]");
  if (propertyTab) {
    activePropertyTab = propertyTab.dataset.propertyTab;
    if (activePropertyTab !== "attachments" || !activeAttachmentEditMode) {
      activeAttachmentDraftCount = 0;
    }
    renderApp();
    return;
  }

  const workflowButton = event.target.closest("[data-workflow-action]");
  if (workflowButton) {
    runWorkflowTransition(workflowButton.dataset.workflowAction, workflowButton.dataset.workflowTo).catch((error) => {
      statusMessage = `Workflow transition failed: ${error.message}`;
      renderApp();
    });
    return;
  }

  const workflowConnectGitHub = event.target.closest("[data-workflow-connect-github]");
  if (workflowConnectGitHub) {
    const workflow = workflowConnectGitHub.dataset.workflowConnectGithub;
    const part = getSelectedBomPart() || getOpenedPart() || findPartByKey(selectedPartNumber);
    connectGitHub({ workflow, part });
    return;
  }

  const button = event.target.closest("[data-part-number]");
  if (!button) {
    return;
  }
  moveToPart(button.dataset.partNumber);
});

function handlePartAction(action) {
  const part = getSelectedBomPart() || getOpenedPart();
  if (action === "pull-main") {
    pullMainFromRunner();
    return;
  }
  if (!part) {
    return;
  }

  if (activePartEditMode && ["edit-attachments", "submit-workflow"].includes(action)) {
    statusMessage = "Save or cancel the current part edit before changing views";
    selectedPartNumber = openedPartNumber;
    selectedBomPartNumber = openedPartNumber;
    renderApp();
    return;
  }

  if (action === "open-drive") {
    openPartLink(documentUrl(part, "drive"), "No Google Drive link is set for this part");
    return;
  }
  if (action === "open-onshape") {
    openPartLink(documentUrl(part, "onshape"), "No Onshape link is set for this part");
    return;
  }
  if (action === "open-work") {
    openPartLink(documentUrl(part, "work"), "No WI link is set for this part");
    return;
  }
  if (action === "edit-part") {
    if (!isDraftRevision(part)) {
      statusMessage = "Only draft revisions can be edited";
      renderApp();
      return;
    }
    activePartEditMode = true;
    activeAttachmentEditMode = false;
    activePropertyTab = "overview";
    activeAttachmentDraftCount = 0;
    selectedPartNumber = partKey(part);
    selectedBomPartNumber = partKey(part);
    openedPartNumber = partKey(part);
    window.history.replaceState({}, "", partUrl(partKey(part), { editMode: true }));
    renderApp();
    return;
  }
  if (action === "edit-attachments") {
    activePartEditMode = false;
    activeAttachmentEditMode = true;
    activePropertyTab = "attachments";
    activeAttachmentDraftCount = 0;
    statusMessage = `Editing attachments for ${partObjectLabel(part)}`;
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }
  if (action === "submit-workflow") {
    activePartEditMode = false;
    activeAttachmentEditMode = false;
    activePropertyTab = "workflow";
    statusMessage = `Opened workflow for ${partObjectLabel(part)}`;
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }
  if (action === "copy-part-id") {
    copyPartDetails(part);
  }
}

function handleProjectAction(action) {
  if (action === "pull-main") {
    pullMainFromRunner();
    return;
  }
  const project = selectedProjectName || projects()[0] || "";
  if (!project) {
    return;
  }
  if (action === "edit-project") {
    activeProjectEditMode = true;
    renderApp();
    return;
  }
  if (action === "open-project-folder") {
    openProjectFolder(project);
    return;
  }
  if (action === "open-project-drive") {
    openPartLink(projectDriveUrl(project), "No Google Drive link is set for this project");
  }
}

function handleTabularAction(action) {
  if (action === "pull-main") {
    pullMainFromRunner();
    return;
  }
  if (action === "push-tabular") {
    pushTabularChangesToRunner().catch((error) => {
      statusMessage = `Table push failed: ${error.message}`;
      renderApp();
    });
    return;
  }
  if (action === "import-tabular") {
    importCsvFromPicker();
    return;
  }
  if (action === "export-tabular-csv") {
    exportTabularCsv();
    return;
  }
  if (action === "export-tabular-json") {
    exportPartsJson();
  }
}

function handleHistoryAction(action) {
  if (action === "pull-main") {
    pullMainFromRunner();
  }
}

async function runWorkflowTransition(workflow, target) {
  const part = getSelectedBomPart() || getOpenedPart() || findPartByKey(selectedPartNumber);
  if (!part || !target) {
    return;
  }

  if (workflow === "revision") {
    await transitionRevisionWorkflow(part, target);
    return;
  }

  if (workflow === "maturity") {
    await transitionMaturityWorkflow(part, target);
  }
}

async function transitionRevisionWorkflow(part, target) {
  const transition =
    target === "draft" && revisionStatusValue(part) === "release_candidate"
      ? { to: "draft", mode: "direct", action: "revert" }
      : target === "delete" && isDraftRevision(part)
        ? { to: "delete", mode: "direct", action: "delete" }
        : nextRevisionTransition(part);
  if (!transition || transition.to !== target) {
    statusMessage = `Cannot transition ${partObjectLabel(part)} to ${revisionStatusText(target)} from ${releaseStatusLabel(part)}.`;
    renderApp();
    return;
  }
  const rule = revisionWorkflowRule(part, target);
  if (!rule.ready) {
    statusMessage = firstBlockedWorkflowMessage(rule);
    renderApp();
    return;
  }

  const label = partObjectLabel(part);
  const title = transition.mode === "mr" ? revisionWorkflowMrTitle(part, target) : target === "delete" ? `Delete ${label}` : `Set ${label} to ${revisionStatusText(target)}`;
  const performedAt = activityTimestamp();
  let files;
  let deletePaths = [];
  if (transition.mode === "direct") {
    if (target === "delete") {
      deletePaths = productDataDeletePathsForRevision(part);
      deleteDraftRevision(part, performedAt);
    } else {
      stampPartRevision(part, target);
      appendPartActivity(part, "updated_revision", `${label} revision status changed to ${revisionStatusText(target)}`, { performedAt });
      part.workflow = revisionWorkflowRecord(part, target, transition.mode, null);
      part.revision_properties = {
        ...(part.revision_properties || {}),
        workflow: part.workflow
      };
    }
    await persistLocalChanges();
    statusMessage = target === "delete"
      ? `${label} deleted locally; pushing to ${productDataGithubOwner}/${productDataGithubRepo}.`
      : `${label} set to ${revisionStatusText(target)}; pushing to ${productDataGithubOwner}/${productDataGithubRepo}.`;
    setWorkflowFeedback("revision", part, "running", `Pushing ${label} to main...`);
    files = productDataSnapshotFiles();
  } else {
    if (!(await ensureGitHubReadyForMergeRequest("revision", part))) {
      return;
    }
    const proposedParts = proposedRevisionWorkflowParts(part, target, transition.mode, performedAt);
    statusMessage = `${label} proposed for ${revisionStatusText(target)}; creating merge request "${title}".`;
    setWorkflowFeedback("revision", part, "running", `Creating merge request "${title}"...`);
    files = productDataSnapshotFiles(proposedParts);
  }
  renderApp();
  await pushWorkflowTransitionToRunner({
    workflow: "revision",
    mode: transition.mode,
    title,
    label,
    target,
    part,
    files,
    deletePaths
  });
}

async function transitionMaturityWorkflow(part, target) {
  const transition = nextMaturityTransition(part);
  if (!transition || transition.to !== target) {
    statusMessage = `Cannot transition ${part.part_number} to ${maturityStageText(target)} from ${maturityStageLabel(part)}.`;
    renderApp();
    return;
  }
  const rule = maturityWorkflowRule(part, target);
  if (!rule.ready) {
    statusMessage = firstBlockedWorkflowMessage(rule);
    renderApp();
    return;
  }

  if (!(await ensureGitHubReadyForMergeRequest("maturity", part))) {
    return;
  }
  const files = productDataSnapshotFiles(proposedMaturityWorkflowParts(part, target, activityTimestamp()));
  statusMessage = `${part.part_number} maturity proposed for ${maturityStageText(target)}; creating merge request "${maturityWorkflowMrTitle(part, target)}".`;
  setWorkflowFeedback("maturity", part, "running", `Creating merge request "${maturityWorkflowMrTitle(part, target)}"...`);
  renderApp();
  await pushWorkflowTransitionToRunner({
    workflow: "maturity",
    mode: "mr",
    title: maturityWorkflowMrTitle(part, target),
    label: `${part.part_number} maturity ${maturityStageText(target)}`,
    target,
    part,
    files
  });
}

async function ensureGitHubReadyForMergeRequest(workflow, part) {
  const status = await refreshGitHubAuthStatus({ render: false });
  if (status?.authenticated) {
    return true;
  }
  const message = `${status?.message || "GitHub is not connected."} ${status?.action || "Connect GitHub, then retry this workflow action."}`.trim();
  setWorkflowFeedback(workflow, part, "error", message, { action: "connect-github" });
  statusMessage = "Connect GitHub before creating a workflow merge request.";
  renderApp();
  return false;
}

function proposedRevisionWorkflowParts(part, target, mode, performedAt = activityTimestamp()) {
  const proposedParts = structuredCloneSafe(parts);
  const proposedPart = proposedParts.find((candidate) => partKey(candidate) === partKey(part));
  if (!proposedPart) {
    return proposedParts;
  }
  stampPartRevision(proposedPart, target);
  appendPartActivity(proposedPart, "updated_revision", `${partObjectLabel(proposedPart)} revision status changed to ${revisionStatusText(target)}`, { performedAt });
  proposedPart.workflow = revisionWorkflowRecord(proposedPart, target, mode, mode === "mr" ? revisionWorkflowMrTitle(proposedPart, target) : null);
  proposedPart.revision_properties = {
    ...(proposedPart.revision_properties || {}),
    workflow: proposedPart.workflow
  };
  return proposedParts;
}

function proposedMaturityWorkflowParts(part, target, performedAt = activityTimestamp()) {
  const proposedParts = structuredCloneSafe(parts);
  const editor = currentEditorName();
  const today = new Date().toISOString().slice(0, 10);
  proposedParts
    .filter((candidate) => candidate.part_number === part.part_number)
    .forEach((sibling) => {
      sibling.maturity = target;
      sibling.updated_by = editor;
      sibling.owner = editor;
      sibling.updated_at = today;
      appendPartActivity(sibling, "updated_maturity", `${sibling.part_number} maturity changed to ${maturityStageText(target)}`, { actor: editor, performedAt });
      sibling.workflow = maturityWorkflowRecord(sibling, target);
      sibling.part_properties = {
        ...(sibling.part_properties || {}),
        maturity: target,
        workflow: sibling.workflow
      };
    });
  return proposedParts;
}

function deleteDraftRevision(part, performedAt = activityTimestamp()) {
  const deletedKey = partKey(part);
  const partNumber = part.part_number;
  const remaining = parts.filter((candidate) => partKey(candidate) !== deletedKey);
  const siblingRevisions = remaining
    .filter((candidate) => candidate.part_number === partNumber)
    .map((candidate) => `${candidate.part_number}^${candidate.revision || "A"}.json`)
    .sort();
  remaining
    .filter((candidate) => candidate.part_number === partNumber)
    .forEach((candidate) => {
      candidate.part_properties = {
        ...(candidate.part_properties || {}),
        revisions: siblingRevisions
      };
    });
  appendPartActivity(part, "updated_revision", `${deletedKey} draft revision deleted`, { performedAt });
  parts = sortParts(remaining);
  const fallback = latestRevisionForPart(partNumber) || parts[0];
  selectedPartNumber = fallback ? partKey(fallback) : null;
  openedPartNumber = selectedPartNumber;
  selectedBomPartNumber = selectedPartNumber;
}

function revisionWorkflowRecord(part, status, approval, mrTitle) {
  return {
    type: "revision",
    status,
    approval,
    mr_title: mrTitle,
    updated_at: part.updated_at
  };
}

function maturityWorkflowRecord(part, status) {
  return {
    type: "maturity",
    status,
    approval: "mr",
    mr_title: maturityWorkflowMrTitle(part, status),
    updated_at: part.updated_at
  };
}

function stampPartRevision(part, status) {
  const editor = currentEditorName();
  const today = new Date().toISOString().slice(0, 10);
  part.release_status = status;
  part.updated_by = editor;
  part.owner = editor;
  part.updated_at = today;
  part.revision_properties = {
    ...(part.revision_properties || {}),
    release_status: status,
    owner: part.owner,
    updated_by: part.updated_by,
    updated_at: part.updated_at
  };
  delete part.revision_properties.lifecycle_state;
}

function firstBlockedWorkflowMessage(rule) {
  const blocked = rule.criteria.find((item) => !item.met);
  return blocked ? `Workflow blocked: ${blocked.label}.` : "Workflow transition is not available.";
}

function openProjectFolder(project) {
  activeNavMode = "home";
  activeProjectEditMode = false;
  searchInput.value = "";
  stateFilter.value = "";
  projectFilter.value = project;
  statusMessage = `Opened project folder ${project}`;
  renderApp();
}

function openPartLink(url, missingMessage) {
  if (!url) {
    statusMessage = missingMessage;
    renderApp();
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyPartDetails(part) {
  const text = `${part.part_number}^${part.revision || "A"} - ${part.name || ""}`;
  try {
    await navigator.clipboard.writeText(text);
    statusMessage = `Copied ${text}`;
  } catch {
    statusMessage = text;
  }
  renderApp();
}

navigationTree.addEventListener("click", (event) => {
  const button = event.target.closest("[data-save-bom-add], [data-cancel-bom-add], [data-toggle-bom-collapse], [data-focus-project], [data-focus-create], [data-focus-settings], [data-generate-part-number], [data-create-mode], [data-sync-action], [data-action], [data-bom-part-number], [data-filter-state], [data-filter-project], [data-clear-filters]");
  if (!button) {
    return;
  }

  if (button.dataset.saveBomAdd !== undefined) {
    addBomFromForm(activeBomAddParent || openedPartNumber);
    return;
  }

  if (button.dataset.cancelBomAdd !== undefined) {
    activeBomAddParent = "";
    renderApp();
    return;
  }

  if (button.dataset.toggleBomCollapse) {
    toggleBomCollapse(button.dataset.toggleBomCollapse);
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
    if (preventPartNavigationDuringEdit(button.dataset.bomPartNumber)) {
      return;
    }
    selectedBomPartNumber = button.dataset.bomPartNumber;
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

navigationTree.addEventListener("dragstart", (event) => {
  const row = event.target.closest(".bomNode.child[draggable='true']");
  if (!row || !activePartEditMode) {
    return;
  }
  row.classList.add("isDragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", row.dataset.bomPartNumber);
});

navigationTree.addEventListener("dragover", (event) => {
  const row = event.target.closest(".bomNode.child[draggable='true']");
  if (!row || !activePartEditMode) {
    return;
  }
  event.preventDefault();
  row.classList.add("isDropTarget");
  event.dataTransfer.dropEffect = "move";
});

navigationTree.addEventListener("dragleave", (event) => {
  event.target.closest(".bomNode.child")?.classList.remove("isDropTarget");
});

navigationTree.addEventListener("drop", (event) => {
  const row = event.target.closest(".bomNode.child[draggable='true']");
  if (!row || !activePartEditMode) {
    return;
  }
  event.preventDefault();
  const sourceId = event.dataTransfer.getData("text/plain");
  const targetId = row.dataset.bomPartNumber;
  clearBomDragState();
  reorderBomItem(sourceId, targetId);
});

navigationTree.addEventListener("dragend", clearBomDragState);

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
  if (!event.target.closest(".createFormDropWrap")) {
    const basedOnSuggestions = document.querySelector("#basedOnSuggestions");
    if (basedOnSuggestions) basedOnSuggestions.hidden = true;
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
  if (partContextMenu.dataset.menuMode === "bom") {
    const childIdentifier = partContextMenu.dataset.bomPartNumber;
    const parentIdentifier = partContextMenu.dataset.bomParentNumber || openedPartNumber;
    hidePartContextMenu();
    if (actionButton.dataset.contextAction === "bom-add") {
      activeBomAddParent = parentIdentifier;
      renderApp();
      return;
    }
    if (actionButton.dataset.contextAction === "bom-delete" && childIdentifier) {
      removeBomItem(childIdentifier);
      return;
    }
    return;
  }
  const partNumber = partContextMenu.dataset.partNumber;
  if (!partNumber) {
    return;
  }
  hidePartContextMenu();
  if (actionButton.dataset.contextAction === "open") {
    if (preventPartNavigationDuringEdit(partNumber)) {
      return;
    }
    selectedPartNumber = partNumber;
    openSelectedPart();
    return;
  }
  if (actionButton.dataset.contextAction === "open-new-tab") {
    window.open(partUrl(partNumber), "_blank", "noopener,noreferrer");
    return;
  }
  if (actionButton.dataset.contextAction === "edit") {
    if (preventPartNavigationDuringEdit(partNumber)) {
      return;
    }
    selectedPartNumber = partNumber;
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

tableHead.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-table-sort]");
  if (sortButton && activeNavMode === "table") {
    const column = sortButton.dataset.tableSort;
    activeTableSort = {
      column,
      direction: activeTableSort.column === column && activeTableSort.direction === "asc" ? "desc" : "asc"
    };
    renderApp();
    return;
  }
  const historySortButton = event.target.closest("[data-history-sort]");
  if (historySortButton && activeNavMode === "history") {
    const column = historySortButton.dataset.historySort;
    activeHistorySort = {
      column,
      direction: activeHistorySort.column === column && activeHistorySort.direction === "asc" ? "desc" : "asc"
    };
    renderApp();
  }
});

tableHead.addEventListener("input", (event) => {
  const filterInput = event.target.closest("[data-table-filter]");
  if (filterInput && activeNavMode === "table") {
    tableColumnFilters = {
      ...tableColumnFilters,
      [filterInput.dataset.tableFilter]: filterInput.value
    };
    const filterKey = filterInput.dataset.tableFilter;
    const cursor = filterInput.selectionStart ?? filterInput.value.length;
    renderSearchWorkspace();
    enableColumnResizing();
    syncChrome();
    const nextInput = tableHead.querySelector(`[data-table-filter="${CSS.escape(filterKey)}"]`);
    nextInput?.focus();
    nextInput?.setSelectionRange(cursor, cursor);
    return;
  }
  const historyFilterInput = event.target.closest("[data-history-filter]");
  if (!historyFilterInput || activeNavMode !== "history") {
    return;
  }
  historyColumnFilters = {
    ...historyColumnFilters,
    [historyFilterInput.dataset.historyFilter]: historyFilterInput.value
  };
  const filterKey = historyFilterInput.dataset.historyFilter;
  const cursor = historyFilterInput.selectionStart ?? historyFilterInput.value.length;
  renderSearchWorkspace();
  enableColumnResizing();
  syncChrome();
  const nextInput = tableHead.querySelector(`[data-history-filter="${CSS.escape(filterKey)}"]`);
  nextInput?.focus();
  nextInput?.setSelectionRange(cursor, cursor);
});

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
  const projectCard = event.target.closest("[data-project-name]");
  if (projectCard && activeNavMode === "projects") {
    selectedProjectName = projectCard.dataset.projectName;
    activeProjectEditMode = false;
    renderApp();
    return;
  }

  const basedOnButton = event.target.closest("[data-based-on-part]");
  if (basedOnButton) {
    const input = document.querySelector("#newPartBasedOn");
    if (input) input.value = basedOnButton.dataset.basedOnPart;
    const suggestions = document.querySelector("#basedOnSuggestions");
    if (suggestions) suggestions.hidden = true;
    return;
  }

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
    createProjectFromForm().catch((error) => {
      statusMessage = `Project create failed: ${error.message}`;
      renderApp();
    });
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
    handleSaveOpenPart(saveOpenPartButton.dataset.saveOpenPart);
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

  const connectGitHubButton = event.target.closest("[data-connect-github]");
  if (connectGitHubButton) {
    connectGitHub();
    return;
  }

  const refreshGitHubAuthButton = event.target.closest("[data-refresh-github-auth]");
  if (refreshGitHubAuthButton) {
    refreshGitHubAuthStatus();
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

function enablePaneResizing() {
  const leftHandle = document.querySelector(".resizeHandleLeft");
  const rightHandle = document.querySelector(".resizeHandleRight");

  function wire(handle, getDragHandler) {
    if (!handle || handle.dataset.paneResizeReady === "true") return;
    handle.dataset.paneResizeReady = "true";
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add("isResizing");
      const { onMove } = getDragHandler(event);
      function onUp(upEvent) {
        handle.releasePointerCapture(upEvent.pointerId);
        document.body.classList.remove("isResizing");
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      }
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  }

  wire(leftHandle, (event) => {
    const startX = event.clientX;
    const startWidth = document.querySelector(".navigatorPane")?.getBoundingClientRect().width ?? 270;
    return {
      onMove(e) {
        const workspaceWidth = workspace.getBoundingClientRect().width;
        const maxWidth = workspace.classList.contains("homeWorkspace") && window.matchMedia("(max-width: 1120px)").matches
          ? Math.max(160, workspaceWidth - 260)
          : 600;
        workspace.style.setProperty("--nav-width", `${clamp(startWidth + e.clientX - startX, 140, maxWidth)}px`);
      }
    };
  });

  wire(rightHandle, (event) => {
    const startX = event.clientX;
    const isProject = workspace.classList.contains("projectWorkspace");
    const isResponsiveSearch = workspace.classList.contains("homeWorkspace") && window.matchMedia("(max-width: 1120px)").matches;
    if (isResponsiveSearch) {
      const startY = event.clientY;
      const startHeight = document.querySelector(".resultsPane")?.getBoundingClientRect().height
        || document.querySelector(".navigatorPane")?.getBoundingClientRect().height
        || 260;
      return {
        onMove(e) {
          const workspaceHeight = workspace.getBoundingClientRect().height;
          const maxTopHeight = Math.max(160, workspaceHeight - 180);
          workspace.style.setProperty("--search-top-height", `${clamp(startHeight + e.clientY - startY, 120, maxTopHeight)}px`);
        }
      };
    }
    const startWidth = document.querySelector(".resultsPane")?.getBoundingClientRect().width ?? 280;
    return {
      onMove(e) {
        const width = clamp(startWidth + e.clientX - startX, 200, 900);
        if (isProject) {
          workspace.style.setProperty("--project-results-width", `${width}px`);
        } else {
          workspace.style.setProperty("--results-width", `${width}px`);
        }
      }
    };
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
    partNumber: canonicalPartNumber(document.querySelector("#newPartNumber")?.value.trim()),
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
    statusMessage = `${preflight} Created draft ${values.partNumber}^${values.revision}; open and save the draft to push through the local runner.`;
    renderProjectOptions();
    moveToPart(`${values.partNumber}^${values.revision}`);
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
  if (values.project && !projects().includes(values.project)) {
    return "Project must exist before assigning it to a part";
  }
  if (!values.partNumber) {
    return "Part number is required";
  }
  if (parts.some((part) => canonicalPartNumber(part.part_number) === canonicalPartNumber(values.partNumber))) {
    return `${values.partNumber} is already in use`;
  }
  if (values.project) {
    const projectNumberError = validatePartNumberForProject(values.partNumber, values.project);
    if (projectNumberError) {
      return projectNumberError;
    }
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
  const isMinor = document.querySelector("#newRevisionMinor")?.checked === true;
  const revision = nextRevisionForPart(source, { minor: isMinor });
  if (!source) {
    statusMessage = "Select an existing part before creating a revision";
    renderApp();
    return;
  }
  const existingUnreleased = unreleasedRevisionsForPart(partNumber)[0];
  if (existingUnreleased) {
    statusMessage = `Cannot create a new draft revision for ${partNumber}; ${partObjectLabel(existingUnreleased)} is already ${releaseStatusLabel(existingUnreleased)}.`;
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
    statusMessage = `${preflight} Created draft ${partNumber}^${revision}; open and save the draft to push through the local runner.`;
    moveToPart(`${partNumber}^${revision}`);
  }
}

async function createProjectFromForm() {
  const name = document.querySelector("#newProjectName")?.value.trim();
  const key = document.querySelector("#newProjectKey")?.value.trim();
  const owner = document.querySelector("#newProjectOwner")?.value.trim();
  const description = document.querySelector("#newProjectDescription")?.value.trim();
  const allowCustomPartNumbers = document.querySelector("#newProjectCustomNumbers")?.checked === true;
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
  customProjects.push({ name, key, owner, description, approvers, allow_custom_part_numbers: allowCustomPartNumbers });
  await persistLocalChanges();
  renderProjectOptions();
  activeCreateMode = "hub";
  statusMessage = `Created project ${name}; pushing to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  renderApp();
  await pushProjectsToRunner(`Create project ${name}`, name);
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
  appendPartActivity(part, "updated_properties", `Updated properties for ${partObjectLabel(part)}`);
  selectedPartNumber = partKey(part);
  parts = sortParts(parts);
  persistLocalChanges();
  statusMessage = `Saved ${part.part_number}`;
  renderApp();
}

function saveProjectFromRow(originalProject) {
  const fields = document.querySelectorAll(`[data-edit-project="${CSS.escape(originalProject)}"]`);
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.field, field.value.trim()]));
  saveProjectValues(originalProject, values).catch((error) => {
    statusMessage = `Project save failed: ${error.message}`;
    renderApp();
  });
}

function saveSelectedProjectFromDetail(originalProject) {
  const fields = document.querySelectorAll("[data-selected-project-field]");
  const values = Object.fromEntries([...fields].map((field) => [
    field.dataset.selectedProjectField,
    field.type === "checkbox" ? field.checked : field.value.trim()
  ]));
  activeProjectEditMode = false;
  saveProjectValues(originalProject, values).catch((error) => {
    statusMessage = `Project save failed: ${error.message}`;
    renderApp();
  });
}

async function saveProjectValues(originalProject, values) {
  const existing = customProjects.find((project) => project.name === originalProject);
  if (existing) {
    existing.key = values.key || existing.key || projectKey(originalProject);
    existing.owner = values.owner || "engineering@example.com";
    existing.description = values.description || "";
    existing.drive_url = values.drive_url || "";
    existing.allow_custom_part_numbers = values.allow_custom_part_numbers === true || values.allow_custom_part_numbers === "true";
    existing.approvers = (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean);
  } else {
    customProjects.push({
      name: originalProject,
      key: values.key || projectKey(originalProject),
      owner: values.owner || "engineering@example.com",
      description: values.description || "",
      drive_url: values.drive_url || "",
      allow_custom_part_numbers: values.allow_custom_part_numbers === true || values.allow_custom_part_numbers === "true",
      approvers: (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean)
    });
  }
  await persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Saved project ${originalProject}; pushing to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  renderApp();
  await pushProjectsToRunner(`Update project ${originalProject}`, originalProject);
}

async function handleSaveOpenPart(originalPartNumber) {
  try {
    await saveOpenPartFromForm(originalPartNumber);
  } catch (error) {
    statusMessage = `Save failed: ${error.message}`;
    renderApp();
  }
}

async function handleSaveAttachments(originalPartNumber) {
  try {
    await saveAttachmentsFromForm(originalPartNumber);
  } catch (error) {
    statusMessage = `Attachment save failed: ${error.message}`;
    renderApp();
  }
}

async function saveOpenPartFromForm(originalPartNumber) {
  const part = findPartByKey(originalPartNumber);
  if (!part) {
    return;
  }
  if (!isDraftRevision(part)) {
    activePartEditMode = false;
    statusMessage = "Only draft revisions can be edited";
    renderApp();
    return;
  }
  const fields = document.querySelectorAll("[data-open-part-field]");
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.openPartField, field.value.trim()]));
  values.name ??= part.name || "";
  values.description ??= part.description || "";
  values.legacy_part_number ??= legacyPartNumberValue(part);
  values.cost ??= optionalPartPropertyValue(part, "cost");
  values.mass ??= optionalPartPropertyValue(part, "mass");
  values.traceability ??= traceabilityValue(part) || "LOT";
  values.maturity = part.maturity || maturityStageValue(part);
  values.driveUrl ??= documentUrl(part, "drive");
  values.onshapeUrl ??= documentUrl(part, "onshape");
  values.workUrl ??= documentUrl(part, "work");
  values.approvers ??= (part.approvers ?? []).map((approver) => approver.name || approver).join(", ");
  values.change_summary ??= part.change_summary || "";
  if (!values.name) {
    statusMessage = "Part name is required";
    renderApp();
    return;
  }
  const siblingParts = parts.filter((candidate) => candidate.part_number === part.part_number);
  const editor = currentEditorName();
  const today = new Date().toISOString().slice(0, 10);
  const stableFileLinks = replaceFirstLinkedRecord(part.file_links, { type: "linked_file", google_drive_file_id: driveIdFromUrl(values.driveUrl) }, values.driveUrl, `${values.name} File`, {
    google_drive_file_id: driveIdFromUrl(values.driveUrl)
  });
  const stableOnshape = replaceFirstLinkedRecord(part.onshape, { type: "linked_object", document_id: onshapeDocumentIdFromUrl(values.onshapeUrl), workspace_id: "linked-workspace", element_id: "linked-element" }, values.onshapeUrl, `${values.name} Onshape`, {
    document_id: onshapeDocumentIdFromUrl(values.onshapeUrl),
    workspace_id: "linked-workspace",
    element_id: "linked-element"
  });
  const stableWorkInstructions = replaceFirstLinkedRecord(part.work_instructions, { type: "work_instruction" }, values.workUrl, `${values.name} WI`);
  siblingParts.forEach((sibling) => {
    sibling.name = values.name;
    sibling.description = values.description || "";
    sibling.legacy_part_number = values.legacy_part_number || "";
    sibling.cost = values.cost || "";
    sibling.mass = values.mass || "";
    sibling.traceability = normalizeTraceability(values.traceability) || "LOT";
    sibling.maturity = values.maturity || sibling.maturity || "development";
    sibling.file_links = stableFileLinks;
    sibling.onshape = stableOnshape;
    sibling.work_instructions = stableWorkInstructions;
    sibling.part_properties = {
      ...(sibling.part_properties || {}),
      schema: "peak.part.v2",
      part_number: sibling.part_number,
      name: sibling.name,
      description: sibling.description,
      legacy_part_number: sibling.legacy_part_number,
      cost: sibling.cost,
      mass: sibling.mass,
      project: sibling.project,
      traceability: traceabilityValue(sibling),
      maturity: sibling.maturity,
      onshape: sibling.onshape,
      work_instructions: sibling.work_instructions,
      file_links: sibling.file_links,
      tags: sibling.tags || [],
      revisions: siblingParts.map((revisionPart) => `${sibling.part_number}^${revisionPart.revision || "A"}.json`)
    };
  });
  const approvers = values.approvers
    ? values.approvers.split(",").map((name) => ({ name: name.trim() })).filter((approver) => approver.name)
    : [];
  part.release_status = revisionStatusValue(part);
  part.owner = editor;
  part.updated_by = editor;
  part.change_summary = values.change_summary || "";
  part.updated_at = today;
  part.approvers = approvers;
  appendPartActivity(part, "updated_properties", values.change_summary || `Updated properties for ${partObjectLabel(part)}`, {
    actor: editor
  });
  part.revision_properties = {
    ...(part.revision_properties || {}),
    schema: "peak.revision.v1",
    object_id: partKey(part),
    part_number: part.part_number,
    revision: part.revision || "A",
    release_status: part.release_status,
    owner: part.owner,
    created_by: part.created_by || part.owner,
    created_at: part.created_at,
    updated_by: part.updated_by,
    updated_at: part.updated_at,
    based_on: part.based_on || null,
    approvers: part.approvers,
    bom: part.bom || [],
    attachments: part.attachments || [],
    activity_history: part.activity_history || [],
    change_summary: part.change_summary
  };
  siblingParts.forEach((sibling) => {
    sibling.object_id = `${sibling.part_number}^${sibling.revision || "A"}`;
  });
  selectedPartNumber = partKey(part);
  selectedBomPartNumber = partKey(part);
  openedPartNumber = partKey(part);
  activePartEditMode = false;
  activeAttachmentEditMode = false;
  activeAttachmentDraftCount = 0;
  statusMessage = `Saved ${partObjectLabel(part)} locally; pushing draft edit to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  window.history.replaceState({}, "", partUrl(partKey(part)));
  renderProjectOptions();
  renderApp();
  await persistLocalChanges();
  await pushDraftPartChangesToRunner(part);
}

async function saveAttachmentsFromForm(originalPartNumber) {
  const part = findPartByKey(originalPartNumber);
  if (!part) {
    return;
  }
  const newAttachments = attachmentRowsFromForm();
  if (newAttachments === null) {
    renderApp();
    return;
  }
  const removedAttachmentKeys = attachmentRemovalKeysFromForm();
  const editor = currentEditorName();
  const today = new Date().toISOString().slice(0, 10);
  if (removedAttachmentKeys.length) {
    part.attachments = removeAttachmentRecords(part.attachments, removedAttachmentKeys);
    part.documents = removeAttachmentRecords(part.documents, removedAttachmentKeys);
  }
  if (newAttachments.length) {
    part.attachments = [...asArray(part.attachments), ...newAttachments];
  }
  part.owner = editor;
  part.updated_by = editor;
  part.updated_at = today;
  appendPartActivity(part, "updated_attachments", `Updated attachments for ${partObjectLabel(part)}`, {
    actor: editor
  });
  part.revision_properties = {
    ...(part.revision_properties || {}),
    schema: "peak.revision.v1",
    object_id: partKey(part),
    part_number: part.part_number,
    revision: part.revision || "A",
    release_status: revisionStatusValue(part),
    owner: part.owner,
    created_by: part.created_by || part.owner,
    created_at: part.created_at,
    updated_by: part.updated_by,
    updated_at: part.updated_at,
    based_on: part.based_on || null,
    approvers: part.approvers || [],
    bom: part.bom || [],
    attachments: part.attachments || [],
    activity_history: part.activity_history || [],
    change_summary: part.change_summary || "",
    workflow: part.workflow || part.revision_properties?.workflow || null
  };
  selectedPartNumber = partKey(part);
  selectedBomPartNumber = partKey(part);
  openedPartNumber = partKey(part);
  activeAttachmentEditMode = false;
  activeAttachmentDraftCount = 0;
  statusMessage = `Saved attachments for ${partObjectLabel(part)} locally; pushing to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  renderApp();
  await persistLocalChanges();
  await pushDraftPartChangesToRunner(part, { commitMessage: `Update attachments ${partObjectLabel(part)}` });
}

function attachmentRowsFromForm() {
  const rows = [...document.querySelectorAll("[data-attachment-row]")];
  const attachments = [];
  for (const row of rows) {
    const values = Object.fromEntries(
      [...row.querySelectorAll("[data-attachment-field]")].map((field) => [field.dataset.attachmentField, field.value.trim()])
    );
    if (!values.title && !values.url) {
      continue;
    }
    if (!values.title || !values.url) {
      statusMessage = "Attachment title and link are required";
      return null;
    }
    const type = attachmentTypeLabel({ type: values.type || "OTHER ATTACHMENTS" });
    attachments.push({
      type,
      title: values.title,
      url: values.url
    });
  }
  return attachments;
}

function attachmentRemovalKeysFromForm() {
  return [...document.querySelectorAll("[data-remove-attachment][data-restore-attachment]")]
    .map((button) => button.dataset.removeAttachment)
    .filter(Boolean);
}

function removeAttachmentRecords(records, removalKeys) {
  const removalSet = new Set(removalKeys);
  return asArray(records).filter((record) => !removalSet.has(attachmentRecordKey(record)));
}

function addBomFromForm(parentIdentifier = "") {
  const rootPart = getOpenedPart();
  const parentPart = parentIdentifier ? findPartByKey(parentIdentifier) : rootPart;
  const row = document.querySelector("[data-bom-add-parent]");
  const childObjectId = row?.querySelector('[data-bom-add-field="part"]')?.value.trim();
  const childPart = findPartByKey(childObjectId);
  if (!parentPart || !childPart) {
    statusMessage = "Select a valid part to add";
    renderApp();
    return;
  }
  if (partKey(parentPart) !== partKey(rootPart)) {
    statusMessage = "Open the subassembly to edit its BOM";
    renderApp();
    return;
  }
  const quantity = Number(row?.querySelector('[data-bom-add-field="quantity"]')?.value || 1);
  parentPart.bom = parentPart.bom || [];
  if (parentPart.bom.some((item) => (resolveBomChild(item) ? partKey(resolveBomChild(item)) === partKey(childPart) : item.child_object_id === partKey(childPart)))) {
    statusMessage = `${partObjectLabel(childPart)} is already in this BOM`;
    renderApp();
    return;
  }
  parentPart.bom.push({
    child_object_id: partKey(childPart),
    child_part_number: childPart.part_number,
    child_revision: childPart.revision,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit: "each"
  });
  parentPart.updated_at = new Date().toISOString().slice(0, 10);
  activeBomAddParent = "";
  persistLocalChanges();
  statusMessage = `Added ${partObjectLabel(childPart)} to ${partObjectLabel(parentPart)}`;
  renderApp();
}

function toggleBomCollapse(partIdentifier) {
  if (collapsedBomNodes.has(partIdentifier)) {
    collapsedBomNodes.delete(partIdentifier);
  } else {
    collapsedBomNodes.add(partIdentifier);
  }
  renderApp();
}

function removeBomItem(childIdentifier) {
  const owner = findBomItemOwner(childIdentifier);
  if (!owner) {
    return;
  }
  owner.parent.bom = (owner.parent.bom || []).filter((item) => bomItemIdentifier(item) !== childIdentifier);
  owner.parent.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Removed ${childIdentifier}`;
  renderApp();
}

function updateBomQuantity(childIdentifier, rawQuantity) {
  const owner = findBomItemOwner(childIdentifier);
  const item = owner?.item;
  const quantity = Number(rawQuantity);
  if (!item || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }
  item.quantity = quantity;
  owner.parent.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Updated ${childIdentifier} quantity`;
  renderApp();
}

function reorderBomItem(sourceIdentifier, targetIdentifier) {
  if (!sourceIdentifier || !targetIdentifier || sourceIdentifier === targetIdentifier) {
    return;
  }
  const sourceOwner = findBomItemOwner(sourceIdentifier);
  const targetOwner = findBomItemOwner(targetIdentifier);
  if (!sourceOwner || !targetOwner || sourceOwner.parent !== targetOwner.parent) {
    statusMessage = "Drag within the same BOM level to reorder";
    renderApp();
    return;
  }
  const bom = sourceOwner.parent.bom || [];
  const sourceIndex = sourceOwner.index;
  const targetIndex = targetOwner.index;
  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }
  const [moved] = bom.splice(sourceIndex, 1);
  bom.splice(targetIndex, 0, moved);
  sourceOwner.parent.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = `Moved ${sourceIdentifier}`;
  renderApp();
}

function findBomItemOwner(childIdentifier, parent = getOpenedPart(), visited = new Set()) {
  if (!parent || visited.has(partKey(parent))) {
    return null;
  }
  visited.add(partKey(parent));
  const bom = parent.bom || [];
  const index = bom.findIndex((item) => bomItemIdentifier(item) === childIdentifier);
  if (index >= 0) {
    return { parent, item: bom[index], index };
  }
  for (const item of bom) {
    const child = resolveBomChild(item);
    const owner = findBomItemOwner(childIdentifier, child, visited);
    if (owner) {
      return owner;
    }
  }
  return null;
}

function bomItemIdentifier(item) {
  const child = resolveBomChild(item);
  return child ? partKey(child) : item.child_object_id || item.child_part_number;
}

function clearBomDragState() {
  document.querySelectorAll(".bomNode.isDragging, .bomNode.isDropTarget").forEach((row) => {
    row.classList.remove("isDragging", "isDropTarget");
  });
}

function showSyncAction(action) {
  if (action === "pull") {
    pullMainFromRunner();
    return;
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
    statusMessage = "Merge request push requires runner support to create a branch, commit, push, open an MR, and assign approvers.";
  }
  renderApp();
}

function saveSettingsFromForm() {
  const configuredProductData = runnerProductDataDir || (productDataDirectoryHandle ? productDataFolderName : "");
  statusMessage = configuredProductData
    ? `Using product data folder ${configuredProductData}; remote ${productDataGithubOwner}/${productDataGithubRepo}`
    : "Select a product data folder to load PEAK data";
  renderApp();
}

function savePreferencesFromForm() {
  const defaultOwner = document.querySelector("#settingsDefaultOwner")?.value.trim() || "engineering@example.com";
  localStorage.setItem("peakDefaultOwner", defaultOwner);
  statusMessage = "Preferences saved";
  renderApp();
}

function ensureGitHubAuthStatus() {
  if (githubAuthStatus || githubAuthChecking) {
    return;
  }
  window.setTimeout(() => refreshGitHubAuthStatus({ render: true }), 0);
}

async function refreshGitHubAuthStatus({ render = true } = {}) {
  githubAuthChecking = true;
  try {
    const response = await fetch(peakRunnerGitHubAuthStatusUrl, { cache: "no-store" });
    githubAuthStatus = await response.json();
    if (!response.ok || githubAuthStatus.ok === false) {
      throw new Error(githubAuthStatus.message || "Could not check GitHub connection");
    }
  } catch (error) {
    githubAuthStatus = {
      ok: false,
      authenticated: false,
      installed: false,
      message: "Could not check GitHub connection.",
      action: runnerErrorMessage(error)
    };
  } finally {
    githubAuthChecking = false;
    if (render) {
      renderApp();
    }
  }
  return githubAuthStatus;
}

async function connectGitHub({ workflow, part } = {}) {
  githubAuthChecking = true;
  githubAuthStatus = {
    ok: true,
    authenticated: false,
    installed: true,
    message: "Opening PEAK GitHub Login...",
    action: "A terminal window will open with the browser login instructions. PEAK will update when GitHub is connected."
  };
  if (workflow && part) {
    setWorkflowFeedback(workflow, part, "running", "Opening PEAK GitHub Login...");
  }
  renderApp();
  try {
    const response = await fetch(peakRunnerGitHubAuthLoginUrl, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.action || payload.message || "Could not start GitHub login");
    }
    githubAuthStatus = payload;
    statusMessage = payload.message || "GitHub login started";
    if (workflow && part) {
      setWorkflowFeedback(workflow, part, "running", `${payload.message || "GitHub login started"} ${payload.action || ""}`.trim());
    }
    startGitHubAuthPolling({ workflow, part });
  } catch (error) {
    githubAuthChecking = false;
    githubAuthStatus = {
      ok: false,
      authenticated: false,
      message: "GitHub connection failed.",
      action: error.message
    };
    if (workflow && part) {
      setWorkflowFeedback(workflow, part, "error", `GitHub connection failed: ${error.message}`);
    }
  }
  renderApp();
}

function startGitHubAuthPolling({ workflow, part } = {}) {
  if (githubAuthPollingTimer) {
    window.clearInterval(githubAuthPollingTimer);
  }
  let attempts = 0;
  githubAuthPollingTimer = window.setInterval(async () => {
    attempts += 1;
    const status = await refreshGitHubAuthStatus({ render: false });
    if (status?.authenticated) {
      window.clearInterval(githubAuthPollingTimer);
      githubAuthPollingTimer = null;
      githubAuthChecking = false;
      statusMessage = status.message || "GitHub connected";
      if (workflow && part) {
        setWorkflowFeedback(workflow, part, "success", `${statusMessage}. Retry the workflow action to create the merge request.`);
      }
      renderApp();
      return;
    }
    if (attempts >= 20) {
      window.clearInterval(githubAuthPollingTimer);
      githubAuthPollingTimer = null;
      githubAuthChecking = false;
      githubAuthStatus = {
        ...(githubAuthStatus || {}),
        authenticated: false,
        message: "GitHub is not connected yet.",
        action: "Finish the PEAK GitHub Login window, or click Connect GitHub to try again."
      };
      statusMessage = "GitHub is not connected yet. Finish the PEAK GitHub Login window, or try Connect GitHub again.";
      if (workflow && part) {
        setWorkflowFeedback(workflow, part, "error", statusMessage, { action: "connect-github" });
      }
      renderApp();
    }
  }, 3000);
}

function createPartRecord(values, options = {}) {
  const shouldRender = options.render !== false;
  if (!values.partNumber || !values.name || !values.revision || !values.state || !values.owner) {
    statusMessage = "Missing required create fields";
    if (shouldRender) {
      renderApp();
    }
    return false;
  }
  if (parts.some((part) => canonicalPartNumber(part.part_number) === canonicalPartNumber(values.partNumber))) {
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
    description: values.description || "",
    legacy_part_number: values.legacyPartNumber || values.legacy_part_number || "",
    project: values.project,
    traceability: "LOT",
    maturity: "development",
    onshape: onshapeLinks,
    work_instructions: [],
    file_links: fileLinks,
    tags: [],
    revisions: [`${values.partNumber}^${values.revision}.json`]
  };
  const revisionProperties = {
    schema: "peak.revision.v1",
    object_id: `${values.partNumber}^${values.revision}`,
    part_number: values.partNumber,
    revision: values.revision,
    release_status: values.state,
    owner: values.owner,
    created_by: values.owner,
    created_at: today,
    updated_by: values.owner,
    updated_at: today,
    based_on: null,
    approvers: [],
    bom: [],
    attachments: [],
    change_summary: values.changeSummary || ""
  };
  const part = {
    ...partProperties,
    ...revisionProperties,
    part_number: values.partNumber,
    object_id: `${values.partNumber}^${values.revision}`,
    name: values.name,
    description: values.description || "",
    legacy_part_number: values.legacyPartNumber || values.legacy_part_number || "",
    project: values.project,
    revision: values.revision,
    owner: values.owner,
    tags: [],
    onshape: onshapeLinks,
    work_instructions: [],
    file_links: fileLinks,
    documents: [],
    attachments: [],
    approvers: [],
    bom: [],
    change_summary: values.changeSummary || "",
    created_at: today,
    updated_at: today,
    created_by: values.owner,
    updated_by: values.owner,
    release_status: values.state,
    maturity: "development",
    traceability: "LOT",
    part_properties: partProperties,
    revision_properties: revisionProperties
  };
  appendPartActivity(part, "create", `Created ${partObjectLabel(part)}`, {
    actor: values.owner,
    performedAt: `${today}T00:00:00.000Z`
  });
  parts.push(part);
  parts = sortParts(parts);
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
  const existingUnreleased = unreleasedRevisionsForPart(source.part_number)[0];
  if (existingUnreleased) {
    statusMessage = `Cannot create a new draft revision for ${source.part_number}; ${partObjectLabel(existingUnreleased)} is already ${releaseStatusLabel(existingUnreleased)}.`;
    return false;
  }
  const today = new Date().toISOString().slice(0, 10);
  const owner = currentEditorName() || source.owner || "engineering@example.com";
  const revisionProperties = {
    schema: "peak.revision.v1",
    object_id: `${source.part_number}^${revision}`,
    part_number: source.part_number,
    revision,
    release_status: "draft",
    owner,
    created_by: owner,
    created_at: today,
    updated_by: owner,
    updated_at: today,
    based_on: partKey(source),
    approvers: [],
    bom: structuredCloneSafe(source.bom || []),
    attachments: [],
    change_summary: ""
  };
  const partProperties = {
    ...(source.part_properties || {}),
    schema: "peak.part.v2",
    part_number: source.part_number,
    name: source.name,
    description: source.description || "",
    legacy_part_number: legacyPartNumberValue(source),
    project: source.project,
    traceability: traceabilityValue(source) || "LOT",
    maturity: source.maturity || "development",
    onshape: source.onshape || [],
    work_instructions: source.work_instructions || [],
    file_links: source.file_links || [],
    tags: source.tags || [],
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
    legacy_part_number: legacyPartNumberValue(source),
    project: source.project,
    traceability: traceabilityValue(source) || "LOT",
    maturity: source.maturity || "development",
    release_status: "draft",
    owner,
    onshape: source.onshape || [],
    work_instructions: source.work_instructions || [],
    file_links: source.file_links || [],
    tags: source.tags || [],
    approvers: [],
    bom: revisionProperties.bom,
    documents: [],
    attachments: [],
    created_by: owner,
    created_at: today,
    updated_by: owner,
    updated_at: today,
    based_on: partKey(source),
    change_summary: "",
    part_properties: partProperties,
    revision_properties: revisionProperties
  };
  appendPartActivity(part, "created_revision", `Created revision ${partObjectLabel(part)} from ${partObjectLabel(source)}`, {
    actor: owner,
    performedAt: `${today}T00:00:00.000Z`
  });
  parts.push(part);
  parts
    .filter((candidate) => candidate.part_number === source.part_number)
    .forEach((candidate) => {
      candidate.part_properties = {
        ...(candidate.part_properties || {}),
        revisions: partProperties.revisions
      };
    });
  parts = sortParts(parts);
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

function nextRevisionForPart(source, { minor = false } = {}) {
  const currentRevision = typeof source === "string" ? latestRevisionForPart(source)?.revision : source?.revision;
  if (!currentRevision) {
    return "A";
  }
  return minor ? incrementMinorRevisionLabel(currentRevision) : incrementMajorRevisionLabel(currentRevision);
}

function splitRevisionLabel(revision) {
  const match = String(revision || "A").trim().toUpperCase().match(/^([A-Z]+)(\d+)?$/);
  return {
    major: match?.[1] || "A",
    minor: match?.[2] || ""
  };
}

function incrementMajorRevisionLabel(revision) {
  return incrementAlphaLabel(splitRevisionLabel(revision).major);
}

function incrementMinorRevisionLabel(revision) {
  const { major, minor } = splitRevisionLabel(revision);
  const nextMinor = minor ? Number(minor) + 1 : 1;
  return `${major}${String(nextMinor).padStart(2, "0")}`;
}

function incrementAlphaLabel(label) {
  const chars = String(label || "A").toUpperCase().split("");
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
    const skippedDetails = result.skippedReasons?.length ? `: ${result.skippedReasons.slice(0, 3).join("; ")}${result.skippedReasons.length > 3 ? "; ..." : ""}` : "";
    statusMessage = `Imported ${result.created} parts${result.skipped ? `, skipped ${result.skipped}${skippedDetails}` : ""}`;
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
  const skippedReasons = [];
  rows.slice(1).forEach((row) => {
    const rawPartNumber = row[partNumberIndex]?.trim();
    const partNumber = canonicalPartNumber(rawPartNumber);
    const name = row[nameIndex]?.trim();
    const project = row[projectIndex]?.trim();
    if (!rawPartNumber && !name && !project) {
      return;
    }
    if (!partNumber || !name || !project) {
      skippedReasons.push(`${rawPartNumber || "Blank part number"}: missing Part No, Name, or Project`);
      skipped += 1;
      return;
    }
    if (!projects().includes(project)) {
      skippedReasons.push(`${rawPartNumber}: project "${project}" does not exist`);
      skipped += 1;
      return;
    }
    const projectNumberError = validatePartNumberForProject(partNumber, project);
    if (projectNumberError) {
      skippedReasons.push(`${rawPartNumber}: ${projectNumberError}`);
      skipped += 1;
      return;
    }
    if (parts.some((part) => canonicalPartNumber(part.part_number) === canonicalPartNumber(partNumber))) {
      skippedReasons.push(`${rawPartNumber}: part number already exists`);
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
  parts = sortParts(parts);
  return { created, skipped, skippedReasons };
}

function validatePartNumberForProject(partNumber, project) {
  if (!project) {
    return "";
  }
  const key = projectKey(project);
  const format = projectAllowsCustomPartNumbers(project)
    ? new RegExp(`^${escapeRegExp(key)}-.+`, "i")
    : new RegExp(`^${escapeRegExp(key)}-\\d+$`, "i");
  if (format.test(partNumber)) {
    return "";
  }
  return projectAllowsCustomPartNumbers(project)
    ? `Custom part numbers for ${project} must start with ${key}-`
    : `Part numbers for ${project} must use the ${key}-# format`;
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

function exportTabularCsv() {
  const headers = tabularColumns.map((column) => column.label);
  const rows = tabularParts(filteredParts()).map((part) =>
    tabularColumns.map((column) => tabularColumnValue(part, column))
  );
  downloadTextFile(`peak-table-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([headers, ...rows]), "text/csv");
  statusMessage = "Exported table CSV";
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
  return persistProductDataFolderChanges();
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
  await Promise.all(
    productDataSnapshotFiles().map((file) => writeJsonToDirectory(directoryHandle, file.path, file.value))
  );
}

function productDataSnapshotFiles(records = parts) {
  const groups = groupedPartResults(records);
  const today = new Date().toISOString().slice(0, 10);
  const files = [];
  const manifest = {
    schema: "peak.parts.manifest.v2",
    updated_at: today,
    projects: "projects.json",
    parts: groups.map((group) => `parts/${group.part_number}/${group.part_number}.json`)
  };
  groups.forEach((group) => {
    const revisions = group.revisions;
    files.push({
      path: `parts/${group.part_number}/${group.part_number}.json`,
      value: productPartProperties(group.part_number, revisions)
    });
    revisions.forEach((part) => {
      files.push({
        path: `parts/${group.part_number}/${group.part_number}^${part.revision || "A"}.json`,
        value: productRevisionProperties(part)
      });
    });
  });
  files.push({ path: "projects.json", value: productProjectsPayload() });
  files.push({ path: "manifest.json", value: manifest });
  return files;
}

function productDataDeletePathsForRevision(part) {
  const revisionPath = `parts/${part.part_number}/${part.part_number}^${part.revision || "A"}.json`;
  const hasOtherRevisions = parts.some((candidate) => candidate.part_number === part.part_number && partKey(candidate) !== partKey(part));
  return hasOtherRevisions
    ? [revisionPath]
    : [revisionPath, `parts/${part.part_number}/${part.part_number}.json`];
}

async function pushDraftPartChangesToRunner(part, { commitMessage = "" } = {}) {
  const label = partObjectLabel(part);
  try {
    const response = await fetch(peakRunnerPushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partLabel: label,
        partNumber: part.part_number,
        revision: part.revision || "A",
        commitMessage,
        files: productDataSnapshotFiles()
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "PEAK runner push failed");
    }
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    statusMessage = payload.message || `Saved ${label} and pushed product data to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  } catch (error) {
    hasRepoChanges = true;
    localStorage.setItem("peakHasLocalChanges", "true");
    statusMessage = `Saved ${label} locally, but runner push failed: ${runnerErrorMessage(error)}`;
  }
  renderApp();
}

async function pushProjectsToRunner(commitMessage, projectName = "projects") {
  const label = `projects ${projectName}`.trim();
  try {
    const response = await fetch(peakRunnerPushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partLabel: label,
        commitMessage,
        files: productDataSnapshotFiles()
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "PEAK runner project push failed");
    }
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    statusMessage = payload.message || `Pushed project changes to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  } catch (error) {
    hasRepoChanges = true;
    localStorage.setItem("peakHasLocalChanges", "true");
    statusMessage = `Saved project changes locally, but runner push failed: ${runnerErrorMessage(error)}`;
  }
  renderApp();
}

async function pushTabularChangesToRunner() {
  statusMessage = `Pushing tabular changes to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  renderApp();
  try {
    const response = await fetch(peakRunnerPushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partLabel: "tabular data",
        commitMessage: "Update tabular product data",
        files: productDataSnapshotFiles()
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "PEAK runner table push failed");
    }
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    statusMessage = payload.message || `Pushed tabular changes to ${productDataGithubOwner}/${productDataGithubRepo}.`;
  } catch (error) {
    hasRepoChanges = true;
    localStorage.setItem("peakHasLocalChanges", "true");
    statusMessage = `Saved tabular changes locally, but runner push failed: ${runnerErrorMessage(error)}`;
  }
  renderApp();
}

async function pushWorkflowTransitionToRunner({ workflow, mode, title, label, target, part, files = productDataSnapshotFiles(), deletePaths = [] }) {
  try {
    const response = await fetch(peakRunnerWorkflowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow,
        mode,
        title,
        label,
        target,
        partNumber: part.part_number,
        revision: part.revision || "A",
        files,
        deletePaths
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || "PEAK workflow runner failed");
    }
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    statusMessage = workflowRunnerSuccessMessage(payload, title);
    setWorkflowFeedback(workflow, part, "success", workflowRunnerInlineSuccessMessage(payload, mode, title));
  } catch (error) {
    const directMode = mode === "direct";
    hasRepoChanges = directMode;
    localStorage.setItem("peakHasLocalChanges", directMode ? "true" : "false");
    statusMessage = directMode
      ? `${label} saved locally, but workflow GitHub action failed: ${runnerErrorMessage(error)}`
      : `${label} was not changed locally because the merge request failed: ${runnerErrorMessage(error)}`;
    const feedbackMessage = directMode
      ? `Push failed: ${runnerErrorMessage(error)}`
      : `Merge request failed: ${runnerErrorMessage(error)}`;
    setWorkflowFeedback(workflow, part, "error", feedbackMessage, isGitHubAuthError(error) ? { action: "connect-github" } : {});
  }
  renderApp();
}

function workflowRunnerSuccessMessage(payload, title) {
  if (payload.prUrl) {
    return `Created GitHub merge request "${title}": ${payload.prUrl}`;
  }
  return payload.message || `Workflow transition "${title}" pushed to ${productDataGithubOwner}/${productDataGithubRepo}.`;
}

function workflowRunnerInlineSuccessMessage(payload, mode, title) {
  if (payload.prUrl) {
    return `Merge request created: ${payload.prUrl}`;
  }
  if (mode === "direct") {
    return `Push successful: ${payload.message || title}`;
  }
  return payload.message || `Workflow action completed: ${title}`;
}

function runnerErrorMessage(error) {
  if (error instanceof TypeError) {
    return window.peakDesktop
      ? "restart PEAK so the local desktop runner can use Git credentials."
      : "start PEAK with npm run web so the local runner can use Git credentials.";
  }
  return error.message || "unknown runner error";
}

function isGitHubAuthError(error) {
  return /connect github|github cli|gh auth|not authenticated|login/i.test(error?.message || "");
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
      description: projectDescription(name),
      drive_url: projectDriveUrl(name),
      allow_custom_part_numbers: projectAllowsCustomPartNumbers(name)
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
    legacy_part_number: legacyPartNumberValue(representative) || undefined,
    cost: optionalPartPropertyValue(representative, "cost") || undefined,
    mass: optionalPartPropertyValue(representative, "mass") || undefined,
    project: representative.project,
    traceability: traceabilityValue(representative) || "LOT",
    maturity: representative.maturity || "development",
    onshape: representative.onshape || [],
    work_instructions: representative.work_instructions || [],
    file_links: representative.file_links || [],
    tags: representative.tags || [],
    workflow: representative.part_properties?.workflow || representative.workflow || null,
    revisions: revisions.map((part) => `${partNumber}^${part.revision || "A"}.json`).sort()
  };
  delete properties.category;
  delete properties.manufacturers;
  delete properties.lifecycle_state;
  if (!properties.legacy_part_number) {
    delete properties.legacy_part_number;
  }
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
    owner: part.owner,
    created_by: part.created_by || part.owner,
    created_at: part.created_at,
    updated_by: part.updated_by || part.owner,
    updated_at: part.updated_at,
    based_on: part.based_on || null,
    approvers: part.approvers || [],
    bom: part.bom || [],
    attachments: part.attachments || part.documents || [],
    activity_history: activityHistoryForPart(part),
    workflow: part.revision_properties?.workflow || part.workflow || null,
    change_summary: part.change_summary || ""
  };
  delete properties.category;
  delete properties.manufacturers;
  delete properties.lifecycle_state;
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
          <small>${escapeHtml(part.project || "Unassigned project")} | ${escapeHtml(releaseStatusLabel(part))}</small>
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

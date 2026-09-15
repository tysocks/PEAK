const searchInput = document.querySelector("#searchInput");
const searchSuggestions = document.querySelector("#searchSuggestions");
const stateFilter = document.querySelector("#stateFilter");
const projectFilter = document.querySelector("#projectFilter");
const partsList = document.querySelector("#partsList");
const partDetail = document.querySelector("#partDetail");
const recordCount = document.querySelector("#recordCount");
const workspaceHeading = document.querySelector("#workspaceHeading");
const pageDescriptionEl = document.querySelector("#pageDescription");
const navigationTree = document.querySelector("#navigationTree");
const navigatorTitle = document.querySelector("#navigatorTitle");
const appSidebar = document.querySelector("#appSidebar");
const appRoot = document.querySelector("#peakApp") || document.querySelector(".app");
const tableHead = document.querySelector("#tableHead");
const objectTable = document.querySelector(".objectTable");
const resultsTitle = document.querySelector("#resultsTitle");
const workspace = document.querySelector(".workspace");
const navigatorPane = document.querySelector(".navigatorPane");
const tabListEl = document.querySelector("#tabList");
const workspaceHost = document.querySelector("#workspaceHost");
const primaryPane = document.querySelector(".primaryPane");
const workspaceEmptyState = document.querySelector("#workspaceEmptyState");
const workspaceOpenItem = document.querySelector("#workspaceOpenItem");
const secondaryPane = document.querySelector(".secondaryPane");
const splitResizer = document.querySelector("#splitResizer");
const favoritesListEl = document.querySelector("#favoritesList");
const projectsTreeEl = document.querySelector("#projectsTree");
const inboxListEl = document.querySelector("#inboxList");
const sidebarHomeView = document.querySelector("#sidebarHomeView");
const sidebarInboxView = document.querySelector("#sidebarInboxView");
const createModal = document.querySelector("#createModal");
const createModalBody = document.querySelector("#createModalBody");
const settingsModal = document.querySelector("#settingsModal");
const settingsModalBody = document.querySelector("#settingsModalBody");
const alternateModal = document.querySelector("#alternateModal");
const alternateSearchInput = document.querySelector("#alternateSearchInput");
const alternateModalList = document.querySelector("#alternateModalList");
const searchModal = document.querySelector("#searchModal");
const searchModalList = document.querySelector("#searchModalList");
const searchModalPreview = document.querySelector("#searchModalPreview");
const searchModalSplit = document.querySelector("#searchModalSplit");
const searchFilterChips = document.querySelector("#searchFilterChips");
const searchFiltersToggle = document.querySelector("#searchFiltersToggle");
const searchPreviewToggle = document.querySelector("#searchPreviewToggle");
const searchTitleOnlyBtn = document.querySelector("#searchTitleOnly");
const searchCreatedByLabel = document.querySelector("#searchCreatedByLabel");
const searchInLabel = document.querySelector("#searchInLabel");
const searchProjectLabel = document.querySelector("#searchProjectLabel");
const searchFilterPicker = document.querySelector("#searchFilterPicker");
const searchFilterPickerQuery = document.querySelector("#searchFilterPickerQuery");
const searchFilterPickerList = document.querySelector("#searchFilterPickerList");
const repoBadge = document.querySelector("#repoBadge");
const partContextMenu = document.querySelector("#partContextMenu");
const csvImportFile = document.querySelector("#csvImportFile");
const navItems = document.querySelectorAll("[data-nav-mode]");

if (navigator.userAgent.includes("Electron")) {
  document.documentElement.classList.add("peak-electron");
}

if (navigator.userAgent.includes("Electron")) {
  document.documentElement.classList.add("peak-electron");
}

let parts = [];
let selectedPartNumber = null;
let openedPartNumber = null;
let selectedBomPartNumber = null;
let selectedProjectName = "";
let activeNavMode = "home";
let activePartEditMode = false;
let activeAttachmentEditMode = false;
let activeAlternateEditMode = false;
let activeProjectEditMode = false;
let activeCreateMode = "new";
let createModalSeed = null;
let alternateSourceKey = null;
let pendingAlternateLinkKey = null;
let activeResultView = "grid";
let activePropertyTab = "overview";
let partAsidePanel = null; // "info" | null
let partOptionsMenuOpen = false;
let partOptionsSearchQuery = "";
let activeAttachmentDraftCount = 0;
let activeTableSort = { column: "part_number", direction: "asc" };
let tableColumnFilters = {};
let activeHistorySort = { column: "performed_at", direction: "desc" };
let historyColumnFilters = {};
let collapsedBomNodes = new Set();
let bomPickerTargetId = "";
let activeBomPaneWidthRatio = loadBomPaneWidthRatio();
const bomColumnDefinitions = {
  item: { label: "Item", width: 260 },
  name: { label: "Name", width: 180 },
  quantity: { label: "Qty", width: 48 },
  revision: { label: "Rev", width: 44 },
  status: { label: "Status", width: 110 }
};
const bomDefaultColumnOrder = ["item", "name", "quantity", "revision", "status"];
let activeBomColumnOrder = loadBomColumnOrder();
let activeSettingsTab = "profile";
let settingsProfileFeedback = null;
let activeColorScheme = localStorage.getItem("peakColorScheme") || "dark";
let activeFontFamily = localStorage.getItem("peakFontFamily") || "inter";
let activeFontSize = Number(localStorage.getItem("peakFontSize") || "14") || 14;
let activeAccentColor = "notion";
let activeAccentCustomHex = "#6f6f6f";
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
let productDataRemote = "";

let workspaceTabs = [];
let activeTabId = null;
let secondaryTabId = null;
let splitViewEnabled = false;
let sidebarOpen = localStorage.getItem("peakSidebarOpen") !== "0";
let sidebarMode = "home";
let favoritePartKeys = loadFavorites();
let expandedProjectFolders = loadExpandedProjects();
let expandedSidebarBomNodes = loadExpandedSidebarBomNodes();
let searchModalSelection = null;
let searchFiltersVisible = true;
let searchPreviewVisible = true;
let searchTitleOnly = false;
let searchCreatedBy = "";
let searchInBomRoot = "";
let searchProject = "";
let searchFilterPickerType = null;
let nextTabSeq = 1;
let tabHistory = [];
let tabHistoryIndex = -1;
let tabHistoryLock = false;
let tabDragId = null;

const productDataDbName = "peakProductData";
const productDataStoreName = "handles";
const productDataGithubBranch = "main";
const peakRunnerProductDataUrl = "/api/product-data";
const peakRunnerConfigUrl = "/api/config";
const peakRunnerPushUrl = "/api/git/push-draft";
const peakRunnerWorkflowUrl = "/api/git/workflow-transition";
const peakRunnerPullMainUrl = "/api/git/pull-main";
const peakRunnerConfigProductDataFolderUrl = "/api/config/product-data-folder";
const peakRunnerConfigProductDataRemoteUrl = "/api/config/product-data-remote";
const peakRunnerGitHubAuthStatusUrl = "/api/github/auth-status";
const peakRunnerGitHubAuthLoginUrl = "/api/github/auth-login";

function productDataRemoteLabel() {
  return productDataRemote || "configured product data remote";
}

const fontFamilyOptions = [
  { id: "inter", label: "Inter", stack: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif' },
  { id: "dmsans", label: "DM Sans", stack: '"DM Sans", "Inter", system-ui, sans-serif' }
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

function applyAppearance(scheme) {
  const mode = scheme === "light" ? "light" : "dark";
  document.documentElement.classList.toggle("light-mode", mode === "light");
  document.body.classList.toggle("lightMode", mode === "light");
  const font = fontFamilyOptions.find((item) => item.id === activeFontFamily) || fontFamilyOptions[0];
  document.documentElement.style.setProperty("--peak-font-family", font.stack);
  document.documentElement.style.setProperty("--peak-base-font-size", `${clamp(activeFontSize, 10, 24)}px`);
  document.body.style.removeProperty("--accent");
  document.body.style.removeProperty("--accent-soft");
  document.body.style.removeProperty("--selected");
}

applyAppearance(activeColorScheme);

function loadFavorites() {
  try {
    const values = JSON.parse(localStorage.getItem("peakFavorites") || "[]");
    return Array.isArray(values) ? values.map(String) : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem("peakFavorites", JSON.stringify(favoritePartKeys));
}

function loadExpandedProjects() {
  try {
    const expanded = JSON.parse(localStorage.getItem("peakExpandedProjects") || "null");
    if (Array.isArray(expanded)) {
      return new Set(expanded.map(String));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveExpandedProjects() {
  localStorage.setItem("peakExpandedProjects", JSON.stringify([...expandedProjectFolders]));
}

function loadExpandedSidebarBomNodes() {
  try {
    const expanded = JSON.parse(localStorage.getItem("peakExpandedSidebarBom") || "null");
    if (Array.isArray(expanded)) {
      return new Set(expanded.map(String));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveExpandedSidebarBomNodes() {
  localStorage.setItem("peakExpandedSidebarBom", JSON.stringify([...expandedSidebarBomNodes]));
}

function sidebarBomNodeId(projectName, partNumber) {
  return `${projectName}::${partNumber}`;
}

function newTabId(prefix = "tab") {
  nextTabSeq += 1;
  return `${prefix}-${Date.now()}-${nextTabSeq}`;
}

function tabTitleFor(type, payload = {}) {
  if (type === "part") {
    const part = findPartByKey(payload.objectId);
    return part ? `${part.part_number}^${part.revision || "A"}` : payload.objectId || "Part";
  }
  const titles = {
    home: "Browse",
    projects: "Projects",
    history: "History",
    table: "Table",
    report: "Report",
    settings: "Settings"
  };
  return titles[type] || "Tab";
}

function findTab(id) {
  return workspaceTabs.find((tab) => tab.id === id);
}

function findTabByType(type, objectId = "") {
  return workspaceTabs.find((tab) => {
    if (tab.type !== type) return false;
    if (type === "part") return tab.payload?.objectId === objectId;
    return true;
  });
}

function openWorkspaceTab(type, payload = {}, { activate = true, forceNew = false } = {}) {
  if (type === "settings") {
    openSettingsModal(payload.section || "profile");
    return null;
  }
  let tab = forceNew ? null : findTabByType(type, payload.objectId || "");
  if (!tab) {
    tab = {
      id: newTabId(type),
      type,
      title: tabTitleFor(type, payload),
      payload: { ...payload }
    };
    workspaceTabs.push(tab);
  } else {
    tab.payload = { ...tab.payload, ...payload };
    tab.title = tabTitleFor(type, tab.payload);
  }
  if (activate) {
    activateWorkspaceTab(tab.id);
  } else {
    renderTabBar();
  }
  return tab;
}

function pushTabHistory(tabId) {
  if (tabHistoryLock || !tabId) return;
  if (tabHistory[tabHistoryIndex] === tabId) {
    syncTabHistoryButtons();
    return;
  }
  tabHistory = tabHistory.slice(0, tabHistoryIndex + 1);
  tabHistory.push(tabId);
  if (tabHistory.length > 100) {
    tabHistory = tabHistory.slice(-100);
  }
  tabHistoryIndex = tabHistory.length - 1;
  syncTabHistoryButtons();
}

function pruneTabHistory(closedTabId) {
  if (!closedTabId) return;
  const currentId = tabHistory[tabHistoryIndex];
  tabHistory = tabHistory.filter((id) => id !== closedTabId);
  if (!tabHistory.length) {
    tabHistoryIndex = -1;
  } else {
    const nextIndex = tabHistory.lastIndexOf(currentId);
    tabHistoryIndex = nextIndex >= 0 ? nextIndex : tabHistory.length - 1;
  }
  syncTabHistoryButtons();
}

function syncTabHistoryButtons() {
  const backBtn = document.querySelector("#navBackBtn");
  const forwardBtn = document.querySelector("#navForwardBtn");
  if (backBtn) backBtn.disabled = tabHistoryIndex <= 0;
  if (forwardBtn) forwardBtn.disabled = tabHistoryIndex < 0 || tabHistoryIndex >= tabHistory.length - 1;
}

function navigateTabHistory(delta) {
  let nextIndex = tabHistoryIndex + delta;
  while (nextIndex >= 0 && nextIndex < tabHistory.length && !findTab(tabHistory[nextIndex])) {
    nextIndex += delta;
  }
  if (nextIndex < 0 || nextIndex >= tabHistory.length) {
    tabHistory = tabHistory.filter((id) => Boolean(findTab(id)));
    tabHistoryIndex = Math.min(Math.max(tabHistoryIndex, 0), tabHistory.length - 1);
    syncTabHistoryButtons();
    return;
  }
  const targetId = tabHistory[nextIndex];
  tabHistoryLock = true;
  tabHistoryIndex = nextIndex;
  activateWorkspaceTab(targetId, { skipHistory: true });
  tabHistoryLock = false;
  syncTabHistoryButtons();
}

function activateWorkspaceTab(tabId, { skipHistory = false } = {}) {
  const tab = findTab(tabId);
  if (!tab) return;
  activeTabId = tabId;
  if (!skipHistory) {
    pushTabHistory(tabId);
  } else {
    syncTabHistoryButtons();
  }
  applyTabToWorkspace(tab);
  renderTabBar();
  renderSidebarChrome();
  renderApp();
}

function closeWorkspaceTab(tabId) {
  const index = workspaceTabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return;
  const wasActive = activeTabId === tabId;
  const historyBackId = wasActive && tabHistoryIndex > 0 ? tabHistory[tabHistoryIndex - 1] : null;
  workspaceTabs.splice(index, 1);
  pruneTabHistory(tabId);
  if (secondaryTabId === tabId) {
    secondaryTabId = null;
    splitViewEnabled = false;
  }
  if (secondaryTabId && !findTab(secondaryTabId)) {
    secondaryTabId = null;
    splitViewEnabled = false;
  }
  if (workspaceTabs.length < 2) {
    splitViewEnabled = false;
    secondaryTabId = null;
  }
  if (!workspaceTabs.length) {
    activeTabId = null;
    openedPartNumber = null;
    selectedBomPartNumber = null;
    activeNavMode = "";
    renderEmptyWorkspace();
    renderTabBar();
    renderSidebarChrome();
    syncChrome();
    syncTabHistoryButtons();
    return;
  }
  if (wasActive) {
    const next = (historyBackId && findTab(historyBackId))
      || workspaceTabs[Math.max(0, index - 1)]
      || workspaceTabs[0];
    activateWorkspaceTab(next.id);
    return;
  }
  renderTabBar();
  renderSidebarChrome();
}

function setWorkspaceEmptyState(isEmpty) {
  if (primaryPane) primaryPane.classList.toggle("is-empty", Boolean(isEmpty));
  if (workspaceEmptyState) workspaceEmptyState.hidden = !isEmpty;
  if (workspace) workspace.hidden = Boolean(isEmpty);
}

function renderEmptyWorkspace() {
  document.title = "PEAK";
  activeNavMode = "";
  if (recordCount) recordCount.textContent = "No open tabs";
  if (workspaceHeading) workspaceHeading.textContent = "PEAK";
  if (pageDescriptionEl) pageDescriptionEl.textContent = "";
  if (tableHead) tableHead.innerHTML = "";
  if (partsList) partsList.innerHTML = "";
  if (partDetail) partDetail.innerHTML = "";
  if (navigationTree) navigationTree.innerHTML = "";
  setWorkspaceEmptyState(true);
}

function applyTabToWorkspace(tab) {
  activeNavMode = tab.type === "part" ? "part" : tab.type;
  if (tab.type === "part") {
    const objectId = tab.payload?.objectId || "";
    openedPartNumber = objectId;
    selectedPartNumber = objectId;
    selectedBomPartNumber = objectId;
    activePartEditMode = Boolean(tab.payload?.editMode);
    activeAttachmentEditMode = false;
    activeAlternateEditMode = false;
    activeAttachmentDraftCount = 0;
  } else {
    openedPartNumber = null;
    selectedBomPartNumber = null;
    activePartEditMode = false;
    activeAttachmentEditMode = false;
    activeAlternateEditMode = false;
  }
  if (tab.type === "projects" && tab.payload?.projectName) {
    selectedProjectName = tab.payload.projectName;
  }
}

function renderTabBar() {
  if (!tabListEl) return;
  tabListEl.innerHTML = workspaceTabs.map((tab) => `
    <div class="workspaceTab${tab.id === activeTabId ? " active" : ""}${splitViewEnabled && tab.id === secondaryTabId ? " is-secondary" : ""}" role="tab" aria-selected="${tab.id === activeTabId}" data-tab-id="${escapeHtml(tab.id)}" title="${escapeHtml(tab.title)}" draggable="true">
      <span class="workspaceTabTitle">${escapeHtml(tab.title)}</span>
      <button class="workspaceTabClose" type="button" data-close-tab="${escapeHtml(tab.id)}" title="Close" aria-label="Close ${escapeHtml(tab.title)}">×</button>
    </div>
  `).join("");
  if (workspaceHost) {
    workspaceHost.dataset.split = splitViewEnabled ? "true" : "false";
  }
  if (secondaryPane) {
    secondaryPane.hidden = !splitViewEnabled;
    if (!splitViewEnabled) {
      secondaryPane.setAttribute("hidden", "");
      secondaryPane.style.display = "none";
    } else {
      secondaryPane.style.removeProperty("display");
    }
  }
  if (splitResizer) {
    splitResizer.hidden = !splitViewEnabled;
    if (!splitViewEnabled) {
      splitResizer.setAttribute("hidden", "");
      splitResizer.style.display = "none";
    } else {
      splitResizer.style.removeProperty("display");
    }
  }
  if (splitViewEnabled && secondaryPane) {
    const secondary = findTab(secondaryTabId) || workspaceTabs.find((tab) => tab.id !== activeTabId);
    secondaryTabId = secondary?.id || null;
    secondaryPane.innerHTML = secondary
      ? `
        <div class="splitPaneHeader">
          <h3>${escapeHtml(secondary.title)}</h3>
          <div class="tabBarLeading">
            <button class="tabBarBtn" type="button" data-focus-tab="${escapeHtml(secondary.id)}">Focus</button>
            <button class="tabBarBtn" type="button" data-unsplit-view="1">Unsplit</button>
          </div>
        </div>
        <div class="splitPaneBody">
          <p>This tab is open on the right. Focus it to edit, or drag another tab left/right to change the split.</p>
        </div>
      `
      : `<div class="splitEmpty"><p>Open another tab, then drag it left or right to split.</p></div>`;
  }
}

function showSplitDropOverlay(show) {
  const overlay = document.querySelector("#splitDropOverlay");
  if (!overlay) return;
  overlay.hidden = !show;
  overlay.classList.toggle("is-active", Boolean(show));
  if (!show) {
    overlay.querySelectorAll(".splitDropZone").forEach((zone) => zone.classList.remove("is-target"));
  }
}

function applyTabSplit(draggedId, side) {
  if (!draggedId || workspaceTabs.length < 2) return;
  const other = workspaceTabs.find((tab) => tab.id !== draggedId);
  if (!other) return;
  splitViewEnabled = true;
  if (side === "left") {
    secondaryTabId = activeTabId === draggedId ? other.id : (activeTabId || other.id);
    if (secondaryTabId === draggedId) {
      secondaryTabId = other.id;
    }
    activateWorkspaceTab(draggedId);
    return;
  }
  if (activeTabId === draggedId) {
    secondaryTabId = draggedId;
    activateWorkspaceTab(other.id);
    return;
  }
  secondaryTabId = draggedId;
  renderTabBar();
}

function clearSplitView() {
  splitViewEnabled = false;
  secondaryTabId = null;
  showSplitDropOverlay(false);
  renderTabBar();
}

function reorderWorkspaceTab(draggedId, targetId, placeAfter = false) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const from = workspaceTabs.findIndex((tab) => tab.id === draggedId);
  const to = workspaceTabs.findIndex((tab) => tab.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = workspaceTabs.splice(from, 1);
  let insertAt = workspaceTabs.findIndex((tab) => tab.id === targetId);
  if (placeAfter) insertAt += 1;
  workspaceTabs.splice(insertAt, 0, moved);
  renderTabBar();
}

function setSidebarOpen(open) {
  sidebarOpen = Boolean(open);
  localStorage.setItem("peakSidebarOpen", sidebarOpen ? "1" : "0");
  appSidebar?.classList.toggle("open", sidebarOpen);
  appRoot?.classList.toggle("sidebar-collapsed", !sidebarOpen);
}

function renderSidebarChrome() {
  document.querySelectorAll("[data-sidebar-action]").forEach((button) => {
    const action = button.dataset.sidebarAction;
    const isMode = action === "home" || action === "inbox";
    button.classList.toggle("active", isMode && action === sidebarMode);
  });
  document.querySelectorAll("[data-open-tab]").forEach((button) => {
    button.classList.toggle("active", activeNavMode === button.dataset.openTab);
  });
  if (sidebarHomeView) sidebarHomeView.hidden = sidebarMode !== "home";
  if (sidebarInboxView) sidebarInboxView.hidden = sidebarMode !== "inbox";
  renderFavoritesList();
  renderProjectsTree();
  renderInboxList();
}

function renderFavoritesList() {
  if (!favoritesListEl) return;
  const items = favoritePartKeys
    .map((key) => findPartByKey(key))
    .filter(Boolean);
  if (!items.length) {
    favoritesListEl.innerHTML = `<p class="sidebarEmpty">Pin parts from the context menu.</p>`;
    return;
  }
  favoritesListEl.innerHTML = items.map((part) => {
    const key = partKey(part);
    const active = activeNavMode === "part" && openedPartNumber === key;
    return `
      <button class="sidebarItem${active ? " active" : ""}" type="button" data-open-part="${escapeHtml(key)}">
        <span class="sidebarItemLabel">${escapeHtml(part.part_number)} · ${escapeHtml(part.name)}</span>
      </button>
    `;
  }).join("");
}

function projectBomForest(projectName) {
  const groups = groupedPartResults(parts.filter((part) => part.project === projectName));
  const byPartNumber = new Map(groups.map((group) => [group.part_number, group.representative]));
  const childMap = new Map();
  const referencedAsChild = new Set();

  for (const group of groups) {
    const part = group.representative;
    const childNumbers = [];
    for (const item of asArray(part.bom)) {
      const childPn = String(item?.child_part_number || "").trim();
      if (!childPn || !byPartNumber.has(childPn) || childPn === group.part_number) {
        continue;
      }
      referencedAsChild.add(childPn);
      if (!childNumbers.includes(childPn)) {
        childNumbers.push(childPn);
      }
    }
    childMap.set(group.part_number, childNumbers);
  }

  const roots = groups
    .map((group) => group.part_number)
    .filter((partNumber) => !referencedAsChild.has(partNumber));

  return { byPartNumber, childMap, roots };
}

function renderProjectBomNode(partNumber, forest, depth, visited, projectName) {
  const part = forest.byPartNumber.get(partNumber);
  if (!part) {
    return "";
  }
  const key = partKey(part);
  const active = activeNavMode === "part" && openedPartNumber === key;
  const children = (forest.childMap.get(partNumber) || []).filter((childPn) => !visited.has(childPn) && childPn !== partNumber);
  const hasChildren = children.length > 0;
  const nodeId = sidebarBomNodeId(projectName, partNumber);
  const expanded = hasChildren && expandedSidebarBomNodes.has(nodeId);
  const nextVisited = new Set(visited);
  nextVisited.add(partNumber);
  const childHtml = expanded
    ? children
      .map((childPn) => renderProjectBomNode(childPn, forest, depth + 1, nextVisited, projectName))
      .join("")
    : "";
  const twist = hasChildren
    ? `<button class="twist sidebarBomTwist${expanded ? " expanded" : ""}" type="button" data-toggle-sidebar-bom="${escapeHtml(nodeId)}" title="${expanded ? "Collapse" : "Expand"}" aria-label="${expanded ? "Collapse" : "Expand"} ${escapeHtml(part.part_number)}" aria-expanded="${expanded}"></button>`
    : `<span class="twistSpacer" aria-hidden="true"></span>`;
  return `
    <div class="sidebarBomNode">
      <div class="sidebarBomRow">
        ${twist}
        <button class="sidebarItem${active ? " active" : ""}" type="button" data-open-part="${escapeHtml(key)}">
          <span class="sidebarItemLabel">${escapeHtml(part.part_number)} · ${escapeHtml(part.name)}</span>
        </button>
      </div>
      ${hasChildren ? `<div class="sidebarChildren${expanded ? " open" : ""}">${childHtml}</div>` : ""}
    </div>
  `;
}

function renderProjectsTree() {
  if (!projectsTreeEl) return;
  const names = projects();
  if (!names.length) {
    projectsTreeEl.innerHTML = `<p class="sidebarEmpty">No projects yet.</p>`;
    return;
  }
  const header = document.querySelector("#projectsTreeSection .sidebarSectionHeader");
  if (header) {
    header.innerHTML = `<h3>Projects</h3>`;
  }
  projectsTreeEl.innerHTML = names.map((project) => {
    const expanded = expandedProjectFolders.has(project);
    const forest = projectBomForest(project);
    const rootCount = forest.roots.length;
    return `
      <div class="sidebarProject">
        <button class="sidebarItem sidebarProjectItem${expanded ? " expanded" : ""}" type="button" data-toggle-project="${escapeHtml(project)}" aria-expanded="${expanded}">
          <span class="twist" aria-hidden="true"></span>
          <span class="sidebarItemLabel">${escapeHtml(project)}</span>
          <span class="sidebarItemMeta">${rootCount}</span>
        </button>
        <div class="sidebarChildren${expanded ? " open" : ""}">
          ${expanded
            ? (forest.roots.length
              ? forest.roots.map((partNumber) => renderProjectBomNode(partNumber, forest, 0, new Set(), project)).join("")
              : `<p class="sidebarEmpty">No parts</p>`)
            : ""}
        </div>
      </div>
    `;
  }).join("");
}

function inboxItems() {
  const me = (getProfileUsername() || getProfileName() || "").trim().toLowerCase();
  return parts.filter((part) => {
    const owner = String(part.owner || part.updated_by || part.created_by || "").trim().toLowerCase();
    const approvers = asArray(part.approvers).map((item) => String(item?.name || item || "").trim().toLowerCase());
    const involvesMe = me && (owner === me || approvers.includes(me));
    const needsAction = ["draft", "release_candidate"].includes(revisionStatusValue(part));
    return involvesMe && needsAction;
  }).slice(0, 80);
}

function renderInboxList() {
  if (!inboxListEl) return;
  const items = inboxItems();
  if (!items.length) {
    inboxListEl.innerHTML = `<p class="sidebarEmpty">No actions assigned to you.</p>`;
    return;
  }
  inboxListEl.innerHTML = items.map((part) => {
    const key = partKey(part);
    return `
      <button class="sidebarItem" type="button" data-open-part="${escapeHtml(key)}">
        <span class="sidebarItemLabel">${escapeHtml(part.part_number)}^${escapeHtml(part.revision || "A")} · ${escapeHtml(releaseStatusLabel(part))}</span>
      </button>
    `;
  }).join("");
}

function toggleFavorite(partKeyValue) {
  const key = String(partKeyValue || "");
  if (!key) return;
  if (favoritePartKeys.includes(key)) {
    favoritePartKeys = favoritePartKeys.filter((item) => item !== key);
  } else {
    favoritePartKeys = [key, ...favoritePartKeys];
  }
  saveFavorites();
  renderFavoritesList();
}

function openCreateModal(mode = "new", seed = null) {
  if (!requireProfileForEdit()) return;
  activeCreateMode = ["new", "source", "revision"].includes(mode) ? mode : "new";
  createModalSeed = seed || null;
  if (!createModal || !createModalBody) return;
  createModal.hidden = false;
  renderCreateModalBody();
  const focusId = activeCreateMode === "revision"
    ? "[data-submit-revision]"
    : activeCreateMode === "source"
      ? "#newPartBasedOnPicker"
      : "#newPartName";
  requestAnimationFrame(() => {
    refreshNotionScrolls();
    document.querySelector(focusId)?.focus();
  });
}

function closeCreateModal() {
  if (createModal) createModal.hidden = true;
  createModalSeed = null;
  pendingAlternateLinkKey = null;
  if (searchFilterPickerType === "basedOn") closeSearchFilterPicker();
}

function createModalTitleText(mode = activeCreateMode) {
  if (pendingAlternateLinkKey) return "Create Alternate Item";
  if (mode === "source") return "Create Item Based On";
  if (mode === "revision") return "Create Revision";
  return "New Part";
}

function syncCreateModalTitle() {
  const titleEl = document.querySelector("#createModalTitle");
  if (titleEl) titleEl.textContent = createModalTitleText();
}

function renderCreateModalBody() {
  if (!createModalBody) return;
  syncCreateModalTitle();
  const previous = partsList.innerHTML;
  const previousHead = tableHead.innerHTML;
  renderCreateRows();
  createModalBody.innerHTML = partsList.innerHTML;
  partsList.innerHTML = previous;
  tableHead.innerHTML = previousHead;
  const cell = createModalBody.querySelector("td");
  if (cell) {
    createModalBody.innerHTML = cell.innerHTML;
  }
  const actions = createModalBody.querySelector(".createFormActions");
  if (actions && !actions.querySelector(".editingAsLabel")) {
    actions.insertAdjacentHTML("afterbegin", productEditUserLabel());
  }
  applyCreateModalSeed();
}

function applyCreateModalSeed() {
  if (!createModalSeed) return;
  if (activeCreateMode === "source" && createModalSeed.basedOn) {
    const seeded = findPartByKey(createModalSeed.basedOn);
    setCreateBasedOnSelection(seeded?.part_number || String(createModalSeed.basedOn).split("^")[0] || "");
  }
}

function openSearchModal() {
  if (!searchModal) return;
  searchModal.hidden = false;
  syncSearchModalChrome();
  searchInput?.focus();
  renderSearchModalResults();
  requestAnimationFrame(refreshNotionScrolls);
}

function closeSearchModal() {
  if (searchModal) searchModal.hidden = true;
  closeSearchFilterPicker();
}

function setChipValue(labelEl, chipEl, value) {
  if (!labelEl || !chipEl) return;
  const hasValue = Boolean(value);
  chipEl.classList.toggle("is-active", hasValue);
  if (hasValue) {
    labelEl.hidden = false;
    labelEl.textContent = value;
  } else {
    labelEl.hidden = true;
    labelEl.textContent = "";
  }
}

function syncSearchModalChrome() {
  if (searchFiltersToggle) searchFiltersToggle.setAttribute("aria-pressed", String(searchFiltersVisible));
  if (searchPreviewToggle) searchPreviewToggle.setAttribute("aria-pressed", String(searchPreviewVisible));
  if (searchFilterChips) searchFilterChips.hidden = !searchFiltersVisible;
  if (searchModalSplit) searchModalSplit.classList.toggle("preview-hidden", !searchPreviewVisible);
  if (searchTitleOnlyBtn) {
    searchTitleOnlyBtn.setAttribute("aria-pressed", String(searchTitleOnly));
    searchTitleOnlyBtn.classList.toggle("is-active", searchTitleOnly);
  }
  setChipValue(searchCreatedByLabel, document.querySelector("#searchCreatedByChip"), searchCreatedBy);
  const inPart = searchInBomRoot ? findPartByKey(searchInBomRoot) : null;
  const inLabel = inPart
    ? `${inPart.part_number}^${inPart.revision || "A"}`
    : "";
  setChipValue(searchInLabel, document.querySelector("#searchInChip"), inLabel);
  setChipValue(searchProjectLabel, document.querySelector("#searchProjectChip"), searchProject);
}

function searchCreatorOptions() {
  const names = new Set();
  parts.forEach((part) => {
    const name = String(createdBy(part) || "").trim();
    if (name && name !== "Not set") names.add(name);
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

function searchInBomOptions() {
  return groupedPartResults(parts).map((group) => {
    const part = group.representative;
    return {
      value: partKey(part),
      label: `${part.part_number}^${part.revision || "A"} · ${part.name}`
    };
  });
}

function searchProjectOptions() {
  return projects();
}

function bomSubtreePartNumbers(rootPart) {
  const allowed = new Set();
  const visit = (part) => {
    if (!part) return;
    const pn = String(part.part_number || "").trim();
    if (!pn || allowed.has(pn)) return;
    allowed.add(pn);
    for (const item of asArray(part.bom)) {
      const child = resolveBomChild(item);
      if (child) {
        visit(child);
      } else {
        const childPn = String(item?.child_part_number || "").trim();
        if (childPn) allowed.add(childPn);
      }
    }
  };
  visit(rootPart);
  return allowed;
}

function closeSearchFilterPicker() {
  document.querySelectorAll("[data-filter-picker][aria-expanded='true']").forEach((el) => {
    el.setAttribute("aria-expanded", "false");
  });
  searchFilterPickerType = null;
  bomPickerTargetId = "";
  if (searchFilterPicker) searchFilterPicker.hidden = true;
  if (searchFilterPickerQuery) searchFilterPickerQuery.value = "";
}

function openSearchFilterPicker(type, anchor) {
  if (!searchFilterPicker || !anchor) return;
  const nextBomTarget = type === "bomItem" ? (anchor.dataset.bomPickItem || "") : "";
  if (searchFilterPickerType === type && !searchFilterPicker.hidden) {
    if (type !== "bomItem" || bomPickerTargetId === nextBomTarget) {
      closeSearchFilterPicker();
      return;
    }
  }
  searchFilterPickerType = type;
  searchFilterPicker.hidden = false;
  document.querySelectorAll("[data-filter-picker][aria-expanded='true']").forEach((el) => {
    el.setAttribute("aria-expanded", "false");
  });
  anchor.setAttribute("aria-expanded", "true");
  if (searchFilterPickerQuery) {
    searchFilterPickerQuery.value = "";
    searchFilterPickerQuery.placeholder = type === "createdBy"
      ? "Filter people…"
      : type === "project"
        ? "Filter projects…"
        : type === "basedOn" || type === "bomItem"
          ? "Filter items…"
          : "Filter assemblies…";
  }
  if (type === "bomItem") {
    bomPickerTargetId = nextBomTarget;
  } else {
    bomPickerTargetId = "";
  }
  renderSearchFilterPickerOptions();
  const rect = anchor.getBoundingClientRect();
  const width = (type === "basedOn" || type === "bomItem")
    ? Math.max(280, Math.min(420, rect.width || 280))
    : 260;
  searchFilterPicker.style.width = `${width}px`;
  const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left));
  const top = Math.min(window.innerHeight - 20, rect.bottom + 6);
  searchFilterPicker.style.left = `${left}px`;
  searchFilterPicker.style.top = `${top}px`;
  searchFilterPickerQuery?.focus();
  requestAnimationFrame(refreshNotionScrolls);
}

function basedOnPickerOptions() {
  return groupedPartResults(parts).map((group) => {
    const part = group.representative;
    return {
      value: group.part_number,
      label: `${part.part_number}^${part.revision || "A"} · ${part.name || "Untitled"}`
    };
  });
}

function basedOnPickerLabel(partNumber) {
  if (!partNumber) return "Select item";
  const part = latestRevisionForPart(partNumber) || findPartByKey(partNumber);
  if (!part) return partNumber;
  return `${part.part_number}^${part.revision || "A"} · ${part.name || "Untitled"}`;
}

function setCreateBasedOnSelection(partNumber) {
  const value = String(partNumber || "").trim();
  const input = document.querySelector("#newPartBasedOn");
  const label = document.querySelector("#newPartBasedOnLabel");
  if (input) input.value = value;
  if (label) {
    label.textContent = basedOnPickerLabel(value);
    label.classList.toggle("is-placeholder", !value);
  }
  if (value) {
    createModalSeed = { ...(createModalSeed || {}), basedOn: value };
  }
}

function renderSearchFilterPickerOptions() {
  if (!searchFilterPickerList || !searchFilterPickerType) return;
  const query = String(searchFilterPickerQuery?.value || "").trim().toLowerCase();
  let options = [];
  if (searchFilterPickerType === "createdBy") {
    options = searchCreatorOptions().map((name) => ({ value: name, label: name }));
  } else if (searchFilterPickerType === "in") {
    options = searchInBomOptions();
  } else if (searchFilterPickerType === "project") {
    options = searchProjectOptions().map((name) => ({
      value: name,
      label: name
    }));
  } else if (searchFilterPickerType === "basedOn") {
    options = basedOnPickerOptions();
  } else if (searchFilterPickerType === "bomItem") {
    const rootKey = partKey(getOpenedPart());
    options = basedOnPickerOptions().filter((option) => {
      const part = latestRevisionForPart(option.value) || findPartByKey(option.value);
      return part && partKey(part) !== rootKey;
    });
  }
  const filtered = options.filter((option) => !query || option.label.toLowerCase().includes(query));
  const selectedValue = searchFilterPickerType === "createdBy"
    ? searchCreatedBy
    : searchFilterPickerType === "in"
      ? searchInBomRoot
      : searchFilterPickerType === "project"
        ? searchProject
        : searchFilterPickerType === "basedOn"
          ? (document.querySelector("#newPartBasedOn")?.value || "")
          : (() => {
              const owner = findBomItemOwner(bomPickerTargetId);
              const child = resolveBomChild(owner?.item);
              return child?.part_number || "";
            })();
  searchFilterPickerList.innerHTML = filtered.length
    ? filtered.map((option) => `
        <button class="searchFilterOption${option.value === selectedValue ? " active" : ""}" type="button" data-search-filter-value="${escapeHtml(option.value)}">
          ${escapeHtml(option.label)}
        </button>
      `).join("")
    : `<p class="sidebarEmpty">No matches</p>`;
  requestAnimationFrame(refreshNotionScrolls);
}

function applySearchFilterPickerValue(value) {
  if (searchFilterPickerType === "createdBy") {
    searchCreatedBy = searchCreatedBy === value ? "" : value;
  } else if (searchFilterPickerType === "in") {
    searchInBomRoot = searchInBomRoot === value ? "" : value;
  } else if (searchFilterPickerType === "project") {
    searchProject = searchProject === value ? "" : value;
  } else if (searchFilterPickerType === "basedOn") {
    setCreateBasedOnSelection(value);
    closeSearchFilterPicker();
    return;
  } else if (searchFilterPickerType === "bomItem") {
    assignBomRowPart(bomPickerTargetId, value);
    closeSearchFilterPicker();
    return;
  }
  closeSearchFilterPicker();
  syncSearchModalChrome();
  renderSearchModalResults();
}

function searchModalFilteredParts() {
  const query = searchInput?.value.trim() || "";
  const bomRoot = searchInBomRoot ? findPartByKey(searchInBomRoot) : null;
  const bomAllowed = bomRoot ? bomSubtreePartNumbers(bomRoot) : null;
  return parts.filter((part) => {
    if (!matchesSearch(part, query, { titleOnly: searchTitleOnly })) return false;
    if (searchCreatedBy && createdBy(part) !== searchCreatedBy) return false;
    if (searchProject && part.project !== searchProject) return false;
    if (bomAllowed && !bomAllowed.has(part.part_number)) return false;
    return true;
  });
}

function bindNotionScroll(root) {
  if (!root) return;
  const viewport = root.querySelector(".notionScrollViewport");
  const up = root.querySelector(".notionScrollChevron.up");
  const down = root.querySelector(".notionScrollChevron.down");
  if (!viewport || !up || !down) return;
  const sync = () => {
    const max = viewport.scrollHeight - viewport.clientHeight;
    const canScroll = max > 4;
    up.hidden = !canScroll || viewport.scrollTop <= 2;
    down.hidden = !canScroll || viewport.scrollTop >= max - 2;
  };
  if (!root.dataset.scrollBound) {
    root.dataset.scrollBound = "1";
    viewport.addEventListener("scroll", sync, { passive: true });
    up.addEventListener("click", () => viewport.scrollBy({ top: -140, behavior: "smooth" }));
    down.addEventListener("click", () => viewport.scrollBy({ top: 140, behavior: "smooth" }));
  }
  sync();
}

function refreshNotionScrolls() {
  document.querySelectorAll("[data-notion-scroll]").forEach(bindNotionScroll);
}

function renderSearchModalPreviewOnly() {
  if (!searchModalPreview) return;
  const selected = findPartByKey(searchModalSelection);
  searchModalPreview.innerHTML = selected
    ? renderSearchModalPreview(selected)
    : `<p class="empty">Select a result to preview</p>`;
  requestAnimationFrame(refreshNotionScrolls);
}

function syncSearchModalListSelection() {
  if (!searchModalList) return;
  searchModalList.querySelectorAll("[data-search-select]").forEach((button) => {
    button.classList.toggle("active", button.dataset.searchSelect === searchModalSelection);
  });
}

function selectSearchModalResult(key) {
  searchModalSelection = key || null;
  syncSearchModalListSelection();
  renderSearchModalPreviewOnly();
}

function renderSearchModalResults() {
  if (!searchModalList || !searchModalPreview) return;
  syncSearchModalChrome();
  const visible = searchModalFilteredParts();
  const groups = groupedPartResults(visible).slice(0, 100);
  if (!groups.some((group) => partKey(group.representative) === searchModalSelection)) {
    searchModalSelection = partKey(groups[0]?.representative) || null;
  }
  searchModalList.innerHTML = groups.length
    ? groups.map((group) => {
      const part = group.representative;
      const key = partKey(part);
      return `
        <button class="searchResultItem${key === searchModalSelection ? " active" : ""}" type="button" data-search-select="${escapeHtml(key)}">
          <strong>${escapeHtml(part.part_number)}^${escapeHtml(part.revision || "A")}</strong>
          <span>${escapeHtml(part.name)} · ${escapeHtml(part.project || "Unassigned")}</span>
        </button>
      `;
    }).join("")
    : `<p class="sidebarEmpty">No matching parts</p>`;
  renderSearchModalPreviewOnly();
}

function renderSearchModalPreview(part) {
  const legacyPartNumber = legacyPartNumberValue(part);
  const propertyRows = [
    property("Description", part.description || "Not set"),
    property("Revision Description", part.change_summary || "Not set"),
    property("Project", part.project || "Unassigned"),
    property("Traceability", traceabilityLabel(part)),
    property("Legacy Number", legacyPartNumber || "Not set"),
    property("Cost", optionalPartPropertyValue(part, "cost") || "Not set"),
    property("Mass", optionalPartPropertyValue(part, "mass") || "Not set"),
    propertyHtml("Based On", basedOnLink(part))
  ].filter(Boolean);

  return `
    <div class="searchPreviewDetail" data-search-open="${escapeHtml(partKey(part))}" title="Open part">
      <header class="searchPreviewHeader">
        <h3 class="searchPreviewTitle">${escapeHtml(part.name || "Untitled")}</h3>
        <p class="searchPreviewSubtitle">${escapeHtml(mostRecentlyReleasedLabel(part))}</p>
      </header>
      <div class="partCombinedLayout searchPreviewBody">
        ${detailSection("", propertyRows)}
        ${renderInlineWorkflow(part)}
      </div>
    </div>
  `;
}

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
    await syncRunnerConfigDisplay();
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
    productDataRemote = payload.remote || "";
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
  statusMessage = `Pulling latest ${productDataGithubBranch} from ${productDataRemoteLabel()}...`;
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
    await syncRunnerConfigDisplay();
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
      owner: part.owner || currentEditorName() || "",
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
  return parseJsonText(await file.text());
}

function parseJsonText(text) {
  return JSON.parse(String(text).replace(/^\uFEFF/, ""));
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
  if (navigator.userAgent.includes("Electron")) {
    statusMessage = "PEAK's desktop folder picker is unavailable. Restart PEAK or install the latest release.";
    renderApp();
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
    refreshSettingsSurfaces();
  } catch (error) {
    if (error.name !== "AbortError") {
      statusMessage = `Could not select product data folder: ${error.message}`;
      refreshSettingsSurfaces();
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
    await syncRunnerConfigDisplay();
    hasRepoChanges = false;
    localStorage.setItem("peakHasLocalChanges", "false");
    selectedPartNumber = partKey(parts[0]) || null;
    openedPartNumber = null;
    selectedBomPartNumber = selectedPartNumber;
    renderProjectOptions();
    statusMessage = payload.message || `Using product data folder ${productDataFolderName}`;
    refreshSettingsSurfaces();
    renderApp();
  } catch (error) {
    statusMessage = `Could not select product data folder: ${runnerErrorMessage(error)}`;
    refreshSettingsSurfaces();
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
    alternates: normalizeAlternateList(partProperties.alternates || revisionProperties.alternates),
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
  document.title = "PEAK";
  if (!workspaceTabs.length || !activeTabId) {
    renderEmptyWorkspace();
    syncChrome();
    renderTabBar();
    renderSidebarChrome();
    enableSidebarResizing();
    return;
  }
  if (activeNavMode === "part") {
    renderOpenedPartWorkspace();
  } else {
    renderSearchWorkspace();
  }
  syncChrome();
  renderTabBar();
  renderSidebarChrome();
  enableColumnResizing();
  enableBomColumnResizing();
  enableBomColumnReordering();
  enablePaneResizing();
  enableSidebarResizing();
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
  if (pageDescriptionEl) {
    pageDescriptionEl.textContent = pageDescription();
  }

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
    create: "Create draft parts, revisions, and projects.",
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

  document.title = `${partObjectLabel(rootPart)} - PEAK`;
  recordCount.textContent = `Opened ${partObjectLabel(rootPart)}`;
  workspaceHeading.textContent = rootPart.name;
  if (pageDescriptionEl) {
    pageDescriptionEl.textContent = pageDescription();
  }
  navigatorTitle.textContent = "";
  if (navigationTree) {
    navigationTree.hidden = false;
  }
  resultsTitle.textContent = "";

  renderBomTree();
  tableHead.innerHTML = "";
  partsList.innerHTML = "";
  renderOpenedPartDetail(rootPart, selectedPart);
}

function matchesSearch(part, query, { titleOnly = false } = {}) {
  if (!query) {
    return true;
  }

  const haystack = (titleOnly
    ? [part.part_number, part.object_id, part.name]
    : [
      part.part_number,
      part.object_id,
      part.name,
      part.description,
      part.project,
      revisionStatusValue(part),
      part.revision,
      part.owner,
      part.created_by,
      maturityStageLabel(part),
      ...(part.tags ?? []),
      ...(part.attachments ?? []).flatMap((document) => [document.type, document.title]),
      ...(part.documents ?? []).flatMap((document) => [document.type, document.title]),
      ...(part.onshape ?? []).flatMap((reference) => [reference.type, reference.title])
    ])
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

function getOpenedPart() {
  return findPartByKey(openedPartNumber);
}

function getSelectedBomPart() {
  if (selectedBomPartNumber && String(selectedBomPartNumber).startsWith("blank:")) {
    return findPartByKey(openedPartNumber);
  }
  return findPartByKey(selectedBomPartNumber || openedPartNumber) || findPartByKey(openedPartNumber);
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
  activeAlternateEditMode = false;
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
  if (activeCreateMode === "source") {
    renderCreateItemRows({ fromSource: true });
    return;
  }
  if (activeCreateMode === "revision") {
    renderCreateRevisionRows();
    return;
  }
  renderCreateItemRows({ fromSource: false });
}

function renderCreateItemRows({ fromSource }) {
  tableHead.innerHTML = "";
  const projectNames = projects();
  const selectedProject = projectNames.includes(projectFilter.value)
    ? projectFilter.value
    : (projectNames[0] || "");
  const generatedPartNumber = selectedProject ? nextProjectPartNumber(selectedProject) : "";
  const projectOptions = [
    `<option value="">Select project</option>`,
    ...projectNames.map((project) => `<option value="${escapeHtml(project)}"${project === selectedProject ? " selected" : ""}>${escapeHtml(project)}</option>`)
  ].join("");
  const basedOnSelected = (() => {
    if (!fromSource || !createModalSeed?.basedOn) return "";
    const seeded = findPartByKey(createModalSeed.basedOn);
    return seeded?.part_number || String(createModalSeed.basedOn).split("^")[0] || "";
  })();
  const basedOnLabel = basedOnPickerLabel(basedOnSelected);
  const sourceField = fromSource
    ? `
      <div class="createFormField">
        <div class="createFormMeta">
          <label class="createFormLabel" for="newPartBasedOnPicker">Based On <span class="requiredMark" aria-hidden="true">*</span></label>
        </div>
        <button class="createFormPickerBtn" id="newPartBasedOnPicker" type="button" data-filter-picker="basedOn" aria-haspopup="listbox" aria-expanded="false">
          <span id="newPartBasedOnLabel" class="${basedOnSelected ? "" : "is-placeholder"}">${escapeHtml(basedOnLabel)}</span>
        </button>
        <input type="hidden" id="newPartBasedOn" value="${escapeHtml(basedOnSelected)}" required>
      </div>
    `
    : "";
  partsList.innerHTML = `
    <tr class="createFormRow">
      <td colspan="10">
        <div class="createForm">
          <div class="createFormField createFormFieldName">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newPartName">Name <span class="requiredMark" aria-hidden="true">*</span></label>
            </div>
            <input class="tableInput createFormInput createFormNameInput" id="newPartName" value="" required>
          </div>
          <div class="createFormField createFormFieldInline">
            <div class="createFormInlinePair">
              <div class="createFormField">
                <div class="createFormMeta">
                  <label class="createFormLabel" for="newPartNumber">Part Number <span class="requiredMark" aria-hidden="true">*</span></label>
                </div>
                <input class="tableInput createFormInput" id="newPartNumber" value="${escapeHtml(generatedPartNumber)}" required>
              </div>
              <div class="createFormField createFormFieldRevision">
                <div class="createFormMeta">
                  <label class="createFormLabel" for="newPartRevision">Revision</label>
                </div>
                <input class="tableInput createFormInput" id="newPartRevision" value="A" readonly tabindex="-1" aria-readonly="true">
              </div>
            </div>
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newPartProject">Project <span class="requiredMark" aria-hidden="true">*</span></label>
            </div>
            <select class="tableInput createFormInput createFormProjectInput" id="newPartProject" required>${projectOptions}</select>
          </div>
          ${sourceField}
          <div class="createFormActions">
            <button class="createSubmitIcon" type="button" data-submit-create="${fromSource ? "source" : "new"}" title="Create" aria-label="Create"></button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderCreateRevisionRows() {
  tableHead.innerHTML = "";
  const selectedBase = createModalSeed?.partNumber || "";
  const selectedSource = latestRevisionForPart(selectedBase);
  const nextRevision = nextRevisionForPart(selectedSource);
  const name = selectedSource?.name || "";
  const partNumber = selectedSource?.part_number || selectedBase;
  const project = selectedSource?.project || "";
  partsList.innerHTML = `
    <tr class="createFormRow">
      <td colspan="10">
        <div class="createForm createFormReadonly">
          <input type="hidden" id="revisionSourcePart" value="${escapeHtml(partNumber)}">
          <div class="createFormField createFormFieldName">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newRevisionName">Name</label>
            </div>
            <input class="tableInput createFormInput createFormNameInput" id="newRevisionName" value="${escapeHtml(name)}" readonly tabindex="-1" aria-readonly="true">
          </div>
          <div class="createFormField createFormFieldInline">
            <div class="createFormInlinePair">
              <div class="createFormField">
                <div class="createFormMeta">
                  <label class="createFormLabel" for="newRevisionPartNumber">Part Number</label>
                </div>
                <input class="tableInput createFormInput" id="newRevisionPartNumber" value="${escapeHtml(partNumber)}" readonly tabindex="-1" aria-readonly="true">
              </div>
              <div class="createFormField createFormFieldRevision">
                <div class="createFormMeta">
                  <label class="createFormLabel" for="newRevisionValue">Revision</label>
                </div>
                <input class="tableInput createFormInput" id="newRevisionValue" value="${escapeHtml(nextRevision)}" readonly tabindex="-1" aria-readonly="true">
              </div>
            </div>
          </div>
          <div class="createFormField">
            <div class="createFormMeta">
              <label class="createFormLabel" for="newRevisionProject">Project</label>
            </div>
            <input class="tableInput createFormInput createFormProjectInput" id="newRevisionProject" value="${escapeHtml(project)}" readonly tabindex="-1" aria-readonly="true">
          </div>
          <div class="createFormActions">
            <button class="createSubmitIcon" type="button" data-submit-revision title="Create" aria-label="Create"></button>
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
          ${renderCreatePageIntro("New Project", "Project codes become the prefix for auto-generated part numbers.")}
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
            <input class="tableInput createFormInput" id="newProjectOwner" value="${escapeHtml(currentEditorName() || "")}">
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
            <button class="iconButton createActionBtn createCancelBtn" type="button" data-create-mode="hub">Cancel</button>
            <button class="iconButton primaryAction createActionBtn createSaveBtn" type="button" data-submit-project>Create</button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderCreateDetail() {
  partDetail.innerHTML = "";
}

function renderCreatePageIntro(title, detail) {
  return `
    <div class="createPageIntro">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(detail)}</p>
    </div>
  `;
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

function getProfileName() {
  return String(localStorage.getItem("peakProfileName") || "").trim();
}

function getProfileUsername() {
  return String(localStorage.getItem("peakProfileUsername") || "").trim();
}

function isProfileComplete() {
  return Boolean(getProfileName() && getProfileUsername());
}

function currentEditorName() {
  return getProfileName() || getProfileUsername() || "";
}

function currentEditorLabel() {
  const name = getProfileName();
  const username = getProfileUsername();
  if (name && username) return `${name} (@${username})`;
  if (name || username) return name || username;
  return "Profile incomplete";
}

function requireProfileForEdit(message = "Complete your profile in Settings before editing product data.") {
  if (isProfileComplete()) return true;
  statusMessage = message;
  openSettingsModal("profile");
  return false;
}

function productEditUserLabel() {
  return `<p class="editingAsLabel">Editing as ${escapeHtml(currentEditorLabel())}</p>`;
}

function editingAsBanner() {
  if (!activePartEditMode && !activeAttachmentEditMode && !activeAlternateEditMode) return "";
  return productEditUserLabel();
}

function openSettingsModal(section = activeSettingsTab) {
  activeSettingsTab = ["profile", "directory", "appearance"].includes(section) ? section : "profile";
  settingsProfileFeedback = null;
  if (!settingsModal || !settingsModalBody) return;
  settingsModal.hidden = false;
  renderSettingsModal();
}

function closeSettingsModal() {
  if (settingsModal) settingsModal.hidden = true;
}

function refreshSettingsSurfaces() {
  if (settingsModal && !settingsModal.hidden) renderSettingsModal();
}

function saveProfileFromForm() {
  const name = document.querySelector("#settingsProfileName")?.value.trim() || "";
  const username = document.querySelector("#settingsProfileUsername")?.value.trim() || "";
  localStorage.setItem("peakProfileName", name);
  localStorage.setItem("peakProfileUsername", username);
  if (!name || !username) {
    statusMessage = "Profile Name and Profile Username are required.";
    settingsProfileFeedback = { tone: "warning", text: statusMessage };
  } else {
    statusMessage = `Profile saved as ${currentEditorLabel()}`;
    settingsProfileFeedback = { tone: "success", text: statusMessage };
  }
  renderSettingsModal();
  renderApp();
}

function renderSettingsModal() {
  if (!settingsModalBody) return;
  settingsModal?.querySelectorAll("[data-settings-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsSection === activeSettingsTab);
  });
  if (activeSettingsTab === "directory") {
    ensureGitHubAuthStatus();
    settingsModalBody.innerHTML = renderSettingsDirectoryPanel();
    return;
  }
  if (activeSettingsTab === "appearance") {
    settingsModalBody.innerHTML = renderSettingsAppearancePanel();
    return;
  }
  settingsModalBody.innerHTML = renderSettingsProfilePanel();
}

function renderSettingsProfilePanel() {
  const incomplete = !isProfileComplete();
  const feedback = settingsProfileFeedback
    ? `<p class="settingsPanelNotice settingsPanelNotice-${settingsProfileFeedback.tone}" role="status">${escapeHtml(settingsProfileFeedback.text)}</p>`
    : incomplete
      ? `<p class="settingsPanelNotice" role="status">Profile Name and Profile Username are required.</p>`
      : "";
  return `
    <div class="settingsPanel">
      <header class="settingsPanelHeader">
        <h3>Profile</h3>
        <p>Required before creating or editing product data.</p>
      </header>
      ${feedback}
      <div class="settingsField">
        <label class="settingsFieldLabel" for="settingsProfileName">Profile Name <span class="requiredMark" aria-hidden="true">*</span></label>
        <input class="settingsFieldInput" id="settingsProfileName" value="${escapeHtml(getProfileName())}" placeholder="Full name" autocomplete="name">
      </div>
      <div class="settingsField">
        <label class="settingsFieldLabel" for="settingsProfileUsername">Profile Username <span class="requiredMark" aria-hidden="true">*</span></label>
        <input class="settingsFieldInput" id="settingsProfileUsername" value="${escapeHtml(getProfileUsername())}" placeholder="username" autocomplete="username">
      </div>
      <div class="settingsPanelActions">
        <button class="iconButton primaryAction formAction" type="button" data-save-profile>Save Profile</button>
      </div>
    </div>
  `;
}

function renderSettingsDirectoryPanel() {
  const productDataFolderDisplay = productDataFolderName || "";
  return `
    <div class="settingsPanel">
      <header class="settingsPanelHeader">
        <h3>Directory</h3>
        <p>Product data folder and remote configuration.</p>
      </header>
      <div class="settingsField">
        <label class="settingsFieldLabel" for="settingsProductDataFolder">Product Data Folder</label>
        <div class="folderPicker">
          <input class="settingsFieldInput folderInput" id="settingsProductDataFolder" value="${escapeHtml(productDataFolderDisplay)}" placeholder="No folder selected" readonly>
          <button class="iconButton formAction" type="button" data-select-product-folder title="Select product data folder" aria-label="Select product data folder" data-icon="folder"></button>
        </div>
        <p class="settingsFieldHint">Local Git folder containing manifest.json and parts/</p>
      </div>
      <div class="settingsField">
        <label class="settingsFieldLabel" for="settingsProductDataRemote">Product Data Remote</label>
        <input class="settingsFieldInput" id="settingsProductDataRemote" value="${escapeHtml(productDataRemote)}" placeholder="https://github.com/organization/Product-Data.git">
        <p class="settingsFieldHint">Required Git origin used for pull, push, and workflow operations</p>
      </div>
      <div class="settingsField">
        <span class="settingsFieldLabel">GitHub Merge Requests</span>
        ${githubAuthSettingsInline()}
      </div>
      <div class="settingsPanelActions">
        <button class="iconButton primaryAction formAction" type="button" data-save-settings>Save Directory</button>
      </div>
    </div>
  `;
}

function githubAuthSettingsInline() {
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
    <div class="settingsActionCell">
      <span class="settingsStatus ${status?.authenticated ? "success" : "warning"}">${escapeHtml(state)}</span>
      ${button}
    </div>
    <p class="settingsFieldHint">${escapeHtml(detail)}</p>
  `;
}

function renderSettingsAppearancePanel() {
  return `
    <div class="settingsPanel">
      <header class="settingsPanelHeader">
        <h3>Appearance</h3>
        <p>General appearance preferences for this workstation.</p>
      </header>
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
          <p class="appearanceLabel">Typography</p>
          <div class="fontPrefRow">
            <label>
              Font
              <select id="peakFontFamily" aria-label="Font family">
                ${fontFamilyOptions.map((option) => `
                  <option value="${escapeHtml(option.id)}"${activeFontFamily === option.id ? " selected" : ""}>${escapeHtml(option.label)}</option>
                `).join("")}
              </select>
            </label>
            <label>
              Size
              <input type="number" id="peakFontSize" min="10" max="24" step="1" value="${escapeHtml(activeFontSize)}" aria-label="Font size">
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsRows() {
  // Legacy tab renderer replaced by settings popup.
  tableHead.innerHTML = "";
  partsList.innerHTML = `<tr><td class="emptyCell" colspan="6">Open Settings from the sidebar.</td></tr>`;
}

function githubAuthSettingsRow() {
  return `
    <tr>
      <td>GitHub Merge Requests</td>
      <td>${githubAuthSettingsInline()}</td>
      <td></td>
    </tr>
  `;
}

function renderAppearanceTabRows() {
  partsList.innerHTML = `
    <tr>
      <td colspan="10" class="appearanceCell">
        ${renderSettingsAppearancePanel()}
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
  const key = partKey(selectedPart);
  const isFavorite = favoritePartKeys.includes(key);
  const infoOpen = partAsidePanel === "info";
  const editing = activePartEditMode && isDraftRevision(selectedPart);
  const releasedLabel = mostRecentlyReleasedLabel(selectedPart);
  const driveUrl = documentUrl(selectedPart, "drive");
  const onshapeUrl = documentUrl(selectedPart, "onshape");
  const workUrl = documentUrl(selectedPart, "work");
  partDetail.innerHTML = `
    <div class="partDetailLayout partDetailV2${infoOpen ? " panel-open" : ""}">
      <div class="partDetailMain">
        <header class="partDetailToolbar">
          <div class="partDetailHeading">
            ${editing
              ? `<input class="partDetailNameInput" data-open-part-field="name" value="${escapeHtml(selectedPart.name || "")}" aria-label="Name">`
              : `<h2 class="partDetailName">${escapeHtml(selectedPart.name || "Untitled")}</h2>`}
            <p class="partDetailObjectId">${escapeHtml(releasedLabel)}</p>
            <div class="partDetailLinkActions" aria-label="External links">
              ${partActionButton("Open Google Drive", "open-drive", { disabled: !driveUrl })}
              ${partActionButton("Open Onshape", "open-onshape", { disabled: !onshapeUrl })}
              ${partActionButton("Open WI", "open-work", { disabled: !workUrl })}
            </div>
          </div>
          <div class="partDetailToolbarActions">
            ${editingAsBanner()}
            <button class="partToolBtn${infoOpen ? " active" : ""}" type="button" data-part-panel="info" title="Details" aria-label="Details" aria-pressed="${infoOpen}"></button>
            <button class="partToolBtn partToolStar${isFavorite ? " active" : ""}" type="button" data-part-favorite="${escapeHtml(key)}" title="${isFavorite ? "Unfavorite" : "Favorite"}" aria-label="${isFavorite ? "Unfavorite" : "Favorite"}" aria-pressed="${isFavorite}"></button>
            <div class="partOptionsWrap">
              <button class="partToolBtn${partOptionsMenuOpen ? " active" : ""}" type="button" data-part-options-toggle title="Options" aria-label="Options" aria-expanded="${partOptionsMenuOpen}" aria-haspopup="menu"></button>
              ${partOptionsMenuOpen ? renderPartOptionsMenu(selectedPart) : ""}
            </div>
          </div>
        </header>
        <div class="partDetailBody notionScroll" data-notion-scroll>
          <button class="notionScrollChevron up" type="button" data-scroll-dir="-1" hidden aria-label="Scroll up"></button>
          <div class="partDetailScroll notionScrollViewport">
            ${renderCombinedPartDetails(selectedPart)}
          </div>
          <button class="notionScrollChevron down" type="button" data-scroll-dir="1" hidden aria-label="Scroll down"></button>
        </div>
      </div>
      <div class="partAsideSlot" aria-hidden="${infoOpen ? "false" : "true"}">
        ${renderPartInfoPanel(selectedPart)}
      </div>
    </div>
  `;
  requestAnimationFrame(refreshNotionScrolls);
}

function mostRecentlyReleasedLabel(part) {
  const revisions = parts.filter((candidate) => candidate.part_number === part.part_number);
  const released = latestReleasedRevision(revisions) || representativeRevision(revisions) || part;
  return `${released.part_number}^${released.revision || "A"}`;
}

function renderPartInfoPanel(part) {
  const documents = attachmentsForPart(part);
  return `
    <aside class="partAsidePanel" aria-label="Part details">
      <header class="partAsideHeader">
        <h3>Details</h3>
        <button class="partAsideClose" type="button" data-part-panel-close aria-label="Close">×</button>
      </header>
      <div class="notionPropsPanel">
        <div class="notionPropRow">
          <span class="notionPropLabel">Created by</span>
          <span class="notionPropValue">${escapeHtml(createdBy(part))}</span>
        </div>
        <div class="notionPropRow">
          <span class="notionPropLabel">Created</span>
          <span class="notionPropValue">${escapeHtml(formatPartTimestamp(part.created_at))}</span>
        </div>
        <div class="notionPropRow">
          <span class="notionPropLabel">Last edited by</span>
          <span class="notionPropValue">${escapeHtml(updatedBy(part))}</span>
        </div>
        <div class="notionPropRow">
          <span class="notionPropLabel">Last edited</span>
          <span class="notionPropValue">${escapeHtml(formatPartTimestamp(part.updated_at))}</span>
        </div>
        <div class="notionDocsBlock">
          <h4 class="notionDocsHeading">Documents</h4>
          ${documents.length
            ? `<ul class="notionDocsList">${documents.map((record) => `
                <li class="notionDocItem">
                  ${record.url
                    ? `<a href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(record.title || record.name || "Untitled")}">${escapeHtml(record.title || record.name || "Untitled")}</a>`
                    : `<span title="${escapeHtml(record.title || record.name || "Untitled")}">${escapeHtml(record.title || record.name || "Untitled")}</span>`}
                  <span class="notionDocType">${escapeHtml(attachmentTypeLabel(record))}</span>
                </li>
              `).join("")}</ul>`
            : `<p class="notionDocsEmpty">No documents</p>`}
        </div>
      </div>
    </aside>
  `;
}

function renderPartOptionsMenu(part) {
  const canEdit = isDraftRevision(part);
  const hasDraftRevision = draftRevisionsForPart(part.part_number).length > 0;
  const maturityTransition = nextMaturityTransition(part);
  const revisionTransition = nextRevisionTransition(part);
  const maturityRule = maturityTransition ? maturityWorkflowRule(part, maturityTransition.to) : workflowRule([]);
  const revisionRule = revisionTransition ? revisionWorkflowRule(part, revisionTransition.to) : workflowRule([]);

  return `
    <div class="partOptionsMenu" role="menu" aria-label="Part options">
      <div class="partOptionsMenuBody">
        ${partOptionItem("Copy Item ID", "copy-item-id", { icon: "copy-id" })}
        ${partOptionItem("Copy Item Contents", "copy-item-contents", { icon: "copy" })}
        <div class="partOptionsDivider" role="separator"></div>
        ${partOptionItem("Edit Item", "edit-part", { icon: "edit", disabled: !canEdit, active: activePartEditMode })}
        ${partOptionItem("Edit Attachments", "edit-attachments", { icon: "attachments", active: activeAttachmentEditMode })}
        ${partOptionItem("Edit Alternates", "edit-alternates", { icon: "alternates", active: activeAlternateEditMode })}
        <div class="partOptionsDivider" role="separator"></div>
        ${partOptionItem("Create Revision", "create-revision", { icon: "revision", disabled: hasDraftRevision, title: hasDraftRevision ? "A draft revision already exists for this item" : "" })}
        ${partOptionItem("Create Item Based On", "create-from-source", { icon: "revision" })}
        ${partOptionItem("Create Alternate Item", "create-alternate", { icon: "revision" })}
        <div class="partOptionsDivider" role="separator"></div>
        ${workflowMenuAction(maturityTransition, maturityRule, "Transition Item Maturity", "maturity", part, { alwaysShow: true, icon: "status" })}
        ${workflowMenuAction(revisionTransition, revisionRule, "Transition Revision Status", "revision", part, { alwaysShow: true, icon: "arrow-up" })}
        ${workflowFeedbackMessage("maturity", part)}
        ${workflowFeedbackMessage("revision", part)}
        ${activePartEditMode ? `
          <div class="partOptionsDivider" role="separator"></div>
          ${partOptionItem("Save Part", "save-part", { icon: "save" })}
          ${partOptionItem("Cancel Changes", "cancel-part-edit", { icon: "cancel" })}
        ` : ""}
      </div>
    </div>
  `;
}

function partOptionItem(label, action, { icon = "", disabled = false, active = false, title = "" } = {}) {
  return `<button class="partOptionItem${active ? " is-active" : ""}" type="button" role="menuitem" data-part-action="${escapeHtml(action)}" data-option-label="${escapeHtml(label)}" data-option-icon="${escapeHtml(icon)}"${disabled ? " disabled" : ""}${active ? " aria-current=\"true\"" : ""}${title ? ` title="${escapeHtml(title)}"` : ""}><span class="partOptionIcon" aria-hidden="true"></span><span class="partOptionLabel">${escapeHtml(label)}</span></button>`;
}

function workflowMenuAction(transition, rule, label, workflow, part, { danger = false, alwaysShow = false, icon = "" } = {}) {
  if (!transition && !alwaysShow) return "";
  const feedback = workflowFeedbackFor(workflow, part);
  const isRunning = feedback?.state === "running";
  const enabled = Boolean(transition) && Boolean(rule?.ready) && !isRunning;
  const to = transition?.to || "";
  const display = isRunning ? "Working..." : label;
  return `<button class="partOptionItem${danger ? " danger" : ""}" type="button" role="menuitem" data-option-label="${escapeHtml(label)}" data-option-icon="${escapeHtml(icon)}" data-workflow-action="${escapeHtml(workflow)}" data-workflow-to="${escapeHtml(to)}"${enabled ? "" : " disabled"}><span class="partOptionIcon" aria-hidden="true"></span><span class="partOptionLabel">${escapeHtml(display)}</span></button>`;
}

function filterPartOptionsMenu(query = partOptionsSearchQuery) {
  const menu = document.querySelector(".partOptionsMenu");
  if (!menu) return;
  const body = menu.querySelector(".partOptionsMenuBody");
  if (!body) return;
  const q = String(query || "").trim().toLowerCase();
  const items = [...body.querySelectorAll(".partOptionItem")];
  items.forEach((item) => {
    const label = String(item.dataset.optionLabel || item.textContent || "").toLowerCase();
    item.hidden = Boolean(q) && !label.includes(q);
  });
  body.querySelectorAll(".partOptionsDivider").forEach((divider) => {
    let hasBefore = false;
    let hasAfter = false;
    let el = divider.previousElementSibling;
    while (el) {
      if (el.classList.contains("partOptionsDivider")) break;
      if (el.classList.contains("partOptionItem") && !el.hidden) {
        hasBefore = true;
        break;
      }
      el = el.previousElementSibling;
    }
    el = divider.nextElementSibling;
    while (el) {
      if (el.classList.contains("partOptionsDivider")) break;
      if (el.classList.contains("partOptionItem") && !el.hidden) {
        hasAfter = true;
        break;
      }
      el = el.nextElementSibling;
    }
    divider.hidden = !(hasBefore && hasAfter);
  });
  const anyVisible = items.some((item) => !item.hidden);
  let empty = body.querySelector(".partOptionsEmpty");
  if (!anyVisible) {
    if (!empty) {
      empty = document.createElement("p");
      empty.className = "partOptionsEmpty";
      empty.textContent = "No matching actions";
      body.insertBefore(empty, body.firstChild);
    }
  } else {
    empty?.remove();
  }
}

function focusPartOptionsSearch() {
  // Search field removed; keep first enabled action ready for keyboard use.
  requestAnimationFrame(() => {
    document.querySelector(".partOptionsMenuBody .partOptionItem:not([hidden]):not(:disabled)")?.focus();
  });
}

function formatPartTimestamp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Not set";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderCombinedPartDetails(part) {
  if (activeAttachmentEditMode) {
    return renderEditableAttachmentsTab(part);
  }
  if (activeAlternateEditMode) {
    return renderEditableAlternates(part);
  }
  const editing = activePartEditMode && isDraftRevision(part);
  const legacyPartNumber = legacyPartNumberValue(part);
  const propertyRows = [
    editing ? propertyEditInline("Description", "description", part.description || "", { textarea: true }) : property("Description", part.description || "Not set"),
    editing ? propertyEditInline("Revision Description", "change_summary", part.change_summary || "", { textarea: true }) : property("Revision Description", part.change_summary || "Not set"),
    property("Project", part.project || "Unassigned"),
    editing ? propertyEditSelectInline("Traceability", "traceability", traceabilityValue(part), traceabilityOptions()) : property("Traceability", traceabilityLabel(part)),
    editing ? propertyEditInline("Legacy Number", "legacy_part_number", legacyPartNumber) : property("Legacy Number", legacyPartNumber || "Not set"),
    editing ? propertyEditInline("Cost", "cost", optionalPartPropertyValue(part, "cost")) : property("Cost", optionalPartPropertyValue(part, "cost") || "Not set"),
    editing ? propertyEditInline("Mass", "mass", optionalPartPropertyValue(part, "mass")) : property("Mass", optionalPartPropertyValue(part, "mass") || "Not set"),
    propertyHtml("Based On", basedOnLink(part)),
    ...(editing ? [
      propertyEditInline("Google Drive Link", "driveUrl", documentUrl(part, "drive")),
      propertyEditInline("Onshape Link", "onshapeUrl", documentUrl(part, "onshape")),
      propertyEditInline("Work Instructions Link", "workUrl", documentUrl(part, "work")),
      propertyEditInline("Approvers", "approvers", (part.approvers ?? []).map((approver) => approver.name || approver).join(", "))
    ] : [])
  ].filter(Boolean);

  return `
    <div class="partCombinedLayout">
      ${detailSection("", propertyRows)}
      ${renderRevisionHistory(part)}
      ${renderApprovedAlternates(part)}
      ${renderWhereUsedHistory(part)}
      ${renderInlineWorkflow(part)}
      ${(() => {
        const activityItems = activityHistoryForPart(part);
        return `
          <section class="propertySection sectionLabeled">
            <h3>Activity</h3>
            ${activityItems.length ? renderActivityHistory(activityItems) : `<p class="empty">No activity recorded for this part.</p>`}
          </section>
        `;
      })()}
    </div>
  `;
}

function renderInlineWorkflow(part) {
  return `
    <section class="propertySection workflowSection sectionLabeled">
      <h3>Part Maturity</h3>
      ${workflowPillTrack(maturityWorkflowStates, maturityStageValue(part), maturityStageText)}
      ${workflowFeedbackMessage("maturity", part)}
    </section>
    <section class="propertySection workflowSection sectionLabeled">
      <h3>Release Status</h3>
      ${workflowPillTrack(revisionWorkflowStates, revisionStatusValue(part), revisionStatusText)}
      ${workflowFeedbackMessage("revision", part)}
    </section>
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
        ${detailSection("Links", [
          editing ? propertyEditInline("Google Drive Link", "driveUrl", documentUrl(part, "drive")) : propertyLink("Google Drive Link", documentUrl(part, "drive"), { kind: "drive", required: true }),
          editing ? propertyEditInline("Onshape Link", "onshapeUrl", documentUrl(part, "onshape")) : propertyLink("Onshape Link", documentUrl(part, "onshape"), { kind: "onshape", required: true }),
          editing ? propertyEditInline("Work Instructions Link", "workUrl", documentUrl(part, "work")) : propertyLink("Work Instructions Link", documentUrl(part, "work"), { kind: "work" })
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
    <ol class="activityCommitList">
      ${sorted.map((item) => `
        <li class="activityCommitItem">
          <div class="activityCommitRail" aria-hidden="true">
            <span class="activityCommitDot"></span>
          </div>
          <div class="activityCommitBody">
            <p class="activityCommitMessage">${escapeHtml(item.detail || activityDefaultDetail(item))}</p>
            <p class="activityCommitMeta">
              <span class="activityCommitActor">${escapeHtml(item.actor || "Unknown user")}</span>
              <span class="activityCommitAction">${escapeHtml(activityActionLabel(item.action))}</span>
              <time class="activityCommitTime" datetime="${escapeHtml(item.performed_at || "")}">${escapeHtml(formatActivityTimestamp(item.performed_at))}</time>
            </p>
          </div>
        </li>
      `).join("")}
    </ol>
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
  const primary = revisionTransition
    ? {
        title: revisionTransition.to === "release_candidate" ? "Next: Set Release Candidate" : `Next: ${revisionStatusText(revisionTransition.to)}`,
        detail: revisionTransition.mode === "direct"
          ? "This transition pushes directly to the product data remote."
          : "This transition opens a GitHub pull request for review.",
        transition: revisionTransition,
        rule: revisionRule,
        workflow: "revision",
        label: revisionTransition.to === "release_candidate" ? "Set Release Candidate" : `Transition to ${revisionStatusText(revisionTransition.to)}`
      }
    : maturityTransition
      ? {
          title: `Next: ${maturityStageText(maturityTransition.to)}`,
          detail: "Maturity changes are reviewed through a GitHub pull request.",
          transition: maturityTransition,
          rule: maturityRule,
          workflow: "maturity",
          label: `Transition to ${maturityStageText(maturityTransition.to)}`
        }
      : null;
  return `
    ${primary ? `
      <section class="propertySection">
        <div class="workflowNextCard">
          <strong>${escapeHtml(primary.title)}</strong>
          <p>${escapeHtml(primary.detail)}</p>
          ${workflowCriteriaList(primary.rule, { jumpable: true })}
          ${workflowActionButton(primary.transition, primary.rule, primary.label, primary.workflow, part)}
        </div>
      </section>
    ` : ""}
    <section class="propertySection workflowSection">
      <h3>Product Maturity</h3>
      ${workflowTimeline(maturityWorkflowStates, maturityStageValue(part), maturityStageText)}
      <dl class="propertyGrid workflowGrid">
        ${property("Current", maturityStageLabel(part))}
        ${property("Scope", part.part_number)}
        ${property("Next", maturityTransition ? maturityStageText(maturityTransition.to) : "No transition available")}
        ${property("Approval", maturityTransition ? "Merge request" : "Complete")}
      </dl>
      ${workflowCriteriaList(maturityRule, { jumpable: true })}
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
      ${workflowCriteriaList(revisionRule, { jumpable: true })}
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

function workflowPillTrack(states, current, labeler) {
  const activeIndex = Math.max(0, states.indexOf(current));
  const items = states.flatMap((state, index) => {
    const isComplete = index <= activeIndex;
    const isActive = index === activeIndex;
    const cls = `workflowPill${isComplete ? " complete" : ""}${isActive ? " active" : ""}`;
    const pill = `<span class="${cls}" role="listitem">${escapeHtml(labeler(state))}</span>`;
    if (index >= states.length - 1) return [pill];
    const chevronComplete = index < activeIndex ? " complete" : "";
    return [pill, `<span class="workflowPillChevron${chevronComplete}" aria-hidden="true"></span>`];
  });
  return `<div class="workflowPillTrack" role="list" aria-label="Workflow status">${items.join("")}</div>`;
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

function workflowCriteriaList(rule, { jumpable = false } = {}) {
  const items = rule.criteria.map((item) => {
    const jumpField = jumpable && !item.met ? workflowGateJumpField(item.label) : "";
    const labelHtml = jumpField
      ? `<button class="gateJump" type="button" data-gate-jump="${escapeHtml(jumpField)}">${escapeHtml(item.label)}</button>`
      : `<span>${escapeHtml(item.label)}</span>`;
    return `
      <li class="${item.met ? "met" : "blocked"}">
        <span class="workflowCriterionIcon" aria-hidden="true"></span>
        ${labelHtml}
      </li>
    `;
  }).join("");
  return `<ul class="workflowCriteria">${items}</ul>`;
}

function workflowGateJumpField(label) {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("google drive") || normalized.includes("onshape") || normalized.includes("links")) {
    return "driveUrl";
  }
  if (normalized.includes("required properties") || normalized.includes("description") || normalized.includes("name")) {
    return "name";
  }
  if (normalized.includes("approver")) {
    return "approvers";
  }
  return "";
}

function detailSection(title, rows) {
  return `
    <section class="propertySection">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
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

function propertyLink(label, url, { kind = "", required = false } = {}) {
  if (!url) {
    return `
      <dt>${escapeHtml(label)}${required ? '<span class="linkRequired">required for release</span>' : ""}</dt>
      <dd>Not set</dd>
    `;
  }
  const parsedId = kind === "onshape"
    ? onshapeDocumentIdFromUrl(url)
    : kind === "drive"
      ? driveIdFromUrl(url)
      : "";
  const idLabel = parsedId && parsedId !== "linked-drive-file" && parsedId !== "linked-document"
    ? `<span class="linkMetaId">${escapeHtml(parsedId)}</span>`
    : "";
  return `
    <dt>${escapeHtml(label)}${required ? '<span class="linkRequired">required for release</span>' : ""}</dt>
    <dd>
      <div class="linkMetaRow">
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>
        <div class="linkMetaActions">
          ${idLabel}
          <button class="iconButton formAction" type="button" data-copy-link="${escapeHtml(url)}" title="Copy link">Copy</button>
        </div>
      </div>
    </dd>
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
  if (editable) {
    const groups = groupedAttachments(part);
    if (!groups.length) {
      return `
        <section class="propertySection attachmentTypeSection sectionLabeled">
          <h3>Documents</h3>
          <p class="description">No attachments linked.</p>
        </section>
      `;
    }
    return groups
      .map(
        ([type, records]) => `
          <section class="propertySection attachmentTypeSection sectionLabeled">
            <h3>${escapeHtml(type)}</h3>
            <div class="referenceList">
              ${records.map((record) => fileReference(record, { editable: true })).join("")}
            </div>
          </section>
        `
      )
      .join("");
  }
  return "";
}

function renderDocumentsTable(part) {
  return "";
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
      ["Google Drive and Onshape links are present", allRequiredLinksPresent(part)]
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
  return ["drive", "onshape"].every((kind) => Boolean(documentUrl(part, kind)));
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
    <section class="propertySection sectionLabeled">
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
  if (!rows.length) return "";
  return `
    <section class="propertySection sectionLabeled">
      <h3>Where Used</h3>
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
    </section>
  `;
}

function normalizeAlternateList(value) {
  const seen = new Set();
  const list = [];
  asArray(value).forEach((entry) => {
    const partNumber = canonicalPartNumber(
      typeof entry === "string"
        ? String(entry).split("^")[0]
        : entry?.part_number || entry?.partNumber || ""
    );
    if (!partNumber || seen.has(partNumber)) return;
    seen.add(partNumber);
    list.push(partNumber);
  });
  return list;
}

function alternatesForPart(part) {
  if (!part) return [];
  const own = normalizeAlternateList(part.alternates || part.part_properties?.alternates);
  const partNumber = canonicalPartNumber(part.part_number);
  return own.filter((candidate) => candidate !== partNumber);
}

function setAlternatesForPartNumber(partNumber, alternates) {
  const normalizedNumber = canonicalPartNumber(partNumber);
  const next = normalizeAlternateList(alternates).filter((candidate) => candidate !== normalizedNumber);
  parts.forEach((candidate) => {
    if (canonicalPartNumber(candidate.part_number) !== normalizedNumber) return;
    candidate.alternates = [...next];
    candidate.part_properties = {
      ...(candidate.part_properties || {}),
      alternates: [...next]
    };
  });
}

function linkPartsAsAlternates(partA, partB) {
  if (!partA || !partB) return false;
  const aNumber = canonicalPartNumber(partA.part_number);
  const bNumber = canonicalPartNumber(partB.part_number);
  if (!aNumber || !bNumber || aNumber === bNumber) return false;
  const aAlts = new Set(alternatesForPart(partA));
  const bAlts = new Set(alternatesForPart(partB));
  aAlts.add(bNumber);
  bAlts.add(aNumber);
  setAlternatesForPartNumber(aNumber, [...aAlts]);
  setAlternatesForPartNumber(bNumber, [...bAlts]);
  return true;
}

function alternatePartsFor(part) {
  return alternatesForPart(part)
    .map((partNumber) => latestRevisionForPart(partNumber) || findPartByKey(partNumber))
    .filter(Boolean);
}

function renderApprovedAlternates(part) {
  const rows = alternatePartsFor(part);
  if (!rows.length) return "";
  return `
    <section class="propertySection sectionLabeled">
      <h3>Approved Alternates</h3>
      <div class="detailTableWrap">
        <table class="detailTable revisionHistoryTable">
          <thead>
            <tr>
              <th scope="col">Object</th>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Project</th>
              <th scope="col">Updated By</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(approvedAlternateRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function approvedAlternateRow(alternate) {
  const objectLabel = partObjectLabel(alternate);
  return `
    <tr>
      <td><button class="linkButton" type="button" data-part-number="${escapeHtml(partKey(alternate))}">${escapeHtml(objectLabel)}</button></td>
      <td>${escapeHtml(alternate.name || "Untitled")}</td>
      <td>${escapeHtml(releaseStatusLabel(alternate))}</td>
      <td>${escapeHtml(alternate.project || "Unassigned")}</td>
      <td>${escapeHtml(updatedBy(alternate))}</td>
      <td>${escapeHtml(alternate.updated_at || "Not set")}</td>
    </tr>
  `;
}

function renderEditableAlternates(part) {
  const rows = alternatePartsFor(part);
  return `
    <div class="alternateEditLayout">
      <header class="alternateEditHeader">
        <div>
          <h3>Edit Alternates</h3>
          <p>Manage approved substitutes for ${escapeHtml(partObjectLabel(part))}.</p>
        </div>
        <div class="alternateEditActions">
          <button class="iconButton formAction" type="button" data-add-alternate-picker title="Add alternate">Add Alternate</button>
          <button class="iconButton formAction" type="button" data-cancel-alternate-edit>Done</button>
        </div>
      </header>
      <div class="detailTableWrap">
        <table class="detailTable revisionHistoryTable">
          <thead>
            <tr>
              <th scope="col">Object</th>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Project</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            ${rows.length
              ? rows.map((alternate) => `
                <tr>
                  <td><button class="linkButton" type="button" data-part-number="${escapeHtml(partKey(alternate))}">${escapeHtml(partObjectLabel(alternate))}</button></td>
                  <td>${escapeHtml(alternate.name || "Untitled")}</td>
                  <td>${escapeHtml(releaseStatusLabel(alternate))}</td>
                  <td>${escapeHtml(alternate.project || "Unassigned")}</td>
                  <td class="alternateEditRemoveCell">
                    <button class="iconButton formAction" type="button" data-remove-alternate="${escapeHtml(alternate.part_number)}" title="Remove alternate">Remove</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td class="emptyCell" colspan="5">No alternates assigned yet</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function unlinkPartsAsAlternates(partA, partB) {
  if (!partA || !partB) return false;
  const aNumber = canonicalPartNumber(partA.part_number);
  const bNumber = canonicalPartNumber(partB.part_number);
  if (!aNumber || !bNumber || aNumber === bNumber) return false;
  setAlternatesForPartNumber(aNumber, alternatesForPart(partA).filter((value) => value !== bNumber));
  setAlternatesForPartNumber(bNumber, alternatesForPart(partB).filter((value) => value !== aNumber));
  return true;
}

function openAlternateModal(part) {
  if (!requireProfileForEdit()) return;
  if (!alternateModal || !part) return;
  alternateSourceKey = partKey(part);
  alternateModal.hidden = false;
  if (alternateSearchInput) {
    alternateSearchInput.value = "";
    alternateSearchInput.focus();
  }
  renderAlternateModalResults();
  requestAnimationFrame(refreshNotionScrolls);
}

function closeAlternateModal() {
  if (alternateModal) alternateModal.hidden = true;
  alternateSourceKey = null;
  if (alternateSearchInput) alternateSearchInput.value = "";
  if (alternateModalList) alternateModalList.innerHTML = "";
}

function renderAlternateModalResults() {
  if (!alternateModalList) return;
  const source = findPartByKey(alternateSourceKey);
  if (!source) {
    alternateModalList.innerHTML = `<p class="sidebarEmpty">No source part selected</p>`;
    return;
  }
  const query = alternateSearchInput?.value.trim() || "";
  const existing = new Set(alternatesForPart(source));
  const sourceNumber = canonicalPartNumber(source.part_number);
  const groups = groupedPartResults(parts)
    .filter((group) => {
      const part = group.representative;
      const partNumber = canonicalPartNumber(part.part_number);
      if (!partNumber || partNumber === sourceNumber) return false;
      if (existing.has(partNumber)) return false;
      if (!query) return true;
      return matchesSearch(part, query);
    })
    .slice(0, 80);
  alternateModalList.innerHTML = groups.length
    ? groups.map((group) => {
      const part = group.representative;
      return `
        <button class="searchResultItem" type="button" data-assign-alternate="${escapeHtml(partKey(part))}">
          <strong>${escapeHtml(part.part_number)}^${escapeHtml(part.revision || "A")}</strong>
          <span>${escapeHtml(part.name)} · ${escapeHtml(part.project || "Unassigned")}</span>
        </button>
      `;
    }).join("")
    : `<p class="sidebarEmpty">${query ? "No matching parts" : "No available parts to assign"}</p>`;
  requestAnimationFrame(refreshNotionScrolls);
}

function assignAlternateFromPicker(targetKey) {
  if (!requireProfileForEdit()) return;
  const source = findPartByKey(alternateSourceKey);
  const target = findPartByKey(targetKey);
  if (!source || !target) {
    statusMessage = "Could not assign alternate";
    return;
  }
  if (!linkPartsAsAlternates(source, target)) {
    statusMessage = "Could not assign alternate";
    return;
  }
  persistLocalChanges();
  statusMessage = `Linked ${partObjectLabel(source)} and ${partObjectLabel(target)} as approved alternates`;
  closeAlternateModal();
  renderApp();
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
  if (!item || isBlankBomItem(item)) {
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

function isBlankBomItem(item) {
  return Boolean(item) && String(item.child_object_id || "").startsWith("blank:");
}

function createBlankBomItem() {
  return {
    child_object_id: `blank:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    child_part_number: "",
    child_revision: "",
    quantity: 1,
    unit: "each"
  };
}

function bomItemsForPersist(bom) {
  return asArray(bom).filter((item) => !isBlankBomItem(item));
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
        <button class="treeNode${activeCreateMode === "new" ? " active" : ""}" type="button" data-create-mode="new">New Part</button>
        <button class="treeNode${activeCreateMode === "source" ? " active" : ""}" type="button" data-create-mode="source">From Source</button>
        <button class="treeNode${activeCreateMode === "revision" ? " active" : ""}" type="button" data-create-mode="revision">New Revision</button>
      </div>
    `;
    return;
  }

  if (activeNavMode === "settings") {
    navigationTree.innerHTML = `<div class="treeEmpty">Use Settings in the sidebar.</div>`;
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
      ${renderBomHeader()}
      <button class="treeNode bomNode root${selectedBomPartNumber === partKey(rootPart) ? " active" : ""}" type="button" data-bom-part-number="${escapeHtml(partKey(rootPart))}" role="row">
        ${renderBomRowCells({ type: "root", part: rootPart })}
      </button>
      ${childRows || (!activePartEditMode ? '<div class="treeEmpty">No child components</div>' : "")}
      ${activePartEditMode ? renderBomNewRow() : ""}
    </div>
  `;
}

function renderBomHeader() {
  return `
    <div class="bomHeader" role="row">
      ${activeBomColumnOrder.map((key, index) => {
        const column = bomColumnDefinitions[key];
        return `<span class="bomHeaderCell" draggable="true" data-bom-column="${key}" title="Drag to reorder ${escapeHtml(column.label)} column">${escapeHtml(column.label)}<span class="bomResizeHandle" data-bom-resize-column="${index}" data-bom-resize-key="${key}" role="separator" aria-label="Resize ${escapeHtml(column.label)} column"></span></span>`;
      }).join("")}
    </div>
  `;
}

function renderBomRowCells({ type, part, item, child, childId, toggle = "", editable = false }) {
  return activeBomColumnOrder.map((key) => {
    if (key === "item") {
      if (type === "root") return `<span class="bomItem bomItemCell">${escapeHtml(part.part_number)}</span>`;
      if (editable) {
        const blank = isBlankBomItem(item);
        const label = blank
          ? "Select item"
          : (child?.part_number || item?.child_part_number || "Select item");
        const dragHandle = blank
          ? ""
          : `<span class="bomDragHandle" draggable="true" data-bom-drag="${escapeHtml(childId)}" title="Drag to reorder" aria-label="Drag to reorder"></span>`;
        return `
          <div class="bomItem bomItemCell">
            ${dragHandle}
            ${toggle}
            <button class="bomItemSelectBtn${blank ? " is-placeholder" : ""}" type="button" data-filter-picker="bomItem" data-bom-pick-item="${escapeHtml(childId)}" aria-haspopup="listbox" aria-expanded="false" title="Select item">
              ${escapeHtml(label)}
            </button>
          </div>
        `;
      }
      return `<div class="bomItem bomItemCell">${toggle}<button class="linkButton" type="button" data-bom-part-number="${escapeHtml(childId)}">${escapeHtml(child?.part_number || item.child_part_number)}</button></div>`;
    }
    if (key === "name") {
      if (isBlankBomItem(item)) return '<span class="bomName bomPlaceholder">—</span>';
      return `<span class="bomName">${escapeHtml(part?.name || child?.name || "External component")}</span>`;
    }
    if (key === "quantity") {
      if (type === "root") return '<span class="bomQty">1</span>';
      return editable
        ? `<input class="tableInput bomQtyInput" value="${escapeHtml(item.quantity)}" data-bom-qty="${escapeHtml(childId)}">`
        : `<span class="bomQty">${escapeHtml(item.quantity)}</span>`;
    }
    if (key === "revision") {
      if (isBlankBomItem(item)) return '<span class="bomRevision bomPlaceholder">—</span>';
      return `<span class="bomRevision">${escapeHtml(part?.revision || child?.revision || item?.child_revision || "—")}</span>`;
    }
    if (isBlankBomItem(item)) return '<span class="bomStatus bomPlaceholder">—</span>';
    return `<span class="bomStatus">${escapeHtml(part ? releaseStatusLabel(part) : child ? releaseStatusLabel(child) : "Not found")}</span>`;
  }).join("");
}

function renderBomNewRow() {
  return `
    <button class="treeNode bomNode bomNewRow" type="button" data-bom-add-blank title="Add row" aria-label="Add BOM row" role="row">
      <span class="bomNewRowIcon" aria-hidden="true"></span>
    </button>
  `;
}

function renderBomChildren(parentPart, depth, visited) {
  return (parentPart.bom ?? [])
    .map((item) => {
      const blank = isBlankBomItem(item);
      const child = resolveBomChild(item);
      const childId = blank
        ? item.child_object_id
        : (child ? partKey(child) : item.child_object_id || item.child_part_number);
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
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}${blank ? " bomBlankRow" : ""}" data-bom-part-number="${escapeHtml(childId)}" role="row">
            ${renderBomRowCells({ type: "child", item, child, childId, toggle, editable: true })}
          </div>
        `
        : `
          <div class="treeNode bomNode child depth${Math.min(depth, 4)}${active}" data-bom-part-number="${escapeHtml(childId)}" role="row">
            ${renderBomRowCells({ type: "child", item, child, childId, toggle })}
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
  return customProjects.find((candidate) => candidate.name === project)?.owner || currentEditorName() || "";
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
  if (mode !== "part") {
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
  }
  if (mode === "home" && searchInput) {
    searchInput.value = "";
    if (stateFilter) stateFilter.value = "";
    if (projectFilter) projectFilter.value = "";
    activeResultView = "grid";
  }
}

function openSelectedPart({ newTab = false, editMode = false } = {}) {
  if (!selectedPartNumber) {
    return;
  }
  moveToPart(selectedPartNumber, { editMode, newTab });
}

function moveToPart(partNumber, { editMode = false, newTab = false } = {}) {
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
  activePartEditMode = Boolean(editMode) && isDraftRevision(part);
  activeAttachmentEditMode = false;
  activeAlternateEditMode = false;
  activeAttachmentDraftCount = 0;
  partAsidePanel = null;
  partOptionsMenuOpen = false;
  activeNavMode = "part";
  if (searchInput) searchInput.value = "";
  if (searchSuggestions) {
    searchSuggestions.innerHTML = "";
    searchSuggestions.classList.remove("visible");
  }
  window.history.replaceState({}, "", partUrl(objectId, { editMode: activePartEditMode }));
  openWorkspaceTab("part", { objectId, editMode: activePartEditMode }, { activate: true, forceNew: newTab });
  closeSearchModal();
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
  const isEmpty = !workspaceTabs.length || !activeTabId;
  const isOpened = !isEmpty && activeNavMode === "part";
  const isSinglePane = !isEmpty && ["settings"].includes(activeNavMode);
  const isReportPane = !isEmpty && activeNavMode === "report";
  const isProjectPane = !isEmpty && activeNavMode === "projects";
  const isTablePane = !isEmpty && (activeNavMode === "table" || activeNavMode === "history");
  const isHomePane = !isEmpty && activeNavMode === "home";
  document.body.classList.toggle("openedPartMode", isOpened);
  document.body.classList.toggle("partCanvasMode", isOpened);
  document.body.classList.toggle("searchMode", !isOpened);
  document.body.classList.toggle("emptyWorkspaceMode", isEmpty);
  if (appRoot) {
    appRoot.dataset.mode = isEmpty ? "empty" : activeNavMode;
    appRoot.classList.toggle("sidebar-collapsed", !sidebarOpen);
  }
  appSidebar?.classList.toggle("open", sidebarOpen);
  setWorkspaceEmptyState(isEmpty);

  if (navigatorPane) {
    navigatorPane.hidden = !isOpened;
    if (isOpened) {
      navigatorPane.style.setProperty("display", "grid", "important");
      navigatorPane.style.gridColumn = "1";
    } else {
      navigatorPane.style.setProperty("display", "none", "important");
    }
  }
  if (navigationTree) {
    navigationTree.hidden = !isOpened;
  }

  // Part mode: BOM left / details right, default 50/50, resizable
  if (isOpened && workspace) {
    const ratio = clamp(activeBomPaneWidthRatio || 0.5, 0.2, 0.75);
    workspace.style.setProperty("--nav-width", `${(ratio * 100).toFixed(1)}%`);
    workspace.style.gridTemplateColumns = "minmax(180px, var(--nav-width)) 6px minmax(0, 1fr)";
    const resultsPane = workspace.querySelector(".resultsPane");
    const resizeLeft = workspace.querySelector(".resizeHandleLeft");
    const resizeRight = workspace.querySelector(".resizeHandleRight");
    if (resultsPane) resultsPane.style.setProperty("display", "none", "important");
    if (resizeRight) resizeRight.style.setProperty("display", "none", "important");
    if (resizeLeft) {
      resizeLeft.style.setProperty("display", "block", "important");
      resizeLeft.style.gridColumn = "2";
    }
    const propertiesPane = workspace.querySelector(".propertiesPane");
    if (propertiesPane) {
      propertiesPane.style.gridColumn = "3";
      propertiesPane.style.setProperty("display", "flex", "important");
    }
  } else if (workspace) {
    workspace.style.removeProperty("grid-template-columns");
    const resultsPane = workspace.querySelector(".resultsPane");
    const resizeLeft = workspace.querySelector(".resizeHandleLeft");
    const resizeRight = workspace.querySelector(".resizeHandleRight");
    if (resultsPane) resultsPane.style.removeProperty("display");
    if (resizeRight) resizeRight.style.removeProperty("display");
    if (resizeLeft) resizeLeft.style.setProperty("display", "none", "important");
    const propertiesPane = workspace.querySelector(".propertiesPane");
    if (propertiesPane) {
      propertiesPane.style.removeProperty("grid-column");
      propertiesPane.style.removeProperty("display");
    }
  }

  workspace.classList.toggle("homeWorkspace", isHomePane);
  workspace.classList.toggle("partWorkspace", isOpened);
  workspace.classList.toggle("partReadOnlyWorkspace", isOpened && !activePartEditMode);
  workspace.classList.toggle("partEditingWorkspace", isOpened && activePartEditMode);
  workspace.classList.toggle("singlePaneWorkspace", isSinglePane);
  workspace.classList.toggle("reportWorkspace", isReportPane);
  workspace.classList.toggle("projectWorkspace", isProjectPane);
  workspace.classList.toggle("tabularWorkspace", isTablePane);

  navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.navMode === activeNavMode);
  });
  if (repoBadge) repoBadge.hidden = !hasRepoChanges;
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
    <button type="button" role="menuitem" data-context-action="favorite">${favoritePartKeys.includes(partNumber) ? "Unfavorite" : "Favorite"}</button>
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
  if (event.target.matches("#peakFontSize")) {
    activeFontSize = clamp(Number(event.target.value) || 14, 10, 24);
    localStorage.setItem("peakFontSize", String(activeFontSize));
    applyAppearance(activeColorScheme);
  }
});

partsList.addEventListener("change", (event) => {
  if (event.target.closest("#newPartProject")) {
    generatePartNumberIntoForm();
    return;
  }
  if (event.target.matches("#peakFontFamily")) {
    activeFontFamily = event.target.value || "inter";
    localStorage.setItem("peakFontFamily", activeFontFamily);
    applyAppearance(activeColorScheme);
    renderApp();
    return;
  }
  if (event.target.matches("#peakFontSize")) {
    activeFontSize = clamp(Number(event.target.value) || 14, 10, 24);
    localStorage.setItem("peakFontSize", String(activeFontSize));
    applyAppearance(activeColorScheme);
    renderApp();
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

partDetail.addEventListener("input", (event) => {
  const search = event.target.closest("[data-part-options-search]");
  if (!search) return;
  partOptionsSearchQuery = search.value;
  filterPartOptionsMenu(partOptionsSearchQuery);
});

partDetail.addEventListener("keydown", (event) => {
  const search = event.target.closest("[data-part-options-search]");
  if (!search) return;
  if (event.key === "Escape") {
    event.preventDefault();
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    renderApp();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const first = partDetail.querySelector(".partOptionsMenuBody .partOptionItem:not([hidden]):not(:disabled)");
    first?.click();
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
    const shouldCloseOptions = partOptionsMenuOpen;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    handlePartAction(partAction.dataset.partAction);
    if (shouldCloseOptions) {
      const menu = partDetail.querySelector(".partOptionsMenu");
      if (menu) {
        menu.remove();
        partDetail.querySelector("[data-part-options-toggle]")?.classList.remove("active");
        partDetail.querySelector("[data-part-options-toggle]")?.setAttribute("aria-expanded", "false");
      }
    }
    return;
  }

  const partPanelBtn = event.target.closest("[data-part-panel]");
  if (partPanelBtn) {
    const next = partPanelBtn.dataset.partPanel;
    partOptionsMenuOpen = false;
    const layout = partDetail.querySelector(".partDetailLayout.partDetailV2");
    const closing = partAsidePanel === next;
    partAsidePanel = closing ? null : next;
    if (layout) {
      layout.classList.toggle("panel-open", !closing);
      const slot = layout.querySelector(".partAsideSlot");
      if (slot) slot.setAttribute("aria-hidden", closing ? "true" : "false");
      layout.querySelectorAll("[data-part-panel]").forEach((btn) => {
        const active = !closing && btn.dataset.partPanel === next;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      const optionsBtn = layout.querySelector("[data-part-options-toggle]");
      optionsBtn?.classList.remove("active");
      optionsBtn?.setAttribute("aria-expanded", "false");
      layout.querySelector(".partOptionsMenu")?.remove();
    } else {
      renderApp();
    }
    return;
  }

  const optionsToggle = event.target.closest("[data-part-options-toggle]");
  if (optionsToggle) {
    event.stopPropagation();
    partOptionsMenuOpen = !partOptionsMenuOpen;
    if (!partOptionsMenuOpen) {
      partOptionsSearchQuery = "";
    }
    renderApp();
    if (partOptionsMenuOpen) {
      focusPartOptionsSearch();
    }
    return;
  }

  if (event.target.closest("[data-part-panel-close]")) {
    partAsidePanel = null;
    const layout = partDetail.querySelector(".partDetailLayout.partDetailV2");
    if (layout) {
      layout.classList.remove("panel-open");
      const slot = layout.querySelector(".partAsideSlot");
      if (slot) slot.setAttribute("aria-hidden", "true");
      layout.querySelectorAll("[data-part-panel]").forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      });
    } else {
      renderApp();
    }
    return;
  }

  const favoriteBtn = event.target.closest("[data-part-favorite]");
  if (favoriteBtn) {
    toggleFavorite(favoriteBtn.dataset.partFavorite);
    renderApp();
    return;
  }

  const cancelPartEdit = event.target.closest("[data-cancel-part-edit]");
  if (cancelPartEdit) {
    cancelOpenPartEdit();
    return;
  }

  const cancelAlternateEdit = event.target.closest("[data-cancel-alternate-edit]");
  if (cancelAlternateEdit) {
    activeAlternateEditMode = false;
    renderApp();
    return;
  }

  const addAlternatePicker = event.target.closest("[data-add-alternate-picker]");
  if (addAlternatePicker) {
    const part = getSelectedBomPart() || getOpenedPart();
    if (part) openAlternateModal(part);
    return;
  }

  const removeAlternate = event.target.closest("[data-remove-alternate]");
  if (removeAlternate) {
    const part = getSelectedBomPart() || getOpenedPart();
    const other = latestRevisionForPart(removeAlternate.dataset.removeAlternate) || findPartByKey(removeAlternate.dataset.removeAlternate);
    if (part && other && unlinkPartsAsAlternates(part, other)) {
      persistLocalChanges();
      statusMessage = `Removed alternate ${partObjectLabel(other)}`;
      renderApp();
    }
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
    if (!requireProfileForEdit()) return;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
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

function cancelOpenPartEdit() {
  const opened = getOpenedPart();
  if (opened?.bom) {
    opened.bom = bomItemsForPersist(opened.bom);
  }
  activePartEditMode = false;
  activeAttachmentEditMode = false;
  activeAlternateEditMode = false;
  activeAttachmentDraftCount = 0;
  partOptionsMenuOpen = false;
  partOptionsSearchQuery = "";
  if (openedPartNumber) {
    selectedPartNumber = openedPartNumber;
    selectedBomPartNumber = openedPartNumber;
    window.history.replaceState({}, "", partUrl(openedPartNumber));
  }
  renderApp();
}

function handlePartAction(action) {
  const part = getSelectedBomPart() || getOpenedPart();
  if (action === "pull-main") {
    pullMainFromRunner();
    return;
  }
  if (!part) {
    return;
  }

  if (activePartEditMode && ["edit-attachments", "edit-alternates", "submit-workflow"].includes(action)) {
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
    if (!requireProfileForEdit()) return;
    if (!isDraftRevision(part)) {
      statusMessage = "Only draft revisions can be edited";
      renderApp();
      return;
    }
    activePartEditMode = true;
    activeAttachmentEditMode = false;
    activeAlternateEditMode = false;
    activeAlternateEditMode = false;
    activeAttachmentDraftCount = 0;
    partAsidePanel = null;
    partOptionsMenuOpen = false;
    selectedPartNumber = partKey(part);
    selectedBomPartNumber = partKey(part);
    openedPartNumber = partKey(part);
    window.history.replaceState({}, "", partUrl(partKey(part), { editMode: true }));
    renderApp();
    return;
  }
  if (action === "save-part") {
    const opened = getOpenedPart() || part;
    if (!opened) return;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    handleSaveOpenPart(partKey(opened));
    return;
  }
  if (action === "cancel-part-edit") {
    cancelOpenPartEdit();
    return;
  }
  if (action === "edit-attachments") {
    if (!requireProfileForEdit()) return;
    activePartEditMode = false;
    activeAttachmentEditMode = true;
    activeAlternateEditMode = false;
    activeAttachmentDraftCount = 0;
    partAsidePanel = null;
    partOptionsMenuOpen = false;
    statusMessage = `Editing attachments for ${partObjectLabel(part)}`;
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }
  if (action === "edit-alternates") {
    if (!requireProfileForEdit()) return;
    activePartEditMode = false;
    activeAttachmentEditMode = false;
    activeAlternateEditMode = true;
    activeAttachmentDraftCount = 0;
    partAsidePanel = null;
    partOptionsMenuOpen = false;
    statusMessage = `Editing alternates for ${partObjectLabel(part)}`;
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }
  if (action === "submit-workflow") {
    activePartEditMode = false;
    activeAttachmentEditMode = false;
    activeAlternateEditMode = false;
    partAsidePanel = null;
    partOptionsMenuOpen = false;
    statusMessage = `Workflow actions are available on the part page for ${partObjectLabel(part)}`;
    if (openedPartNumber) {
      window.history.replaceState({}, "", partUrl(openedPartNumber));
    }
    renderApp();
    return;
  }
  if (action === "copy-item-id" || action === "copy-part-id") {
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    copyItemId(part);
    return;
  }
  if (action === "copy-item-contents" || action === "copy-part-contents") {
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    copyItemContents(part);
    return;
  }
  if (action === "create-from-source") {
    if (!requireProfileForEdit()) return;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    pendingAlternateLinkKey = null;
    openCreateModal("source", { basedOn: partKey(part) });
    return;
  }
  if (action === "create-revision") {
    if (!requireProfileForEdit()) return;
    if (draftRevisionsForPart(part.part_number).length > 0) {
      statusMessage = `Cannot create a new draft revision for ${part.part_number}; a draft revision already exists.`;
      partOptionsMenuOpen = false;
      renderApp();
      return;
    }
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    openCreateModal("revision", { partNumber: part.part_number });
    return;
  }
  if (action === "add-alternate") {
    if (!requireProfileForEdit()) return;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    openAlternateModal(part);
    return;
  }
  if (action === "create-alternate") {
    if (!requireProfileForEdit()) return;
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    pendingAlternateLinkKey = partKey(part);
    openCreateModal("source", { basedOn: partKey(part) });
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
      ? `${label} deleted locally; pushing to ${productDataRemoteLabel()}.`
      : `${label} set to ${revisionStatusText(target)}; pushing to ${productDataRemoteLabel()}.`;
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

async function copyItemId(part) {
  const text = `${part.name || "Untitled"} ${part.part_number || ""}`.trim();
  try {
    await navigator.clipboard.writeText(text);
    statusMessage = `Copied ${text}`;
  } catch {
    statusMessage = text;
  }
  renderApp();
}

async function copyItemContents(part) {
  const lines = [
    ["Name", part.name || "Untitled"],
    ["Part Number", part.part_number || ""],
    ["Revision", part.revision || "A"],
    ["Project", part.project || "Unassigned"],
    ["Description", part.description || ""],
    ["Revision Description", part.change_summary || ""],
    ["Traceability", traceabilityLabel(part)],
    ["Legacy Number", legacyPartNumberValue(part) || ""],
    ["Cost", optionalPartPropertyValue(part, "cost") || ""],
    ["Mass", optionalPartPropertyValue(part, "mass") || ""],
    ["Part Maturity", maturityStageLabel(part)],
    ["Release Status", releaseStatusLabel(part)],
    ["Created By", createdBy(part)],
    ["Created", part.created_at || ""],
    ["Last Updated By", updatedBy(part)],
    ["Updated", part.updated_at || ""],
    ["Based On", part.based_on || ""],
    ["Alternates", alternatesForPart(part).join(", ") || ""]
  ];
  const text = lines.map(([label, value]) => `${label}: ${value}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    statusMessage = `Copied contents for ${partObjectLabel(part)}`;
  } catch {
    statusMessage = text;
  }
  renderApp();
}

async function copyPartDetails(part) {
  return copyItemId(part);
}

navigationTree.addEventListener("click", (event) => {
  const addBlank = event.target.closest("[data-bom-add-blank]");
  if (addBlank) {
    event.preventDefault();
    insertBlankBomRow();
    return;
  }

  const pickItem = event.target.closest("[data-bom-pick-item]");
  if (pickItem) {
    event.preventDefault();
    event.stopPropagation();
    openSearchFilterPicker("bomItem", pickItem);
    return;
  }

  const button = event.target.closest("[data-select-bom-part], [data-toggle-bom-collapse], [data-focus-project], [data-focus-create], [data-focus-settings], [data-generate-part-number], [data-create-mode], [data-settings-tab], [data-sync-action], [data-action], [data-bom-part-number], [data-filter-state], [data-filter-project], [data-clear-filters]");
  if (!button) {
    return;
  }

  if (button.dataset.selectBomPart) {
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

  if (button.dataset.settingsTab) {
    activeSettingsTab = button.dataset.settingsTab;
    renderApp();
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
    if (event.target.closest("input, select, textarea, [data-bom-pick-item], [data-bom-drag]")) {
      return;
    }
    if (String(button.dataset.bomPartNumber).startsWith("blank:")) {
      return;
    }
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
  const handle = event.target.closest("[data-bom-drag]");
  if (!handle || !activePartEditMode) {
    if (event.target.closest(".bomNode.child")) event.preventDefault();
    return;
  }
  const row = handle.closest(".bomNode.child");
  if (!row) {
    event.preventDefault();
    return;
  }
  row.classList.add("isDragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", handle.dataset.bomDrag || row.dataset.bomPartNumber);
});

navigationTree.addEventListener("dragover", (event) => {
  const row = event.target.closest(".bomNode.child:not(.bomBlankRow)");
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
  const row = event.target.closest(".bomNode.child:not(.bomBlankRow)");
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
  if (!searchModal?.hidden) {
    renderSearchModalResults();
    return;
  }
  if (openedPartNumber) {
    renderSearchSuggestions();
    return;
  }
  renderApp();
});
searchInput.addEventListener("focus", () => {
  if (!searchModal?.hidden) return;
  renderSearchSuggestions();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".searchBox")) {
    searchSuggestions.classList.remove("visible");
  }
  if (!event.target.closest("#partContextMenu")) {
    hidePartContextMenu();
  }
  if (!event.target.closest("#searchFilterPicker") && !event.target.closest("[data-filter-picker]")) {
    closeSearchFilterPicker();
  }
  if (partOptionsMenuOpen && !event.target.closest(".partOptionsWrap")) {
    partOptionsMenuOpen = false;
    partOptionsSearchQuery = "";
    renderApp();
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
      insertBlankBomRow({ afterIdentifier: childIdentifier || "" });
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
    moveToPart(partNumber, { newTab: true });
    return;
  }
  if (actionButton.dataset.contextAction === "edit") {
    if (preventPartNavigationDuringEdit(partNumber)) {
      return;
    }
    selectedPartNumber = partNumber;
    openSelectedPart({ editMode: true });
    return;
  }
  if (actionButton.dataset.contextAction === "favorite") {
    toggleFavorite(partNumber);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hidePartContextMenu();
    if (searchFilterPicker && !searchFilterPicker.hidden) {
      closeSearchFilterPicker();
      return;
    }
    if (alternateModal && !alternateModal.hidden) {
      closeAlternateModal();
      return;
    }
    if (settingsModal && !settingsModal.hidden) {
      closeSettingsModal();
      return;
    }
    if (createModal && !createModal.hidden) {
      closeCreateModal();
      return;
    }
    if (searchModal && !searchModal.hidden) {
      closeSearchModal();
    }
  }
});
stateFilter?.addEventListener("change", () => {
  if (!searchModal?.hidden) {
    renderSearchModalResults();
    return;
  }
  renderApp();
});
projectFilter?.addEventListener("change", () => {
  if (!searchModal?.hidden) {
    renderSearchModalResults();
    return;
  }
  renderApp();
});
searchFiltersToggle?.addEventListener("click", () => {
  searchFiltersVisible = !searchFiltersVisible;
  if (!searchFiltersVisible) closeSearchFilterPicker();
  syncSearchModalChrome();
  requestAnimationFrame(refreshNotionScrolls);
});
searchPreviewToggle?.addEventListener("click", () => {
  searchPreviewVisible = !searchPreviewVisible;
  syncSearchModalChrome();
  requestAnimationFrame(refreshNotionScrolls);
});
searchTitleOnlyBtn?.addEventListener("click", () => {
  searchTitleOnly = !searchTitleOnly;
  syncSearchModalChrome();
  renderSearchModalResults();
});
searchFilterChips?.addEventListener("click", (event) => {
  const picker = event.target.closest("[data-filter-picker]");
  if (!picker) return;
  openSearchFilterPicker(picker.dataset.filterPicker, picker);
});
searchFilterPickerQuery?.addEventListener("input", renderSearchFilterPickerOptions);
searchFilterPickerList?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-search-filter-value]");
  if (!option) return;
  applySearchFilterPickerValue(option.dataset.searchFilterValue ?? "");
});
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
    openWorkspaceTab(button.dataset.navMode, {}, { activate: true });
  });
});

document.querySelector("#sidebarToggle")?.addEventListener("click", () => {
  setSidebarOpen(!sidebarOpen);
});

document.querySelector("#navBackBtn")?.addEventListener("click", () => navigateTabHistory(-1));
document.querySelector("#navForwardBtn")?.addEventListener("click", () => navigateTabHistory(1));
document.querySelector("#tabSearchAdd")?.addEventListener("click", () => openSearchModal());
workspaceOpenItem?.addEventListener("click", () => openSearchModal());
document.querySelector("#tabSearchAdd")?.addEventListener("click", () => openSearchModal());

tabListEl?.addEventListener("click", (event) => {
  const closeBtn = event.target.closest("[data-close-tab]");
  if (closeBtn) {
    event.stopPropagation();
    closeWorkspaceTab(closeBtn.dataset.closeTab);
    return;
  }
  const tabEl = event.target.closest("[data-tab-id]");
  if (tabEl) {
    if (splitViewEnabled && activeTabId && tabEl.dataset.tabId !== activeTabId) {
      secondaryTabId = activeTabId;
    }
    activateWorkspaceTab(tabEl.dataset.tabId);
  }
});

tabListEl?.addEventListener("dragstart", (event) => {
  const tabEl = event.target.closest("[data-tab-id]");
  if (!tabEl || event.target.closest("[data-close-tab]")) {
    event.preventDefault();
    return;
  }
  tabDragId = tabEl.dataset.tabId;
  tabEl.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", tabDragId);
  if (workspaceTabs.length >= 2) {
    showSplitDropOverlay(true);
  }
});

tabListEl?.addEventListener("dragend", () => {
  tabListEl.querySelectorAll(".workspaceTab.dragging").forEach((el) => el.classList.remove("dragging"));
  tabDragId = null;
  showSplitDropOverlay(false);
});

tabListEl?.addEventListener("dragover", (event) => {
  const target = event.target.closest("[data-tab-id]");
  if (!tabDragId || !target || target.dataset.tabId === tabDragId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

tabListEl?.addEventListener("drop", (event) => {
  const target = event.target.closest("[data-tab-id]");
  if (!tabDragId || !target || target.dataset.tabId === tabDragId) return;
  event.preventDefault();
  const rect = target.getBoundingClientRect();
  const placeAfter = event.clientX > rect.left + rect.width / 2;
  reorderWorkspaceTab(tabDragId, target.dataset.tabId, placeAfter);
  tabDragId = null;
  showSplitDropOverlay(false);
});

document.querySelector("#splitDropOverlay")?.addEventListener("dragover", (event) => {
  if (!tabDragId || workspaceTabs.length < 2) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const zone = event.target.closest("[data-split-side]");
  document.querySelectorAll(".splitDropZone").forEach((el) => {
    el.classList.toggle("is-target", el === zone);
  });
});

document.querySelector("#splitDropOverlay")?.addEventListener("dragleave", (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    document.querySelectorAll(".splitDropZone").forEach((el) => el.classList.remove("is-target"));
  }
});

document.querySelector("#splitDropOverlay")?.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-split-side]");
  if (!tabDragId || !zone) return;
  event.preventDefault();
  const draggedId = tabDragId;
  tabDragId = null;
  showSplitDropOverlay(false);
  applyTabSplit(draggedId, zone.dataset.splitSide);
});

appSidebar?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-sidebar-action]");
  if (action) {
    const kind = action.dataset.sidebarAction;
    if (kind === "home") {
      sidebarMode = "home";
      renderSidebarChrome();
      return;
    }
    if (kind === "create") {
      openCreateModal("new");
      return;
    }
    if (kind === "inbox") {
      sidebarMode = "inbox";
      renderSidebarChrome();
      return;
    }
    if (kind === "search") {
      openSearchModal();
      return;
    }
  }

  const library = event.target.closest("[data-open-tab]");
  if (library) {
    openWorkspaceTab(library.dataset.openTab, {}, { activate: true });
    return;
  }

  if (event.target.closest("[data-open-settings]")) {
    openSettingsModal(activeSettingsTab || "profile");
    return;
  }

  const toggleSidebarBom = event.target.closest("[data-toggle-sidebar-bom]");
  if (toggleSidebarBom) {
    event.preventDefault();
    event.stopPropagation();
    const nodeId = toggleSidebarBom.dataset.toggleSidebarBom;
    if (expandedSidebarBomNodes.has(nodeId)) {
      expandedSidebarBomNodes.delete(nodeId);
    } else {
      expandedSidebarBomNodes.add(nodeId);
    }
    saveExpandedSidebarBomNodes();
    renderProjectsTree();
    return;
  }

  const toggleProject = event.target.closest("[data-toggle-project]");
  if (toggleProject) {
    const name = toggleProject.dataset.toggleProject;
    if (expandedProjectFolders.has(name)) {
      expandedProjectFolders.delete(name);
    } else {
      expandedProjectFolders.add(name);
    }
    saveExpandedProjects();
    renderProjectsTree();
    return;
  }

  const openPart = event.target.closest("[data-open-part]");
  if (openPart) {
    moveToPart(openPart.dataset.openPart);
  }
});

document.addEventListener("click", (event) => {
  const closeModal = event.target.closest("[data-close-modal]");
  if (closeModal) {
    if (closeModal.dataset.closeModal === "create") closeCreateModal();
    if (closeModal.dataset.closeModal === "search") closeSearchModal();
    if (closeModal.dataset.closeModal === "alternate") closeAlternateModal();
    if (closeModal.dataset.closeModal === "settings") closeSettingsModal();
    return;
  }

  const focusTab = event.target.closest("[data-focus-tab]");
  if (focusTab) {
    const nextId = focusTab.dataset.focusTab;
    if (splitViewEnabled && activeTabId && nextId !== activeTabId) {
      secondaryTabId = activeTabId;
    }
    activateWorkspaceTab(nextId);
    return;
  }

  if (event.target.closest("[data-unsplit-view]")) {
    clearSplitView();
    return;
  }

  const searchSelect = event.target.closest("[data-search-select]");
  if (searchSelect) {
    selectSearchModalResult(searchSelect.dataset.searchSelect);
    return;
  }

  const searchOpen = event.target.closest("[data-search-open]");
  if (searchOpen) {
    moveToPart(searchOpen.dataset.searchOpen);
  }
});

searchModalList?.addEventListener("dblclick", (event) => {
  const searchSelect = event.target.closest("[data-search-select]");
  if (!searchSelect || searchModal?.hidden) return;
  event.preventDefault();
  moveToPart(searchSelect.dataset.searchSelect);
});

createModal?.addEventListener("click", (event) => {
  const picker = event.target.closest("[data-filter-picker]");
  if (picker) {
    openSearchFilterPicker(picker.dataset.filterPicker, picker);
    return;
  }
  const createButton = event.target.closest("[data-submit-create]");
  if (createButton) {
    if (createPartFromForm()) {
      closeCreateModal();
    }
    return;
  }
  const revisionButton = event.target.closest("[data-submit-revision]");
  if (revisionButton) {
    if (createRevisionFromForm()) {
      closeCreateModal();
    }
  }
});

createModal?.addEventListener("change", (event) => {
  if (event.target.closest("#newPartProject")) {
    generatePartNumberIntoForm();
  }
});

settingsModal?.addEventListener("click", (event) => {
  const section = event.target.closest("[data-settings-section]");
  if (section) {
    activeSettingsTab = section.dataset.settingsSection || "profile";
    renderSettingsModal();
    return;
  }

  if (event.target.closest("[data-save-profile]")) {
    saveProfileFromForm();
    return;
  }

  if (event.target.closest("[data-save-settings]")) {
    saveSettingsFromForm().catch((error) => {
      statusMessage = `Setup save failed: ${runnerErrorMessage(error)}`;
      renderSettingsModal();
    });
    return;
  }

  if (event.target.closest("[data-connect-github]")) {
    connectGitHub();
    return;
  }

  if (event.target.closest("[data-refresh-github-auth]")) {
    refreshGitHubAuthStatus();
    return;
  }

  if (event.target.closest("[data-select-product-folder]")) {
    selectProductDataFolder();
    return;
  }

  const themeModeButton = event.target.closest("[data-theme-mode]");
  if (themeModeButton) {
    activeColorScheme = themeModeButton.dataset.themeMode;
    applyAppearance(activeColorScheme);
    localStorage.setItem("peakColorScheme", activeColorScheme);
    refreshSettingsSurfaces();
    renderApp();
  }
});

settingsModal?.addEventListener("input", (event) => {
  if (event.target.matches("#peakFontSize")) {
    activeFontSize = clamp(Number(event.target.value) || 14, 10, 24);
    localStorage.setItem("peakFontSize", String(activeFontSize));
    applyAppearance(activeColorScheme);
  }
});

settingsModal?.addEventListener("change", (event) => {
  if (event.target.matches("#peakFontFamily")) {
    activeFontFamily = event.target.value || "inter";
    localStorage.setItem("peakFontFamily", activeFontFamily);
    applyAppearance(activeColorScheme);
    refreshSettingsSurfaces();
    return;
  }
  if (event.target.matches("#peakFontSize")) {
    activeFontSize = clamp(Number(event.target.value) || 14, 10, 24);
    localStorage.setItem("peakFontSize", String(activeFontSize));
    applyAppearance(activeColorScheme);
    refreshSettingsSurfaces();
  }
});

alternateSearchInput?.addEventListener("input", () => {
  renderAlternateModalResults();
});

alternateModal?.addEventListener("click", (event) => {
  const assign = event.target.closest("[data-assign-alternate]");
  if (!assign) return;
  assignAlternateFromPicker(assign.dataset.assignAlternate);
});

searchInput?.addEventListener("input", () => {
  if (!searchModal?.hidden) {
    renderSearchModalResults();
  }
});

partsList.addEventListener("click", (event) => {
  const projectCard = event.target.closest("[data-project-name]");
  if (projectCard && activeNavMode === "projects") {
    selectedProjectName = projectCard.dataset.projectName;
    activeProjectEditMode = false;
    renderApp();
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
    saveSettingsFromForm().catch((error) => {
      statusMessage = `Setup save failed: ${runnerErrorMessage(error)}`;
      if (settingsModal && !settingsModal.hidden) renderSettingsModal();
      else renderApp();
    });
    return;
  }

  const saveProfileButton = event.target.closest("[data-save-profile]");
  if (saveProfileButton) {
    saveProfileFromForm();
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
    applyAppearance(activeColorScheme);
    localStorage.setItem("peakColorScheme", activeColorScheme);
    refreshSettingsSurfaces();
    renderApp();
    return;
  }

  const settingsSection = event.target.closest("[data-settings-section]");
  if (settingsSection && settingsModal && !settingsModal.hidden) {
    activeSettingsTab = settingsSection.dataset.settingsSection || "profile";
    renderSettingsModal();
    return;
  }

  const copyLinkButton = event.target.closest("[data-copy-link]");
  if (copyLinkButton) {
    const value = copyLinkButton.dataset.copyLink || "";
    if (value && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        statusMessage = "Link copied";
        renderApp();
      }).catch(() => {});
    }
    return;
  }

  const gateJumpButton = event.target.closest("[data-gate-jump]");
  if (gateJumpButton) {
    if (!requireProfileForEdit()) return;
    activePropertyTab = "overview";
    activePartEditMode = true;
    activeAttachmentEditMode = false;
    activeAlternateEditMode = false;
    renderApp();
    const field = gateJumpButton.dataset.gateJump;
    const target = document.querySelector(`[data-open-part-field="${field}"]`);
    if (target) {
      target.focus();
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return;
  }

});

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
  activeBomColumnOrder.forEach((key, index) => {
    const width = saved[key] || bomColumnDefinitions[key].width;
    grid.style.setProperty(`--bom-col-${index + 1}`, `${width}px`);
  });
  fitBomItemColumnWidth(grid, saved);
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
        saveBomColumnWidth(handle.dataset.bomResizeKey, parseFloat(getComputedStyle(grid).getPropertyValue(`--bom-col-${index + 1}`)));
      }

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  });
}

function fitBomItemColumnWidth(grid, saved = loadBomColumnWidths()) {
  const itemIndex = activeBomColumnOrder.indexOf("item");
  if (itemIndex < 0 || !grid) return;
  const cells = [...grid.querySelectorAll(".bomNode")]
    .map((node) => node.children[itemIndex])
    .filter(Boolean);
  if (!cells.length) return;
  let needed = bomColumnDefinitions.item.width;
  cells.forEach((cell) => {
    const previous = {
      overflow: cell.style.overflow,
      width: cell.style.width,
      minWidth: cell.style.minWidth,
      maxWidth: cell.style.maxWidth
    };
    cell.style.overflow = "visible";
    cell.style.width = "max-content";
    cell.style.minWidth = "max-content";
    cell.style.maxWidth = "none";
    needed = Math.max(needed, Math.ceil(cell.getBoundingClientRect().width) + 4);
    cell.style.overflow = previous.overflow;
    cell.style.width = previous.width;
    cell.style.minWidth = previous.minWidth;
    cell.style.maxWidth = previous.maxWidth;
  });
  const current = Number(saved.item) || bomColumnDefinitions.item.width;
  const width = Math.max(current, needed);
  grid.style.setProperty(`--bom-col-${itemIndex + 1}`, `${width}px`);
}

function enableBomColumnReordering() {
  const headers = [...document.querySelectorAll("[data-bom-column]")];
  headers.forEach((header) => {
    if (header.dataset.reorderReady === "true") return;
    header.dataset.reorderReady = "true";
    header.addEventListener("dragstart", (event) => {
      if (event.target.closest("[data-bom-resize-column]")) {
        event.preventDefault();
        return;
      }
      header.classList.add("isDragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/bom-column", header.dataset.bomColumn);
    });
    header.addEventListener("dragover", (event) => {
      if (!Array.from(event.dataTransfer.types || []).includes("text/bom-column")) return;
      event.preventDefault();
      header.classList.add("isDropTarget");
      event.dataTransfer.dropEffect = "move";
    });
    header.addEventListener("dragleave", () => header.classList.remove("isDropTarget"));
    header.addEventListener("drop", (event) => {
      const sourceKey = event.dataTransfer.getData("text/bom-column");
      const targetKey = header.dataset.bomColumn;
      if (!sourceKey || !targetKey || sourceKey === targetKey) return;
      event.preventDefault();
      const nextOrder = activeBomColumnOrder.filter((key) => key !== sourceKey);
      nextOrder.splice(nextOrder.indexOf(targetKey), 0, sourceKey);
      activeBomColumnOrder = nextOrder;
      localStorage.setItem("peakBomColumnOrder", JSON.stringify(activeBomColumnOrder));
      renderApp();
    });
    header.addEventListener("dragend", () => {
      document.querySelectorAll(".bomHeaderCell.isDragging, .bomHeaderCell.isDropTarget").forEach((cell) => cell.classList.remove("isDragging", "isDropTarget"));
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
        const isPartWorkspace = workspace.classList.contains("partWorkspace");
        const maxWidth = isPartWorkspace
          ? workspaceWidth * 0.75
          : workspace.classList.contains("homeWorkspace") && window.matchMedia("(max-width: 1120px)").matches
            ? Math.max(160, workspaceWidth - 260)
            : 600;
        const minWidth = isPartWorkspace ? Math.max(180, workspaceWidth * 0.2) : 140;
        const width = clamp(startWidth + e.clientX - startX, minWidth, maxWidth);
        if (isPartWorkspace && workspaceWidth > 0) {
          activeBomPaneWidthRatio = clamp(width / workspaceWidth, 0.2, 0.75);
          localStorage.setItem("peakBomPaneRatio", String(activeBomPaneWidthRatio));
          workspace.style.setProperty("--nav-width", `${(activeBomPaneWidthRatio * 100).toFixed(1)}%`);
          workspace.style.gridTemplateColumns = "minmax(180px, var(--nav-width)) 6px minmax(0, 1fr)";
        } else {
          workspace.style.setProperty("--nav-width", `${width}px`);
        }
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

function enableSidebarResizing() {
  const resizer = document.querySelector("#sidebarResizer");
  if (!resizer || resizer.dataset.bound === "1") {
    return;
  }
  resizer.dataset.bound = "1";

  function sidebarMaxWidth() {
    return Math.floor(window.innerWidth * 0.5);
  }

  function applySidebarWidth(width) {
    if (!appSidebar) return;
    const next = clamp(width, 160, sidebarMaxWidth());
    appSidebar.style.width = `${next}px`;
    localStorage.setItem("peakSidebarWidth", String(next));
  }

  const savedWidth = Number(localStorage.getItem("peakSidebarWidth") || "0");
  if (savedWidth >= 160) {
    applySidebarWidth(savedWidth);
  } else {
    applySidebarWidth(Math.floor(window.innerWidth * 0.18));
  }

  window.addEventListener("resize", () => {
    if (!appSidebar?.classList.contains("open")) return;
    const current = appSidebar.getBoundingClientRect().width;
    if (current > sidebarMaxWidth()) {
      applySidebarWidth(sidebarMaxWidth());
    }
  });

  resizer.addEventListener("pointerdown", (event) => {
    if (!appSidebar?.classList.contains("open")) {
      return;
    }
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    document.body.classList.add("isResizing");
    const startX = event.clientX;
    const startWidth = appSidebar.getBoundingClientRect().width;

    function onMove(moveEvent) {
      applySidebarWidth(startWidth + moveEvent.clientX - startX);
    }

    function onUp() {
      document.body.classList.remove("isResizing");
      resizer.removeEventListener("pointermove", onMove);
      resizer.removeEventListener("pointerup", onUp);
    }

    resizer.addEventListener("pointermove", onMove);
    resizer.addEventListener("pointerup", onUp);
  });
}

function runAction(action) {
  if (action === "create-part") {
    openCreateModal("new");
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
  if (!requireProfileForEdit()) return false;
  const createMode = document.querySelector("[data-submit-create]")?.dataset.submitCreate || activeCreateMode;
  const values = {
    partNumber: canonicalPartNumber(document.querySelector("#newPartNumber")?.value.trim()),
    name: document.querySelector("#newPartName")?.value.trim(),
    project: document.querySelector("#newPartProject")?.value.trim(),
    revision: document.querySelector("#newPartRevision")?.value.trim() || "A",
    state: "draft",
    owner: currentEditorName(),
    description: "",
    driveUrl: "",
    onshapeUrl: "",
    basedOn: document.querySelector("#newPartBasedOn")?.value.trim(),
    traceability: ""
  };
  const validationError = validateDraftCreate(values, { fromSource: createMode === "source" });
  if (validationError) {
    statusMessage = validationError;
    showCreateFormError(validationError);
    return false;
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
      const linkSource = pendingAlternateLinkKey ? findPartByKey(pendingAlternateLinkKey) : null;
      if (linkSource) {
        linkPartsAsAlternates(linkSource, createdPart);
      }
      persistLocalChanges();
    }
    pendingAlternateLinkKey = null;
    statusMessage = `${preflight} Created draft ${values.partNumber}^${values.revision}; open and save the draft to push through the local runner.`;
    renderProjectOptions();
    moveToPart(`${values.partNumber}^${values.revision}`, { editMode: true });
    return true;
  }
  showCreateFormError(statusMessage || "Could not create part");
  return false;
}

function showCreateFormError(message) {
  const form = document.querySelector("#createModalBody .createForm");
  if (!form) return;
  let error = form.querySelector(".createFormError");
  if (!error) {
    error = document.createElement("p");
    error.className = "createFormError";
    error.setAttribute("role", "alert");
    form.insertBefore(error, form.querySelector(".createFormActions"));
  }
  error.textContent = message;
}

function generatePartNumberIntoForm() {
  const project = document.querySelector("#newPartProject")?.value || "";
  const input = document.querySelector("#newPartNumber");
  if (!input) return;
  if (!project) {
    input.value = "";
    return;
  }
  input.value = nextProjectPartNumber(project);
}

function validateDraftCreate(values, { fromSource }) {
  if (!values.name) {
    return "Name is required";
  }
  if (!values.project) {
    return "Project is required";
  }
  if (!projects().includes(values.project)) {
    return "Project must exist before assigning it to a part";
  }
  if (!values.partNumber) {
    return "Part number is required";
  }
  if (parts.some((part) => canonicalPartNumber(part.part_number) === canonicalPartNumber(values.partNumber))) {
    return `${values.partNumber} is already in use`;
  }
  const projectNumberError = validatePartNumberForProject(values.partNumber, values.project);
  if (projectNumberError) {
    return projectNumberError;
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
  if (!requireProfileForEdit()) return false;
  const partNumber = document.querySelector("#revisionSourcePart")?.value || createModalSeed?.partNumber;
  const source = latestRevisionForPart(partNumber);
  const revision = nextRevisionForPart(source);
  if (!source) {
    statusMessage = "Select an existing part before creating a revision";
    renderApp();
    return false;
  }
  const existingUnreleased = unreleasedRevisionsForPart(partNumber)[0];
  if (existingUnreleased) {
    statusMessage = `Cannot create a new draft revision for ${partNumber}; ${partObjectLabel(existingUnreleased)} is already ${releaseStatusLabel(existingUnreleased)}.`;
    renderApp();
    return false;
  }
  if (!revision || parts.some((part) => part.part_number === partNumber && part.revision === revision)) {
    statusMessage = "Next revision is not available";
    renderApp();
    return false;
  }
  const preflight = draftRemotePreflight();
  const created = createRevisionRecord(source, revision);
  if (created) {
    statusMessage = `${preflight} Created draft ${partNumber}^${revision}; open and save the draft to push through the local runner.`;
    moveToPart(`${partNumber}^${revision}`, { editMode: true });
    return true;
  }
  return false;
}

async function createProjectFromForm() {
  if (!requireProfileForEdit()) return;
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
  activeCreateMode = "new";
  statusMessage = `Created project ${name}; pushing to ${productDataRemoteLabel()}.`;
  renderApp();
  await pushProjectsToRunner(`Create project ${name}`, name);
}

function savePartFromRow(originalPartNumber) {
  if (!requireProfileForEdit()) return;
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
    existing.owner = values.owner || currentEditorName() || "";
    existing.description = values.description || "";
    existing.drive_url = values.drive_url || "";
    existing.allow_custom_part_numbers = values.allow_custom_part_numbers === true || values.allow_custom_part_numbers === "true";
    existing.approvers = (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean);
  } else {
    customProjects.push({
      name: originalProject,
      key: values.key || projectKey(originalProject),
      owner: values.owner || currentEditorName() || "",
      description: values.description || "",
      drive_url: values.drive_url || "",
      allow_custom_part_numbers: values.allow_custom_part_numbers === true || values.allow_custom_part_numbers === "true",
      approvers: (values.approvers || "").split(",").map((value) => value.trim()).filter(Boolean)
    });
  }
  await persistLocalChanges();
  renderProjectOptions();
  statusMessage = `Saved project ${originalProject}; pushing to ${productDataRemoteLabel()}.`;
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
  if (!requireProfileForEdit()) return;
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
    bom: bomItemsForPersist(part.bom),
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
  activeAlternateEditMode = false;
  activeAttachmentDraftCount = 0;
  statusMessage = `Saved ${partObjectLabel(part)} locally; pushing draft edit to ${productDataRemoteLabel()}.`;
  window.history.replaceState({}, "", partUrl(partKey(part)));
  renderProjectOptions();
  renderApp();
  await persistLocalChanges();
  await pushDraftPartChangesToRunner(part);
}

async function saveAttachmentsFromForm(originalPartNumber) {
  if (!requireProfileForEdit()) return;
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
  activeAlternateEditMode = false;
  activeAttachmentDraftCount = 0;
  statusMessage = `Saved attachments for ${partObjectLabel(part)} locally; pushing to ${productDataRemoteLabel()}.`;
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

function insertBlankBomRow({ afterIdentifier = "" } = {}) {
  if (!requireProfileForEdit()) return;
  const rootPart = getOpenedPart();
  if (!rootPart || !activePartEditMode) {
    return;
  }
  if (partKey(rootPart) !== openedPartNumber) {
    statusMessage = "Open the subassembly to edit its BOM";
    renderApp();
    return;
  }
  rootPart.bom = rootPart.bom || [];
  const blank = createBlankBomItem();
  if (afterIdentifier) {
    const index = rootPart.bom.findIndex((item) => bomItemIdentifier(item) === afterIdentifier);
    if (index >= 0) rootPart.bom.splice(index + 1, 0, blank);
    else rootPart.bom.push(blank);
  } else {
    rootPart.bom.push(blank);
  }
  statusMessage = "Select an item for the new BOM row";
  renderBomTree();
  enableBomColumnResizing();
  enableBomColumnReordering();
  if (recordCount) recordCount.textContent = statusMessage;
}

function assignBomRowPart(rowIdentifier, partNumber) {
  if (!requireProfileForEdit()) return;
  const rootPart = getOpenedPart();
  const owner = findBomItemOwner(rowIdentifier);
  const childPart = latestRevisionForPart(partNumber) || findPartByKey(partNumber);
  if (!rootPart || !owner || !childPart) {
    statusMessage = "Select a valid part";
    renderApp();
    return;
  }
  if (owner.parent !== rootPart) {
    statusMessage = "Open the subassembly to edit its BOM";
    renderApp();
    return;
  }
  if (partKey(childPart) === partKey(rootPart)) {
    statusMessage = "A part cannot reference itself in its BOM";
    renderApp();
    return;
  }
  const duplicate = (owner.parent.bom || []).some((item, index) => {
    if (index === owner.index) return false;
    const existing = resolveBomChild(item);
    return existing && partKey(existing) === partKey(childPart);
  });
  if (duplicate) {
    statusMessage = `${partObjectLabel(childPart)} is already in this BOM`;
    renderApp();
    return;
  }
  const wasBlank = isBlankBomItem(owner.item);
  owner.item.child_object_id = partKey(childPart);
  owner.item.child_part_number = childPart.part_number;
  owner.item.child_revision = childPart.revision;
  if (!Number(owner.item.quantity)) owner.item.quantity = 1;
  if (!owner.item.unit) owner.item.unit = "each";
  owner.parent.updated_at = new Date().toISOString().slice(0, 10);
  persistLocalChanges();
  statusMessage = wasBlank
    ? `Added ${partObjectLabel(childPart)} to ${partObjectLabel(owner.parent)}`
    : `Updated BOM item to ${partObjectLabel(childPart)}`;
  renderBomTree();
  enableBomColumnResizing();
  enableBomColumnReordering();
  if (recordCount) recordCount.textContent = statusMessage;
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
  if (!requireProfileForEdit()) return;
  const owner = findBomItemOwner(childIdentifier);
  if (!owner) {
    return;
  }
  const blank = isBlankBomItem(owner.item);
  owner.parent.bom = (owner.parent.bom || []).filter((item) => bomItemIdentifier(item) !== childIdentifier);
  owner.parent.updated_at = new Date().toISOString().slice(0, 10);
  if (selectedBomPartNumber === childIdentifier) {
    selectedBomPartNumber = openedPartNumber;
  }
  if (!blank) persistLocalChanges();
  statusMessage = blank ? "Removed blank BOM row" : `Removed ${childIdentifier}`;
  renderApp();
}

function updateBomQuantity(childIdentifier, rawQuantity) {
  if (!requireProfileForEdit()) return;
  const owner = findBomItemOwner(childIdentifier);
  const item = owner?.item;
  const quantity = Number(rawQuantity);
  if (!item || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }
  item.quantity = quantity;
  owner.parent.updated_at = new Date().toISOString().slice(0, 10);
  if (!isBlankBomItem(item)) {
    persistLocalChanges();
    statusMessage = `Updated ${childIdentifier} quantity`;
  }
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

async function saveSettingsFromForm() {
  const configuredProductData = runnerProductDataDir || (productDataDirectoryHandle ? productDataFolderName : "");
  if (!configuredProductData) {
    statusMessage = "Select a product data folder before configuring its remote";
    refreshSettingsSurfaces();
    renderApp();
    return;
  }
  const remote = document.querySelector("#settingsProductDataRemote")?.value.trim() || "";
  if (!remote) {
    statusMessage = "Enter the Product Data Remote before saving setup";
    refreshSettingsSurfaces();
    renderApp();
    return;
  }
  const response = await fetch(peakRunnerConfigProductDataRemoteUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remote })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || "Could not configure product data remote");
  }
  productDataRemote = payload.remote || remote;
  statusMessage = `Using product data folder ${configuredProductData}; remote ${productDataRemote}`;
  refreshSettingsSurfaces();
  renderApp();
}

function savePreferencesFromForm() {
  const defaultOwner = currentEditorName() || document.querySelector("#settingsDefaultOwner")?.value.trim() || "";
  if (defaultOwner) localStorage.setItem("peakDefaultOwner", defaultOwner);
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
      refreshSettingsSurfaces();
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
  refreshSettingsSurfaces();
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
  refreshSettingsSurfaces();
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
  if (!values.partNumber || !values.name || !values.project || !values.revision || !values.state || !values.owner) {
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
    traceability: normalizeTraceability(values.traceability) || "",
    maturity: "development",
    onshape: onshapeLinks,
    work_instructions: [],
    file_links: fileLinks,
    tags: [],
    alternates: [],
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
    traceability: normalizeTraceability(values.traceability) || "",
    alternates: [],
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
  const owner = currentEditorName() || source.owner || "";
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
    alternates: normalizeAlternateList(source.alternates || source.part_properties?.alternates),
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
    alternates: normalizeAlternateList(source.alternates || source.part_properties?.alternates),
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

function nextRevisionForPart(source) {
  const currentRevision = typeof source === "string" ? latestRevisionForPart(source)?.revision : source?.revision;
  if (!currentRevision) {
    return "A";
  }
  return incrementMajorRevisionLabel(currentRevision);
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
  if (!requireProfileForEdit("Complete your profile in Settings before importing product data.")) {
    if (csvImportFile) csvImportFile.value = "";
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

  const owner = currentEditorName();
  if (!owner) {
    throw new Error("Complete your profile in Settings before importing product data.");
  }
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
    statusMessage = payload.message || `Saved ${label} and pushed product data to ${productDataRemoteLabel()}.`;
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
    statusMessage = payload.message || `Pushed project changes to ${productDataRemoteLabel()}.`;
  } catch (error) {
    hasRepoChanges = true;
    localStorage.setItem("peakHasLocalChanges", "true");
    statusMessage = `Saved project changes locally, but runner push failed: ${runnerErrorMessage(error)}`;
  }
  renderApp();
}

async function pushTabularChangesToRunner() {
  statusMessage = `Pushing tabular changes to ${productDataRemoteLabel()}.`;
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
    statusMessage = payload.message || `Pushed tabular changes to ${productDataRemoteLabel()}.`;
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
  return payload.message || `Workflow transition "${title}" pushed to ${productDataRemoteLabel()}.`;
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
    alternates: normalizeAlternateList(representative.alternates || representative.part_properties?.alternates),
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
    bom: bomItemsForPersist(part.bom),
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
    const widths = JSON.parse(localStorage.getItem("peakBomColumnWidthsV5") || "{}");
    return widths && typeof widths === "object" && !Array.isArray(widths) ? widths : {};
  } catch {
    return {};
  }
}

function saveBomColumnWidth(key, width) {
  if (!bomColumnDefinitions[key] || !Number.isFinite(width)) return;
  localStorage.setItem("peakBomColumnWidthsV5", JSON.stringify({ ...loadBomColumnWidths(), [key]: width }));
}

function loadBomColumnOrder() {
  try {
    const order = JSON.parse(localStorage.getItem("peakBomColumnOrder") || "[]");
    return Array.isArray(order) && order.length === bomDefaultColumnOrder.length && bomDefaultColumnOrder.every((key) => order.includes(key))
      ? order
      : [...bomDefaultColumnOrder];
  } catch {
    return [...bomDefaultColumnOrder];
  }
}

function loadBomPaneWidthRatio() {
  const ratio = Number(localStorage.getItem("peakBomPaneRatio"));
  return Number.isFinite(ratio) && ratio >= 0.2 && ratio <= 0.75 ? ratio : 0.5;
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
  if (!searchSuggestions || !searchInput) {
    return;
  }
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
    setSidebarOpen(sidebarOpen);
    sidebarMode = "home";
    if (!workspaceTabs.length) {
      const params = new URLSearchParams(window.location.search);
      const objectId = params.get("object") || params.get("part");
      if (objectId && findPartByKey(objectId)) {
        openWorkspaceTab("part", { objectId, editMode: params.get("edit") === "1" }, { activate: true });
      } else {
        renderApp();
      }
    } else {
      renderApp();
    }
  })
  .catch((error) => {
    setSidebarOpen(sidebarOpen);
    sidebarMode = "home";
    if (recordCount) recordCount.textContent = "PEAK data unavailable";
    if (partsList) partsList.innerHTML = '<tr><td class="emptyCell" colspan="6">Could not load part records</td></tr>';
    if (partDetail) partDetail.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
    renderApp();
  });

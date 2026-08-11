import { execFile, spawn } from "node:child_process";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const appRoot = path.join(repoRoot, "app");
const configPath = process.env.PEAK_CONFIG_PATH
  ? path.resolve(process.env.PEAK_CONFIG_PATH)
  : path.join(repoRoot, "peak.config.json");
const port = Number(process.env.PEAK_PORT || process.env.PORT || 8765);
let productDataDir = resolveProductDataDir();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    if (url.pathname === "/api/product-data") {
      await sendJson(response, await readProductData());
      return;
    }
    if (url.pathname === "/api/config") {
      await sendJson(response, await runnerConfig());
      return;
    }
    if (url.pathname === "/api/config/product-data-folder" && request.method === "POST") {
      const body = await readJsonBody(request);
      await sendJson(response, await saveProductDataFolder(body?.productDataDir || body?.path));
      return;
    }
    if (url.pathname === "/api/config/product-data-remote" && request.method === "POST") {
      const body = await readJsonBody(request);
      await sendJson(response, await saveProductDataRemote(body?.remote || body?.url));
      return;
    }
    if (url.pathname === "/api/git/status") {
      await sendJson(response, await gitStatus());
      return;
    }
    if (url.pathname === "/api/git/pull-main" && request.method === "POST") {
      await sendJson(response, await pullMain());
      return;
    }
    if (url.pathname === "/api/github/auth-status") {
      await sendJson(response, await githubAuthStatus());
      return;
    }
    if (url.pathname === "/api/github/auth-login" && request.method === "POST") {
      await sendJson(response, await startGitHubAuthLogin());
      return;
    }
    if (url.pathname === "/api/git/push-draft" && request.method === "POST") {
      const body = await readJsonBody(request);
      await sendJson(response, await pushDraft(body));
      return;
    }
    if (url.pathname === "/api/git/workflow-transition" && request.method === "POST") {
      const body = await readJsonBody(request);
      await sendJson(response, await pushWorkflowTransition(body));
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      await sendJson(response, { ok: false, message: "Unknown PEAK runner endpoint" }, 404);
      return;
    }
    await serveStatic(url.pathname, response);
  } catch (error) {
    await sendJson(response, { ok: false, message: error.message || "PEAK runner error" }, 500);
  }
}).listen(port, () => {
  console.log(`PEAK runner serving http://127.0.0.1:${port}`);
  console.log(productDataDir ? `Product data: ${productDataDir}` : "Product data: not configured");
});

function resolveProductDataDir() {
  const configured = process.env.PEAK_PRODUCT_DATA_DIR || readConfiguredProductDataDir();
  return configured ? path.resolve(configured) : "";
}

function readConfiguredProductDataDir() {
  return readConfiguredSettings().productDataDir || "";
}

function readConfiguredSettings() {
  try {
    if (!existsSync(configPath)) {
      return {};
    }
    return parseJsonText(readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

async function pushDraft(body) {
  await assertProductDataRepo();
  const label = cleanLabel(body?.partLabel || "draft part");
  const message = cleanLabel(body?.commitMessage || `Update draft ${label}`);
  if (Array.isArray(body?.files) && body.files.length) {
    await writeProductDataFiles(body.files);
  }
  const status = await commitAndPushCurrentBranch(message);
  return {
    ok: true,
    message: `Pushed ${label} to ${status.remote || "origin"}`,
    committed: status.dirty,
    pushed: true
  };
}

async function pullMain() {
  await assertProductDataRepo();
  await requireCleanWorkingTree("pull latest main");
  const baseBranch = await currentBranch();
  if (baseBranch !== "main") {
    await runGit(["switch", "main"]);
  }
  const output = await runGit(["pull", "--ff-only", "origin", "main"]);
  const status = await gitStatus();
  return {
    ok: true,
    message: output || "Already up to date.",
    branch: status.branch,
    lastCommit: status.lastCommit
  };
}

async function pushWorkflowTransition(body) {
  await assertProductDataRepo();
  const mode = String(body?.mode || "").toLowerCase();
  if (mode === "direct") {
    return pushDirectWorkflowTransition(body);
  }
  if (mode === "mr") {
    return createWorkflowPullRequest(body);
  }
  throw new Error(`Unsupported workflow mode: ${body?.mode || "not set"}`);
}

async function pushDirectWorkflowTransition(body) {
  await deleteProductDataFiles(body.deletePaths);
  if (Array.isArray(body?.files) && body.files.length) {
    await writeProductDataFiles(body.files);
  }
  const title = cleanLabel(body?.title || body?.label || "workflow transition");
  const status = await commitAndPushCurrentBranch(title);
  return {
    ok: true,
    mode: "direct",
    message: `Pushed workflow transition "${title}" to ${status.remote || "origin"}`,
    committed: status.dirty,
    pushed: true
  };
}

async function createWorkflowPullRequest(body) {
  await requireGitHubCliAuth();
  await requireCleanWorkingTree("create a workflow merge request");
  const baseBranch = await currentBranch();
  if (baseBranch !== "main") {
    await runGit(["switch", "main"]);
  }
  await runGit(["pull", "--ff-only", "origin", "main"]);
  const title = cleanLabel(body?.title || body?.label || "workflow transition");
  const branch = workflowBranchName(body, title);
  await runGit(["switch", "-c", branch]);
  try {
    if (Array.isArray(body?.files) && body.files.length) {
      await writeProductDataFiles(body.files);
    }
    const status = await commitAndPushCurrentBranch(title, { branch, syncRemote: false });
    const prUrl = await createGitHubPullRequest({ branch, title, body });
    await runGit(["switch", baseBranch || "main"]).catch(() => runGit(["switch", "main"]));
    return {
      ok: true,
      mode: "mr",
      branch,
      prUrl,
      message: `Created GitHub merge request "${title}"`,
      committed: status.dirty,
      pushed: true
    };
  } catch (error) {
    await runGit(["switch", baseBranch || "main"]).catch(() => {});
    throw error;
  }
}

async function requireCleanWorkingTree(action = "continue") {
  const porcelain = await runGit(["status", "--porcelain"]);
  if (porcelain.trim()) {
    throw new Error(`Product data has uncommitted changes. Commit, push, or clean the product data repo before trying to ${action}.`);
  }
}

async function runnerConfig() {
  const remote = productDataDir && existsSync(path.join(productDataDir, ".git"))
    ? (await runGit(["remote", "get-url", "origin"]).catch(() => "")).trim()
    : "";
  return {
    ok: true,
    productDataDir,
    remote,
    configured: Boolean(productDataDir),
    configPath,
    message: productDataDir
      ? `Product data folder configured: ${productDataDir}`
      : "Product data folder is not configured. Set PEAK_PRODUCT_DATA_DIR or choose a Product-Data folder in the local app."
  };
}

async function saveProductDataFolder(value) {
  const requested = String(value || "").trim();
  if (!requested) {
    throw new Error("Product data folder path is required.");
  }
  const nextDir = path.resolve(requested);
  if (!existsSync(path.join(nextDir, "manifest.json"))) {
    throw new Error(`Selected folder is not a PEAK product data repository: ${nextDir}`);
  }
  const config = { productDataDir: nextDir };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  productDataDir = nextDir;
  return {
    ok: true,
    productDataDir,
    message: `Product data folder configured: ${productDataDir}`
  };
}

async function saveProductDataRemote(value) {
  await assertProductDataRepo();
  const remote = String(value || "").trim();
  if (!remote) {
    throw new Error("Product data remote is required.");
  }
  const hasOrigin = Boolean((await runGit(["remote"]).catch(() => "")).split(/\r?\n/).includes("origin"));
  await runGit(hasOrigin ? ["remote", "set-url", "origin", remote] : ["remote", "add", "origin", remote]);
  const config = { ...readConfiguredSettings(), productDataDir, productDataRemote: remote };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return { ok: true, productDataDir, remote, message: `Product data remote configured: ${remote}` };
}

function assertProductDataConfigured() {
  if (!productDataDir) {
    throw new Error("Product data folder is not configured. Set PEAK_PRODUCT_DATA_DIR or choose a Product-Data folder in the local app.");
  }
}

async function readProductData() {
  assertProductDataConfigured();
  await access(productDataDir);
  const manifest = await readJsonFile("manifest.json");
  const parts = (await Promise.all((manifest.parts || []).map((entry) => readPartEntry(entry)))).flat();
  const projects = await readJsonFile("projects.json").catch(() => ({ projects: [] }));
  return {
    ok: true,
    folderName: path.basename(productDataDir),
    productDataDir,
    manifest,
    parts,
    projects
  };
}

async function readPartEntry(entry) {
  const partPath = typeof entry === "string" ? entry : entry.path;
  const partProperties = await readJsonFile(partPath);
  if (!Array.isArray(partProperties.revisions)) {
    return [normalizePartRecord(partProperties, {})];
  }
  const revisions = await Promise.all(
    partProperties.revisions.map((revisionEntry) => {
      if (typeof revisionEntry === "object" && (revisionEntry.revision || revisionEntry.object_id)) {
        return revisionEntry;
      }
      const revisionPath = typeof revisionEntry === "string" ? revisionEntry : revisionEntry.path;
      return readJsonFile(resolveProductPath(partPath, revisionPath));
    })
  );
  return revisions.map((revision) => normalizePartRecord(partProperties, revision));
}

function normalizePartRecord(partProperties, revisionProperties) {
  const partNumber = partProperties.part_number || revisionProperties.part_number;
  const revision = revisionProperties.revision || revisionProperties.rev || "A";
  return {
    ...partProperties,
    ...revisionProperties,
    object_id: revisionProperties.object_id || `${partNumber}^${revision}`,
    part_number: partNumber,
    revision,
    name: partProperties.name || revisionProperties.name,
    description: partProperties.description || revisionProperties.description,
    legacy_part_number: partProperties.legacy_part_number || partProperties.legacyPartNumber || revisionProperties.legacy_part_number || revisionProperties.legacyPartNumber || "",
    project: partProperties.project || revisionProperties.project,
    traceability: partProperties.traceability || revisionProperties.traceability,
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

async function writeProductDataFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      const relativePath = normalizeProductPath(file.path);
      const filePath = path.resolve(productDataDir, relativePath);
      if (!filePath.startsWith(productDataDir)) {
        throw new Error(`Refusing to write outside product data folder: ${file.path}`);
      }
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(file.value, null, 2)}\n`, "utf8");
    })
  );
}

async function deleteProductDataFiles(paths) {
  await Promise.all(
    asArray(paths).map(async (relative) => {
      const relativePath = normalizeProductPath(relative);
      const filePath = path.resolve(productDataDir, relativePath);
      if (!filePath.startsWith(productDataDir)) {
        throw new Error(`Refusing to delete outside product data folder: ${relative}`);
      }
      await rm(filePath, { force: true });
    })
  );
}

async function readJsonFile(relativePath) {
  return parseJsonText(await readFile(path.join(productDataDir, normalizeProductPath(relativePath)), "utf8"));
}

function parseJsonText(text) {
  return JSON.parse(String(text).replace(/^\uFEFF/, ""));
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
  const resolved = [...baseSegments, normalizedRelative].filter(Boolean).join("/");
  if (existsSync(path.join(productDataDir, resolved))) {
    return resolved;
  }
  const fileName = normalizedRelative.split("/").pop();
  const sibling = [...baseSegments, fileName].filter(Boolean).join("/");
  if (existsSync(path.join(productDataDir, sibling))) {
    return sibling;
  }
  return resolved;
}

function asArray(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value.filter((item) => item != null) : [value];
}

async function gitStatus() {
  if (!productDataDir) {
    return {
      configured: false,
      dirty: false,
      branch: null,
      remote: null,
      message: "Product data folder is not configured."
    };
  }
  if (!existsSync(path.join(productDataDir, ".git"))) {
    return {
      configured: false,
      dirty: false,
      branch: null,
      remote: null,
      message: `Product data folder is not a Git repository: ${productDataDir}`
    };
  }
  const branch = (await runGit(["branch", "--show-current"]).catch(() => "main")).trim() || "main";
  const remote = (await runGit(["remote", "get-url", "origin"]).catch(() => "")).trim();
  const porcelain = await runGit(["status", "--porcelain"]);
  const lastCommit = (await runGit(["log", "-1", "--oneline"]).catch(() => "")).trim();
  return {
    configured: true,
    dirty: Boolean(porcelain.trim()),
    branch,
    remote,
    changedFiles: porcelain.split("\n").filter(Boolean),
    lastCommit,
    message: remote ? null : "No origin remote configured for product data"
  };
}

async function assertProductDataRepo() {
  assertProductDataConfigured();
  await access(productDataDir);
  if (!existsSync(path.join(productDataDir, ".git"))) {
    throw new Error(`Product data folder is not a Git repository: ${productDataDir}`);
  }
}

async function commitAndPushCurrentBranch(message, { branch, syncRemote = true } = {}) {
  const status = await gitStatus();
  if (!status.configured) {
    throw new Error(status.message || "Product data Git repository is not configured");
  }
  if (!status.remote) {
    throw new Error("Product data remote is not configured. Set it in Settings > Setup before pushing.");
  }
  const targetBranch = branch || status.branch || "main";
  if (status.dirty) {
    await runGit(["add", "-A"]);
    await runGit(["commit", "-m", message]);
  }
  if (syncRemote) {
    await runGit(["pull", "--rebase", "origin", targetBranch]);
  }
  await runGit(["push", "origin", targetBranch]);
  return status;
}

async function currentBranch() {
  return (await runGit(["branch", "--show-current"]).catch(() => "main")).trim() || "main";
}

async function requireGitHubCliAuth() {
  const status = await githubAuthStatus();
  if (!status.authenticated) {
    throw new Error(status.action || "Connect GitHub in Settings, then retry the workflow transition.");
  }
}

async function githubAuthStatus() {
  try {
    await runGh(["auth", "status"]);
    const login = (await runGh(["api", "user", "--jq", ".login"]).catch(() => "")).trim();
    return {
      ok: true,
      installed: true,
      authenticated: true,
      login,
      message: login ? `Connected to GitHub as ${login}` : "Connected to GitHub"
    };
  } catch (error) {
    const installed = !String(error.message || "").toLowerCase().includes("enoent");
    return {
      ok: true,
      installed,
      authenticated: false,
      login: "",
      message: installed
        ? "GitHub is not connected on this workstation."
        : "GitHub CLI is not installed on this workstation.",
      action: installed
        ? "Open Settings > Setup and click Connect GitHub. A PEAK GitHub Login window will open; follow its instructions, then retry the workflow action."
        : "Install GitHub CLI, restart PEAK, then connect GitHub in Settings > Setup."
    };
  }
}

async function startGitHubAuthLogin() {
  const status = await githubAuthStatus();
  if (status.authenticated) {
    return status;
  }
  if (!status.installed) {
    return { ...status, ok: false };
  }

  startVisibleGitHubAuth();
  return {
    ok: true,
    installed: true,
    authenticated: false,
    loginStarted: true,
    message: "GitHub login opened in a PEAK GitHub Login window.",
    action: "Follow the instructions in that window. PEAK will detect the connection automatically."
  };
}

function startVisibleGitHubAuth() {
  const args = ["auth", "login", "--web", "--clipboard", "--hostname", "github.com", "--git-protocol", "https"];
  if (process.platform === "win32") {
    const command = `title PEAK GitHub Login && gh ${args.join(" ")} && echo. && echo GitHub is connected. You can close this window. && pause`;
    const child = spawn("cmd.exe", ["/c", "start", "PEAK GitHub Login", "cmd.exe", "/k", command], {
      cwd: productDataDir || repoRoot,
      detached: true,
      windowsHide: false,
      stdio: "ignore",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    });
    child.unref();
    return;
  }

  const child = spawn("gh", args, {
    cwd: productDataDir || repoRoot,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  child.unref();
}

async function runGh(args) {
  const { stdout, stderr } = await execFileAsync("gh", args, {
    cwd: productDataDir || repoRoot,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  return `${stdout}${stderr}`.trim();
}

async function createGitHubPullRequest({ branch, title, body }) {
  const prBody = workflowPullRequestBody(body);
  const { stdout } = await execFileAsync("gh", [
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    title,
    "--body",
    prBody
  ], {
    cwd: productDataDir,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  return stdout.trim();
}

function workflowPullRequestBody(body) {
  const lines = [
    "Created by PEAK local runner.",
    "",
    `Workflow: ${body?.workflow || "not set"}`,
    `Target: ${body?.target || "not set"}`,
    `Part: ${body?.partNumber || "not set"}`,
    body?.revision ? `Revision: ${body.revision}` : ""
  ].filter(Boolean);
  return lines.join("\n");
}

function workflowBranchName(body, title) {
  const scope = [body?.workflow, body?.partNumber, body?.revision, body?.target]
    .filter(Boolean)
    .join("-");
  const seed = cleanBranchSegment(scope || title || "workflow");
  const suffix = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `workflow/${seed}-${suffix}`;
}

function cleanBranchSegment(value) {
  return String(value || "workflow")
    .toLowerCase()
    .replace(/\^/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "workflow";
}

async function runGit(args) {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd: productDataDir,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    });
    return `${stdout}${stderr}`.trim();
  } catch (error) {
    const detail = [error.stderr, error.stdout, error.message].filter(Boolean).join("\n").trim();
    throw new Error(detail || "Git command failed");
  }
}

async function serveStatic(rawPathname, response) {
  const pathname = decodeURIComponent(rawPathname === "/" ? "/index.html" : rawPathname);
  const relative = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(appRoot, relative);
  if (!filePath.startsWith(appRoot)) {
    await sendJson(response, { ok: false, message: "Path is outside PEAK app root" }, 403);
    return;
  }
  if (!existsSync(filePath)) {
    await sendJson(response, { ok: false, message: "Not found" }, 404);
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? parseJsonText(text) : {};
}

async function sendJson(response, value, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function cleanLabel(value) {
  return String(value || "draft part").replace(/[^\w .^()-]/g, "").trim() || "draft part";
}

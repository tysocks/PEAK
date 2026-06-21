import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const runnerPath = path.join(repoRoot, "runner", "server.mjs");
const preloadPath = path.join(__dirname, "preload.mjs");
const port = Number(process.env.PEAK_PORT || 8765);
const appUrl = `http://127.0.0.1:${port}/`;

let runnerProcess;
let mainWindow;

function startRunner() {
  if (runnerProcess) {
    return;
  }
  runnerProcess = spawn(process.execPath, [runnerPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PEAK_PORT: String(port),
      ELECTRON_RUN_AS_NODE: "1"
    },
    stdio: "inherit",
    windowsHide: true
  });
  runnerProcess.on("exit", () => {
    runnerProcess = undefined;
  });
}

async function createWindow() {
  startRunner();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: "PEAK",
    backgroundColor: "#0f141d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath
    }
  });
  await waitForRunner();
  await mainWindow.loadURL(appUrl);
}

async function waitForRunner() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${appUrl}api/config`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("PEAK runner did not start in time.");
}

app.whenReady().then(createWindow);

ipcMain.handle("peak:select-product-data-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Product-Data Folder",
    properties: ["openDirectory"]
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  const folderPath = result.filePaths[0];
  return {
    path: folderPath,
    name: path.basename(folderPath)
  };
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (runnerProcess) {
    runnerProcess.kill();
    runnerProcess = undefined;
  }
});

import { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } from "electron";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const port = Number(process.env.PEAK_PORT || 8765);
const appUrl = `http://127.0.0.1:${port}/`;

let runnerProcess;
let mainWindow;

function appearanceChrome(scheme = "dark") {
  const light = scheme === "light";
  return {
    backgroundColor: light ? "#ffffff" : "#191919",
    titleBarOverlay: {
      color: light ? "#ffffff" : "#202020",
      symbolColor: light ? "#37352f" : "#ffffff",
      height: 40
    }
  };
}

function applyWindowAppearance(scheme = "dark") {
  const light = scheme === "light";
  nativeTheme.themeSource = light ? "light" : "dark";
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const chrome = appearanceChrome(scheme);
  mainWindow.setBackgroundColor(chrome.backgroundColor);
  if (process.platform !== "darwin" && typeof mainWindow.setTitleBarOverlay === "function") {
    mainWindow.setTitleBarOverlay(chrome.titleBarOverlay);
  }
}

function startRunner() {
  if (runnerProcess) {
    return;
  }
  const appRoot = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked")
    : app.getAppPath();
  const userDataPath = app.getPath("userData");
  const runnerPath = path.join(appRoot, "runner", "server.mjs");
  mkdirSync(userDataPath, { recursive: true });
  runnerProcess = spawn(process.execPath, [runnerPath], {
    cwd: appRoot,
    env: {
      ...process.env,
      PEAK_PORT: String(port),
      PEAK_CONFIG_PATH: path.join(userDataPath, "peak.config.json"),
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
  const preloadPath = path.join(app.getAppPath(), "electron", "preload.cjs");
  const chrome = appearanceChrome("dark");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 720,
    title: "PEAK",
    backgroundColor: chrome.backgroundColor,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    ...(process.platform === "darwin"
      ? { trafficLightPosition: { x: 14, y: 12 } }
      : { titleBarOverlay: chrome.titleBarOverlay }),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("preload-error", (_event, failedPreloadPath, error) => {
    console.error(`PEAK preload failed (${failedPreloadPath}):`, error);
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  try {
    await waitForRunner();
    await mainWindow.loadURL(appUrl);
  } catch (error) {
    await mainWindow.loadURL(errorPage(error));
  }
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

function createMenu() {
  // Hide the native File/Edit/View ribbon; keep DevTools via Ctrl+Shift+I when needed.
  Menu.setApplicationMenu(null);
}

function errorPage(error) {
  const message = escapeHtml(error?.message || "PEAK could not start.");
  const html = `<!doctype html><title>PEAK</title><body style="margin:0;font:14px system-ui;background:#10151f;color:#e5edf8;display:grid;place-items:center;height:100vh"><main style="max-width:560px;padding:32px"><h1 style="font-size:24px;margin:0 0 12px">PEAK could not start</h1><p style="line-height:1.5;color:#b8c4d6">The local runner did not become available. Restart PEAK and check that port ${port} is available.</p><pre style="white-space:pre-wrap;background:#17202d;border:1px solid #2a3546;padding:16px;border-radius:8px">${message}</pre></main></body>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    createMenu();
    return createWindow();
  });
}

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

ipcMain.handle("peak:set-appearance", (_event, scheme) => {
  applyWindowAppearance(scheme === "light" ? "light" : "dark");
  return true;
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

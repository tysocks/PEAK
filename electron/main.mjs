import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from "electron";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const port = Number(process.env.PEAK_PORT || 8765);
const appUrl = `http://127.0.0.1:${port}/`;

let runnerProcess;
let mainWindow;

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
  const preloadPath = path.join(app.getAppPath(), "electron", "preload.mjs");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 720,
    title: "PEAK",
    backgroundColor: "#0f141d",
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
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        { role: "reload" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "toggleDevTools" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ]));
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

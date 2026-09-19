const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("peakDesktop", {
  selectProductDataFolder: () => ipcRenderer.invoke("peak:select-product-data-folder"),
  setAppearance: (scheme) => ipcRenderer.invoke("peak:set-appearance", scheme)
});

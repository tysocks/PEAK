const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("peakDesktop", {
  selectProductDataFolder: () => ipcRenderer.invoke("peak:select-product-data-folder")
});

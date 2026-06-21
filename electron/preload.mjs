import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("peakDesktop", {
  selectProductDataFolder: () => ipcRenderer.invoke("peak:select-product-data-folder")
});

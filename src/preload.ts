import {contextBridge, ipcRenderer} from 'electron';
import {Config} from "./types/configType";

contextBridge.exposeInMainWorld(
    'bridge', {
        sendConfig: (message: never) => {
            ipcRenderer.on('sendConfig', message);
        },
        requestConfig: (message: never) => {
            ipcRenderer.on('requestConfig', message);
        },
        overlaysToBrowser: (message:never) => {
            ipcRenderer.on('overlaysToBrowser', message);
        }
    }
);

contextBridge.exposeInMainWorld('electronAPI', {
    getConfig: () => ipcRenderer.send('getConfig'),
    getOverlays: () => ipcRenderer.send('getOverlays'),
    saveConfig: (config:Config) => ipcRenderer.send('saveConfig',config),
});
import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld(
    'bridge', {
        sendConfig: (message: never) => {
            ipcRenderer.on('sendConfig', message);
        }
    }
);

contextBridge.exposeInMainWorld('electronAPI', {
    getConfig: () => ipcRenderer.send('getConfig')
});
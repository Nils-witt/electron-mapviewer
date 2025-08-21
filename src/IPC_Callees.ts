import {Config} from "./types/configType";
import * as fs from "node:fs";


export async function getAvailableOverlays(window: Electron.BrowserWindow): Promise<void> {
    const conf = Config.getInstance();
    let overlays: Map<string, string> = new Map<string, string>();
    const dirs = fs.readdirSync(conf.overlay_path);
    for (const dir of dirs) {
        const fullPath = `${conf.overlay_path}/${dir}`;
        if (!dir.startsWith(".") && fs.statSync(fullPath).isDirectory()) {
            console.log('Found overlay directory:', fullPath);
            overlays.set(dir, fullPath+ "/{z}/{x}/{y}.png");
        }
    }
    console.log('Available overlays:', overlays);
    window.webContents.send('overlaysToBrowser', overlays);
}


export function sendConfigToWindow(window: Electron.BrowserWindow): void {
    window.webContents.send('sendConfig', Config.getInstance());
}
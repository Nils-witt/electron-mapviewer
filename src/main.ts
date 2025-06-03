import { app, BrowserWindow, dialog, Menu, net, protocol, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { Config } from './types/configType';
import { MapType } from './types/MapInfo';
import * as fs from 'node:fs';

const config: Config = new Config();

const CONFIG_FILE_PATH = path.join(app.getPath('documents'), 'config.json');

// Load config file if it exists
if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
        config.loadFromFile(CONFIG_FILE_PATH);
    } catch (error) {
        console.error('Failed to load config file:', error);
    }
}

/**
 * Updates all windows with the current configuration
 */
function updateAllWindows(): void {
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('sendConfig', config);
    });
}

/**
 * Opens a directory dialog and adds the selected directory as a map or overlay
 * @param type The type of map to add (MAP or OVERLAY)
 */
async function addMapResource(type: MapType): Promise<void> {
    const res = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (res.canceled || res.filePaths.length === 0) {
        return;
    }

    res.filePaths.forEach((filePath) => {
        const prefix = type === MapType.MAP ? 'Map-' : 'Overlay-';
        const newLocalMap = {
            name: prefix + filePath,
            type: type,
            path: filePath + '/{z}/{x}/{y}.png'
        };
        config.maps.push(newLocalMap);
    });

    updateAllWindows();
}

/**
 * Opens a map directory
 */
async function openMap(): Promise<void> {
    await addMapResource(MapType.MAP);
}

/**
 * Opens an overlay directory
 */
async function openOverlay(): Promise<void> {
    await addMapResource(MapType.OVERLAY);
}

/**
 * Loads a configuration file
 */
async function loadConfig(): Promise<void> {
    const res = await dialog.showOpenDialog({
        title: 'Open Config',
        defaultPath: CONFIG_FILE_PATH,
        properties: ['openFile']
    });

    if (res.canceled || res.filePaths.length === 0) {
        return;
    }

    const filePath = res.filePaths[0];
    try {
        config.loadFromFile(filePath);
        updateAllWindows();
    } catch (error) {
        console.error('Failed to load config file:', error);
        await dialog.showMessageBox({
            type: 'error',
            message: 'Failed to load configuration file',
            detail: String(error),
            buttons: ['OK']
        });
    }
}

/**
 * Application menu template
 */
const template = [
    {
        label: 'Start',
        submenu: [
            {
                label: 'Help',
                click() {
                    dialog.showMessageBox({
                        type: 'info',
                        message: 'This is a help message.',
                        buttons: ['OK']
                    });
                }
            }
        ]
    },
    {
        label: 'Config',
        submenu: [
            {
                label: 'Save Config',
                click() {
                    dialog.showSaveDialog({
                        title: 'Save Config',
                        defaultPath: CONFIG_FILE_PATH,
                    })
                        .then((result) => {
                            if (result.filePath) {
                                try {
                                    config.saveToFile(result.filePath);
                                } catch (error) {
                                    console.error('Failed to save config file:', error);
                                    dialog.showMessageBox({
                                        type: 'error',
                                        message: 'Failed to save configuration file',
                                        detail: String(error),
                                        buttons: ['OK']
                                    });
                                }
                            }
                        });
                }
            },
            {
                label: 'Open Config',
                click() {
                    loadConfig();
                }
            }
        ]
    },
    {
        label: 'Maps',
        submenu: [
            {
                label: 'Add Map',
                click() {
                    openMap();
                }
            },
            {
                label: 'Add Overlay',
                click() {
                    openOverlay();
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'my-protocol',
        privileges: {
            supportFetchAPI: true
        }
    }
]);

// Handle Squirrel startup events
if (started) {
    app.quit();
}

/**
 * Creates the main application window
 */
function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        title: 'Map Viewer',
    });

    ipcMain.on('getConfig', (event) => {
        console.log('Received getConfig request');
        mainWindow.webContents.send('sendConfig', config);
    })
    
    // Load the appropriate URL based on environment
    const loadPromise = MAIN_WINDOW_VITE_DEV_SERVER_URL
        ? mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
        : mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    mainWindow.openDevTools();
}

app.on('ready', () => {
    // Register custom protocol handler
    protocol.handle('my-protocol', async (request): Promise<Response> => {
        try {
            const filePath = request.url
                .replace('my-protocol://', 'file://');

            return await net.fetch(filePath);
        } catch (error) {
            console.error('Error in protocol handler:', error);
            // Return an error response instead of undefined
            return new Response('Error loading resource', { 
                status: 500, 
                statusText: 'Internal Server Error' 
            });
        }
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

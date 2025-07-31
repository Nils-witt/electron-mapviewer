import {app, BrowserWindow, dialog, ipcMain, Menu, net, protocol} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import {Config} from './types/configType';
import * as fs from 'node:fs';

const config: Config = new Config();

const CONFIG_FILE_PATH = path.join(app.getPath('documents'), 'config.json');


let mainWindow: BrowserWindow | null = null;

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

function saveConfigHandler(event: Event, data: Config): void {
    console.log("Save config handler called");
    console.log(data)

    const configData: Config = new Config(data);
    configData.saveToFile(CONFIG_FILE_PATH);
}

/**
 * Application menu template
 */
const template = [{
    label: "Application",
    submenu: [
        {label: "About Application", selector: "orderFrontStandardAboutPanel:"},
        {type: "separator"},
        {
            label: "Quit", accelerator: "Command+Q", click: function () {
                app.quit();
            }
        }
    ]
}, {
    label: "Edit",
    submenu: [
        {label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:"},
        {label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:"},
        {type: "separator"},
        {label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:"},
        {label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:"},
        {label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:"},
        {label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:"}
    ]
},
    {
        label: 'Config',
        submenu: [
            {
                label: 'Save Config',
                click() {
                    mainWindow.webContents.send('requestConfig');
                }
            },
            {
                label: 'Open Config',
                click() {
                    loadConfig();
                }
            }
        ]
    }
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
function createWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 2000,
        height: 1200,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        title: 'Map Viewer',
    });

    ipcMain.on('getConfig', () => {
        mainWindow.webContents.send('sendConfig', config);
    })
    ipcMain.on('saveConfig', saveConfigHandler)

    // Load the appropriate URL based on environment
    const loadPromise = MAIN_WINDOW_VITE_DEV_SERVER_URL
        ? mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
        : mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));

    mainWindow.openDevTools();
    return mainWindow;
}

app.on('ready', () => {
    // Register custom protocol handler
    protocol.handle('my-protocol', async (request): Promise<Response> => {
        try {
            const filePath = request.url
                .replace('my-protocol://', 'file://');

            return await net.fetch(filePath);


        } catch (error) {
            return new Response('Error loading resource', {
                status: 500,
                statusText: 'Internal Server Error: ' + error.message
            });
        }
    });

    mainWindow = createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
    }
});

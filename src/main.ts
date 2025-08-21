import {app, BrowserWindow, ipcMain, Menu, net, protocol} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import {Config} from './types/configType';
import * as fs from 'node:fs';
import {ungzip} from 'node-gzip';
import {getAvailableOverlays, sendConfigToWindow} from "./IPC_Callees";

const CONFIG_FILE_PATH = path.join(app.getPath('documents'), 'config.json');
Config.createInstance()
let mainWindow: BrowserWindow | null = null;

// Load config file if it exists
if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
        Config.getInstance().loadFromFile(CONFIG_FILE_PATH);
    } catch (error) {
        console.error('Failed to load config file:', error);
    }
}

/**
 * Updates all windows with the current configuration
 */
function updateAllWindows(): void {
    BrowserWindow.getAllWindows().forEach(win => {
        //win.webContents.send('sendConfig', config);
    });
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
                    //mainWindow.webContents.send('requestConfig');
                }
            },
            {
                label: 'Open Config',
                click() {
                    //loadConfig();
                }
            }
        ]
    }
];

// @ts-ignore
Menu.setApplicationMenu(Menu.buildFromTemplate(template));
// @ts-ignore
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'my-protocol',
        privileges: {
            supportFetchAPI: true
        }
    },
    {
        scheme: 'local-mbfile',
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
        sendConfigToWindow(mainWindow)
    })
    ipcMain.on('getOverlays', () => {
        getAvailableOverlays(mainWindow)
    })
    // ipcMain.on('saveConfig', saveConfigHandler)

    // Load the appropriate URL based on environment
    const loadPromise = MAIN_WINDOW_VITE_DEV_SERVER_URL
        ? mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
        : mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));

    // @ts-ignore
    mainWindow.openDevTools();
    return mainWindow;
}

let usedMbFile: unknown = null;

// @ts-ignore
const MBTiles = require('@mapbox/mbtiles');

new MBTiles(Config.getInstance().vector_path + '/deutschland.mbtiles?mode=ro', function (err:any , mbtiles:any) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('MBTiles file opened successfully');
    mbtiles.getInfo(function (err: any, info: any) {
        if (err) {
            console.error(err);
            return;
        }
        //console.log(info); // Metadata about the MBTiles file
    });
    usedMbFile = mbtiles;
});

app.on('ready', () => {
    // Register custom protocol handler
    protocol.handle('my-protocol', async (request): Promise<Response> => {
        try {
            let filePath = request.url.replace('my-protocol://', 'file://');
            if (filePath.indexOf('?') >= 0){
                filePath = filePath.substring(0, filePath.indexOf('?'));
            }
            console.log('Handling my-protocol protocol:', filePath);


            return await net.fetch(filePath);


        } catch (error) {
            return new Response('Error loading resource', {
                status: 500,
                statusText: 'Internal Server Error: ' + error.message
            });
        }
    });

    protocol.handle('local-mbfile', (request): Promise<Response> => {

        return new Promise(async (resolve, reject) => {
            //console.log('Handling local-mbfile protocol:', request.url);
            if (request.url.startsWith('local-mbfile://vector_file.mbtiles')) {
                const url = new URL(request.url);
                if (usedMbFile) {
                    // @ts-ignore
                    usedMbFile.getTile(url.searchParams.get('z'), url.searchParams.get('x'), url.searchParams.get('y'), async function (err, tile, headers) {

                        const decompressed = await ungzip(tile);
                        resolve(new Response(decompressed, {
                            status: err ? 404 : 200,
                            statusText: err ? 'Not Found' : 'OK',
                            headers: headers
                        }));
                    });
                } else {
                    resolve(new Response('MBTiles file not loaded', {status: 404, statusText: 'Not Found'}));
                }
            } else {
                net.fetch('file://' + path.join(Config.getInstance().vector_path + '/map_files', request.url.replace('local-mbfile://', '')))
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            }

        });
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

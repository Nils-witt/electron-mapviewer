import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Config} from "./types/configType";
import {Map as MapLibreMap, NavigationControl} from "maplibre-gl";
import {SettingsControl} from "./components/SettingsControl";
import {LayersControl} from "./common_components/controls/LayerControl";
import {DataProvider, DataProviderEvent, DataProviderEventType} from "./common_components/DataProvider";
import {GlobalEventHandler} from "./common_components/GlobalEventHandler";
import {LayerInfo} from "./common_components/types/LayerInfo";

declare global {
    interface Window {
        bridge: {
            sendConfig: (callback: (event: Electron.IpcRendererEvent, config: Config) => void) => void;
            requestConfig: (callback: (event: Electron.IpcRendererEvent) => void) => void;
            overlaysToBrowser: (callback: (event: Electron.IpcRendererEvent, data: any) => void) => void;
        },
        electronAPI: {
            getConfig: () => void;
            saveConfig: (config: Config) => void;
            getOverlays: () => void;
        }
    }
}

const map = new MapLibreMap({
    container: 'map',
    center: [0, 0],
    zoom: 10,
    rollEnabled: true,
});

map.setStyle('local-mbfile://liberty.json')

const settingsControl = new SettingsControl();
const layersControl = new LayersControl();
map.addControl(layersControl, 'top-left');
map.addControl(settingsControl, 'bottom-left');
map.addControl(new NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true
}));


function setUpOverlayHandling() {
    GlobalEventHandler.getInstance().on(DataProviderEventType.OVERLAY_ADDED, (event: DataProviderEvent) => {
        const overlay = event.data as LayerInfo;
        if (map.getSource(overlay.id) === undefined && map.getLayer(overlay.id + '-layer') === undefined) {
            console.log('Adding overlay source layer', overlay);
            addOverlay(overlay);
        }
    });
    DataProvider.getInstance().getOverlays().forEach((overlay: LayerInfo) => {
        if (map.getSource(overlay.id) === undefined && map.getLayer(overlay.id + '-layer') === undefined) {
            console.log('Adding overlay source layer', overlay);
            addOverlay(overlay);
        }
    });
}


function addOverlay(overlay: LayerInfo) {

    map.addSource(overlay.id, {
        type: "raster",
        tiles: [overlay.url.replace("file://", "my-protocol://")],
        tileSize: 256
    });
    map.addLayer({
        id: overlay.id + '-layer',
        type: "raster",
        source: overlay.id,
    });

}

if (map.loaded()) {
    //setUpOverlayHandling();
}

map.on('load', () => {
    console.log('Map loaded');
    //setUpOverlayHandling();
});


const loadedMaps: string[] = []

let firstLoad = true;
window.bridge.sendConfig((event, config: Config) => {
    console.log('Received config', config);

    if (firstLoad) {
        map.setCenter(config.mapCenter);
        map.setZoom(config.mapZoom);
        firstLoad = false;
    }
});

window.electronAPI.getConfig();

window.electronAPI.getOverlays();

window.bridge.overlaysToBrowser((event, data) => {

    for (const [name, url] of data) {
        let overlay: LayerInfo = {
            name: name,
            id: name,
            url: "my-protocol://" + url,
            description: '',
        }
        console.log('Adding overlay', overlay);
        DataProvider.getInstance().addOverlay(name, overlay);
    }
});
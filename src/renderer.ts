import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Config} from "./types/configType";
import {Map as MapLibreMap, NavigationControl} from "maplibre-gl";
import {LayersControl} from "./components/LayerControl";
import {DataProvider, DataProviderEventType} from "./components/DataProvider";
import {SettingsControl} from "./components/SettingsControl";
import {LayerInfo} from "./types/LayerInfo";
import {MapType} from "./types/MapInfo";

declare global {
    interface Window {
        bridge: {
            sendConfig: (callback: (event: Electron.IpcRendererEvent, config: Config) => void) => void;
            requestConfig: (callback: (event: Electron.IpcRendererEvent) => void) => void;
        },
        electronAPI: {
            getConfig: () => void;
            saveConfig: (config: Config) => void;
        }
    }
}


const map = new MapLibreMap({
    container: 'map',
    center: [0, 0],
    zoom: 10,
    rollEnabled: true,
});

map.setStyle("https://tiles.openfreemap.org/styles/liberty")

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
    DataProvider.getInstance().on(DataProviderEventType.OVERLAY_ADDED, (event) => {
        const overlay = event.data as LayerInfo;
        if (map.getSource(overlay.id) === undefined && map.getLayer(overlay.id + '-layer') === undefined) {
            console.log('Adding overlay source layer', overlay);
            addOverlay(overlay);

            DataProvider.getInstance().on(DataProviderEventType.OVERLAY_UPDATED + "-" + overlay.id, (event) => {
                console.log('MAPOverlay updated', event.data);
                if (event.changes) {
                    if (Object.prototype.hasOwnProperty.call(event.changes, 'visible')) {
                        if (event.changes.visible) {
                            map.setLayoutProperty(overlay.id + '-layer', 'visibility', 'visible');
                        } else {
                            map.setLayoutProperty(overlay.id + '-layer', 'visibility', 'none');
                        }
                    }
                    if (event.changes.opacity) {
                        map.setPaintProperty(overlay.id + '-layer', 'raster-opacity', event.changes.opacity / 100);
                    }
                    if (event.changes.url) {
                        const newUrl = event.changes.url.replace("file://", "my-protocol://");
                    }
                }
            });
        }
    });
    DataProvider.getInstance().getOverlays().forEach((overlay: LayerInfo) => {
        if (map.getSource(overlay.id) === undefined && map.getLayer(overlay.id + '-layer') === undefined) {
            console.log('Adding overlay source layer', overlay);
            addOverlay(overlay);

            DataProvider.getInstance().on(DataProviderEventType.OVERLAY_UPDATED + "-" + overlay.id, (event) => {
                console.log('MAPOverlay updated', event.data);
                if (event.changes) {
                    if (Object.prototype.hasOwnProperty.call(event.changes, 'visible')) {
                        if (event.changes.visible) {
                            map.setLayoutProperty(overlay.id + '-layer', 'visibility', 'visible');
                        } else {
                            map.setLayoutProperty(overlay.id + '-layer', 'visibility', 'none');
                        }
                    }
                    if (event.changes.opacity) {
                        map.setPaintProperty(overlay.id + '-layer', 'raster-opacity', event.changes.opacity / 100);
                    }
                    if (event.changes.url) {
                        map.removeLayer(overlay.id + '-layer');
                        map.removeSource(overlay.id);
                        addOverlay(event.data);
                    }
                }
            });
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
    setUpOverlayHandling();
}

map.on('load', () => {
    console.log('Map loaded');
    setUpOverlayHandling();
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

    loadedMaps.length = 0;
    for (const mapInfo of config.maps) {
        if (loadedMaps.includes(mapInfo.name)) {
            continue;
        } else {
            loadedMaps.push(mapInfo.name);
        }
        if (mapInfo.type == 'overlay') {
            DataProvider.getInstance().addUpdateOverlay(mapInfo.name, {
                name: mapInfo.name,
                id: mapInfo.name,
                url: mapInfo.url,
                description: '',
                visible: true
            });
        }
    }
});


window.bridge.requestConfig(() => {
    window.electronAPI.saveConfig(new Config({
        mapCenter: [map.getCenter().lng, map.getCenter().lat],
        mapZoom: map.getZoom(),
        maps: Array.from(DataProvider.getInstance().getOverlays().values()).map((overlay: LayerInfo) => ({
            id: overlay.id,
            name: overlay.name,
            type: MapType.OVERLAY,
            url: overlay.url,
            description: overlay.description,
            visible: overlay.visible,
            opacity: overlay.opacity || 100
        }))
    }));
});


window.electronAPI.getConfig();

settingsControl.setOpen(true);
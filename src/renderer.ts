import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Config} from "./types/configType";
import {Map as MapLibreMap, NavigationControl} from "maplibre-gl";

declare global {
    interface Window {
        bridge: {
            sendConfig: (callback: (event: Electron.IpcRendererEvent, config: Config) => void) => void;
        }
    }
}


const map = new MapLibreMap({
    container: 'map',
    center: [0,0],
    zoom: 10,
    rollEnabled: true,
});

map.addSource('osm', {
    type: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256
});

map.addLayer({
    id: 'osm-layer',
    type: 'raster',
    source: 'osm'
});


map.addControl(new NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true
}));


//TODO add a layer control

const loadedMaps: string[] = []

window.bridge.sendConfig((event, config: Config) => {
    console.log('Received config', config);
    
    map.setCenter(config.mapCenter);
    map.setZoom(config.mapZoom);
    
    loadedMaps.length = 0;

    for (const mapInfo of config.maps) {
        console.log('MapInfo', mapInfo);
        if (loadedMaps.includes(mapInfo.name)) {
            continue;
        } else {
            loadedMaps.push(mapInfo.name);
        }
        if (mapInfo.path) {
            if (mapInfo.type == 'overlay') {
                if (map.getSource(mapInfo.name) == undefined) {
                    map.addSource(mapInfo.name, {
                        type: 'raster',
                        tiles: [`my-protocol://${mapInfo.path}`],
                        tileSize: 256
                    });
                }

                if (map.getLayer(mapInfo.name) == undefined) {
                    map.addLayer({
                        id: mapInfo.name,
                        type: 'raster',
                        source: mapInfo.name,
                    });
                }
            } else {
                //TODO add baselayer loading
            }
        } else if (mapInfo.url) {
            if (mapInfo.type == 'overlay') {
                if (map.getSource(mapInfo.name) == undefined) {
                    map.addSource(mapInfo.name, {
                        type: 'raster',
                        tiles: [mapInfo.url],
                        tileSize: 256
                    });
                }
                if (map.getLayer(mapInfo.name) == undefined) {
                    map.addLayer({
                        id: mapInfo.name,
                        type: 'raster',
                        source: mapInfo.name,
                    });
                }
            }
            //TODO add baselayer loading
        }
    }
});

window.electronAPI.getConfig();
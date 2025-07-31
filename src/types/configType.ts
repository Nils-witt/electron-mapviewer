import * as fs from "node:fs";
import {MapInfo} from "./MapInfo";

type ConfigData = {
    maps: MapInfo[];
    mapCenter: [number, number];
    mapZoom: number;
};


export class Config {
    maps: MapInfo[] = [];
    mapCenter: [number, number] = [0, 0];
    mapZoom: number = 10;

    constructor(data?: ConfigData) {
        if (data) {
            this.maps = data.maps || [];
            this.mapCenter = data.mapCenter || [0, 0];
            this.mapZoom = data.mapZoom || 10;
        }
    }

    saveToFile(path: string) {
        fs.writeFileSync(path, JSON.stringify({
            maps: this.maps,
            mapCenter: this.mapCenter,
            mapZoom: this.mapZoom
        }));
    }

    loadFromFile(path: string) {
        const data = fs.readFileSync(path).toString();
        const json = JSON.parse(data);
        this.maps = json.maps;
        this.mapCenter = json.mapCenter || [0, 0];
        this.mapZoom = json.mapZoom || 10;
    }
}
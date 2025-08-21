import * as fs from "node:fs";

type ConfigData = {
    mapCenter: [number, number];
    mapZoom: number;
    overlay_path: string;
    vector_path: string;
};


export class Config {
    mapCenter: [number, number] = [0, 0];
    mapZoom: number = 10;
    overlay_path: string | undefined;
    vector_path: string | undefined;

    static instance: Config | undefined = undefined;

    static getInstance() {
        return Config.instance;
    }

    static createInstance(data?: ConfigData) {
        Config.instance = new Config(data);
        return Config.instance;
    }

    static createDynConfig(data?: ConfigData) {
        return new Config(data);
    }

    private constructor(data?: ConfigData) {
        if (data) {
            this.mapCenter = data.mapCenter || [0, 0];
            this.mapZoom = data.mapZoom || 10;
            this.overlay_path = data.overlay_path;
            this.vector_path = data.vector_path;
        }
    }

    saveToFile(path: string) {
        fs.writeFileSync(path, JSON.stringify({
            mapCenter: this.mapCenter,
            mapZoom: this.mapZoom,
            overlay_path: this.overlay_path,
            vector_path: this.vector_path,
        }));
    }

    loadFromFile(path: string) {
        const data = fs.readFileSync(path).toString();
        const json = JSON.parse(data);
        this.mapCenter = json.mapCenter || [0, 0];
        this.mapZoom = json.mapZoom || 10;
        this.overlay_path = json.overlay_path;
        this.vector_path = json.vector_path;
    }
}
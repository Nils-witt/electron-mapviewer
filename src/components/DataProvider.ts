import type {LayerInfo} from "../types/LayerInfo.ts";
import {IMapGroup} from "../types/MapEntity";
import {NamedGeoReferencedObject} from "../types/NamedGeoReferencedObject";


export interface DataProviderEvent {
    type: string; // Event type, e.g., 'mapLocationsUpdated'
    data: unknown; // Optional data associated with the event
    changes: unknown; // Optional changes associated with the event
    [key: string]: unknown; // Additional properties can be added
}

export enum DataProviderEventType {
    MAP_LOCATIONS_UPDATED = 'mapLocations-updated',
    MAP_STYLE_UPDATED = 'mapStyle-updated',
    MAP_GROUPS_UPDATED = 'mapGroups-updated',
    OVERLAY_ADDED = 'overlay-added',
    OVERLAY_UPDATED = 'overlay-updated',
    LOGIN_SUCCESS = 'login-success',
    LOGIN_FAILURE = 'login-failure'
}

export class DataProvider {

    private mapLocations = new Map<string, NamedGeoReferencedObject>();
    private eventListeners: Map<string, ((event: DataProviderEvent) => void)[]> = new Map();
    private mapStyle: LayerInfo | undefined;
    private overlays: Map<string, LayerInfo> = new Map();

    private mapGroups: Map<string, IMapGroup> = new Map();

    private static instance: DataProvider;

    private constructor() {
    }

    public static getInstance(): DataProvider {
        if (!DataProvider.instance) {
            DataProvider.instance = new DataProvider();
        }
        return DataProvider.instance;
    }

    private triggerEvent(eventType: string, data: unknown, changes: unknown): void {
        //console.log(`Triggering event: ${eventType}`, data);
        this.eventListeners.get(eventType)?.forEach(callback => {
            callback({type: eventType, data, changes: changes});
        });
    }

    addMapLocation(id: string, item: NamedGeoReferencedObject): void {
        this.mapLocations.set(id, item);
        this.triggerEvent(DataProviderEventType.MAP_LOCATIONS_UPDATED, [item], null);
    }

    getMapLocations(): Map<string, NamedGeoReferencedObject> {
        return this.mapLocations;
    }

    addMapGroup(id: string, group: IMapGroup): void {
        this.mapGroups.set(id, group);
        this.triggerEvent(DataProviderEventType.MAP_GROUPS_UPDATED, group, null);
    }

    getMapGroups(): Map<string, IMapGroup> {
        return this.mapGroups;
    }

    setMapStyle(style: LayerInfo): void {
        this.mapStyle = style;
        this.triggerEvent(DataProviderEventType.MAP_STYLE_UPDATED, style, null);
    }

    getMapStyle(): LayerInfo | undefined {
        return this.mapStyle;
    }

    addUpdateOverlay(id: string, overlay: LayerInfo): void {
        if (this.overlays.has(id)) {
            const changes: { [key: string]: unknown; } = {}
            const oldOverlay = this.overlays.get(id);
            console.log(oldOverlay);
            console.log(overlay);
            if (oldOverlay.name !== overlay.name) {
                changes.name = overlay.name;
            }
            if (oldOverlay.url !== overlay.url) {
                changes.url = overlay.url;
            }
            if (oldOverlay.opacity !== overlay.opacity) {
                changes.opacity = overlay.opacity;
            }
            if (oldOverlay.description !== overlay.description) {
                changes.description = overlay.description;
            }
            if (oldOverlay.visible !== overlay.visible) {
                console.log("Overlay visibility changed", id, oldOverlay.visible, overlay.visible);
                changes.visible = overlay.visible;
            }
            console.log("Changes detected for overlay", id, changes);
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED, overlay, changes);
            this.triggerEvent(DataProviderEventType.OVERLAY_UPDATED + "-" + overlay.id, overlay, changes);
        } else {
            //Add new overlay
            this.overlays.set(id, overlay);
            this.triggerEvent(DataProviderEventType.OVERLAY_ADDED, overlay, null);
        }


    }

    getOverlays(): Map<string, LayerInfo> {
        return this.overlays;
    }

    getOverlay(id: string): LayerInfo | undefined {
        if (this.overlays.has(id)) {
            return {...this.overlays.get(id)}; // Return a shallow copy to prevent external modifications
        } else {
            return undefined;
        }
    }

    on(event: string, callback: (event: DataProviderEvent) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
    }
}
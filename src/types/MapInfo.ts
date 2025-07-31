export enum MapType {
    MAP = 'map',
    OVERLAY = 'overlay',
}

export type MapInfo = {
    id: string;
    name: string;
    url: string;
    type: MapType;
    visible: boolean;
    opacity: number;
}
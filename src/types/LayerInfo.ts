/**
 * Represents information about a map layer.
 * This type is used to define and manage layers that can be added to the map.
 */
export type LayerInfo = {
    /**
     * The display name of the layer shown in the layer control
     */
    name: string;

    /**
     * Unique identifier for the layer, used for source and layer creation
     */
    id: string;

    /**
     * Description of the layer's content and purpose
     */
    description: string;

    /**
     * URL to the tile source for this layer
     */
    url: string;

    /**
     * A number between 0 and 100 representing the layer's opacity.
     */
    opacity?: number;

    visible: boolean;
};

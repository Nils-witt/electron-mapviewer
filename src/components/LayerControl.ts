import {Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faMap} from "@fortawesome/free-solid-svg-icons/faMap";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {DataProvider, DataProviderEvent, DataProviderEventType} from "./DataProvider";
import {LayerInfo} from "../types/LayerInfo";

/**
 * A control for MapLibre GL JS that allows users to toggle the visibility of map layers.
 * Implements the IControl interface required by MapLibre GL JS.
 */
export class LayersControl extends Evented implements IControl {
    /**
     * Reference to the MapLibre map instance
     */
    private map: MapLibreMap | undefined;

    /**
     * The HTML container element that holds the control UI
     */
    private container: HTMLElement;

    private layersContainer: HTMLElement;

    private isOpen: boolean = false; // Flag to track if the control is open or closed

    private spanIcon = document.createElement("span");
    /**
     * Array of checkbox input elements for each layer
     */
    private inputs: HTMLInputElement[];

    /**
     * Map of layer IDs to their corresponding LayerInfo objects for quick lookup
     */
    private layers: Map<string, LayerInfo> = new Map();

    /**
     * Map to track active overlays by their IDs
     * This is used to persist the state of active overlays across sessions
     * @private
     */
    private activeOverlays: Map<string, boolean> = new Map();

    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor() {
        super();

        this.map = undefined;

        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "grid"
        );


        this.spanIcon.classList.add("p-[5px]");
        this.spanIcon.innerHTML = icon(faMap).html[0];

        this.layersContainer = document.createElement("div")
        this.layersContainer.classList.add('hidden', 'grid')

        this.container.appendChild(this.layersContainer);
        this.container.appendChild(this.spanIcon);

        // Create a map of layer IDs to LayerInfo objects for quick lookup
        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_ADDED, (event: DataProviderEvent) => {
            const data = event.data as LayerInfo;
            console.log("LayersControl: Overlay added", data);
            this.addLayer(data);
        });
        this.setLayers(DataProvider.getInstance().getOverlays());
        this.inputs = [];

        const previouslyActiveOverlays = localStorage.getItem("activeOverlays");
        if (previouslyActiveOverlays) {
            // Parse the stored active overlays and set them in the map
            const activeOverlaysArray = JSON.parse(previouslyActiveOverlays) as string[];
            for (const overlayId of activeOverlaysArray) {
                this.activeOverlays.set(overlayId, true);
            }
        }

        this.spanIcon.addEventListener("click", () => {
            this.setOpen(!this.isOpen);
        });
    }

    private setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.layersContainer.classList.remove("hidden");
            //this.spanIcon.classList.add("hidden");
            this.spanIcon.innerHTML = icon(faXmark).html[0];
        } else {
            this.layersContainer.classList.add("hidden");
            this.spanIcon.innerHTML = icon(faMap).html[0];
        }
    }

    /**
     * Sets the layers for the control
     * This method can be used to update the layers dynamically
     *
     * @param overlays
     */
    private setLayers(overlays: Map<string, LayerInfo>): void {
        // Clear existing inputs and container
        this.inputs = [];
        this.layersContainer.innerHTML = "";

        // Update the layers map
        this.layers.clear();
        for (const layer of overlays.values()) {
            this.layers.set(layer.id, layer);
        }

        // Create a checkbox for each new layer and add it to the container
        for (const layer of overlays.values()) {
            const labeled_checkbox = this.createLabeledCheckbox(layer);
            this.layersContainer.appendChild(labeled_checkbox);
        }
    }

    private addLayer(layer: LayerInfo): void {
        if (this.map === undefined) {
            console.error("LayersControl: Map is not initialized. Cannot add layer.");
            return;
        }
        if (this.layers.has(layer.id)) {
            console.warn(`Layer with ID ${layer.id} already exists. Skipping.`);
            return; // Layer already exists, skip adding it again
        }

        this.layers.set(layer.id, layer);
        const labeled_checkbox = this.createLabeledCheckbox(layer);

        this.layersContainer.appendChild(labeled_checkbox);

    }

    /**
     * Creates a labeled checkbox for a layer
     *
     * @param layer - The layer information object
     * @returns A label element containing a checkbox and the layer name
     */
    private createLabeledCheckbox(layer: LayerInfo): HTMLDivElement {
        const container = document.createElement("div");
        container.classList.add("m-1")
        container.classList.add("inline-flex", "items-center");


        const cLabel = document.createElement("label");
        container.appendChild(cLabel);
        cLabel.classList.add("flex", "items-center", "cursor-pointer", "relative");

        const input = document.createElement("input");
        cLabel.appendChild(input);
        input.type = "checkbox";
        input.id = "cb-" + layer.id; // Set the ID to the layer ID for easy reference
        input.classList.add("peer", "h-5", "w-5", "cursor-pointer", "transition-all", "appearance-none", "rounded", "shadow", "hover:shadow-md", "border", "border-slate-300", "checked:bg-slate-800", "checked:border-slate-800")

        const span = document.createElement("span");
        cLabel.appendChild(span);
        span.classList.add("absolute", "text-white", "opacity-0", "peer-checked:opacity-100", "top-1/2", "left-1/2", "transform", "-translate-x-1/2", "-translate-y-1/2");
        span.innerHTML = '      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"\n' +
            '        stroke="currentColor" stroke-width="1">\n' +
            '        <path fill-rule="evenodd"\n' +
            '        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"\n' +
            '        clip-rule="evenodd"></path>\n' +
            '      </svg>'
        const textLabel = document.createElement("label");
        container.appendChild(textLabel);
        textLabel.classList.add("cursor-pointer", "ml-2", "text-slate-600", "text-sm");
        textLabel.textContent = layer.name;

        input.checked = layer.visible; // Default to unchecked if no map is available

        // Add event listener to toggle layer visibility when checkbox is clicked
        input.addEventListener("change", () => {
            const cLayer: LayerInfo = DataProvider.getInstance().getOverlay(layer.id);
            DataProvider.getInstance().addUpdateOverlay(cLayer.id, {
                ...cLayer,
                visible: input.checked,
            });
        });

        DataProvider.getInstance().on(DataProviderEventType.OVERLAY_UPDATED + "-" + layer.id, () => {
            textLabel.textContent = layer.name;
        });

        return container;
    }

    /**
     * Adds the control to the map
     * Required method for MapLibre IControl interface
     *
     * @param map - The MapLibre map instance
     * @returns The control's container element
     */
    public onAdd(map: MapLibreMap): HTMLElement {
        this.map = map;

        // Initialize checkbox states based on layer visibility in the map
        for (const input of this.inputs) {
            const layer = this.layers.get(input.id);
            if (layer) {
                // Determine if the layer is currently visible
                let is_visible = true;
                if (this.map) {
                    is_visible =
                        is_visible &&
                        this.map.getLayoutProperty(layer.id + '-layer', "visibility") !== "none";
                } else {
                    is_visible = false; // If no map, then no layers can be visible
                }

                // Set checkbox state to match layer visibility
                input.checked = is_visible;
                if (is_visible) {
                    this.activeOverlays.set(layer.id, true);
                } else {
                    this.activeOverlays.delete(layer.id);
                }
            }
        }

        // Return the container element to be added to the map
        return this.container;
    }

    /**
     * Removes the control from the map
     * Required method for MapLibre IControl interface
     */
    public onRemove() {
        // Remove the container from its parent element
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Clear the map reference
        this.map = undefined;
    }
}

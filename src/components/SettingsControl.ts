import {Evented, type IControl, Map as MapLibreMap} from "maplibre-gl";
import {icon} from "@fortawesome/fontawesome-svg-core";
import {faXmark} from "@fortawesome/free-solid-svg-icons/faXmark";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
import {DataProvider} from "./DataProvider";
import {LayerInfo} from "../types/LayerInfo";
import {v4} from "uuid";

/**
 * A control for MapLibre GL JS that allows users to toggle the visibility of map layers.
 * Implements the IControl interface required by MapLibre GL JS.
 */
export class SettingsControl extends Evented implements IControl {

    /**
     * The HTML container element that holds the control UI
     */
    private container: HTMLElement;

    private overlayContainer: HTMLElement = document.createElement("div");


    private isOpen: boolean = false; // Flag to track if the control is open or closed

    private spanIcon = document.createElement("span");


    /**
     * Creates a new LayersControl instance
     *
     * @param options - Array of LayerInfo objects representing available layers
     */
    constructor() {
        super();


        // This div will hold all the checkboxes and their labels
        this.container = document.createElement("div");
        this.container.classList.add(
            "maplibregl-ctrl",        // Standard MapLibre control class
            "maplibregl-ctrl-group",  // Groups the control visually
            "grid"
        );


        this.spanIcon.classList.add("p-[5px]");
        this.spanIcon.innerHTML = icon(faGear).html[0];


        this.container.appendChild(this.spanIcon);
        this.spanIcon.addEventListener("click", () => {
            this.setOpen(!this.isOpen);
        });


        document.body.appendChild(this.overlayContainer);
        this.createOverlayContainer();

        this.overlayContainer.classList.add("absolute", "top-0", "left-0", "w-full", "h-full", "bg-white", "hidden", "z-50");
    }

    public setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.spanIcon.classList.add('hidden')
            this.overlayContainer.classList.remove('hidden');
        } else {
            this.spanIcon.classList.remove('hidden')
            this.overlayContainer.classList.add('hidden');
        }
    }

    /**
     * Adds the control to the map
     * Required method for MapLibre IControl interface
     *
     * @param map - The MapLibre map instance
     * @returns The control's container element
     */
    public onAdd(map: MapLibreMap): HTMLElement {

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
    }


    private createMenuButton(title: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.classList.add("bg-gray-400", "p-2", "m-2", "rounded", "hover:bg-gray-500");
        button.innerText = title;
        return button;
    }

    private createSingleOverlayContainer(overlay: LayerInfo): HTMLDivElement {
        const item = document.createElement("div");

        const form = document.createElement("form");
        form.classList.add("grid", "grid-cols-1", "gap-x-6", "sm:grid-cols-6", "gap-y-4")

        const d1 = document.createElement("div");
        form.appendChild(d1);
        d1.classList.add("col-span-full")


        const nameLabel = document.createElement("label");
        nameLabel.classList.add("block", "text-sm", "font-medium", "text-gray-700");
        nameLabel.innerText = "Name";
        d1.appendChild(nameLabel);
        const d11 = document.createElement("div");
        d1.appendChild(d11);
        d11.classList.add("relative", "mt-2")

        const nameInput = document.createElement("input");
        nameInput.classList.add("w-full", "rounded-md", "border-0", "bg-transparent", "px-3.5", "py-2.5", "text-sm", "text-gray-900", "ring-1", "ring-inset", "ring-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-inset", "focus:ring-blue-500")
        nameInput.value = overlay.name;

        d11.appendChild(nameInput);

        const nameHint = document.createElement("p");
        nameHint.classList.add("mt-2", "text-sm", "text-gray-500");
        nameHint.innerText = "The name of the overlay, used for display purposes.";
        d1.appendChild(nameHint);

        // --- URL

        const d2 = document.createElement("div");
        form.appendChild(d2);
        d2.classList.add("col-span-full")


        const urlLabel = document.createElement("label");
        urlLabel.classList.add("block", "text-sm", "font-medium", "text-gray-700");
        urlLabel.innerText = "URL";
        d2.appendChild(urlLabel);
        const d21 = document.createElement("div");
        d2.appendChild(d21);
        d21.classList.add("relative", "mt-2")

        const urlInput = document.createElement("input");
        urlInput.classList.add("w-full", "rounded-md", "border-0", "bg-transparent", "px-3.5", "py-2.5", "text-sm", "text-gray-900", "ring-1", "ring-inset", "ring-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-inset", "focus:ring-blue-500")
        urlInput.value = overlay.url;
        urlInput.type = 'text'
        d21.appendChild(urlInput);

        const urlHint = document.createElement("p");
        urlHint.classList.add("mt-2", "text-sm", "text-gray-500");
        urlHint.innerText = "The name of the overlay, used for display purposes.";
        d2.appendChild(urlHint);

        // --- Opacity

        const d3 = document.createElement("div");
        form.appendChild(d3);
        d3.classList.add("col-span-full")


        const opacityLabel = document.createElement("label");
        opacityLabel.classList.add("block", "text-sm", "font-medium", "text-gray-700");
        opacityLabel.innerText = "Opacity";
        d3.appendChild(opacityLabel);

        const d31 = document.createElement("div");
        d3.appendChild(d31);
        d31.classList.add("relative", "mt-2")

        const opacityInput = document.createElement("input");
        opacityInput.classList.add("w-full", "rounded-md", "border-0", "bg-transparent", "px-3.5", "py-2.5", "text-sm", "text-gray-900", "ring-1", "ring-inset", "ring-gray-300", "focus:outline-none", "focus:ring-2", "focus:ring-inset", "focus:ring-blue-500")
        opacityInput.type = "number";
        opacityInput.value = String(overlay.opacity || 100);
        d31.appendChild(opacityInput);

        const opacityHint = document.createElement("p");
        opacityHint.classList.add("mt-2", "text-sm", "text-gray-500");
        opacityHint.innerText = "The name of the overlay, used for display purposes.";
        d3.appendChild(opacityHint);


        // --- Submit Button
        const submitButton = document.createElement("button");
        submitButton.type = "button";
        submitButton.classList.add("mt-4", "inline-flex", "items-center", "justify-center", "rounded-md", "bg-blue-600", "px-4", "py-2", "text-sm", "font-medium", "text-white", "shadow-sm", "hover:bg-blue-700");
        submitButton.innerText = "Save Overlay";
        submitButton.onclick = () => {
            DataProvider.getInstance().addUpdateOverlay(overlay.id, {
                ...overlay,
                name: nameInput.value,
                id: overlay.id,
                url: urlInput.value,
                opacity: parseFloat(opacityInput.value)
            });
        };
        form.appendChild(submitButton);

        item.appendChild(form);
        return item;
    }

    private openOverlayMenu(container: HTMLDivElement): void {
        container.innerHTML = ''; // Clear previous content
        const title = document.createElement("h2");
        title.classList.add("text-xl", "font-bold", "mb-4");
        title.innerText = "Overlay Menu";
        container.appendChild(title);

        const itemContainer = document.createElement("div");
        container.appendChild(itemContainer);
        DataProvider.getInstance().getOverlays().forEach(overlay => {
            itemContainer.appendChild(this.createSingleOverlayContainer(overlay));
        });


        const addOverlayButton = document.createElement("button");
        addOverlayButton.classList.add("mt-4", "inline-flex", "items-center", "justify-center", "rounded-md", "bg-green-600", "px-4", "py-2", "text-sm", "font-medium", "text-white", "shadow-sm", "hover:bg-green-700");
        addOverlayButton.innerText = "Add Overlay";
        addOverlayButton.onclick = () => {
            itemContainer.appendChild(this.createSingleOverlayContainer({
                name: "New Overlay",
                id: "o-" + v4(),
                description: "",
                url: "",
                opacity: 100,
                visible: true
            }));
        };

        container.appendChild(addOverlayButton);
    }

    private createMenu(contentContainer: HTMLDivElement): HTMLElement {
        const menu = document.createElement("div");
        menu.classList.add("p-4");

        const closeButton = document.createElement("button");
        closeButton.classList.add("absolute", "top-2", "right-2", "text-gray-700", "hover:text-gray-900");
        closeButton.innerHTML = icon(faXmark).html[0];
        closeButton.onclick = () => {
            this.setOpen(false)
        };
        menu.appendChild(closeButton);

        const menuOverlays = this.createMenuButton("Overlays");
        menu.appendChild(menuOverlays);
        menu.onclick = () => {
            this.openOverlayMenu(contentContainer)
        }

        setTimeout(() => {
            this.openOverlayMenu(contentContainer)
        }, 500);
        return menu;
    }

    private createOverlayContainer(): void {
        this.overlayContainer.innerHTML = ''; // Clear previous content
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("p-3");
        this.overlayContainer.appendChild(this.createMenu(contentContainer));
        this.overlayContainer.appendChild(contentContainer);
    }
}

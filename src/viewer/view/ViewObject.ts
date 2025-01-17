import {Events} from "../Events";
import {ViewLayer} from "./ViewLayer";
import {SceneObject} from "../scene/index";
import * as math from '../math/index';

/**
 * Represents the visual state of a model object within a {@link View}.
 *
 * ## Summary
 *
 * Each View will automatically contain a ViewObject for each {@link SceneObject} that currently exists. Whenever a
 * SceneObject is created or destroyed, a ViewObject will also automatically be created and destroyed within each View that
 * exists at the time. Each new View we subsequently create will automatically get a ViewObject for each of the SceneObjects
 * that currently exist.
 *
 * If the SceneObject has a value for {@link SceneObject.viewLayer}, then each View will put its corresponding ViewObject in a
 * {@link ViewLayer} `
 *
 * - Registered by {@link ViewObject.id} in {@link ViewLayer.objects}
 * - Has a corresponding {@link SceneObject} in {@link Scene.sceneObjects}
 * - May have a corresponding {@link DataObject} in {@link DataModel.objects}
 */
class ViewObject {

    /**
     * Unique ID of this ViewObject within {@link ViewLayer.objects}.
     */
    public readonly id: string;

    /**
     * Manages events on this ViewObject.
     */
    public readonly events: Events;

    /**
     * The ViewLayer to which this ViewObject belongs.
     */
    public readonly layer: ViewLayer;

    /**
     * The corresponding {@link SceneObject}.
     */
    public readonly sceneObject: SceneObject;

    /**
     * @private
     */
    public readonly state: {
        visible: boolean,
        culled: boolean,
        pickable: boolean,
        clippable: boolean,
        collidable: boolean,
        xrayed: boolean,
        selected: boolean,
        highlighted: boolean,
        edges: boolean,
        colorize: Float32Array,
        colorized: boolean,
        opacityUpdated: boolean
    };

    /**
     * @private
     */
    constructor(layer: ViewLayer, sceneObject: SceneObject, options: {
        opacity?: number;
        colorize?: number[];
        selected?: boolean;
        highlighted?: boolean;
        xrayed?: boolean;
        edges?: boolean;
        collidable?: boolean;
        clippable?: boolean;
        pickable?: boolean;
        culled?: boolean;
        visible?: boolean;
    } = {}) {

        this.id = sceneObject.id;
        this.events = new Events();
        this.layer = layer;
        this.sceneObject = sceneObject;

        // Initialize properties like below so that we also
        // update their counters on the ViewLayer

        this.visible = options.visible !== false;
        this.xrayed = !!options.xrayed;
        this.edges = !!options.edges;
        this.culled = options.culled;
        this.pickable = options.pickable !== false;
        this.clippable = options.clippable !== false;
        this.collidable = options.collidable !== false;
        this.highlighted = !!options.highlighted;
        this.selected = !!options.selected;
        this.colorize = options.colorize;
        this.opacity = options.opacity;
    }

    /**
     * Gets if this ViewObject is visible.
     *
     * * When {@link ViewObject.visible} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.visibleViewObjects}.
     * * Each ViewObject is only rendered when {@link ViewObject.visible} is ````true```` and {@link ViewObject.culled} is ````false````.
     * * Use {@link ViewLayer.setViewObjectsVisible} to batch-update the visibility of Objects.
     */
    get visible(): boolean {
        return this.state.visible;
    }

    /**
     * Sets if this ViewObject is visible.
     *
     * * When {@link ViewObject.visible} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.visibleViewObjects}.
     * * Each ViewObject is only rendered when {@link ViewObject.visible} is ````true```` and {@link ViewObject.culled} is ````false````.
     * * Use {@link ViewLayer.setViewObjectsVisible} to batch-update the visibility of Objects.
     */
    set visible(visible: boolean) {
        if (visible === this.state.visible) {
            return;
        }
        this.state.visible = visible;
        this.sceneObject.setVisible(this.layer.view.viewIndex, visible);
        this.layer.objectVisibilityUpdated(this, visible, true);
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is X-rayed.
     *
     * * When {@link ViewObject.xrayed} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.xrayedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsXRayed} to batch-update the X-rayed state of ViewObjects.
     */
    get xrayed(): boolean {
        return this.state.xrayed;
    }

    /**
     * Sets if this ViewObject is X-rayed.
     *
     * * When {@link ViewObject.xrayed} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.xrayedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsXRayed} to batch-update the X-rayed state of ViewObjects.
     */
    set xrayed(xrayed: boolean) {
        if (this.state.xrayed === xrayed) {
            return;
        }
        this.state.xrayed = xrayed;
        this.sceneObject.setXRayed(this.layer.view.viewIndex, xrayed);
        this.layer.objectXRayedUpdated(this, xrayed);
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject shows edges.
     */
    get edges(): boolean {
        return this.state.edges;
    }

    /**
     * Sets if this ViewObject shows edges.
     */
    set edges(edges: boolean) {
        if (this.state.edges === edges) {
            return;
        }
        this.state.edges = edges;
        this.sceneObject.setEdges(this.layer.view.viewIndex, edges);
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is highlighted.
     *
     * * When {@link ViewObject.highlighted} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.highlightedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsHighlighted} to batch-update the highlighted state of ViewObjects.
     */
    get highlighted(): boolean {
        return this.state.highlighted;
    }

    /**
     * Sets if this ViewObject is highlighted.
     *
     * * When {@link ViewObject.highlighted} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.highlightedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsHighlighted} to batch-update the highlighted state of ViewObjects.
     */
    set highlighted(highlighted: boolean) {
        if (highlighted === this.state.highlighted) {
            return;
        }
        this.state.highlighted = highlighted;
        this.sceneObject.setHighlighted(this.layer.view.viewIndex, highlighted);
        this.layer.objectHighlightedUpdated(this, highlighted);
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is selected.
     *
     * * When {@link ViewObject.selected} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.selectedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsSelected} to batch-update the selected state of ViewObjects.
     */
    get selected(): boolean {
        return this.state.selected;
    }

    /**
     * Sets if this ViewObject is selected.
     *
     * * When {@link ViewObject.selected} is ````true```` the ViewObject will be registered by {@link ViewObject.id} in {@link ViewLayer.selectedViewObjects}.
     * * Use {@link ViewLayer.setViewObjectsSelected} to batch-update the selected state of ViewObjects.
     */
    set selected(selected: boolean) {
        if (selected === this.state.selected) {
            return;
        }
        this.state.selected = selected;
        this.sceneObject.setSelected(this.layer.view.viewIndex, selected);
        this.layer.objectSelectedUpdated(this, selected);
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is culled.
     *
     * * The ViewObject is only rendered when {@link ViewObject.visible} is ````true```` and {@link ViewObject.culled} is ````false````.
     * * Use {@link ViewLayer.setViewObjectsCulled} to batch-update the culled state of ViewObjects.
     */
    get culled(): boolean {
        return this.state.culled;
    }

    /**
     * Sets if this ViewObject is culled.
     *
     * * The ViewObject is only rendered when {@link ViewObject.visible} is ````true```` and {@link ViewObject.culled} is ````false````.
     * * Use {@link ViewLayer.setViewObjectsCulled} to batch-update the culled state of ViewObjects.
     */
    set culled(value: boolean) {
        if (value === this.state.culled) {
            return;
        }
        this.state.culled = value;
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is clippable.
     *
     * * Clipping is done by the {@link SectionPlane}s in {@link ViewLayer.sectionPlanes}.
     * * Use {@link ViewLayer.setViewObjectsClippable} to batch-update the clippable state of ViewObjects.
     */
    get clippable(): boolean {
        return this.state.clippable;
    }

    /**
     * Sets if this ViewObject is clippable.
     *
     * * Clipping is done by the {@link SectionPlane}s in {@link ViewLayer.sectionPlanes}.
     * * Use {@link ViewLayer.setViewObjectsClippable} to batch-update the clippable state of ViewObjects.
     */
    set clippable(value: boolean) {
        if (value === this.state.clippable) {
            return;
        }
        this.state.clippable = value;
        this.layer.redraw();
    }

    /**
     * Gets if this ViewObject is included in boundary calculations.
     *
     * * When ````true````, the 3D World boundaries returned by {@link ViewLayer.aabb} and {@link ViewLayer.getAABB} will include this ViewObject's boundary.
     * * The ViewObject's 3D boundary is held in {@link SceneObject.aabb}.
     * * Use {@link ViewLayer.setViewObjectsCollidable} to batch-update the collidable state of ViewObjects.
     */
    get collidable(): boolean {
        return this.state.collidable;
    }

    /**
     * Sets if this ViewObject included in boundary calculations.
     *
     * * When ````true````, the 3D World boundaries returned by {@link ViewLayer.aabb} and {@link ViewLayer.getAABB} will include this ViewObject's boundary.
     * * The ViewObject's 3D boundary is held in {@link SceneObject.aabb}.
     * * Use {@link ViewLayer.setViewObjectsCollidable} to batch-update the collidable state of ViewObjects.
     */
    set collidable(value: boolean) {
        if (value === this.state.collidable) {
            return;
        }
        this.state.collidable = value;
        // this._setAABBDirty();
        // this.layer._aabbDirty = true;

    }

    /**
     * Gets if this ViewObject is pickable.
     *
     * * Picking is done with {@link ViewLayer.pick}.
     * * Use {@link ViewLayer.setViewObjectsPickable} to batch-update the pickable state of ViewObjects.
     */
    get pickable(): boolean {
        return this.state.pickable;
    }

    /**
     * Sets if this ViewObject is pickable.
     *
     * * Picking is done with {@link ViewLayer.pick}.
     * * Use {@link ViewLayer.setViewObjectsPickable} to batch-update the pickable state of ViewObjects.
     */
    set pickable(value: boolean) {
        if (this.state.pickable === value) {
            return;
        }
        this.state.pickable = value;
        // No need to trigger a render;
        // state is only used when picking
    }

    /**
     * Gets the RGB colorize color for this ViewObject.
     *
     * * Multiplies by rendered fragment colors.
     * * Each element of the color is in range ````[0..1]````.
     * * Use {@link ViewLayer.setViewObjectsColorized} to batch-update the colorized state of ViewObjects.
     */
    get colorize(): Float32Array {
        return this.state.colorize;
    }

    /**
     * Sets the RGB colorize color for this ViewObject.
     *
     * * Multiplies by rendered fragment colors.
     * * Each element of the color is in range ````[0..1]````.
     * * Set to ````null```` or ````undefined```` to reset the colorize color to its default value of ````[1,1,1]````.
     * * Use {@link ViewLayer.setViewObjectsColorized} to batch-update the colorized state of ViewObjects.
     */
    set colorize(value: math.FloatArrayType | undefined | null) {
        let colorize = this.state.colorize;
        if (value) {
            colorize[0] = value[0];
            colorize[1] = value[1];
            colorize[2] = value[2];
        } else {
            colorize[0] = 1;
            colorize[1] = 1;
            colorize[2] = 1;
        }
        this.state.colorized = (!!value);
        this.layer.objectColorizeUpdated(this, this.state.colorized);
        this.layer.redraw();
    }

    /**
     * Gets the opacity factor for this ViewObject.
     *
     * * This is a factor in range ````[0..1]```` which multiplies by the rendered fragment alphas.
     * * Use {@link ViewLayer.setViewObjectsOpacity} to batch-update the opacities of ViewObjects.
     */
    get opacity(): number {
        return this.state.colorize[3];
    }

    /**
     * Sets the opacity factor for this ViewObject.
     *
     * * This is a factor in range ````[0..1]```` which multiplies by the rendered fragment alphas.
     * * Set to ````null```` or ````undefined```` to reset the opacity to its default value of ````1````.
     * * Use {@link ViewLayer.setViewObjectsOpacity} to batch-update the opacities of ViewObjects.
     */
    set opacity(opacity: number | undefined | null) {
        let colorize = this.state.colorize;
        this.state.opacityUpdated = (opacity !== null && opacity !== undefined);
        colorize[3] = this.state.opacityUpdated ? opacity : 1.0;
        this.layer.objectOpacityUpdated(this, this.state.opacityUpdated);
        this.layer.redraw();
    }

    /**
     * @private
     */
    _destroy() { // Called by ViewLayer#destroyViewObjects
        if (this.state.visible) {
            this.layer.objectVisibilityUpdated(this, false, false);
        }
        if (this.state.xrayed) {
            this.layer.objectXRayedUpdated(this, false);
        }
        if (this.state.selected) {
            this.layer.objectSelectedUpdated(this, false);
        }
        if (this.state.highlighted) {
            this.layer.objectHighlightedUpdated(this, false);
        }
        if (this.state.colorized) {
            this.layer.objectColorizeUpdated(this, false);
        }
        if (this.state.opacityUpdated) {
            this.layer.objectOpacityUpdated(this, false);
        }
        this.layer.redraw();
    }
}

export {ViewObject};
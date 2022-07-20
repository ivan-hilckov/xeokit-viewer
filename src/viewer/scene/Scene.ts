import * as math from '../math/';
import {FloatArrayType} from '../math/';

import {Component} from '../Component';
import {Viewer} from "../Viewer";
import {SceneObject} from "./SceneObject";
import {SceneModel} from "./SceneModel";
import {createUUID} from "../utils";
import {View} from "../view";

//import {WebGLSceneModel} from "./webgl/WebGLSceneModel";

/**
 * Contains geometry and materials for the objects in a {@link Viewer}.
 *
 * ## Overview
 *
 * * Belongs to a {@link Viewer}
 * * Located at {@link Viewer.scene}
 * * Contains {@link SceneModel}s and {@link SceneObject}s
 * * Rendered by the {@link View}s in {@link Viewer.views}
 * * May have a {@link DataModel} in {@link Viewer.data}
 */
class Scene extends Component {

    /**
     * The {@link Viewer} this Scene belongs to.
     */
    readonly viewer: Viewer;

    /**
     * The {@link SceneModel}s in this Scene.
     */
    readonly sceneModels: { [key: string]: SceneModel };

    /**
     * The {@link SceneObject}s in this Scene.
     */
    readonly sceneObjects: { [key: string]: SceneObject };

    #center: math.FloatArrayType;
    #aabb: math.FloatArrayType;

    /*
    * @private
     */
    #aabbDirty: boolean;

    /**
     * @private
     */
    constructor(viewer: Viewer, cfg = {}) {

        super(null, cfg);

        this.viewer = viewer;
        this.sceneModels = {};
        this.sceneObjects = {};
        this.#center = math.vec3();
        this.#aabb = math.AABB3();
        this.#aabbDirty = true;
    }

    /**
     * Gets the World-space 3D center of this Scene.
     */
    get center(): math.FloatArrayType {
        if (this.#aabbDirty) {
            const aabb = this.aabb; // Lazy-build AABB
            this.#center[0] = (aabb[0] + aabb[3]) / 2;
            this.#center[1] = (aabb[1] + aabb[4]) / 2;
            this.#center[2] = (aabb[2] + aabb[5]) / 2;
        }
        return this.#center;
    }

    /**
     * Gets the World-space axis-aligned 3D boundary (AABB) of this Scene.
     *
     * The AABB is represented by a six-element Float64Array containing the min/max extents of the axis-aligned volume, ie. ````[xmin, ymin,zmin,xmax,ymax, zmax]````.
     *
     * When the Scene has no content, will be ````[-100,-100,-100,100,100,100]````.
     */
    get aabb() {
        if (this.#aabbDirty) {
            let xmin = math.MAX_DOUBLE;
            let ymin = math.MAX_DOUBLE;
            let zmin = math.MAX_DOUBLE;
            let xmax = math.MIN_DOUBLE;
            let ymax = math.MIN_DOUBLE;
            let zmax = math.MIN_DOUBLE;
            let aabb;
            const objects = this.sceneObjects;
            let valid = false;
            for (const objectId in objects) {
                if (objects.hasOwnProperty(objectId)) {
                    const object = objects[objectId];
                    // if (object.collidable === false) {
                    //     continue;
                    // }
                    aabb = object.aabb;
                    if (aabb[0] < xmin) {
                        xmin = aabb[0];
                    }
                    if (aabb[1] < ymin) {
                        ymin = aabb[1];
                    }
                    if (aabb[2] < zmin) {
                        zmin = aabb[2];
                    }
                    if (aabb[3] > xmax) {
                        xmax = aabb[3];
                    }
                    if (aabb[4] > ymax) {
                        ymax = aabb[4];
                    }
                    if (aabb[5] > zmax) {
                        zmax = aabb[5];
                    }
                    valid = true;
                }
            }
            if (!valid) {
                xmin = -100;
                ymin = -100;
                zmin = -100;
                xmax = 100;
                ymax = 100;
                zmax = 100;
            }
            this.#aabb[0] = xmin;
            this.#aabb[1] = ymin;
            this.#aabb[2] = zmin;
            this.#aabb[3] = xmax;
            this.#aabb[4] = ymax;
            this.#aabb[5] = zmax;
            this.#aabbDirty = false;
        }
        return this.#aabb;
    }

    /**
     * Creates a new {@link SceneModel} within this Scene.
     *
     * @param cfg
     * @param [cfg.id] ID for the new {@link SceneModel}, autogenerated by default
     */
    createSceneModel(cfg: {
        pbrEnabled: boolean;
        saoEnabled: boolean;
        id: string,
        isModel?: boolean;
        matrix?: FloatArrayType;
        scale?: FloatArrayType;
        quaternion?: FloatArrayType;
        rotation?: FloatArrayType;
        position?: FloatArrayType;
        origin?: FloatArrayType;
        edgeThreshold?: number;
        textureTranscoder?: any;
        maxGeometryBatchSize?: number;
    }): SceneModel {
        cfg.id = cfg.id || createUUID();
        if (this.sceneModels[cfg.id]) {
            this.error(`SceneModel already exists: "${cfg.id}"`);
            return;
        }
        const sceneModel = this.viewer.renderer.createSceneModel(cfg);
        this.sceneModels[sceneModel.id] = sceneModel;
        sceneModel.events.on("finalized", () => {
            this.sceneModels[sceneModel.id] = sceneModel;
            this.#registerSceneObjects(sceneModel);
            this.events.fire("sceneModelCreated", sceneModel);
        });
        sceneModel.events.on("destroyed", () => {
            delete this.sceneModels[sceneModel.id];
            this.#deregisterSceneObjects(sceneModel);
            this.events.fire("sceneModelDestroyed", sceneModel);
        });
        return sceneModel;
    }

    /**
     * @private
     */
    setAABBDirty() {
        //if (!this.#aabbDirty) {
        this.#aabbDirty = true;
        this.events.fire("aabb", true);
        // }
    }

    /**
     * @private
     */
    destroy() {
        for (const modelId in this.sceneModels) {
            if (this.sceneModels.hasOwnProperty(modelId)) {
                const sceneModel = this.sceneModels[modelId];
                sceneModel.destroy();
            }
        }
        super.destroy();
    }

    #registerSceneObjects(sceneModel: SceneModel) {
        const sceneObjects = sceneModel.sceneObjects;
        for (let id in sceneObjects) {
            const sceneObject = sceneObjects[id];
            this.sceneObjects[sceneObject.id] = sceneObject;
        }
        this.#aabbDirty = true;
    }

    #deregisterSceneObjects(sceneModel: SceneModel) {
        const sceneObjects = sceneModel.sceneObjects;
        for (let id in sceneObjects) {
            const sceneObject = sceneObjects[id];
            delete this.sceneObjects[sceneObject.id];
        }
        this.#aabbDirty = true;
    }
}

export {Scene};

import {LocaleService} from "./localization/LocaleService";
//import {Scene, WebGLSceneRenderer} from "./scene";
import {Scene} from "./scene";
import {Data} from "./data";
import {View} from "./view";
import {Plugin} from "./Plugin";
import {Component} from "./Component";
import * as math from "./math/math";
import {scheduler} from "./scheduler";
import {SceneRenderer} from "./scene/SceneRenderer";
import {apply, createUUID} from "./utils";

/**
 * The viewer component at the core of the xeokit SDK.
 *
 * See [main docs page](https://xeokit.github.io/xeokit-webgpu-sdk/docs/index.html) for usage examples.
 *
 * ## Overview
 *
 * - A browser-based 3D/2D viewer powered by WebGPU and WebGL
 * - Has a {@link Scene} containing geometry and materials for models
 * - Has {@link Data} containing general data about models
 * - Has {@link View}s, which each provide an independent view of the models in a separate canvas
 * - Extensible via {@link Plugin}s
 */
export class Viewer extends Component {

    /**
     The maximum number of {@link View}s that can belong to this {@link Viewer}.
     */
    static readonly MAX_VIEWS: number = 4;

    /**
     The viewer's locale service.

     This may be configured via the Viewer's constructor.

     By default, this service will be an instance of {@link LocaleService}, which will just return
     null translations for all given strings and phrases.
     */
    readonly localeService: LocaleService;

    /**
     Metadata about the models and objects within the Viewer's {@link Scene}.
     */
    readonly data: Data;

    /**
     The Viewer's {@link Scene}.
     */
    readonly scene: Scene;

    /**
     The {@link View}s belonging to this Viewer, each keyed to {@link View#id}.
     */
    readonly views: { [key: string]: View };

    /**
     List of {@link View}s belonging to this Viewer.
     */
    readonly viewList: View[];

    /**
     The number of {@link View}s belonging to this Viewer.
     */
    numViews: number;

    /**
     List of {@link Plugin}s installed in this Viewer.
     */
    readonly pluginList: Plugin[];

    /**
     The time that this Viewer was created.
     */
    readonly startTime: number = (new Date()).getTime();

    /**
     * @private
     */
    renderer: SceneRenderer;

    /**
     * @private
     */
 //   webglSceneRenderer: WebGLSceneRenderer;

    /**
     Creates a Viewer.

     @param cfg - Viewer configuration.
     @param cfg.id - ID for this Viewer, automatically generated by default.
     @param cfg.units - The measurement unit type. Accepted values are ````"meters"````, ````"metres"````, , ````"centimeters"````, ````"centimetres"````, ````"millimeters"````,  ````"millimetres"````, ````"yards"````, ````"feet"```` and ````"inches"````.
     @param cfg.scale - The number of Real-space units in each World-space coordinate system unit.
     @param cfg.origin - The Real-space 3D origin, in current measurement units, at which the World-space coordinate origin ````[0,0,0]```` sits.
     @param cfg.localeService - Locale-based translation service.
     */
    constructor(cfg: {
        id?: string,
        units?: string,
        scale?: number,
        origin?: math.FloatArrayType,
        localeService?: LocaleService
    } = {}) {

        super(null, cfg);

        this.localeService = cfg.localeService || new LocaleService();
        this.data = new Data(this);
        this.scene = new Scene(this, {});
        this.viewList = [];
        this.numViews = 0;
        this.pluginList = [];
        this.views = {};

        scheduler.registerViewer(this);
    }

    /**
     * Creates a new {@link View} within this Viewer.
     *
     * Fires a "viewCreated" event with the new View.
     *
     * To destroy the View after use, call {@link View#destroy}, which fires a "viewDestroyed" event, with the destroyed View.
     *
     * You must add a View to the Viewer before you can create or load content into the Viewer's Scene.
     *
     * @param cfg
     */
    createView(cfg: {
        id?: number | string,
        origin?: number[];
        scale?: number;
        units?: string;
        canvasId?: string;
        canvasElement?: HTMLCanvasElement;
        backgroundColor?: any[];
        backgroundColorFromAmbientLight?: boolean;
        premultipliedAlpha?: boolean;
        transparent?: boolean;
        pbrEnabled?: boolean;
        colorTextureEnabled?: boolean;
    }): View {
        let id = cfg.id || createUUID();
        if (this.views[id]) {
            this.error(`View with ID "${id}" already exists - will randomly-generate ID`);
            id = createUUID();
        }
        const canvasElement = cfg.canvasElement || document.getElementById(cfg.canvasId);
        if (!(canvasElement instanceof HTMLCanvasElement)) {
            throw "Mandatory View config expected: valid canvasId or canvasElement";
        }
        const view = new View(apply({id, viewer: this}, cfg));
        // this.webglSceneRenderer = new WebGLSceneRenderer({
        //     view,
        //     canvasElement,
        //     alphaDepthMask: true,
        //     transparent: cfg.transparent
        // });
        // this.renderer = this.webglSceneRenderer;
        this.#registerView(view);
        view.events.on("destroyed", () => {
            this.#deregisterView(view);
            this.events.fire("viewDestroyed", view);
        });
        this.events.fire("viewCreated", view);
        return view;
    }

    /**
     @private
     */
    registerPlugin(plugin: Plugin): void {
        this.pluginList.push(plugin);
    }

    /**
     @private
     */
    deregisterPlugin(plugin: Plugin): void {
        for (let i = 0, len = this.pluginList.length; i < len; i++) {
            const p = this.pluginList[i];
            if (p === plugin) {
                p.clear();
                this.pluginList.splice(i, 1);
                return;
            }
        }
    }

    /**
     @private
     */
    sendToPlugins(name: string, value?: any) {
        for (let i = 0, len = this.pluginList.length; i < len; i++) {
            const p = this.pluginList[i];
            if (p.send) {
                p.send(name, value);
            }
        }
    }

    /**
     @private
     */
    recompile() {
        for (let id in this.views) {
            this.views[id].recompile();
        }
    }

    /**
     Trigger a redraw of all {@link View}s belonging to this Viewer.

     @private
     */
    redraw(): void {
        for (let id in this.views) {
            this.views[id].redraw();
        }
    }

    /**
     Destroys this Viewer, along with associated Views and Plugins.
     */
    destroy(): void {
        if (this.destroyed) {
            return;
        }
        scheduler.deregisterViewer(this);
        const pluginList = this.pluginList.slice(); // Array will modify as we delete plugins
        for (let i = 0, len = pluginList.length; i < len; i++) {
            const plugin = pluginList[i];
            plugin.destroy();
        }
        // for (let id in this.views) {
        //     this.views[id].destroy();
        // }
        // this.scene.destroy();
        super.destroy();
    }

    #registerView(view: View): void {
        if (this.views[view.id]) {
            return;
        }
        this.views[view.id] = view;
        for (let viewIndex = 0; ; viewIndex++) {
            if (!this.viewList[viewIndex]) {
                this.viewList[viewIndex] = view;
                // @ts-ignore
                this.numViews++;
                view.viewIndex = viewIndex;
                return;
            }
        }
    }

    #deregisterView(view: View): void {
        if (!this.views[view.id]) {
            return;
        }
        delete this.views[view.id];
        delete this.viewList[view.viewIndex];
        // @ts-ignore
        this.numViews--;
    }
}

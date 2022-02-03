import {LocaleService} from "./localization/LocaleService";
import {Scene} from "./scene";
import {MetaScene} from "./metadata";
import {View} from "./view";
import {Plugin} from "./Plugin";
import {Component} from "./Component";
import * as math from "./math/math";
import {scheduler} from "./scheduler";

/**
 The core 3D viewer component within the xeokit SDK.

 ## Overview

 - Powered by WebGPU or WebGL
 - Has a {@link Scene}, which contains the geometric representation of model objects
 - Has a {@link MetaScene}, which contains metadata about the models and objects
 - Has one or more {@link View}s, each managing an independent view of the models and objects in a separate canvas
 - Add {@link Plugin}s to a Viewer to extend its functionality
 */
export class Viewer extends Component {

    /**
     The viewer's locale service.

     This may be configured via the Viewer's constructor.

     By default, this service will be an instance of {@link LocaleService}, which will just return
     null translations for all given strings and phrases.
     */
    public readonly localeService: LocaleService;

    /**
     Metadata about the models and objects within the Viewer's {@link Scene}.
     */
    public readonly metaScene: MetaScene;

    /**
     The Viewer's {@link Scene}.
     */
    public readonly scene: Scene;

    /**
     The {@link View}s belonging to this Viewer, each keyed to {@link View#id}.
     */
    public readonly views: { [key: string]: View };

    /**
     List of {@link View}s belonging to this Viewer.
     */
    public readonly viewList: View[];

    /**
     The number of {@link View}s belonging to this Viewer.
     */
    public numViews: number;

    /**
     The maximum number of {@link View}s that can belong to this {@link Viewer}.
     */
    public static readonly MAX_VIEWS: number = 4;

    /**
     List of {@link Plugin}s installed in this Viewer.
     */
    public readonly pluginList: Plugin[];

    /**
     The time that this Viewer was created.
     */
    public readonly startTime: number = (new Date()).getTime();

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
        this.metaScene = new MetaScene(this);
        this.scene = new Scene(this, {});
        this.viewList = [];
        this.numViews = 0;
        this.pluginList = [];

        scheduler.registerViewer(this);
    }

    /**
     @private
     */
    registerView(view: View): void {
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

    /**
     @private
     */
    deregisterView(view: View): void {
        if (!this.views[view.id]) {
            return;
        }
        delete this.views[view.id];
        delete this.viewList[view.viewIndex];
        // @ts-ignore
        this.numViews--;
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
        for (let id in this.views) {
            this.views[id].destroy();
        }
        this.scene.destroy();
        super.destroy();
    }
}

import {TrianglesBatchingColorRenderer} from "./renderers/TrianglesBatchingColorRenderer.js";
import {TrianglesBatchingFlatColorRenderer} from "./renderers/TrianglesBatchingFlatColorRenderer.js";
import {TrianglesBatchingSilhouetteRenderer} from "./renderers/TrianglesBatchingSilhouetteRenderer.js";
import {TrianglesBatchingEdgesRenderer} from "./renderers/TrianglesBatchingEdgesRenderer.js";
import {TrianglesBatchingEdgesColorRenderer} from "./renderers/TrianglesBatchingEdgesColorRenderer.js";
import {TrianglesBatchingPickMeshRenderer} from "./renderers/TrianglesBatchingPickMeshRenderer.js";
import {TrianglesBatchingPickDepthRenderer} from "./renderers/TrianglesBatchingPickDepthRenderer.js";
import {TrianglesBatchingPickNormalsRenderer} from "./renderers/TrianglesBatchingPickNormalsRenderer.js";
import {TrianglesBatchingOcclusionRenderer} from "./renderers/TrianglesBatchingOcclusionRenderer.js";
import {TrianglesBatchingDepthRenderer} from "./renderers/TrianglesBatchingDepthRenderer.js";
import {TrianglesBatchingNormalsRenderer} from "./renderers/TrianglesBatchingNormalsRenderer.js";
import {TrianglesBatchingShadowRenderer} from "./renderers/TrianglesBatchingShadowRenderer.js";
import {TrianglesBatchingPBRRenderer} from "./renderers/TrianglesBatchingPBRRenderer.js";
import {TrianglesBatchingPickNormalsFlatRenderer} from "./renderers/TrianglesBatchingPickNormalsFlatRenderer.js";
import {TrianglesBatchingColorTextureRenderer} from "./renderers/TrianglesBatchingColorTextureRenderer";
import {View} from "../../../../../View";

/**
 * @private
 */
class TrianglesBatchingRenderers {
    #view: View;

    #colorRenderer: TrianglesBatchingColorRenderer;
    #colorRendererWithSAO: TrianglesBatchingColorRenderer;
    #flatColorRenderer: TrianglesBatchingFlatColorRenderer;
    #flatColorRendererWithSAO: TrianglesBatchingFlatColorRenderer;
    #colorTextureRenderer: TrianglesBatchingColorTextureRenderer;
    #colorTextureRendererWithSAO: TrianglesBatchingColorTextureRenderer;
    #pbrRenderer: TrianglesBatchingPBRRenderer;
    #pbrRendererWithSAO: TrianglesBatchingPBRRenderer;
    #depthRenderer: TrianglesBatchingDepthRenderer;
    #normalsRenderer: TrianglesBatchingNormalsRenderer;
    #silhouetteRenderer: TrianglesBatchingSilhouetteRenderer;
    #edgesRenderer: TrianglesBatchingEdgesRenderer;
    #edgesColorRenderer: TrianglesBatchingEdgesColorRenderer;
    #pickMeshRenderer: TrianglesBatchingPickMeshRenderer;
    #pickDepthRenderer: TrianglesBatchingPickDepthRenderer;
    #pickNormalsRenderer: TrianglesBatchingPickNormalsRenderer;
    #pickNormalsFlatRenderer: TrianglesBatchingPickNormalsFlatRenderer;
    #occlusionRenderer: TrianglesBatchingOcclusionRenderer;
    #shadowRenderer: TrianglesBatchingShadowRenderer;

    constructor(view: View) {
        this.#view = view;

    }

    get colorRenderer(): TrianglesBatchingColorRenderer {
        if (!this.#colorRenderer) {
            this.#colorRenderer = new TrianglesBatchingColorRenderer(this.#view, false);
        }
        return this.#colorRenderer;
    }

    get colorRendererWithSAO(): TrianglesBatchingColorRenderer {
        if (!this.#colorRendererWithSAO) {
            this.#colorRendererWithSAO = new TrianglesBatchingColorRenderer(this.#view, true);
        }
        return this.#colorRendererWithSAO;
    }

    get flatColorRenderer(): TrianglesBatchingFlatColorRenderer {
        if (!this.#flatColorRenderer) {
            this.#flatColorRenderer = new TrianglesBatchingFlatColorRenderer(this.#view, false);
        }
        return this.#flatColorRenderer;
    }

    get flatColorRendererWithSAO(): TrianglesBatchingFlatColorRenderer {
        if (!this.#flatColorRendererWithSAO) {
            this.#flatColorRendererWithSAO = new TrianglesBatchingFlatColorRenderer(this.#view, true);
        }
        return this.#flatColorRendererWithSAO;
    }

    get colorTextureRenderer(): TrianglesBatchingColorTextureRenderer {
        if (!this.#colorTextureRenderer) {
            this.#colorTextureRenderer = new TrianglesBatchingColorTextureRenderer(this.#view, false);
        }
        return this.#colorTextureRenderer;
    }

    get colorTextureRendererWithSAO(): TrianglesBatchingColorTextureRenderer {
        if (!this.#colorTextureRendererWithSAO) {
            this.#colorTextureRendererWithSAO = new TrianglesBatchingColorTextureRenderer(this.#view, true);
        }
        return this.#colorTextureRendererWithSAO;
    }

    get pbrRenderer(): TrianglesBatchingPBRRenderer {
        if (!this.#pbrRenderer) {
            this.#pbrRenderer = new TrianglesBatchingPBRRenderer(this.#view, false);
        }
        return this.#pbrRenderer;
    }

    get pbrRendererWithSAO(): TrianglesBatchingPBRRenderer {
        if (!this.#pbrRendererWithSAO) {
            this.#pbrRendererWithSAO = new TrianglesBatchingPBRRenderer(this.#view, true);
        }
        return this.#pbrRendererWithSAO;
    }

    get silhouetteRenderer(): TrianglesBatchingSilhouetteRenderer {
        if (!this.#silhouetteRenderer) {
            this.#silhouetteRenderer = new TrianglesBatchingSilhouetteRenderer(this.#view);
        }
        return this.#silhouetteRenderer;
    }

    get depthRenderer(): TrianglesBatchingDepthRenderer {
        if (!this.#depthRenderer) {
            this.#depthRenderer = new TrianglesBatchingDepthRenderer(this.#view);
        }
        return this.#depthRenderer;
    }

    get normalsRenderer(): TrianglesBatchingNormalsRenderer {
        if (!this.#normalsRenderer) {
            this.#normalsRenderer = new TrianglesBatchingNormalsRenderer(this.#view);
        }
        return this.#normalsRenderer;
    }

    get edgesRenderer(): TrianglesBatchingEdgesRenderer {
        if (!this.#edgesRenderer) {
            this.#edgesRenderer = new TrianglesBatchingEdgesRenderer(this.#view);
        }
        return this.#edgesRenderer;
    }

    get edgesColorRenderer(): TrianglesBatchingEdgesColorRenderer {
        if (!this.#edgesColorRenderer) {
            this.#edgesColorRenderer = new TrianglesBatchingEdgesColorRenderer(this.#view);
        }
        return this.#edgesColorRenderer;
    }

    get pickMeshRenderer(): TrianglesBatchingPickMeshRenderer {
        if (!this.#pickMeshRenderer) {
            this.#pickMeshRenderer = new TrianglesBatchingPickMeshRenderer(this.#view);
        }
        return this.#pickMeshRenderer;
    }

    get pickNormalsRenderer(): TrianglesBatchingPickNormalsRenderer {
        if (!this.#pickNormalsRenderer) {
            this.#pickNormalsRenderer = new TrianglesBatchingPickNormalsRenderer(this.#view);
        }
        return this.#pickNormalsRenderer;
    }

    get pickNormalsFlatRenderer(): TrianglesBatchingPickNormalsFlatRenderer {
        if (!this.#pickNormalsFlatRenderer) {
            this.#pickNormalsFlatRenderer = new TrianglesBatchingPickNormalsFlatRenderer(this.#view);
        }
        return this.#pickNormalsFlatRenderer;
    }

    get pickDepthRenderer(): TrianglesBatchingPickDepthRenderer {
        if (!this.#pickDepthRenderer) {
            this.#pickDepthRenderer = new TrianglesBatchingPickDepthRenderer(this.#view);
        }
        return this.#pickDepthRenderer;
    }

    get occlusionRenderer(): TrianglesBatchingOcclusionRenderer {
        if (!this.#occlusionRenderer) {
            this.#occlusionRenderer = new TrianglesBatchingOcclusionRenderer(this.#view);
        }
        return this.#occlusionRenderer;
    }

    get shadowRenderer(): TrianglesBatchingShadowRenderer {
        if (!this.#shadowRenderer) {
            this.#shadowRenderer = new TrianglesBatchingShadowRenderer(this.#view);
        }
        return this.#shadowRenderer;
    }

    compile() {
        if (this.#colorRenderer && (!this.#colorRenderer.getValid())) {
            this.#colorRenderer.destroy();
            this.#colorRenderer = null;
        }
        if (this.#colorRendererWithSAO && (!this.#colorRendererWithSAO.getValid())) {
            this.#colorRendererWithSAO.destroy();
            this.#colorRendererWithSAO = null;
        }
        if (this.#flatColorRenderer && (!this.#flatColorRenderer.getValid())) {
            this.#flatColorRenderer.destroy();
            this.#flatColorRenderer = null;
        }
        if (this.#flatColorRendererWithSAO && (!this.#flatColorRendererWithSAO.getValid())) {
            this.#flatColorRendererWithSAO.destroy();
            this.#flatColorRendererWithSAO = null;
        }
        if (this.#colorTextureRenderer && (!this.#colorTextureRenderer.getValid())) {
            this.#colorTextureRenderer.destroy();
            this.#colorTextureRenderer = null;
        }
        if (this.#colorTextureRendererWithSAO && (!this.#colorTextureRendererWithSAO.getValid())) {
            this.#colorTextureRendererWithSAO.destroy();
            this.#colorTextureRendererWithSAO = null;
        }
        if (this.#pbrRenderer && (!this.#pbrRenderer.getValid())) {
            this.#pbrRenderer.destroy();
            this.#pbrRenderer = null;
        }
        if (this.#pbrRendererWithSAO && (!this.#pbrRendererWithSAO.getValid())) {
            this.#pbrRendererWithSAO.destroy();
            this.#pbrRendererWithSAO = null;
        }
        if (this.#depthRenderer && (!this.#depthRenderer.getValid())) {
            this.#depthRenderer.destroy();
            this.#depthRenderer = null;
        }
        if (this.#normalsRenderer && (!this.#normalsRenderer.getValid())) {
            this.#normalsRenderer.destroy();
            this.#normalsRenderer = null;
        }
        if (this.#silhouetteRenderer && (!this.#silhouetteRenderer.getValid())) {
            this.#silhouetteRenderer.destroy();
            this.#silhouetteRenderer = null;
        }
        if (this.#edgesRenderer && (!this.#edgesRenderer.getValid())) {
            this.#edgesRenderer.destroy();
            this.#edgesRenderer = null;
        }
        if (this.#edgesColorRenderer && (!this.#edgesColorRenderer.getValid())) {
            this.#edgesColorRenderer.destroy();
            this.#edgesColorRenderer = null;
        }
        if (this.#pickMeshRenderer && (!this.#pickMeshRenderer.getValid())) {
            this.#pickMeshRenderer.destroy();
            this.#pickMeshRenderer = null;
        }
        if (this.#pickDepthRenderer && (!this.#pickDepthRenderer.getValid())) {
            this.#pickDepthRenderer.destroy();
            this.#pickDepthRenderer = null;
        }
        if (this.#pickNormalsRenderer && this.#pickNormalsRenderer.getValid() === false) {
            this.#pickNormalsRenderer.destroy();
            this.#pickNormalsRenderer = null;
        }
        if (this.#pickNormalsFlatRenderer && this.#pickNormalsFlatRenderer.getValid() === false) {
            this.#pickNormalsFlatRenderer.destroy();
            this.#pickNormalsFlatRenderer = null;
        }
        if (this.#occlusionRenderer && this.#occlusionRenderer.getValid() === false) {
            this.#occlusionRenderer.destroy();
            this.#occlusionRenderer = null;
        }
        if (this.#shadowRenderer && (!this.#shadowRenderer.getValid())) {
            this.#shadowRenderer.destroy();
            this.#shadowRenderer = null;
        }
    }

    destroy() {
        if (this.#colorRenderer) {
            this.#colorRenderer.destroy();
        }
        if (this.#colorRendererWithSAO) {
            this.#colorRendererWithSAO.destroy();
        }
        if (this.#flatColorRenderer) {
            this.#flatColorRenderer.destroy();
        }
        if (this.#flatColorRendererWithSAO) {
            this.#flatColorRendererWithSAO.destroy();
        }
        if (this.#colorTextureRenderer) {
            this.#colorTextureRenderer.destroy();
        }
        if (this.#colorTextureRendererWithSAO) {
            this.#colorTextureRendererWithSAO.destroy();
        }
        if (this.#pbrRenderer) {
            this.#pbrRenderer.destroy();
        }
        if (this.#pbrRendererWithSAO) {
            this.#pbrRendererWithSAO.destroy();
        }
        if (this.#depthRenderer) {
            this.#depthRenderer.destroy();
        }
        if (this.#normalsRenderer) {
            this.#normalsRenderer.destroy();
        }
        if (this.#silhouetteRenderer) {
            this.#silhouetteRenderer.destroy();
        }
        if (this.#edgesRenderer) {
            this.#edgesRenderer.destroy();
        }
        if (this.#edgesColorRenderer) {
            this.#edgesColorRenderer.destroy();
        }
        if (this.#pickMeshRenderer) {
            this.#pickMeshRenderer.destroy();
        }
        if (this.#pickDepthRenderer) {
            this.#pickDepthRenderer.destroy();
        }
        if (this.#pickNormalsRenderer) {
            this.#pickNormalsRenderer.destroy();
        }
        if (this.#pickNormalsFlatRenderer) {
            this.#pickNormalsFlatRenderer.destroy();
        }
        if (this.#occlusionRenderer) {
            this.#occlusionRenderer.destroy();
        }
        if (this.#shadowRenderer) {
            this.#shadowRenderer.destroy();
        }
    }
}

const cachdRenderers: { [key: string]: TrianglesBatchingRenderers } = {};

/**
 * @private
 */
function getBatchingRenderers(view: View): TrianglesBatchingRenderers {
    const viewId = view.id;
    let batchingRenderers = cachdRenderers[viewId];
    if (!batchingRenderers) {
        batchingRenderers = new TrianglesBatchingRenderers(view);
        cachdRenderers[viewId] = batchingRenderers;
        batchingRenderers.compile();
        view.events.on("compile", () => {
            batchingRenderers.compile();
        });
        view.events.on("destroyed", () => {
            delete cachdRenderers[viewId];
            batchingRenderers.destroy();
        });
    }
    return batchingRenderers;
}

export {getBatchingRenderers};
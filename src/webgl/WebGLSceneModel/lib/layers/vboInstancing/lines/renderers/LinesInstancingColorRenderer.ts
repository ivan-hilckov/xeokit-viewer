import {BasicVBOLayerRenderer} from "../../../BasicVBOLayerRenderer";
import {View} from "../../../../../../../viewer/view";

/**
 * @private
 */
export class LinesInstancingColorRenderer extends BasicVBOLayerRenderer {
    #withSAO: boolean;

    constructor(view: View, withSAO: boolean) {
        super(view);
        this.#withSAO = withSAO;
    }

    getHash(): string {
        return this.view.getSectionPlanesHash();
    }

    buildVertexShader(): string {
        const view = this.view;
        const clipping = (view.sectionPlanesList.length > 0);
        const src = [];
        src.push('#version 300 es');
        src.push("// LinesInstancingColorRenderer");
        src.push("uniform int renderPass;");
        src.push("in vec3 position;");
        src.push("in vec4 color;");
        src.push("in vec4 flags;");
        src.push("in vec4 flags2;");
        // if (view.entityOffsetsEnabled) {
        //     src.push("in vec3 offset;");
        // }
        src.push("in vec4 modelMatrixCol0;"); // Modeling matrix
        src.push("in vec4 modelMatrixCol1;");
        src.push("in vec4 modelMatrixCol2;");
        src.push("uniform mat4 worldMatrix;");
        src.push("uniform mat4 viewMatrix;");
        src.push("uniform mat4 projMatrix;");
        src.push("uniform mat4 positionsDecompressMatrix;");
        if (view.logarithmicDepthBufferEnabled) {
            src.push("uniform float logDepthBufFC;");
            src.push("out float vFragDepth;");
        }
        src.push("uniform vec4 lightAmbient;");
        if (clipping) {
            src.push("out vec4 vWorldPosition;");
            src.push("out vec4 vFlags2;");
        }
        src.push("out vec4 vColor;");
        src.push("void main(void) {");
        // flags.x = NOT_RENDERED | COLOR_OPAQUE | COLOR_TRANSPARENT
        // renderPass = COLOR_OPAQUE | COLOR_TRANSPARENT
        src.push(`if (int(flags.x) != renderPass) {`);
        src.push("   gl_Position = vec4(0.0, 0.0, 0.0, 0.0);"); // Cull vertex
        src.push("} else {");
        src.push("vec4 worldPosition =  positionsDecompressMatrix * vec4(position, 1.0); ");
        src.push("worldPosition = worldMatrix * vec4(dot(worldPosition, modelMatrixCol0), dot(worldPosition, modelMatrixCol1), dot(worldPosition, modelMatrixCol2), 1.0);");
        // if (view.entityOffsetsEnabled) {
        //     src.push("      worldPosition.xyz = worldPosition.xyz + offset;");
        // }
        src.push("vec4 viewPosition  = viewMatrix * worldPosition; ");
        src.push("vColor = vec4(float(color.r) / 255.0, float(color.g) / 255.0, float(color.b) / 255.0,  float(color.a) / 255.0);");
        if (clipping) {
            src.push("vWorldPosition = worldPosition;");
            src.push("vFlags2 = flags2;");
        }
        src.push("vec4 clipPos = projMatrix * viewPosition;");
        if (view.logarithmicDepthBufferEnabled) {
            src.push("vFragDepth = 1.0 + clipPos.w;");
        }
        src.push("gl_Position = clipPos;");
        src.push("}");
        src.push("}");
        return src.join("\n");
    }

    buildFragmentShader(): string {
        const clipping = (this.view.sectionPlanesList.length > 0);
        const src = [];
        src.push('#version 300 es');
        src.push("// LinesInstancingColorRenderer");
        src.push("#ifdef GL_FRAGMENT_PRECISION_HIGH");
        src.push("precision highp float;");
        src.push("precision highp int;");
        src.push("#else");
        src.push("precision mediump float;");
        src.push("precision mediump int;");
        src.push("#endif");
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("uniform float logDepthBufFC;");
            src.push("in float vFragDepth;");
        }
        if (clipping) {
            src.push("in vec4 vWorldPosition;");
            src.push("in vec4 vFlags2;");
            for (let i = 0, len = this.view.sectionPlanesList.length; i < len; i++) {
                src.push("uniform bool sectionPlaneActive" + i + ";");
                src.push("uniform vec3 sectionPlanePos" + i + ";");
                src.push("uniform vec3 sectionPlaneDir" + i + ";");
            }
        }
        src.push("in vec4 vColor;");
        src.push("out vec4 outColor;");
        src.push("void main(void) {");
        if (clipping) {
            src.push("  bool clippable = (float(vFlags2.x) > 0.0);");
            src.push("  if (clippable) {");
            src.push("  float dist = 0.0;");
            for (let i = 0, len = this.view.sectionPlanesList.length; i < len; i++) {
                src.push("if (sectionPlaneActive" + i + ") {");
                src.push("   dist += clamp(dot(-sectionPlaneDir" + i + ".xyz, vWorldPosition.xyz - sectionPlanePos" + i + ".xyz), 0.0, 1000.0);");
                src.push("}");
            }
            src.push("if (dist > 0.0) { discard; }");
            src.push("}");
        }
        // Doing SAO blend in the main solid fill draw shader just so that edge lines can be drawn over the top
        // Would be more efficient to defer this, then render lines later, using same depth buffer for Z-reject
        if (this.#withSAO) {
            src.push("   float viewportWidth     = uSAOParams[0];");
            src.push("   float viewportHeight    = uSAOParams[1];");
            src.push("   float blendCutoff       = uSAOParams[2];");
            src.push("   float blendFactor       = uSAOParams[3];");
            src.push("   vec2 uv                 = vec2(gl_FragCoord.x / viewportWidth, gl_FragCoord.y / viewportHeight);");
            src.push("   float ambient           = smoothstep(blendCutoff, 1.0, unpackRGBAToDepth(texture(uOcclusionTexture, uv))) * blendFactor;");
            src.push("   outColor            = vec4(vColor.rgb * ambient, vColor.a);");
        } else {
            src.push("    outColor           = vColor;");
        }
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("gl_FragDepth = log2( vFragDepth ) * logDepthBufFC * 0.5;");
        }
        src.push("}");
        return src.join("\n");
    }

    drawElements(layer: any) {
        // @ts-ignore
        const gl = this.view.viewer.sceneRenderer.gl;
        gl.lineWidth(this.view.linesMaterial.lineWidth);
        gl.drawElementsInstanced(gl.LINES,
            layer.geometry.indicesBuf.numItems, layer.geometry.indicesBuf.itemType, 0, layer.state.numInstances);
    }
}
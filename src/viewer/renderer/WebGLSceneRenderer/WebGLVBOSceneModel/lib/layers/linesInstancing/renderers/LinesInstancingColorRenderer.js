import {Program} from "../../../../../lib/Program.ts";
import {math} from "../../../../../../math/math.js";
import {createRTCViewMat, getPlaneRTCPos} from "../../../../../../math/rtcCoords.js";

const tempVec3a = math.vec3();

/**
 * @private
 */
class LinesInstancingColorRenderer {
    #view: View;

    constructor(view) {
        this.#view = view;
        this.#hash = this._getHash();
        this._allocate();
    }

    getValid() {
        return this.#hash === this._getHash();
    };

    _getHash() {
        return this.#view.#sectionPlanesState.getHash();
    }

    drawLayer(frameCtx, instancingLayer, renderPass) {

        const model = instancingLayer.model;
        const view = this.#view;
        const camera = view.camera;
        const gl = view.viewer.webglSceneRenderer.gl;
        const state = instancingLayer.state;
        const origin = instancingLayer.state.origin;
        const geometry = instancingLayer.geometry;

        if (!this.#program) {
            this._allocate();
            if (this.errors) {
                return;
            }
        }

        if (frameCtx.lastProgramId !== this.#program.id) {
            frameCtx.lastProgramId = this.#program.id;
            this._bindProgram(frameCtx);
        }

        gl.uniform1i(this.#uRenderPass, renderPass);

        gl.uniformMatrix4fv(this._uViewMatrix, false, (origin) ? createRTCViewMat(camera.viewMatrix, origin) : camera.viewMatrix);
        gl.uniformMatrix4fv(this._uWorldMatrix, false, model.worldMatrix);

        gl.lineWidth(view.linesMaterial.lineWidth);

        const numSectionPlanes = view.#sectionPlanesState.sectionPlanes.length;
        if (numSectionPlanes > 0) {
            const sectionPlanes = view.#sectionPlanesState.sectionPlanes;
            const baseIndex = instancingLayer.layerIndex * numSectionPlanes;
            const renderFlags = model.renderFlags;
            for (let sectionPlaneIndex = 0; sectionPlaneIndex < numSectionPlanes; sectionPlaneIndex++) {
                const sectionPlaneUniforms = this._uSectionPlanes[sectionPlaneIndex];
                if (sectionPlaneUniforms) {
                    const active = renderFlags.sectionPlanesActivePerLayer[baseIndex + sectionPlaneIndex];
                    gl.uniform1i(sectionPlaneUniforms.active, active ? 1 : 0);
                    if (active) {
                        const sectionPlane = sectionPlanes[sectionPlaneIndex];
                        if (origin) {
                            const rtcSectionPlanePos = getPlaneRTCPos(sectionPlane.dist, sectionPlane.dir, origin, tempVec3a);
                            gl.uniform3fv(sectionPlaneUniforms.pos, rtcSectionPlanePos);
                        } else {
                            gl.uniform3fv(sectionPlaneUniforms.pos, sectionPlane.pos);
                        }
                        gl.uniform3fv(sectionPlaneUniforms.dir, sectionPlane.dir);
                    }
                }
            }
        }

        gl.uniformMatrix4fv(this._uPositionsDecodeMatrix, false, geometry.positionsDecompressMatrix);

        this._aModelMatrixCol0.bindArrayBuffer(state.modelMatrixCol0Buf);
        this._aModelMatrixCol1.bindArrayBuffer(state.modelMatrixCol1Buf);
        this._aModelMatrixCol2.bindArrayBuffer(state.modelMatrixCol2Buf);

        gl.vertexAttribDivisor(this._aModelMatrixCol0.location, 1);
        gl.vertexAttribDivisor(this._aModelMatrixCol1.location, 1);
        gl.vertexAttribDivisor(this._aModelMatrixCol2.location, 1);

        this._aPosition.bindArrayBuffer(geometry.positionsBuf);

        this._aColor.bindArrayBuffer(state.colorsBuf);
        gl.vertexAttribDivisor(this._aColor.location, 1);

        this._aFlags.bindArrayBuffer(state.flagsBuf);
        gl.vertexAttribDivisor(this._aFlags.location, 1);

        if (this._aFlags2) {
            this._aFlags2.bindArrayBuffer(state.flags2Buf);
            gl.vertexAttribDivisor(this._aFlags2.location, 1);
        }

        if (this._aOffset) {
            this._aOffset.bindArrayBuffer(state.offsetsBuf);
            gl.vertexAttribDivisor(this._aOffset.location, 1);
        }

        geometry.indicesBuf.bind();

        gl.drawElementsInstanced(gl.LINES, geometry.indicesBuf.numItems, geometry.indicesBuf.itemType, 0, state.numInstances);

        frameCtx.drawElements++;

        gl.vertexAttribDivisor(this._aModelMatrixCol0.location, 0);
        gl.vertexAttribDivisor(this._aModelMatrixCol1.location, 0);
        gl.vertexAttribDivisor(this._aModelMatrixCol2.location, 0);

        gl.vertexAttribDivisor(this._aColor.location, 0);
        gl.vertexAttribDivisor(this._aFlags.location, 0);

        if (this._aFlags2) { // Won't be in shader when not clipping
            gl.vertexAttribDivisor(this._aFlags2.location, 0);
        }

        if (this._aOffset) {
            gl.vertexAttribDivisor(this._aOffset.location, 0);
        }
    }

    _allocate() {

        const view = this.#view;
        const gl = view.viewer.webglSceneRenderer.gl;

        this.#program = new Program(gl, this._buildShader());

        if (this.#program.errors) {
            this.errors = this.#program.errors;
            return;
        }

        const program = this.#program;

        this.#uRenderPass = program.getLocation("renderPass");

        this._uPositionsDecodeMatrix = program.getLocation("positionsDecompressMatrix");

        this._uWorldMatrix = program.getLocation("worldMatrix");

        this._uViewMatrix = program.getLocation("viewMatrix");
        this._uProjMatrix = program.getLocation("projMatrix");

        this._uSectionPlanes = [];

        for (let i = 0, len = view.#sectionPlanesState.sectionPlanes.length; i < len; i++) {
            this._uSectionPlanes.push({
                active: program.getLocation("sectionPlaneActive" + i),
                pos: program.getLocation("sectionPlanePos" + i),
                dir: program.getLocation("sectionPlaneDir" + i)
            });
        }

        this._aPosition = program.getAttribute("position");
        this._aColor = program.getAttribute("color");
        this._aFlags = program.getAttribute("flags");
        this._aFlags2 = program.getAttribute("flags2");
        this._aOffset = program.getAttribute("offset");

        this._aModelMatrixCol0 = program.getAttribute("modelMatrixCol0");
        this._aModelMatrixCol1 = program.getAttribute("modelMatrixCol1");
        this._aModelMatrixCol2 = program.getAttribute("modelMatrixCol2");

        this._uOcclusionTexture = "uOcclusionTexture";

        if (view.logarithmicDepthBufferEnabled) {
            this._uLogDepthBufFC = program.getLocation("logDepthBufFC");
        }
    }

    _bindProgram() {
        const view = this.#view;
        const gl = view.viewer.webglSceneRenderer.gl;
        const project = view.camera.project;
        this.#program.bind();
        gl.uniformMatrix4fv(this._uProjMatrix, false, project.matrix);
        if (view.logarithmicDepthBufferEnabled) {
            const logDepthBufFC = 2.0 / (Math.log(project.far + 1.0) / Math.LN2);
            gl.uniform1f(this._uLogDepthBufFC, logDepthBufFC);
        }
    }

    _buildShader() {
        return {
            vertex: this._buildVertexShader(),
            fragment: this._buildFragmentShader()
        };
    }

    _buildVertexShader() {
        const view = this.#view;
        const sectionPlanesState = view.#sectionPlanesState;
        const clipping = sectionPlanesState.sectionPlanes.length > 0;
        const src = [];
        src.push('#version 300 es');
        src.push("// Lines instancing color vertex shader");
        src.push("uniform int renderPass;");

        src.push("in vec3 position;");
        src.push("in vec4 color;");
        src.push("in vec4 flags;");
        src.push("in vec4 flags2;");

        if (view.entityOffsetsEnabled) {
            src.push("in vec3 offset;");
        }

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
        if (view.entityOffsetsEnabled) {
            src.push("      worldPosition.xyz = worldPosition.xyz + offset;");
        }

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
        return src;
    }

    _buildFragmentShader() {
        const view = this.#view;
        const sectionPlanesState = view.#sectionPlanesState;
        let i;
        let len;
        const clipping = sectionPlanesState.sectionPlanes.length > 0;
        const src = [];
        src.push('#version 300 es');
        src.push("// Lines instancing color fragment shader");
        src.push("#ifdef GL_FRAGMENT_PRECISION_HIGH");
        src.push("precision highp float;");
        src.push("precision highp int;");
        src.push("#else");
        src.push("precision mediump float;");
        src.push("precision mediump int;");
        src.push("#endif");
        if (view.logarithmicDepthBufferEnabled) {
            src.push("uniform float logDepthBufFC;");
            src.push("in float vFragDepth;");
        }
        if (clipping) {
            src.push("in vec4 vWorldPosition;");
            src.push("in vec4 vFlags2;");
            for (i = 0, len = sectionPlanesState.sectionPlanes.length; i < len; i++) {
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
            for (i = 0, len = sectionPlanesState.sectionPlanes.length; i < len; i++) {
                src.push("if (sectionPlaneActive" + i + ") {");
                src.push("   dist += clamp(dot(-sectionPlaneDir" + i + ".xyz, vWorldPosition.xyz - sectionPlanePos" + i + ".xyz), 0.0, 1000.0);");
                src.push("}");
            }
            src.push("if (dist > 0.0) { discard; }");
            src.push("}");
        }

        // Doing SAO blend in the main solid fill draw shader just so that edge lines can be drawn over the top
        // Would be more efficient to defer this, then render lines later, using same depth buffer for Z-reject

        if (this._withSAO) {
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
        if (view.logarithmicDepthBufferEnabled) {
            src.push("gl_FragDepth = log2( vFragDepth ) * logDepthBufFC * 0.5;");
        }
        src.push("}");
        return src;
    }

    webglContextRestored() {
        this.#program = null;
    }

    destroy() {
        if (this.#program) {
            this.#program.destroy();
        }
        this.#program = null;
    }
}

export {LinesInstancingColorRenderer};
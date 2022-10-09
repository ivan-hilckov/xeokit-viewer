import {BasicVBOLayerRenderer} from "../../../../BasicVBOLayerRenderer";
import {View} from "../../../../../../../../view";

export class TrianglesBatchingOcclusionRenderer extends BasicVBOLayerRenderer {

    constructor(view: View) {
        super(view);
    }

    getHash() {
        return this.view.getSectionPlanesHash();
    }

    buildVertexShader(): string {
        const clipping = this.view.sectionPlanesList.length > 0;
        const src = [];
        src.push("#version 300 es");
        src.push("// Triangles batching occlusion vertex shader");
        src.push("uniform int renderPass;");
        src.push("in vec3 position;");
        //if (scene.entityOffsetsEnabled) {
//            src.push("in vec3 offset;");
//        }
        src.push("in vec4 color;");
        src.push("in vec4 flags;");
        src.push("in vec4 flags2;");
        src.push("uniform mat4 worldMatrix;");
        src.push("uniform mat4 viewMatrix;");
        src.push("uniform mat4 projMatrix;");
        src.push("uniform mat4 positionsDecompressMatrix;")
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("uniform float logDepthBufFC;");
            src.push("out float vFragDepth;");
            src.push("bool isPerspectiveMatrix(mat4 m) {");
            src.push("    return (m[2][3] == - 1.0);");
            src.push("}");
            src.push("out float isPerspective;");
        }
        if (clipping) {
            src.push("out vec4 vWorldPosition;");
            src.push("out vec4 vFlags2;");
        }
        src.push("void main(void) {");

        // flags.x = NOT_RENDERED | COLOR_OPAQUE | COLOR_TRANSPARENT
        // renderPass = COLOR_OPAQUE
        // Only opaque objects can be occluders

        src.push(`if (int(flags.x) != renderPass) {`);
        src.push("      gl_Position = vec4(0.0, 0.0, 0.0, 0.0);"); // Cull vertex

        src.push("  } else {");
        src.push("      vec4 worldPosition = worldMatrix * (positionsDecompressMatrix * vec4(position, 1.0)); ");
        // if (scene.entityOffsetsEnabled) {
        //     src.push("      worldPosition.xyz = worldPosition.xyz + offset;");
        // }
        src.push("      vec4 viewPosition  = viewMatrix * worldPosition; ");
        if (clipping) {
            src.push("      vWorldPosition = worldPosition;");
            src.push("      vFlags2 = flags2;");
        }
        src.push("vec4 clipPos = projMatrix * viewPosition;");
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("vFragDepth = 1.0 + clipPos.w;");
            src.push("isPerspective = float (isPerspectiveMatrix(projMatrix));");
        }
        src.push("gl_Position = clipPos;");
        src.push("  }");
        src.push("}");
        return src.join("\n");
    }

    buildFragmentShader(): string {
        const clipping = this.view.sectionPlanesList.length > 0;
        const src = [];
        src.push("#version 300 es");
        src.push("// Triangles batching occlusion fragment shader");
        src.push("#ifdef GL_FRAGMENT_PRECISION_HIGH");
        src.push("precision highp float;");
        src.push("precision highp int;");
        src.push("#else");
        src.push("precision mediump float;");
        src.push("precision mediump int;");
        src.push("#endif");
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("in float isPerspective;");
            src.push("uniform float logDepthBufFC;");
            src.push("in float vFragDepth;");
        }
        if (clipping) {
            src.push("in vec4 vWorldPosition;");
            src.push("in vec4 vFlags2;");
            for (let i = 0; i < this.view.sectionPlanesList.length; i++) {
                src.push("uniform bool sectionPlaneActive" + i + ";");
                src.push("uniform vec3 sectionPlanePos" + i + ";");
                src.push("uniform vec3 sectionPlaneDir" + i + ";");
            }
        }
        src.push("out vec4 outColor;");
        src.push("void main(void) {");
        if (clipping) {
            src.push("  bool clippable = (float(vFlags2.x) > 0.0);");
            src.push("  if (clippable) {");
            src.push("      float dist = 0.0;");
            for (let i = 0; i < this.view.sectionPlanesList.length; i++) {
                src.push("      if (sectionPlaneActive" + i + ") {");
                src.push("          dist += clamp(dot(-sectionPlaneDir" + i + ".xyz, vWorldPosition.xyz - sectionPlanePos" + i + ".xyz), 0.0, 1000.0);");
                src.push("      }");
            }
            src.push("      if (dist > 0.0) { discard; }");
            src.push("  }");
        }
        if (this.view.logarithmicDepthBufferEnabled) {
            src.push("    gl_FragDepth = isPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;");
        }
        src.push("   outColor = vec4(0.0, 0.0, 1.0, 1.0); "); // Occluders are blue
        src.push("}");
        return src.join("\n");
    }

}

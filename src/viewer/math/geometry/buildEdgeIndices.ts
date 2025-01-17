import {DEGTORAD, FloatArrayType, IntArrayType} from "../math";
import {decompressPosition} from "../compression/index";
import {cross3Vec3, dotVec3, normalizeVec3, subVec3, vec3} from "../vector";

const uniquePositions: number[] = [];
const indicesLookup: number[] = [];
const indicesReverseLookup: number[] = [];
const weldedIndices: number[] = [];

// TODO: Optimize with caching, but need to cater to both compressed and uncompressed positions

const faces: { normal: number[]; }[] = [];
let numFaces = 0;
const compa = new Uint16Array(3);
const compb = new Uint16Array(3);
const compc = new Uint16Array(3);
const a = vec3();
const b = vec3();
const c = vec3();
const cb = vec3();
const ab = vec3();
const cross = vec3();
const normal = vec3();

function weldVertices(positions: FloatArrayType, indices: IntArrayType) {
    const positionsMap = {}; // Hashmap for looking up vertices by position coordinates (and making sure they are unique)
    let vx;
    let vy;
    let vz;
    let key;
    const precisionPoints = 4; // number of decimal points, e.g. 4 for epsilon of 0.0001
    const precision = Math.pow(10, precisionPoints);
    let i;
    let len;
    let lenUniquePositions = 0;
    for (i = 0, len = positions.length; i < len; i += 3) {
        vx = positions[i];
        vy = positions[i + 1];
        vz = positions[i + 2];
        key = Math.round(vx * precision) + '_' + Math.round(vy * precision) + '_' + Math.round(vz * precision);
        // @ts-ignore
        if (positionsMap[key] === undefined) {
            // @ts-ignore
            positionsMap[key] = lenUniquePositions / 3;
            uniquePositions[lenUniquePositions++] = vx;
            uniquePositions[lenUniquePositions++] = vy;
            uniquePositions[lenUniquePositions++] = vz;
        }
        // @ts-ignore
        indicesLookup[i / 3] = positionsMap[key];
    }
    for (i = 0, len = indices.length; i < len; i++) {
        weldedIndices[i] = indicesLookup[indices[i]];
        indicesReverseLookup[weldedIndices[i]] = indices[i];
    }
}

function buildFaces(numIndices: number, positionsDecompressMatrix: FloatArrayType) {
    numFaces = 0;
    for (let i = 0, len = numIndices; i < len; i += 3) {
        const ia = ((weldedIndices[i]) * 3);
        const ib = ((weldedIndices[i + 1]) * 3);
        const ic = ((weldedIndices[i + 2]) * 3);
        if (positionsDecompressMatrix) {
            compa[0] = uniquePositions[ia];
            compa[1] = uniquePositions[ia + 1];
            compa[2] = uniquePositions[ia + 2];
            compb[0] = uniquePositions[ib];
            compb[1] = uniquePositions[ib + 1];
            compb[2] = uniquePositions[ib + 2];
            compc[0] = uniquePositions[ic];
            compc[1] = uniquePositions[ic + 1];
            compc[2] = uniquePositions[ic + 2];
            // Decode
            decompressPosition(compa, positionsDecompressMatrix, a);
            decompressPosition(compb, positionsDecompressMatrix, b);
            decompressPosition(compc, positionsDecompressMatrix, c);
        } else {
            a[0] = uniquePositions[ia];
            a[1] = uniquePositions[ia + 1];
            a[2] = uniquePositions[ia + 2];
            b[0] = uniquePositions[ib];
            b[1] = uniquePositions[ib + 1];
            b[2] = uniquePositions[ib + 2];
            c[0] = uniquePositions[ic];
            c[1] = uniquePositions[ic + 1];
            c[2] = uniquePositions[ic + 2];
        }
        subVec3(c, b, cb);
        subVec3(a, b, ab);
        cross3Vec3(cb, ab, cross);
        normalizeVec3(cross, normal);
        // @ts-ignore
        const face = faces[numFaces] || (faces[numFaces] = {normal: vec3()});
        face.normal[0] = normal[0];
        face.normal[1] = normal[1];
        face.normal[2] = normal[2];
        numFaces++;
    }
}


/**
 * Builds edge connectivity indices from a 3D triangle mesh given as vertex positions and triangle indices
 */
export function buildEdgeIndices(
    positions: FloatArrayType,
    indices: IntArrayType,
    positionsDecompressMatrix: FloatArrayType,
    edgeThreshold: number = 10): IntArrayType {

    weldVertices(positions, indices);
    buildFaces(indices.length, positionsDecompressMatrix);

    const edgeIndices = [];
    const thresholdDot = Math.cos(DEGTORAD * edgeThreshold);
    const edges = {};

    let edge1;
    let edge2;
    let index1;
    let index2;
    let key;
    let largeIndex = false;
    let edge;
    let normal1;
    let normal2;
    let dot;
    let ia;
    let ib;

    for (let i = 0, len = indices.length; i < len; i += 3) {
        const faceIndex = i / 3;
        for (let j = 0; j < 3; j++) {
            edge1 = weldedIndices[i + j];
            edge2 = weldedIndices[i + ((j + 1) % 3)];
            index1 = Math.min(edge1, edge2);
            index2 = Math.max(edge1, edge2);
            key = index1 + "," + index2;
            // @ts-ignore
            if (edges[key] === undefined) {
                // @ts-ignore
                edges[key] = {
                    index1: index1,
                    index2: index2,
                    face1: faceIndex,
                    face2: undefined
                };
            } else {
                // @ts-ignore
                edges[key].face2 = faceIndex;
            }
        }
    }

    for (key in edges) {
        // @ts-ignore
        edge = edges[key];
        // an edge is only rendered if the angle (in degrees) between the face normals of the adjoining faces exceeds this value. default = 1 degree.
        if (edge.face2 !== undefined) {
            normal1 = faces[edge.face1].normal;
            normal2 = faces[edge.face2].normal;
            dot = dotVec3(normal1, normal2);
            if (dot > thresholdDot) {
                continue;
            }
        }
        ia = indicesReverseLookup[edge.index1];
        ib = indicesReverseLookup[edge.index2];
        if (!largeIndex && ia > 65535 || ib > 65535) {
            largeIndex = true;
        }
        edgeIndices.push(ia);
        edgeIndices.push(ib);
    }

    return (largeIndex) ? new Uint32Array(edgeIndices) : new Uint16Array(edgeIndices);
}
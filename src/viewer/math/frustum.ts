import {mat4, mulMat4} from "./matrix";
import {vec3} from "./vector";
import {FloatArrayType} from "./math";

const tempVec3a = vec3();
const tempVec3b = vec3();
const tempMat4a = mat4();

/**
 * A plane within a {@link Frustum}.
 */
class FrustumPlane {

    public testVertex: FloatArrayType;
    public offset: number;
    public normal: FloatArrayType;

    /**
     * Creates a new frustum plane.
     */
    constructor() {
        this.normal = vec3();
        this.offset = 0;
        this.testVertex = vec3();
    }

    /**
     * Sets the position and direction of the frustum plane.
     * @param nx
     * @param ny
     * @param nz
     * @param offset
     */
    set(nx: number, ny: number, nz: number, offset: number) {
        const s = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        this.normal[0] = nx * s;
        this.normal[1] = ny * s;
        this.normal[2] = nz * s;
        this.offset = offset * s;
        this.testVertex[0] = (this.normal[0] >= 0.0) ? 1 : 0;
        this.testVertex[1] = (this.normal[1] >= 0.0) ? 1 : 0;
        this.testVertex[2] = (this.normal[2] >= 0.0) ? 1 : 0;
    }
}

/**
 * A frustum defined as six planes.
 */
class Frustum {

    /**
     * The six planes that comprise the frustum boundary.
     */
    public planes: FrustumPlane[];

    /**
     *
     */
    static INSIDE: number = 0;
    static INTERSECT: number = 1;
    static OUTSIDE: number = 2;

    /**
     * Creates a new Frustum
     */
    constructor() {
        this.planes = [
            new FrustumPlane(), new FrustumPlane(), new FrustumPlane(),
            new FrustumPlane(), new FrustumPlane(), new FrustumPlane()
        ];
    }
}

/**
 * Sets the extents of a frustum to the World-space volume defined by view and projection matrices.
 * @param frustum
 * @param viewMat
 * @param projMat
 */
export function setFrustum(frustum:Frustum, viewMat:FloatArrayType, projMat:FloatArrayType) {
    const m = mulMat4(projMat, viewMat, tempMat4a);
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m3 = m[3];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m7 = m[7];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];
    const m11 = m[11];
    const m12 = m[12];
    const m13 = m[13];
    const m14 = m[14];
    const m15 = m[15];
    frustum.planes[0].set(m3 - m0, m7 - m4, m11 - m8, m15 - m12);
    frustum.planes[1].set(m3 + m0, m7 + m4, m11 + m8, m15 + m12);
    frustum.planes[2].set(m3 - m1, m7 - m5, m11 - m9, m15 - m13);
    frustum.planes[3].set(m3 + m1, m7 + m5, m11 + m9, m15 + m13);
    frustum.planes[4].set(m3 - m2, m7 - m6, m11 - m10, m15 - m14);
    frustum.planes[5].set(m3 + m2, m7 + m6, m11 + m10, m15 + m14);
}

/**
 * Tests for intersection between a frustum and an axis-aligned 3D boundary.
 * @param frustum
 * @param aabb
 */
export function frustumIntersectsAABB3(frustum:Frustum, aabb:FloatArrayType):number {
    let ret = Frustum.INSIDE;
    const min = tempVec3a;
    const max = tempVec3b;
    min[0] = aabb[0];
    min[1] = aabb[1];
    min[2] = aabb[2];
    max[0] = aabb[3];
    max[1] = aabb[4];
    max[2] = aabb[5];
    const bminmax = [min, max];
    for (let i = 0; i < 6; ++i) {
        const plane = frustum.planes[i];
        if (((plane.normal[0] * bminmax[plane.testVertex[0]][0]) +
            (plane.normal[1] * bminmax[plane.testVertex[1]][1]) +
            (plane.normal[2] * bminmax[plane.testVertex[2]][2]) +
            (plane.offset)) < 0.0) {
            return Frustum.OUTSIDE;
        }
        if (((plane.normal[0] * bminmax[1 - plane.testVertex[0]][0]) +
            (plane.normal[1] * bminmax[1 - plane.testVertex[1]][1]) +
            (plane.normal[2] * bminmax[1 - plane.testVertex[2]][2]) +
            (plane.offset)) < 0.0) {
            ret = Frustum.INTERSECT;
        }
    }
    return ret;
}

import * as math from "../math/math";

export interface PickParams {
    rayPick?: boolean;
    pickSurface?: boolean;
    pickSurfaceNormal?: boolean;
    excludeEntities?: string[];
    includeEntities?: string[];
    direction?: math.FloatArrayType;
    origin?: math.FloatArrayType;
    matrix?: math.FloatArrayType;
    canvasPos?: math.FloatArrayType;
}
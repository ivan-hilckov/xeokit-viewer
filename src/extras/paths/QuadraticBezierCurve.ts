import {Curve} from "./Curve.js"
import * as math from "../math/index";
import {Component} from "../Component";

/**
 * A **QuadraticBezierCurve** is a {@link Curve} along which a 3D position can be animated.
 *
 * * As shown in the diagram below, a QuadraticBezierCurve is defined by three control points
 * * You can sample a {@link QuadraticBezierCurve#point} and a {@link Curve#tangent} vector on a QuadraticBezierCurve for any given value of {@link QuadraticBezierCurve#t} in the range ````[0..1]````
 * * When you set {@link QuadraticBezierCurve#t} on a QuadraticBezierCurve, its {@link QuadraticBezierCurve#point} and {@link Curve#tangent} will update accordingly.
 * * To build a complex path, you can combine an unlimited combination of QuadraticBezierCurves, {@link CubicBezierCurve}s and {@link SplineCurve}s into a {@link Path}.</li>
 * <br>
 * <img style="border:1px solid;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/B%C3%A9zier_2_big.gif/240px-B%C3%A9zier_2_big.gif"/>
 * <br>
 * *[Quadratic Bezier Curve from WikiPedia](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)*
 */
class QuadraticBezierCurve extends Curve {

    private _v0: number[];
    private _v1: number[];
    private _v2: number[];

    /**
     * @constructor
     * @param owner - Owner component. When destroyed, the owner will destroy this MetallicMaterial as well.
     * @param cfg - Configuration
     * @param cfg.id - Optional ID, unique among all components in the parent {{#crossLink "Scene"}}Scene{{/crossLink}}, generated automatically when omitted.
     * @param cfg.v0 - The starting point.
     * @param cfg.v1 - The middle control point.
     * @param cfg.v2 - The end point.
     * @param cfg.t - Current position on this QuadraticBezierCurve, in range between ````0..1````.
     */
    constructor(owner: Component, cfg: {
        t: number;
        v0: number[];
        v1: number[];
        v2: number[]
    } = {
        t: undefined,
        v0: undefined,
        v1: undefined,
        v2: undefined
    }) {
        super(owner, cfg);
        this.v0 = cfg.v0;
        this.v1 = cfg.v1;
        this.v2 = cfg.v2;
        this.t = cfg.t;
    }

    /**
     * Sets the starting point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @param value New starting point.
     */
    set v0(value) {
        this._v0 = value || math.vec3([0, 0, 0]);
    }

    /**
     * Gets the starting point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @returns {Number[]} The starting point.
     */
    get v0() {
        return this._v0;
    }

    /**
     * Sets the middle control point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @param value New middle control point.
     */
    set v1(value) {
        this._v1 = value || math.vec3([0, 0, 0]);
    }

    /**
     * Gets the middle control point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @returns {Number[]} The middle control point.
     */
    get v1() {
        return this._v1;
    }

    /**
     * Sets the end point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @param value The new end point.
     */
    set v2(value) {
        this._v2 = value || math.vec3([0, 0, 0]);
    }

    /**
     * Gets the end point on this QuadraticBezierCurve.
     *
     * Default value is ````[0.0, 0.0, 0.0]````.
     *
     * @returns {Number[]} The end point.
     */
    get v2() {
        return this._v2;
    }

    /**
     * Sets the progress along this QuadraticBezierCurve.
     *
     * Automatically clamps to range [0..1].
     *
     * Default value is ````0````.
     *
     * @param value The new progress location.
     */
    set t(value) {
        value = value || 0;
        this._t = value < 0.0 ? 0.0 : (value > 1.0 ? 1.0 : value);
    }

    /**
     * Gets the progress along this QuadraticBezierCurve.
     *
     * Default value is ````0````.
     *
     * @returns {Number} The current progress location.
     */
    get t() {
        return this._t;
    }

    /**
     Point on this QuadraticBezierCurve at position {@link QuadraticBezierCurve/t}.

     @property point
     @type {{Number[]}}
     */
    get point() {
        return this.getPoint(this._t);
    }

    /**
     * Returns point on this SplineCurve at the given position.
     *
     * @param t Position to get point at.
     * @param result Point at the given position.
     * @returns {Number[]} Point at the given position.
     */
    getPoint(t: number, result: number[] = math.vec3()): number[] {
        result[0] = math.b2(t, this._v0[0], this._v1[0], this._v2[0]);
        result[1] = math.b2(t, this._v0[1], this._v1[1], this._v2[1]);
        result[2] = math.b2(t, this._v0[2], this._v1[2], this._v2[2]);
        return result;
    }

    getJSON() {
        return {
            v0: this._v0,
            v1: this._v1,
            v2: this._v2,
            t: this._t
        };
    }
}

export {QuadraticBezierCurve}
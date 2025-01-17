import * as math from "../../../../math/index";
import {View} from "../../../View";
import {CameraControl} from "../../CameraControl";

/**
 * @private
 */
class PickController {

    /**
     * Set true to schedule picking of an Entity.
     */
    schedulePickEntity: boolean;

    /**
     * Set true to schedule picking of a position on teh surface of an Entity.
     */
    schedulePickSurface: boolean;

    /**
     * The canvas position at which to do the next scheduled pick.
     */
    pickCursorPos: any;

    /**
     * Will be true after picking to indicate that something was picked.
     */
    picked: boolean;

    /**
     * Will be true after picking to indicate that a position on the surface of an Entity was picked.
     */
    pickedSurface: boolean;

    /**
     * Will hold the PickResult after after picking.
     */
    pickResult: any;
    #view: View;
    #cameraControl: CameraControl;
    #config: any;
    #lastPickedEntityId: any;
    #needFireEvents: boolean;

    constructor(cameraControl: CameraControl, configs: any) {
        this.#view = cameraControl.view;
        this.#cameraControl = cameraControl;
        this.#view.canvas.canvas.oncontextmenu = (e) => {
            e.preventDefault();
        };
        this.#config = configs;
        this.schedulePickEntity = false;
        this.schedulePickSurface = false;
        this.pickCursorPos = math.vec2();
        this.picked = false;
        this.pickedSurface = false;
        this.pickResult = null;
        this.#lastPickedEntityId = null;
        this.#needFireEvents = false;
    }

    /**
     * Immediately attempts a pick, if scheduled.
     */
    update() {

        if (!this.#config.pointerEnabled) {
            return;
        }

        if (!this.schedulePickEntity && !this.schedulePickSurface) {
            return;
        }

        this.picked = false;
        this.pickedSurface = false;
        this.#needFireEvents = false;

        const hasHoverSurfaceSubs = this.#cameraControl.events.hasSubs("hoverSurface");

        if (this.schedulePickSurface) {
            // @ts-ignore
            if (this.pickResult && this.pickResult.worldPos) {
                const pickResultCanvasPos = this.pickResult.canvasPos;
                if (pickResultCanvasPos[0] === this.pickCursorPos[0] && pickResultCanvasPos[1] === this.pickCursorPos[1]) {
                    this.picked = true;
                    this.pickedSurface = true;
                    this.#needFireEvents = hasHoverSurfaceSubs;
                    this.schedulePickEntity = false;
                    this.schedulePickSurface = false;
                    return;
                }
            }
        }

        if (this.schedulePickEntity) {
            if (this.pickResult) {
                const pickResultCanvasPos = this.pickResult.canvasPos;
                if (pickResultCanvasPos[0] === this.pickCursorPos[0] && pickResultCanvasPos[1] === this.pickCursorPos[1]) {
                    this.picked = true;
                    this.pickedSurface = false;
                    this.#needFireEvents = false;
                    this.schedulePickEntity = false;
                    this.schedulePickSurface = false;
                    return;
                }
            }
        }

        if (this.schedulePickSurface) {

            this.pickResult = this.#view.pick({
                pickSurface: true,
                pickSurfaceNormal: false,
                canvasPos: this.pickCursorPos
            });

            if (this.pickResult) {
                this.picked = true;
                this.pickedSurface = true;
                this.#needFireEvents = true;
            }

        } else { // schedulePickEntity == true

            this.pickResult = this.#view.pick({
                canvasPos: this.pickCursorPos
            });

            if (this.pickResult) {
                this.picked = true;
                this.pickedSurface = false;
                this.#needFireEvents = true;
            }
        }

        this.schedulePickEntity = false;
        this.schedulePickSurface = false;
    }

    fireEvents() {

        if (!this.#needFireEvents) {
            return;
        }

        if (this.picked && this.pickResult && this.pickResult.entity) {

            const pickedEntityId = this.pickResult.entity.id;

            if (this.#lastPickedEntityId !== pickedEntityId) {

                if (this.#lastPickedEntityId !== undefined && this.#lastPickedEntityId !== null) {
                    this.#cameraControl.events.fire("hoverOut", {
                        entity: this.#view.viewObjects[this.#lastPickedEntityId]
                    }, true);
                }

                this.#cameraControl.events.fire("hoverEnter", this.pickResult, true);
                this.#lastPickedEntityId = pickedEntityId;
            }

            this.#cameraControl.events.fire("hover", this.pickResult, true);

            if (this.pickResult.worldPos) {
                this.pickedSurface = true;
                this.#cameraControl.events.fire("hoverSurface", this.pickResult, true);
            }

        } else {

            if (this.#lastPickedEntityId !== undefined && this.#lastPickedEntityId !== null) {
                this.#cameraControl.events.fire("hoverOut", {
                    entity: this.#view.viewObjects[this.#lastPickedEntityId]
                }, true);
                this.#lastPickedEntityId = undefined;
            }

            this.#cameraControl.events.fire("hoverOff", {
                canvasPos: this.pickCursorPos
            }, true);
        }

        this.pickResult = null;

        this.#needFireEvents = false;
    }

    destroy() {
    }
}

export {PickController};

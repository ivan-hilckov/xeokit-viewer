import * as math from "../../../../math";
import {View} from "../../../View";


const getCanvasPosFromEvent = function (event:any, canvasPos:any) {
    if (!event) {
        event = window.event;
        canvasPos[0] = event.x;
        canvasPos[1] = event.y;
    } else {
        let element = event.target;
        let totalOffsetLeft = 0;
        let totalOffsetTop = 0;
        while (element.offsetParent) {
            totalOffsetLeft += element.offsetLeft;
            totalOffsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        canvasPos[0] = event.pageX - totalOffsetLeft;
        canvasPos[1] = event.pageY - totalOffsetTop;
    }
    return canvasPos;
};

/**
 * @private
 */
class TouchPanRotateAndDollyHandler {
    #view: View;
    #onTick: any;
    #canvasTouchStartHandler: (event: any) => void;
    #canvasTouchMoveHandler: (event: any) => void;

    constructor(components:any, controllers:any, configs:any, states:any, updates:any) {

        this.#view = components.view;

        const pickController = controllers.pickController;
        const pivotController = controllers.pivotController;

        const tapStartCanvasPos = math.vec2();
        const tapCanvasPos0 = math.vec2();
        const tapCanvasPos1 = math.vec2();
        const touch0Vec = math.vec2();

        const lastCanvasTouchPosList: any[] = [];
        const canvas = this.#view.canvas.canvas;

        let numTouches = 0;
        let tapStartTime = -1;
        let waitForTick = false;

        this.#onTick = this.#view.events.on("tick", () => {
            waitForTick = false;
        });

        canvas.addEventListener("touchstart", this.#canvasTouchStartHandler = (event) => {

            if (!(configs.active && configs.pointerEnabled)) {
                return;
            }

            event.preventDefault();

            const touches = event.touches;
            const changedTouches = event.changedTouches;

            states.touchStartTime = Date.now();

            if (touches.length === 1 && changedTouches.length === 1) {

                tapStartTime = states.touchStartTime;

                getCanvasPosFromEvent(touches[0], tapStartCanvasPos);

                if (configs.followPointer) {

                    pickController.pickCursorPos = tapStartCanvasPos;
                    pickController.schedulePickSurface = true;
                    pickController.update();

                    if (!configs.planView) {

                        if (pickController.picked && pickController.pickedSurface && pickController.pickResult && pickController.pickResult.worldPos) {

                            pivotController.setPivotPos(pickController.pickResult.worldPos);

                            if (!configs.firstPerson && pivotController.startPivot()) {
                                pivotController.showPivot();
                            }

                        } else {

                            if (configs.smartPivot) {
                                pivotController.setCanvasPivotPos(states.pointerCanvasPos);
                            } else {
                                pivotController.setPivotPos(this.#view.camera.look);
                            }

                            if (!configs.firstPerson && pivotController.startPivot()) {
                                pivotController.showPivot();
                            }
                        }
                    }
                }

            } else {
                tapStartTime = -1;
            }

            while (lastCanvasTouchPosList.length < touches.length) {
                lastCanvasTouchPosList.push(math.vec2());
            }

            for (let i = 0, len = touches.length; i < len; ++i) {
                getCanvasPosFromEvent(touches[i], lastCanvasTouchPosList[i]);
            }

            numTouches = touches.length;
        });

        canvas.addEventListener("touchmove", this.#canvasTouchMoveHandler = (event) => {

            if (!(configs.active && configs.pointerEnabled)) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();

            if (waitForTick) {
                // Limit changes detection to one per frame
                return;
            }

            waitForTick = true;

            // Scaling drag-rotate to canvas boundary

            const canvasBoundary = this.#view.canvas.boundary;
            const canvasWidth = canvasBoundary[0];
            const canvasHeight = canvasBoundary[1];

            const touches = event.touches;

            if (event.touches.length !== numTouches) {
                // Two fingers were pressed, then one of them is removed
                // We don't want to rotate in this case (weird behavior)
                return;
            }

            if (numTouches === 1) {

                getCanvasPosFromEvent(touches[0], tapCanvasPos0);

                //-----------------------------------------------------------------------------------------------
                // Drag rotation
                //-----------------------------------------------------------------------------------------------

                math.subVec2(tapCanvasPos0, lastCanvasTouchPosList[0], touch0Vec);

                const xPanDelta = touch0Vec[0];
                const yPanDelta = touch0Vec[1];

                if (states.longTouchTimeout !== null && (Math.abs(xPanDelta) > configs.longTapRadius || Math.abs(yPanDelta) > configs.longTapRadius)) {
                    clearTimeout(states.longTouchTimeout);
                    states.longTouchTimeout = null;
                }

                if (configs.planView) { // No rotating in plan-view mode

                    const camera = this.#view.camera;

                    // We use only canvasHeight here so that aspect ratio does not distort speed

                    if (camera.projection === "perspective") {

                        const touchPicked = false;
                        const pickedWorldPos = [0, 0, 0];

                        const depth = Math.abs(touchPicked ? math.lenVec3(math.subVec3(pickedWorldPos, this.#view.camera.eye, [])) : this.#view.camera.eyeLookDist);
                        const targetDistance = depth * Math.tan((camera.perspective.fov / 2) * Math.PI / 180.0);

                        updates.panDeltaX += (xPanDelta * targetDistance / canvasHeight) * configs.touchPanRate;
                        updates.panDeltaY += (yPanDelta * targetDistance / canvasHeight) * configs.touchPanRate;

                    } else {

                        updates.panDeltaX += 0.5 * camera.ortho.scale * (xPanDelta / canvasHeight) * configs.touchPanRate;
                        updates.panDeltaY += 0.5 * camera.ortho.scale * (yPanDelta / canvasHeight) * configs.touchPanRate;
                    }

                } else {
                    updates.rotateDeltaY -= (xPanDelta / canvasWidth) * (configs.dragRotationRate * 1.0); // Full horizontal rotation
                    updates.rotateDeltaX += (yPanDelta / canvasHeight) * (configs.dragRotationRate * 1.5); // Half vertical rotation
                }

            } else if (numTouches === 2) {

                const touch0 = touches[0];
                const touch1 = touches[1];

                getCanvasPosFromEvent(touch0, tapCanvasPos0);
                getCanvasPosFromEvent(touch1, tapCanvasPos1);

                const lastMiddleTouch = math.geometricMeanVec2(lastCanvasTouchPosList[0], lastCanvasTouchPosList[1]);
                const currentMiddleTouch = math.geometricMeanVec2(tapCanvasPos0, tapCanvasPos1);

                const touchDelta = math.vec2();

                math.subVec2(lastMiddleTouch, currentMiddleTouch, touchDelta);

                const xPanDelta = touchDelta[0];
                const yPanDelta = touchDelta[1];

                const camera = this.#view.camera;

                // Dollying

                const d1 = math.distVec2([touch0.pageX, touch0.pageY], [touch1.pageX, touch1.pageY]);
                const d2 = math.distVec2(lastCanvasTouchPosList[0], lastCanvasTouchPosList[1]);

                const dollyDelta = (d2 - d1) * configs.touchDollyRate;

                updates.dollyDelta = dollyDelta;

                if (Math.abs(dollyDelta) < 1.0) {

                    // We use only canvasHeight here so that aspect ratio does not distort speed

                    if (camera.projection === "perspective") {
                        const pickedWorldPos = pickController.pickResult ? pickController.pickResult.worldPos : this.#view.viewer.scene.center;

                        const depth = Math.abs(math.lenVec3(math.subVec3(pickedWorldPos, this.#view.camera.eye, [])));
                        const targetDistance = depth * Math.tan((camera.perspective.fov / 2) * Math.PI / 180.0);

                        updates.panDeltaX -= (xPanDelta * targetDistance / canvasHeight) * configs.touchPanRate;
                        updates.panDeltaY -= (yPanDelta * targetDistance / canvasHeight) * configs.touchPanRate;

                    } else {

                        updates.panDeltaX -= 0.5 * camera.ortho.scale * (xPanDelta / canvasHeight) * configs.touchPanRate;
                        updates.panDeltaY -= 0.5 * camera.ortho.scale * (yPanDelta / canvasHeight) * configs.touchPanRate;
                    }
                }


                states.pointerCanvasPos = currentMiddleTouch;
            }

            for (let i = 0; i < numTouches; ++i) {
                getCanvasPosFromEvent(touches[i], lastCanvasTouchPosList[i]);
            }
        });
    }

    reset() {
    }

    destroy() {
        const canvas = this.#view.canvas.canvas;
        canvas.removeEventListener("touchstart", this.#canvasTouchStartHandler);
        canvas.removeEventListener("touchmove", this.#canvasTouchMoveHandler);
        this.#view.events.off(this.#onTick);
    }
}

export {TouchPanRotateAndDollyHandler};

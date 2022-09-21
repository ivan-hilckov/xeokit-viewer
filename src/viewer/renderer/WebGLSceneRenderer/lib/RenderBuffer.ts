import {Canvas2Image} from "./canvas2image";
import {Texture} from "./Texture";

/**
 * @private
 */
export class RenderBuffer {

    #canvas: HTMLCanvasElement;
    #gl: WebGL2RenderingContext;
    #allocated: boolean;
    #buffer: any;
    #bound: boolean;
    #size: number[];
    #hasDepthTexture: boolean;
    #imageDataCache: any;
    #texture: Texture;
    #depthTexture: Texture;

    constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, options: {
        depthTexture: boolean;
        size?: number[];
    }) {
        this.#canvas = canvas;
        this.#gl = gl;
        this.#allocated = false;
        this.#buffer = null;
        this.#bound = false;
        this.#size = options.size;
        this.#hasDepthTexture = !!options.depthTexture;
    }

    setSize(size: number[]) {
        this.#size = size;
    }

    bind() {
        this.#touch();
        if (this.#bound) {
            return;
        }
        const gl = this.#gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#buffer.framebuf);
        this.#bound = true;
    }

    #touch() {
        let width;
        let height;
        const gl = this.#gl;
        if (this.#size) {
            width = this.#size[0];
            height = this.#size[1];
        } else {
            width = gl.drawingBufferWidth;
            height = gl.drawingBufferHeight;
        }
        if (this.#buffer) {
            if (this.#buffer.width === width && this.#buffer.height === height) {
                return;
            } else {
                gl.deleteTexture(this.#buffer.texture);
                gl.deleteFramebuffer(this.#buffer.framebuf);
                gl.deleteRenderbuffer(this.#buffer.renderbuf);
            }
        }
        const colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        let depthTexture;
        if (this.#hasDepthTexture) {
            depthTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, depthTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null)
        }
        const renderbuf = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuf);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        const framebuf = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuf);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        if (this.#hasDepthTexture) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        } else {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuf);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Verify framebuffer is OK
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuf);
        if (!gl.isFramebuffer(framebuf)) {
            throw "Invalid framebuffer";
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw "Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw "Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED";
            default:
                throw "Incomplete framebuffer: " + status;
        }
        this.#buffer = {
            framebuf: framebuf,
            renderbuf: renderbuf,
            texture: colorTexture,
            depthTexture: depthTexture,
            width: width,
            height: height
        };
        this.#bound = false;
    }

    clear() {
        if (!this.#bound) {
            throw "Render buffer not bound";
        }
        const gl = this.#gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    read(pickX: number, pickY: number): Uint8Array {
        const x = pickX;
        const y = this.#gl.drawingBufferHeight - pickY;
        const pix = new Uint8Array(4);
        const gl = this.#gl;
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pix);
        return pix;
    }

    readImage(params: {
        height?: number;
        width?: number;
        format?: string;
    }): Uint8Array {
        const gl = this.#gl;
        const imageDataCache = this.#getImageDataCache();
        const pixelData = imageDataCache.pixelData;
        const canvas = imageDataCache.canvas;
        const imageData = imageDataCache.imageData;
        const context = imageDataCache.context;
        gl.readPixels(0, 0, this.#buffer.width, this.#buffer.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
        imageData.data.set(pixelData);
        context.putImageData(imageData, 0, 0);
        const imageWidth = params.width || canvas.width;
        const imageHeight = params.height || canvas.height;
        const format = params.format || "jpeg";
        const flipy = true; // Account for WebGL texture flipping
        let image;
        switch (format) {
            case "jpeg":
                image = Canvas2Image.saveAsJPEG(canvas, true, imageWidth, imageHeight, flipy);
                break;
            case "png":
                image = Canvas2Image.saveAsPNG(canvas, true, imageWidth, imageHeight, flipy);
                break;
            case "bmp":
                image = Canvas2Image.saveAsBMP(canvas, true, imageWidth, imageHeight, flipy);
                break;
            default:
                console.error("Unsupported image format: '" + format + "' - supported types are 'jpeg', 'bmp' and 'png' - defaulting to 'jpeg'");
                image = Canvas2Image.saveAsJPEG(canvas, true, imageWidth, imageHeight, flipy);
        }
        // @ts-ignore
        return image.src;
    }

    #getImageDataCache() {
        const bufferWidth = this.#buffer.width;
        const bufferHeight = this.#buffer.height;
        let imageDataCache = this.#imageDataCache;
        if (imageDataCache) {
            if (imageDataCache.width !== bufferWidth || imageDataCache.height !== bufferHeight) {
                this.#imageDataCache = null;
                imageDataCache = null;
            }
        }
        if (!imageDataCache) {
            const canvas = document.createElement('canvas');
            canvas.width = bufferWidth;
            canvas.height = bufferHeight;
            const context = canvas.getContext('2d');
            const imageData = context.createImageData(bufferWidth, bufferHeight);
            imageDataCache = {
                pixelData: new Uint8Array(bufferWidth * bufferHeight * 4),
                canvas: canvas,
                context: context,
                imageData: imageData,
                width: bufferWidth,
                height: bufferHeight
            };
            this.#imageDataCache = imageDataCache;
        }
        return imageDataCache;
    }

    unbind() {
        const gl = this.#gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.#bound = false;
    }

    getTexture(): Texture {
        return this.#texture || (this.#texture = {
            bind: (unit: number) => {
                if (this.#buffer && this.#buffer.texture) {
                    // @ts-ignore
                    this.#gl.activeTexture(this.#gl["TEXTURE" + unit]);
                    this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#buffer.texture);
                    return true;
                }
                return false;
            },
            unbind: (unit: number) => {
                if (this.#buffer && this.#buffer.texture) {
                    // @ts-ignore
                    this.#gl.activeTexture(this.#gl["TEXTURE" + unit]);
                    this.#gl.bindTexture(this.#gl.TEXTURE_2D, null);
                }
            }
        });
    }

    hasDepthTexture() {
        return this.#hasDepthTexture;
    }

    getDepthTexture(): Texture {
        if (!this.#hasDepthTexture) {
            return null;
        }
        return this.#depthTexture || (this.#depthTexture = {
            bind: (unit: number) => {
                if (this.#buffer && this.#buffer.depthTexture) {
                    // @ts-ignore
                    this.#gl.activeTexture(this.#gl["TEXTURE" + unit]);
                    this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#buffer.depthTexture);
                    return true;
                }
                return false;
            },
            unbind: (unit: number) => {
                if (this.#buffer && this.#buffer.depthTexture) {
                    // @ts-ignore
                    this.#gl.activeTexture(this.#gl["TEXTURE" + unit]);
                    this.#gl.bindTexture(this.#gl.TEXTURE_2D, null);
                }
            }
        });
    }

    destroy() {
        if (this.#allocated) {
            const gl = this.#gl;
            gl.deleteTexture(this.#buffer.texture);
            gl.deleteTexture(this.#buffer.depthTexture);
            gl.deleteFramebuffer(this.#buffer.framebuf);
            gl.deleteRenderbuffer(this.#buffer.renderbuf);
            this.#allocated = false;
            this.#buffer = null;
            this.#bound = false;
        }
        this.#imageDataCache = null;
        this.#texture = null;
        this.#depthTexture = null;
    }
}


import {Cache} from './Cache.js';
import {Loader} from './Loader.js';
import {LoadingManager} from "./LoadingManager";

const loading : {[key:string]:any} = {};

class FileLoader extends Loader {

    mimeType: string;
    responseType: string;

    constructor(manager?: LoadingManager) {
        super(manager);
    }

    load(url:string, onLoad:Function, onProgress:Function, onError:Function) {
        if (url === undefined) {
            url = '';
        }
        if (this.path !== undefined) {
            url = this.path + url;
        }
        url = this.manager.resolveURL(url);
        const cached = Cache.get(url);
        if (cached !== undefined) {
            this.manager.itemStart(url);
            setTimeout(() => {
                if (onLoad) {
                    onLoad(cached);
                }
                this.manager.itemEnd(url);
            }, 0);
            return cached;
        }
        if (loading[url] !== undefined) {
            loading[url].push({onLoad, onProgress, onError});
            return;
        }
        loading[url] = [];
        loading[url].push({onLoad, onProgress, onError});
        const req = new Request(url, {
            headers: new Headers(this.requestHeader),
            credentials: this.withCredentials ? 'include' : 'same-origin'
        });
        const mimeType = this.mimeType;
        const responseType = this.responseType;
        fetch(req).then(response => {
            if (response.status === 200 || response.status === 0) {
                // Some browsers return HTTP Status 0 when using non-http protocol
                // e.g. 'file://' or 'data://'. Handle as success.
                if (response.status === 0) {
                    console.warn('FileLoader: HTTP Status 0 received.');
                }
                if (typeof ReadableStream === 'undefined' || response.body.getReader === undefined) {
                    return response;
                }
                const callbacks = loading[url];
                const reader = response.body.getReader();
                const contentLength = response.headers.get('Content-Length');
                const total = contentLength ? parseInt(contentLength) : 0;
                const lengthComputable = total !== 0;
                let loaded = 0;
                const stream = new ReadableStream({
                    start(controller) {
                        readData();

                        function readData() {
                            reader.read().then(({done, value}) => {
                                if (done) {
                                    controller.close();
                                } else {
                                    loaded += value.byteLength;
                                    const event = new ProgressEvent('progress', {lengthComputable, loaded, total});
                                    for (let i = 0, il = callbacks.length; i < il; i++) {
                                        const callback = callbacks[i];
                                        if (callback.onProgress) {
                                            callback.onProgress(event);
                                        }
                                    }
                                    controller.enqueue(value);
                                    readData();
                                }
                            });
                        }
                    }
                });
                return new Response(stream);
            } else {
                throw Error(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`);
            }
        }).then(response => {
            switch (responseType) {
                case 'arraybuffer':
                    return response.arrayBuffer();
                case 'blob':
                    return response.blob();
                case 'document':
                    return response.text()
                        .then(text => {
                            const parser = new DOMParser();
                            // @ts-ignore
                            return parser.parseFromString(text, mimeType);
                        });
                case 'json':
                    return response.json();
                default:
                    if (mimeType === undefined) {
                        return response.text();
                    } else {
                        // sniff encoding
                        const re = /charset="?([^;"\s]*)"?/i;
                        const exec = re.exec(mimeType);
                        const label = exec && exec[1] ? exec[1].toLowerCase() : undefined;
                        const decoder = new TextDecoder(label);
                        return response.arrayBuffer().then(ab => decoder.decode(ab));
                    }
            }
        }).then(data => {
            // Add to cache only on HTTP success, so that we do not cache
            // error response bodies as proper responses to requests.
            Cache.add(url, data);
            const callbacks = loading[url];
            delete loading[url];
            for (let i = 0, il = callbacks.length; i < il; i++) {
                const callback = callbacks[i];
                if (callback.onLoad) {
                    callback.onLoad(data);
                }
            }
        }).catch(err => {
            // Abort errors and other errors are handled the same
            const callbacks = loading[url];
            if (callbacks === undefined) {
                // When onLoad was called and url was deleted in `loading`
                this.manager.itemError(url);
                throw err;

            }
            delete loading[url];
            for (let i = 0, il = callbacks.length; i < il; i++) {
                const callback = callbacks[i];
                if (callback.onError) {
                    callback.onError(err);
                }
            }
            this.manager.itemError(url);
        }).finally(() => {
            this.manager.itemEnd(url);
        });
        this.manager.itemStart(url);
    }

    setResponseType(value: string) {
        this.responseType = value;
        return this;
    }

    setMimeType(value: string) {
        this.mimeType = value;
        return this;
    }
}


export {FileLoader};

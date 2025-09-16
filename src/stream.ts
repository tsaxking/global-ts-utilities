import { EventEmitter } from './event-emitter';
import { attemptAsync } from './check';

type Events<T = unknown> = {
    data: T;
    error: Error;
    end: void;
}

export class Stream<T = unknown> {
    private readonly emitter = new EventEmitter<Events<T>>();

    public on = this.emitter.on.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);
    private emit = this.emitter.emit.bind(this.emitter);

    public add(data: T) {
        this.index++;
        this.emit('data', data);
    }

    public end() {
        this.emit('end', undefined);
        this.emitter.destroyEvents();
    }

    public error(error: Error) {
        this.emit('error', error);
        this.emitter.destroyEvents();
    }

    private index = 0;

    public pipe(stream: Stream<T> | ((data: T, index: number) => unknown), timeout?: number) {
        return new Promise<void>((res, rej) => {
            let ended = false;
            let errored = false;
            const handlerPromises: Promise<unknown>[] = [];
            let timeoutId: ReturnType<typeof setTimeout> | undefined;

            const cleanup = () => {
                this.off('data', onData);
                this.off('end', onEnd);
                this.off('error', onError);
                if (timeoutId) clearTimeout(timeoutId);
            };

            const onEnd = () => {
                ended = true;
                cleanup();
                Promise.allSettled(handlerPromises).then(() => {
                    if (stream instanceof Stream) {
                        stream.end();
                    }
                    res();
                });
            };

            const onError = (e: Error) => {
                errored = true;
                cleanup();
                Promise.allSettled(handlerPromises).then(() => {
                    if (stream instanceof Stream) {
                        stream.error(e);
                    }
                    rej(e);
                });
            };

            const onData = (data: T) => {
                if (stream instanceof Stream) {
                    stream.add(data);
                } else {
                    try {
                        const result = stream(data, this.index);
                        if (result instanceof Promise) {
                            handlerPromises.push(result.catch(() => {}));
                        }
                    } catch (err) {
                        onError(err instanceof Error ? err : new Error(String(err)));
                    }
                }
            };

            this.on('data', onData);
            this.once('end', onEnd);
            this.once('error', onError);

            if (timeout) {
                timeoutId = setTimeout(() => {
                    if (!ended && !errored) {
                        const err = new Error('Stream Timeout');
                        onError(err);
                    }
                }, timeout);
            }
        });
    }

    public await(timeout = 0) {
        return attemptAsync(async () => new Promise<T[]>((res, rej) => {
            const data: T[] = [];
            let resolved = false;
            const resolve = (error?: Error) => {
                if (resolved) return;
                resolved = true;
                if (error) return rej(error);
                res(data);
            }

            this.on('data', (d) => data.push(d));
            this.on('end', () => resolve());
            this.on('error', resolve);

            if (timeout) {
                setTimeout(() => resolve(new Error('Stream Timeout')), timeout);
            }
        }));
    }
}
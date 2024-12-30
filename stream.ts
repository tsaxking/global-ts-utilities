import { EventEmitter } from './event-emitter';
import { attemptAsync } from './check';

type Events<T = unknown> = {
    data: T;
    error: Error;
    end: void;
}

export class Streamer<T = unknown> {
    private readonly emitter = new EventEmitter<Events<T>>();

    public on = this.emitter.on.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);
    private emit = this.emitter.emit.bind(this.emitter);

    public add(data: T) {
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

    public pipe(stream: Streamer<T> | ((data: T) => void)) {
        this.on('data', (data) => {
            if (stream instanceof Streamer) {
                stream.add(data);
            } else {
                stream(data);
            }
        });
        this.on('end', () => {
            if (stream instanceof Streamer) {
                stream.end();
            }
        });
        this.on('error', (error) => {
            if (stream instanceof Streamer) {
                stream.error(error);
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
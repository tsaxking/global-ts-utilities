import { EventEmitter } from './event-emitter';
import { sleep } from './sleep';

type LoopEvents = {
    stop: undefined;
    start: undefined;
};

export class Loop<
    Events extends Record<string, unknown> = Record<string, unknown>
> {
    private readonly em = new EventEmitter<LoopEvents & Omit<Events, 'stop' | 'start'>>();

    public readonly on = this.em.on.bind(this.em);
    public readonly once = this.em.once.bind(this.em);
    public readonly off = this.em.off.bind(this.em);
    public readonly emit = this.em.emit.bind(this.em);

    private _running = false;

    public async stop() {
        if (!this._running) return;
        this._running = false;
        this.emit('stop', undefined as any);
        await sleep(0); // Ensures the loop exits cleanly before restarting
    }

    get active() {
        return this._running;
    }

    constructor(
        public readonly fn: (tick: number) => void | Promise<void>,
        public interval: number
    ) {
    }

    public async start() {
        if (this._running) {
            await this.stop();
        }

        this._running = true;
        this.emit('start', undefined as any);

        const globalStart = Date.now();
        let i = 0;

        while (this._running) {
            await this.fn(i);
            i++;
            await sleep(
                this.interval - ((Date.now() - globalStart) % this.interval)
            );
        }
    }
}

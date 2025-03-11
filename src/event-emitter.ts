type Listener<T = unknown> = (data: T) => void;

class EM {
    public readonly events = new Map<string, Listener<unknown>[]>();

    destroyEvents() {
        this.events.clear();
    }
}

export class SimpleEventEmitter<E extends string> extends EM {
    constructor() {
        super();
    }

    on(event: E, listener: (...data: unknown[]) => void) {
        const listeners = this.events.get(event) || [];
        listeners.push(listener);
        this.events.set(event, listeners);
        return () => this.off(event, listener);
    }

    off(event: E, listener?: (...data: unknown[]) => void) {
        if (!listener) {
            this.events.delete(event);
            return;
        }
        const listeners = this.events.get(event) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        return false;
    }

    emit(event: E, ...data: unknown[]) {
        const listeners = this.events.get(event) || [];
        listeners.forEach(listener => listener(data));
        return listeners.length;
    }

    once(event: E, listener: (...data: unknown[]) => void) {
        const onceListener = (...data: unknown[]) => {
            listener(...data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
        return () => this.off(event, onceListener);
    }
}

export class EventEmitter<E extends Record<string, unknown>> extends EM {
    constructor() {
        super();
    }

    on<K extends keyof E>(event: K, listener: Listener<E[K]>) {
        const listeners = this.events.get(event as string) || [];
        listeners.push(listener as Listener<unknown>);
        this.events.set(event as string, listeners);

        return () => this.off(event, listener);
    }

    off<K extends keyof E>(event: K, listener?: Listener<E[K]>) {
        if (!listener) {
            this.events.delete(event as string);
            return;
        }
        const listeners = this.events.get(event as string) || [];
        const index = listeners.indexOf(listener as Listener<unknown>);
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        return false;
    }

    emit<K extends keyof E>(event: K, data: E[K]) {
        const listeners = this.events.get(event as string) || [];
        listeners.forEach(listener => listener(data));
        return listeners.length;
    }

    once<K extends keyof E>(event: K, listener: (data: E[K]) => void) {
        const onceListener = (data: E[K]) => {
            listener(data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);

        return () => this.off(event, onceListener);
    }
}

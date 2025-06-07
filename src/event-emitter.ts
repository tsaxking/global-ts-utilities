type Listener<T> =
    T extends any[] ? (...args: T) => void :
    T extends void ? () => void :
    (arg: T) => void;

export class EventEmitter<E extends Record<string, unknown>> {
    private events = new Map<string, Function[]>();

    on<K extends keyof E>(event: K, listener: Listener<E[K]>) {
        const listeners = this.events.get(event as string) || [];
        listeners.push(listener);
        this.events.set(event as string, listeners);
        return () => this.off(event, listener);
    }

    off<K extends keyof E>(event: K, listener?: Listener<E[K]>) {
        if (!listener) {
            this.events.delete(event as string);
            return;
        }
        const listeners = this.events.get(event as string) || [];
        const index = listeners.indexOf(listener as Function);
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        return false;
    }

    emit<K extends keyof E>(
        event: K,
        ...args: E[K] extends any[] ? E[K] :
                E[K] extends void ? [] :
                [E[K]]
    ) {
        const listeners = this.events.get(event as string) || [];
        for (const listener of listeners) {
            try {
                (listener as any)(...args);
            } catch (error) {
                console.error(error);
            }
        }
        return listeners.length;
    }
    once<K extends keyof E>(event: K, listener: Listener<E[K]>) {
        const onceListener = (...args: unknown[]) => {
            (listener as Function).apply(null, args);
            this.off(event, onceListener as Listener<E[K]>);
        };
        this.on(event, onceListener as Listener<E[K]>);
        return () => this.off(event, onceListener as Listener<E[K]>);
    }
}
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
        listeners.forEach(listener => {
            try {
                (listener as Function)(...data);
            } catch (error) {
                console.error(error);
            }
        });
        return listeners.length;
    }

    once(event: E, listener: (...data: unknown[]) => void) {
        const onceListener = (...data: unknown[]) => {
            (listener as Function).apply(null, data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
        return () => this.off(event, onceListener);
    }
}

// export class EventEmitter<E extends Record<string, unknown>> extends EM {
//     constructor() {
//         super();
//     }

//     on<K extends keyof E>(event: K, listener: Listener<E[K]>) {
//         const listeners = this.events.get(event as string) || [];
//         listeners.push(listener as Listener<unknown>);
//         this.events.set(event as string, listeners);

//         return () => this.off(event, listener);
//     }

//     off<K extends keyof E>(event: K, listener?: Listener<E[K]>) {
//         if (!listener) {
//             this.events.delete(event as string);
//             return;
//         }
//         const listeners = this.events.get(event as string) || [];
//         const index = listeners.indexOf(listener as Listener<unknown>);
//         if (index !== -1) {
//             listeners.splice(index, 1);
//             return true;
//         }
//         return false;
//     }

//     emit<K extends keyof E>(event: K, data: E[K]) {
//         const listeners = this.events.get(event as string) || [];
//         listeners.forEach(listener => {
//             try {
//                 listener(data);
//             } catch (error) {
//                 console.error(error);
//             }
//         });
//         return listeners.length;
//     }

//     once<K extends keyof E>(event: K, listener: (data: E[K]) => void) {
//         const onceListener = (data: E[K]) => {
//             listener(data);
//             this.off(event, onceListener);
//         };
//         this.on(event, onceListener);

//         return () => this.off(event, onceListener);
//     }
// }

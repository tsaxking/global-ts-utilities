type Listener<T = unknown> = (data: T) => void;

/**
 * Base Event Manager class.
 * Handles one-time "listen" hooks triggered when the first listener is added for an event.
 * Subclasses manage actual event listener storage and trigger these hooks appropriately.
 */
class EM<Events extends string> {
  private readonly onceListenListeners = new Map<string, Listener<void>[]>();

  /**
   * Clears all registered onceListen hooks.
   */
  destroyEvents() {
    this.onceListenListeners.clear();
  }

  /**
   * Triggers all onceListen hooks for a given event and removes them.
   * Intended to be called by subclasses when the first listener for an event is added.
   * @param event - The event name
   */
  protected triggerOnceListen(event: Events) {
    const listenHooks = this.onceListenListeners.get(event) || [];
    for (const hook of listenHooks) {
      try {
        hook();
      } catch (error) {
        console.error(error);
      }
    }
    this.onceListenListeners.delete(event);
  }

  /**
   * Registers a one-time hook called when the first listener is added to the specified event.
   * @param event - The event name to watch for
   * @param listener - The zero-argument callback to invoke
   */
  onceListen<E extends Events>(event: E, listener: Listener<void>) {
    const listeners = this.onceListenListeners.get(event) || [];
    listeners.push(listener);
    this.onceListenListeners.set(event, listeners);
  }
}

/**
 * Simple event emitter with string events and unknown data payload.
 */
export class SimpleEventEmitter<E extends string> extends EM<E> {
  public readonly events = new Map<string, Listener<unknown>[]>();

  /**
   * Clears all events and onceListen hooks.
   */
  destroyEvents() {
    super.destroyEvents();
    this.events.clear();
  }

  /**
   * Registers a listener for the specified event.
   * If this is the first listener for the event, triggers any onceListen hooks.
   * @param event - Event name
   * @param listener - Callback receiving the event data
   * @returns Function to unregister the listener
   */
  on(event: E, listener: (data: unknown) => void) {
    const listeners = this.events.get(event) || [];
    const isFirstListener = listeners.length === 0;

    listeners.push(listener);
    this.events.set(event, listeners);

    if (isFirstListener) {
      this.triggerOnceListen(event);
    }

    return () => this.off(event, listener);
  }

  /**
   * Unregisters a listener from an event, or removes all listeners if none specified.
   * @param event - Event name
   * @param listener - Specific listener to remove (optional)
   * @returns True if a listener was removed, false otherwise
   */
  off(event: E, listener?: (data: unknown) => void) {
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

  /**
   * Emits an event to all registered listeners.
   * @param event - Event name
   * @param data - Event data
   * @returns Number of listeners invoked
   */
  emit(event: E, data: unknown) {
    const listeners = this.events.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(error);
      }
    }
    return listeners.length;
  }

  /**
   * Registers a listener to be called only once when the event is emitted.
   * @param event - Event name
   * @param listener - Callback receiving the event data
   * @returns Function to unregister the once listener
   */
  once(event: E, listener: (data: unknown) => void) {
    const onceListener = (data: unknown) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
    return () => this.off(event, onceListener);
  }
}

/**
 * Typed event emitter with strongly typed events and payloads.
 */
export class EventEmitter<E extends Record<string, unknown>> extends EM<Extract<keyof E, string>> {
  public readonly events = new Map<string, Listener<unknown>[]>();

  /**
   * Clears all events and onceListen hooks.
   */
  destroyEvents() {
    super.destroyEvents();
    this.events.clear();
  }

  /**
   * Registers a listener for the specified typed event.
   * If this is the first listener for the event, triggers any onceListen hooks.
   * @param event - Typed event name
   * @param listener - Callback receiving the typed event data
   * @returns Function to unregister the listener
   */
  on<K extends Extract<keyof E, string>>(event: K, listener: Listener<E[K]>) {
    const listeners = this.events.get(event as string) || [];
    const isFirstListener = listeners.length === 0;

    listeners.push(listener as Listener<unknown>);
    this.events.set(event as string, listeners);

    if (isFirstListener) {
      this.triggerOnceListen(event);
    }

    return () => this.off(event, listener);
  }

  /**
   * Unregisters a listener from a typed event, or removes all listeners if none specified.
   * @param event - Typed event name
   * @param listener - Specific listener to remove (optional)
   * @returns True if a listener was removed, false otherwise
   */
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

  /**
   * Emits a typed event to all registered listeners.
   * @param event - Typed event name
   * @param data - Typed event data
   * @returns Number of listeners invoked
   */
  emit<K extends keyof E>(event: K, data: E[K]) {
    const listeners = this.events.get(event as string) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(error);
      }
    }
    return listeners.length;
  }

  /**
   * Registers a listener to be called only once when the typed event is emitted.
   * @param event - Typed event name
   * @param listener - Callback receiving the typed event data
   * @returns Function to unregister the once listener
   */
  once<K extends Extract<keyof E, string>>(event: K, listener: (data: E[K]) => void) {
    const onceListener = (data: E[K]) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
    return () => this.off(event, onceListener);
  }
}

/**
 * Listener type for complex event emitter: 
 * supports either multiple arguments or no arguments depending on event type.
 */
type ComplexListener<T> =
  T extends any[] ? (...args: T) => void :
  T extends void ? () => void :
  never;

/**
 * Complex event emitter supporting events with multiple or zero arguments.
 * Event payload types are inferred and enforced via generics.
 */
export class ComplexEventEmitter<E extends Record<string, void | any[]>> extends EM<Extract<keyof E, string>> {
  private _events = new Map<string, ComplexListener<any>[]>( );

  /**
   * Clears all events and onceListen hooks.
   */
  destroyEvents() {
    super.destroyEvents();
    this._events.clear();
  }

  /**
   * Registers a listener for the specified event.
   * If this is the first listener for the event, triggers any onceListen hooks.
   * @param event - Event name
   * @param listener - Callback receiving the event arguments
   * @returns Function to unregister the listener
   */
  on<K extends Extract<keyof E, string>>(event: K, listener: ComplexListener<E[K]>) {
    const listeners = this._events.get(event as string) || [];
    const isFirstListener = listeners.length === 0;

    listeners.push(listener);
    this._events.set(event as string, listeners);

    if (isFirstListener) {
      this.triggerOnceListen(event);
    }

    return () => this.off(event, listener);
  }

  /**
   * Unregisters a listener from an event, or removes all listeners if none specified.
   * @param event - Event name
   * @param listener - Specific listener to remove (optional)
   * @returns True if a listener was removed, false otherwise
   */
  off<K extends keyof E>(event: K, listener?: ComplexListener<E[K]>) {
    if (!listener) {
      this._events.delete(event as string);
      return;
    }
    const listeners = this._events.get(event as string) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Emits an event to all registered listeners with spread arguments.
   * @param event - Event name
   * @param args - Event arguments (spread)
   * @returns Number of listeners invoked
   */
  emit<K extends keyof E>(
    event: K,
    ...args: E[K] extends any[] ? E[K] : E[K] extends void ? [] : [E[K]]
  ) {
    const listeners = this._events.get(event as string) || [];
    for (const listener of listeners) {
      try {
        (listener as any)(...args);
      } catch (error) {
        console.error(error);
      }
    }
    return listeners.length;
  }

  /**
   * Registers a listener to be called only once when the event is emitted.
   * @param event - Event name
   * @param listener - Callback receiving the event arguments
   * @returns Function to unregister the once listener
   */
  once<K extends Extract<keyof E, string>>(event: K, listener: ComplexListener<E[K]>) {
    const onceListener = ((...args: any[]) => {
      (listener as Function)(...args);
      this.off(event, onceListener as ComplexListener<E[K]>);
    }) as ComplexListener<E[K]>;

    this.on(event, onceListener);
    return () => this.off(event, onceListener);
  }
}

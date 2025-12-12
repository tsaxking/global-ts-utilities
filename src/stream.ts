import { EventEmitter } from './event-emitter';
import { attemptAsync } from './check';

/**
 * Event types for the Stream class
 * @template T - Type of data being streamed
 */
type Events<T = unknown> = {
    /** Emitted when new data is added to the stream */
    data: T;
    /** Emitted when an error occurs in the stream */
    error: Error;
    /** Emitted when the stream ends */
    end: void;
}

/**
 * A streaming utility class that provides event-driven data processing capabilities.
 * Supports piping to other streams or functions, error handling, and async data collection.
 * 
 * @template T - Type of data being streamed
 * 
 * @example Basic Usage
 * ```typescript
 * const stream = new Stream<string>();
 * 
 * stream.on('data', (data) => console.log('Received:', data));
 * stream.on('end', () => console.log('Stream ended'));
 * stream.on('error', (err) => console.error('Stream error:', err));
 * 
 * stream.add('hello');
 * stream.add('world');
 * stream.end();
 * ```
 * 
 * @example Piping to Functions
 * ```typescript
 * const source = new Stream<number>();
 * const target = new Stream<number>();
 * 
 * // Pipe with transformation function
 * source.pipe((data, index) => {
 *   console.log(`Processing item ${index}: ${data * 2}`);
 *   return data * 2;
 * });
 * 
 * // Pipe to another stream
 * source.pipe(target);
 * ```
 * 
 * @example Collecting All Data
 * ```typescript
 * const stream = new Stream<string>();
 * 
 * // Collect all data when stream ends
 * const dataPromise = stream.await();
 * 
 * stream.add('first');
 * stream.add('second');
 * stream.end();
 * 
 * const allData = await dataPromise.unwrap(); // ['first', 'second']
 * ```
 */
export class Stream<T = unknown> {
    /** Internal event emitter for stream events */
    private readonly emitter = new EventEmitter<Events<T>>();

    /**
     * Subscribe to stream events
     * 
     * @param event - Event name to listen for
     * @param listener - Callback function to handle the event
     */
    public on = this.emitter.on.bind(this.emitter);
    
    /**
     * Unsubscribe from stream events
     * 
     * @param event - Event name to stop listening for
     * @param listener - Specific callback to remove (optional)
     */
    public off = this.emitter.off.bind(this.emitter);
    
    /**
     * Subscribe to a stream event for a single occurrence
     * 
     * @param event - Event name to listen for
     * @param listener - Callback function to handle the event (called only once)
     */
    public once = this.emitter.once.bind(this.emitter);
    
    /** Internal method to emit events */
    private emit = this.emitter.emit.bind(this.emitter);

    /**
     * Adds data to the stream and emits a 'data' event
     * 
     * @param data - The data to add to the stream
     * 
     * @example
     * ```typescript
     * const stream = new Stream<string>();
     * 
     * stream.on('data', (data) => console.log(data));
     * 
     * stream.add('hello'); // Logs: hello
     * stream.add('world'); // Logs: world
     * ```
     */
    public add(data: T) {
        this.index++;
        this.emit('data', data);
    }

    /**
     * Ends the stream and cleans up all event listeners
     * Emits an 'end' event before cleanup
     * 
     * @example
     * ```typescript
     * stream.once('end', () => console.log('Stream completed'));
     * stream.end(); // Logs: Stream completed
     * ```
     */
    public end() {
        this.emit('end', undefined);
        this.emitter.destroyEvents();
    }

    /**
     * Emits an error event and cleans up the stream
     * 
     * @param error - The error that occurred
     * 
     * @example
     * ```typescript
     * stream.on('error', (err) => console.error('Error:', err.message));
     * stream.error(new Error('Something went wrong'));
     * ```
     */
    public error(error: Error) {
        this.emit('error', error);
        this.emitter.destroyEvents();
    }

    /** Internal counter for tracking the number of items processed */
    private index = 0;

    /**
     * Pipes this stream to another stream or processing function
     * 
     * @param stream - Target stream or processing function
     * @param timeoutMs - Optional timeout in milliseconds
     * @returns Promise that resolves when piping completes or rejects on error
     * 
     * @example Piping to Another Stream
     * ```typescript
     * const source = new Stream<number>();
     * const target = new Stream<number>();
     * 
     * // Pipe all data from source to target
     * const pipePromise = source.pipe(target);
     * 
     * source.add(1);
     * source.add(2);
     * source.end();
     * 
     * await pipePromise; // target now contains [1, 2]
     * ```
     * 
     * @example Piping to Processing Function
     * ```typescript
     * const stream = new Stream<number>();
     * 
     * // Process each item with a function
     * stream.pipe((data, index) => {
     *   console.log(`Item ${index}: ${data * 2}`);
     *   // Can return a promise for async processing
     *   return processAsync(data);
     * });
     * 
     * stream.add(5); // Logs: Item 1: 10
     * stream.add(3); // Logs: Item 2: 6
     * ```
     * 
     * @example With Timeout
     * ```typescript
     * try {
     *   await stream.pipe(targetStream, 5000); // 5 second timeout
     * } catch (error) {
     *   console.log('Stream timed out or errored');
     * }
     * ```
     */
    public pipe(
        stream: Stream<T> | ((data: T, index: number) => unknown),
        timeoutMs?: number
    ) {
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

            const waitForHandlers = async () => {
                try {
                    await Promise.allSettled(handlerPromises);
                } catch {
                    // shouldn't throw, since allSettled always resolves
                }
            };

            const onEnd = async () => {
                ended = true;
                cleanup();
                await waitForHandlers();
                if (stream instanceof Stream) {
                    stream.end();
                }
                res();
            };

            const onError = async (e: Error) => {
                errored = true;
                cleanup();
                await waitForHandlers();
                if (stream instanceof Stream) {
                    stream.error(e);
                }
                rej(e);
            };

            const onData = (data: T) => {
                if (stream instanceof Stream) {
                    stream.add(data);
                } else {
                    try {
                        const result = stream(data, this.index);
                        if (result instanceof Promise) {
                            handlerPromises.push(
                                result.catch(() => {}) // prevent rejection leaks
                            );
                        }
                    } catch (err) {
                        onError(err instanceof Error ? err : new Error(String(err)));
                    }
                }
            };

            this.on('data', onData);
            this.once('end', onEnd);
            this.once('error', onError);

            if (timeoutMs) {
                timeoutId = setTimeout(() => {
                    if (!ended && !errored) {
                        onError(new Error('Stream Timeout'));
                    }
                }, timeoutMs);
            }
        });
    }

    /**
     * Collects all data from the stream until it ends
     * 
     * @param timeout - Optional timeout in milliseconds (0 = no timeout)
     * @returns Promise that resolves with array of all data items
     * 
     * @example Basic Usage
     * ```typescript
     * const stream = new Stream<string>();
     * const dataPromise = stream.await();
     * 
     * stream.add('hello');
     * stream.add('world');
     * stream.end();
     * 
     * const result = await dataPromise.unwrap();
     * console.log(result); // ['hello', 'world']
     * ```
     * 
     * @example With Timeout
     * ```typescript
     * const stream = new Stream<number>();
     * 
     * try {
     *   const result = await stream.await(1000).unwrap(); // 1 second timeout
     *   console.log('Collected data:', result);
     * } catch (error) {
     *   console.log('Stream timed out or errored');
     * }
     * ```
     * 
     * @example Error Handling
     * ```typescript
     * const stream = new Stream<string>();
     * const dataPromise = stream.await();
     * 
     * stream.add('data');
     * stream.error(new Error('Something failed'));
     * 
     * const result = await dataPromise; // Will be an error Result
     * if (result.isErr()) {
     *   console.error('Stream failed:', result.error.message);
     * }
     * ```
     */
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
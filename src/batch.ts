import { attemptAsync } from "./check";
import { ComplexEventEmitter } from "./event-emitter";
import { sleep } from "./sleep";

/**
 * Internal type representing an item in the batch queue with its promise resolvers
 * @template T - Type of the input item
 * @template R - Type of the expected result
 */
type BatchItem<T, R> = {
    /** The actual item to be processed */
    item: T;
    /** Promise resolver for successful results */
    res: (value: R | PromiseLike<R>) => void;
    /** Promise rejector for errors */
    rej: (reason?: any) => void;
}

/**
 * Custom error class for batch-related errors
 */
export class BatchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BatchError";
    }
}

/**
 * A high-performance batching utility that collects items and processes them in configurable batches.
 * Supports automatic batching based on size and time intervals, with timeout protection,
 * backpressure management, individual item error handling, and comprehensive event monitoring.
 * 
 * ## Key Features
 * - **Automatic Batching**: Process items when batch size is reached or on time intervals
 * - **Backpressure Management**: Queue limits prevent memory overflow
 * - **Timeout Protection**: Prevents hanging operations with configurable timeouts
 * - **Individual Error Handling**: Each item can succeed or fail independently
 * - **Event Monitoring**: Real-time events for monitoring and debugging
 * - **Graceful Shutdown**: Flush remaining items or clear immediately
 * - **Concurrency Safety**: Prevents race conditions with internal locking
 * - **Metrics Tracking**: Built-in success/error counters
 * 
 * ## Use Cases
 * - Database batch operations (inserts, updates, deletes)
 * - API request batching to reduce HTTP overhead
 * - File processing and I/O operations
 * - Message queue processing
 * - Log aggregation and forwarding
 * - Cache warming operations
 * 
 * @template T - Type of items being batched
 * @template R - Type of results returned from batch processing
 * 
 * @example Basic Usage
 * ```typescript
 * // Create a batch processor for database inserts
 * const batch = new Batch(
 *   async (items: User[]) => {
 *     const results = await Promise.allSettled(
 *       items.map(user => db.insert(user))
 *     );
 *     return results.map(r => r.status === 'fulfilled' ? r.value : r.reason);
 *   },
 *   {
 *     batchSize: 10,     // Process 10 items at once
 *     interval: 1000,    // Process every 1 second
 *     limit: 100,        // Max 100 items in queue
 *     timeout: 5000      // 5 second timeout per batch
 *   }
 * );
 * 
 * // Add items (returns promises)
 * const result = await batch.add(newUser).unwrap();
 * ```
 * 
 * @example Event Monitoring
 * ```typescript
 * // Monitor batch processing events
 * batch.on('data', ({ item, result }) => {
 *   if (result instanceof Error) {
 *     logger.error('Item failed:', item, result);
 *   } else {
 *     logger.info('Item processed:', item, result);
 *   }
 * });
 * 
 * batch.on('empty', () => {
 *   console.log('Queue is now empty');
 * });
 * 
 * batch.on('drained', () => {
 *   console.log('Batch processor stopped and drained');
 * });
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const result = await batch.add(item).unwrap();
 *   console.log('Success:', result);
 * } catch (error) {
 *   if (error instanceof BatchError) {
 *     console.error('Batch error:', error.message);
 *   } else {
 *     console.error('Processing error:', error);
 *   }
 * }
 * ```
 * 
 * @example Graceful Shutdown
 * ```typescript
 * // Process remaining items before shutdown
 * await batch.flush().unwrap();
 * 
 * // Or clear immediately without processing
 * batch.clear();
 * 
 * // Clean up all resources
 * batch.destroy();
 * ```
 */
export class Batch<T, R> {
    /** Queue of items waiting to be processed */
    private _items: BatchItem<T, R>[] = [];
    /** Timer for interval-based processing */
    private timer: ReturnType<typeof setInterval> | null = null;

    /** Counter for successful operations */
    private _success = 0;
    /** Counter for failed operations */
    private _error = 0;
    /** Flag to prevent concurrent batch execution */
    private _running = false;

    /** 
     * Event emitter for batch processing events
     * @private
     */
    private readonly em = new ComplexEventEmitter<{
        /** Emitted when the queue becomes empty during processing */
        empty: void;
        /** Emitted when the batch processor is drained (stopped and emptied) */
        drained: void;
        /** Emitted when a batch-level error occurs */
        error: [BatchError];
        /** Emitted for each individual item processed (success or failure) */
        data: [{
            /** The original item that was processed */
            item: T;
            /** The result (success value or Error object) */
            result: R | Error;
        }];
        /** Emitted when the interval timer is stopped */
        stop: void;
    }>();

    /**
     * Subscribe to batch processing events
     * 
     * @param event - The event name to listen for
     * @param callback - Function to call when the event is emitted
     * 
     * @example
     * ```typescript
     * batch.on('data', ({ item, result }) => {
     *   console.log(`Processed item:`, item, `Result:`, result);
     * });
     * 
     * batch.on('empty', () => {
     *   console.log('All items processed, queue is empty');
     * });
     * 
     * batch.on('error', (error) => {
     *   console.error('Batch processing error:', error);
     * });
     * ```
     */
    public on = this.em.on.bind(this.em);

    /**
     * Unsubscribe from batch processing events
     * 
     * @param event - The event name to stop listening for
     * @param callback - The specific callback to remove (optional)
     */
    public off = this.em.off.bind(this.em);

    /**
     * Subscribe to a batch processing event for a single occurrence
     * 
     * @param event - The event name to listen for
     * @param callback - Function to call when the event is emitted (will be called only once)
     */
    public once = this.em.once.bind(this.em);

    /**
     * Creates a new batch processor with the specified processing function and configuration.
     * 
     * @param fn - Function that processes a batch of items. This function must:
     *             - Accept an array of items of type T
     *             - Return an array of results (Error | R) in the SAME ORDER as the input items
     *             - Can be synchronous or asynchronous
     *             - Should return Error objects for individual item failures
     *             - Can throw exceptions for batch-wide failures (will fail entire batch)
     * 
     * @param config - Configuration options for the batch processor
     * @param config.batchSize - Maximum number of items to process in a single batch (1-1000 recommended)
     * @param config.interval - Time in milliseconds between automatic batch processing (100-10000ms recommended)
     * @param config.limit - Maximum number of items allowed in the queue for backpressure management (must be >= batchSize)
     * @param config.timeout - Maximum time in milliseconds to wait for batch processing to complete (1000-30000ms recommended)
     * 
     * @throws {Error} If configuration values are invalid
     * 
     * @example Processing Function Examples
     * ```typescript
     * // Database batch insert
     * const dbBatch = new Batch(
     *   async (users: User[]) => {
     *     const results = await Promise.allSettled(
     *       users.map(user => database.insert(user))
     *     );
     *     return results.map(r => 
     *       r.status === 'fulfilled' ? r.value : r.reason
     *     );
     *   },
     *   { batchSize: 50, interval: 2000, limit: 500, timeout: 10000 }
     * );
     * 
     * // API request batching
     * const apiBatch = new Batch(
     *   async (requests: ApiRequest[]) => {
     *     try {
     *       const response = await api.batchProcess(requests);
     *       return response.results;
     *     } catch (error) {
     *       // This will fail the entire batch
     *       throw new Error(`API batch failed: ${error.message}`);
     *     }
     *   },
     *   { batchSize: 20, interval: 1000, limit: 200, timeout: 15000 }
     * );
     * ```
     */
    constructor(public readonly fn: (items: T[]) => Promise<(Error | R)[]> | (Error | R)[], 
    public readonly config: {
        batchSize: number;
        interval: number;
        limit: number;
        timeout: number;
    }) {
        if (config.batchSize <= 0) {
            throw new BatchError("batchSize must be greater than 0.");
        }
    }

    /** 
     * Whether a batch is currently being processed.
     * Used for concurrency control and monitoring.
     * 
     * @returns True if a batch is currently executing, false otherwise
     */
    get running() {
        return this._running;
    }

    /** 
     * Array of all items currently waiting in the queue.
     * This is a snapshot copy - modifications won't affect the actual queue.
     * 
     * @returns Copy of all queued items in order they were added
     */
    get items(): T[] {
        return this._items.map(i => i.item);
    }

    /** 
     * Preview of items that will be in the next batch (up to batchSize).
     * Internal method primarily used for debugging and testing.
     * 
     * @returns Array of batch items that would be processed next
     * @internal
     */
    get batch(): BatchItem<T, R>[] {
        return this._items.slice(0, this.config.batchSize);
    }

    /** 
     * Total number of items that have been successfully processed since creation
     * or the last call to resetMetrics().
     * 
     * @returns Count of successful operations
     */
    get success() {
        return this._success;
    }

    /** 
     * Total number of items that have failed processing since creation
     * or the last call to resetMetrics().
     * 
     * @returns Count of failed operations
     */
    get error() {
        return this._error;
    }

    /**
     * Current processing statistics for monitoring and observability.
     * 
     * @returns Object containing comprehensive batch statistics
     * 
     * @example
     * ```typescript
     * const stats = batch.stats;
     * console.log(`Success Rate: ${stats.successRate}%`);
     * console.log(`Queue Utilization: ${stats.queueUtilization}%`);
     * console.log(`Total Processed: ${stats.totalProcessed}`);
     * ```
     */
    get stats() {
        const totalProcessed = this._success + this._error;
        return {
            /** Current number of items in queue */
            queueSize: this._items.length,
            /** Maximum queue capacity */
            queueLimit: this.config.limit,
            /** Queue utilization as percentage (0-100) */
            queueUtilization: Math.round((this._items.length / this.config.limit) * 100),
            /** Number of successful operations */
            successCount: this._success,
            /** Number of failed operations */
            errorCount: this._error,
            /** Total items processed (success + error) */
            totalProcessed,
            /** Success rate as percentage (0-100), NaN if no items processed */
            successRate: totalProcessed > 0 ? Math.round((this._success / totalProcessed) * 100) : NaN,
            /** Whether batch processing is currently active */
            isRunning: this._running,
            /** Whether the interval timer is active */
            isTimerActive: this.timer !== null,
            /** Current batch configuration */
            config: { ...this.config }
        };
    }
    /**
     * Processes the current batch of items. This method is called automatically
     * by the timer or when the batch size is reached.
     * 
     * @returns Promise that resolves when the batch processing is complete
     * 
     * @remarks
     * - Prevents concurrent execution using the _running flag
     * - Applies timeout protection to prevent hanging
     * - Handles both individual item failures and batch-wide failures
     * - Updates success/error counters and resolves/rejects individual promises
     */
    run() {
        return attemptAsync(async () => {
            if (this._running) return;
            this._running = true;

            const batch = this.batch;
            if (batch.length === 0) {
                this._running = false;
                return;
            }

            const timeoutId = setTimeout(() => {
                this._running = false;
                for (const item of batch) item.rej(new BatchError("Batch processing timed out."));
            }, this.config.timeout);

            this._items = this._items.slice(batch.length);
            if (this._items.length === 0) this.stop();

            try {
                const results = await this.fn(batch.map(i => i.item));
                clearTimeout(timeoutId);
                if (results.length !== batch.length) {
                    throw new BatchError(`Batch function returned ${results.length} results, but ${batch.length} items were provided.`);
                }
                for (let i = 0; i < results.length; i++) {
                    if (results[i] instanceof Error) {
                        this._error++;
                        batch[i].rej(results[i]);
                    } else {
                        this._success++;
                        batch[i].res(results[i] as R);
                    }
                    this.em.emit("data", { item: batch[i].item, result: results[i] });
                }
                
                // Emit empty event if queue is now empty
                if (this._items.length === 0) {
                    this.em.emit("empty");
                }
            } catch (error) {
                clearTimeout(timeoutId);
                this._error += batch.length;
                
                // Emit error event for batch-wide failures
                if (error instanceof BatchError) {
                    this.em.emit("error", error);
                }
                
                for (const item of batch) item.rej(error);
            } finally {
                this._running = false;
            }
        });
    }

    /**
     * Starts the interval timer for automatic batch processing.
     * Prevents multiple timers from being created.
     */
    start(): void {
        if (this.timer) return; // Prevent multiple timers

        this.timer = setInterval(async () => {
            this.run();
        }, this.config.interval);
    }

    /**
     * Adds an item to the batch queue for processing.
     * 
     * @param item - The item to be added to the batch
     * @param doRun - Whether to trigger processing immediately if conditions are met (default: true)
     * @returns Promise that resolves with the processing result for this specific item
     * 
     * @throws {BatchError} When the queue limit is exceeded (backpressure protection)
     * 
     * @remarks
     * - If adding this item reaches the batch size, processing starts immediately
     * - If the timer isn't running, it will be started
     * - Each item gets its own promise that resolves/rejects independently
     * 
     * @example
     * ```typescript
     * try {
     *   const result = await batch.add(myItem).unwrap();
     *   console.log('Item processed:', result);
     * } catch (error) {
     *   console.error('Item failed:', error);
     * }
     * ```
     */
    add(item: T, doRun = true) {
        return attemptAsync(async () => {
            if (this._items.length >= this.config.limit) {
                throw new BatchError(`Batch limit of ${this.config.limit} exceeded.`);
            }
            const p = new Promise<R>((res, rej) => {
                this._items.push({
                    item,
                    res,
                    rej
                });
            });
            if (doRun) {
                if (this._items.length >= this.config.batchSize) {
                    this.run();
                } else if (!this.timer) {
                    this.start();
                }
            }
            return p;
        });
    }

    /**
     * Clears all items from the queue and stops the timer.
     * Items in the queue will not be processed and their promises will not resolve.
     * 
     * @remarks Use this for immediate shutdown when you don't need to process remaining items.
     * For graceful shutdown that processes remaining items, use flush() instead.
     */
    clear(): void {
        this._items = [];
        this.stop();
        this.em.emit("drained");
    }

    /**
     * Returns the current number of items in the queue.
     * 
     * @returns Number of items waiting to be processed
     */
    size(): number {
        return this._items.length;
    }

    /**
     * Processes all remaining items in the queue and stops the timer.
     * This method ensures graceful shutdown by completing all pending work.
     * 
     * @returns Promise that resolves when all items have been processed
     * 
     * @remarks
     * - Yields to the event loop before starting to allow any pending adds to complete
     * - Continues processing until the queue is empty
     * - Stops the interval timer when complete
     * - Ideal for application shutdown scenarios
     * 
     * @example
     * ```typescript
     * // Graceful shutdown
     * await batch.flush();
     * console.log('All items processed');
     * ```
     */
    async flush() {
        return attemptAsync(async () => {
            await sleep(0);
            while (this._items.length > 0) {
                await this.run();
            }
            this.stop();
            this.em.emit("drained");
        });
    }

    /**
     * Resets the success and error counters to zero.
     * Useful for monitoring and metrics collection over specific time periods.
     * Does not affect the current queue or processing state.
     * 
     * @example
     * ```typescript
     * // Reset metrics for a new monitoring period
     * batch.resetMetrics();
     * 
     * // Process items for an hour
     * setTimeout(() => {
     *   const stats = batch.stats;
     *   console.log(`Hourly success rate: ${stats.successRate}%`);
     *   batch.resetMetrics(); // Reset for next hour
     * }, 3600000);
     * ```
     */
    resetMetrics(): void {
        this._success = 0;
        this._error = 0;
    }

    /**
     * Completely destroys the batch processor and cleans up all resources.
     * This method should be called when the batch processor is no longer needed.
     * 
     * @remarks
     * - Clears the queue without processing remaining items
     * - Stops the interval timer
     * - Destroys all event listeners
     * - The batch processor cannot be used after calling this method
     * 
     * @example
     * ```typescript
     * // Clean shutdown
     * try {
     *   await batch.flush().unwrap(); // Process remaining items
     * } finally {
     *   batch.destroy(); // Clean up resources
     * }
     * ```
     */
    public destroy(): void {
        this.clear();
        this.em.destroyEvents();
    }

    /**
     * Stops the interval timer and cleans up timer resources.
     * Emits a 'stop' event when the timer is successfully stopped.
     * 
     * @private
     */
    private stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.em.emit("stop");
        }
    }
}
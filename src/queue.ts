import { attemptAsync } from "./check";
import { ComplexEventEmitter } from "./event-emitter";
import { sleep } from "./sleep";

/**
 * Internal type representing an item in the queue with its promise resolvers and timeout
 */
type QueueItem<T, R> = {
    /** The actual item to be processed */
    item: T;
    /** Promise resolver for successful results */
    res: (data: R) => void;
    /** Promise rejector for errors */
    rej: (err: any) => void;
    /** Timeout ID for this specific item */
    timeoutId: ReturnType<typeof setTimeout> | null;
    /** Timestamp when item was added */
    addedAt: number;
};

/**
 * Custom error class for queue-related errors
 */
export class QueueError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueueError";
    }
}

/**
 * A high-performance queue system for processing items with configurable concurrency,
 * ordering (FIFO/LIFO), timeouts, and comprehensive monitoring capabilities.
 * 
 * ## Key Features
 * - **Configurable Concurrency**: Process multiple items simultaneously
 * - **Flexible Ordering**: Support for FIFO and LIFO queue types
 * - **Timeout Protection**: Individual item timeouts with proper cleanup
 * - **Backpressure Management**: Queue size limits prevent memory overflow
 * - **Event Monitoring**: Real-time events for monitoring and debugging
 * - **Statistics Tracking**: Built-in metrics for success/error rates and timing
 * - **Graceful Shutdown**: Proper resource cleanup and pending item handling
 * - **Pause/Resume**: Control queue processing dynamically
 * 
 * @template T - Type of items being queued
 * @template R - Type of results returned from processing
 * 
 * @example Basic Usage
 * ```typescript
 * const queue = new Queue({
 *   process: async (item: string) => {
 *     const result = await processItem(item);
 *     return result;
 *   },
 *   maxSize: 1000,
 *   concurrency: 5,
 *   interval: 100,
 *   timeout: 30000,
 *   type: 'fifo'
 * });
 * 
 * // Initialize and start processing
 * queue.init();
 * 
 * // Add items
 * const result = await queue.enqueue('my-item').unwrap();
 * ```
 * 
 * @example Event Monitoring
 * ```typescript
 * queue.on('processed', ({ item, result, processingTime }) => {
 *   console.log(`Processed ${item} in ${processingTime}ms:`, result);
 * });
 * 
 * queue.on('error', ({ item, error, processingTime }) => {
 *   console.error(`Failed to process ${item} after ${processingTime}ms:`, error);
 * });
 * 
 * queue.on('timeout', ({ item, queueTime }) => {
 *   console.warn(`Item ${item} timed out after ${queueTime}ms in queue`);
 * });
 * 
 * queue.on('empty', () => {
 *   console.log('Queue is now empty');
 * });
 * ```
 * 
 * @example Queue Management
 * ```typescript
 * // Pause processing temporarily
 * queue.pause();
 * console.log('Queue paused, items can still be added');
 * 
 * // Resume processing
 * queue.resume();
 * 
 * // Get comprehensive statistics
 * const stats = queue.stats;
 * console.log(`Queue utilization: ${stats.utilization}%`);
 * console.log(`Success rate: ${stats.successRate}%`);
 * 
 * // Graceful shutdown
 * await queue.flush().unwrap();
 * queue.destroy();
 * ```
 * 
 * @example Rate Limiting and Processing Control
 * ```typescript
 * // Rate-limited API calls
 * const apiQueue = new Queue({
 *   process: async (request: ApiRequest) => {
 *     return await fetch(request.url, request.options);
 *   },
 *   maxSize: 1000,        // Max 1000 pending requests
 *   concurrency: 3,       // Max 3 concurrent API calls
 *   interval: 100,        // Check every 100ms
 *   timeout: 30000,       // 30 second timeout per request
 *   type: 'fifo'          // First-in-first-out processing
 * });
 * 
 * // Database batch operations with priority
 * const dbQueue = new Queue({
 *   process: async (operation: DbOperation) => {
 *     return await database.execute(operation);
 *   },
 *   maxSize: 500,
 *   concurrency: 10,      // 10 concurrent DB operations
 *   interval: 50,         // Aggressive processing
 *   timeout: 15000,       // 15 second DB timeout
 *   type: 'lifo'          // Last-in-first-out for priority
 * });
 * ```
 */
export class Queue<T, R> {
    /** Array of items waiting to be processed */
    private _items: QueueItem<T, R>[] = [];
    /** Interval timer for processing items */
    private interval: ReturnType<typeof setInterval> | null = null;
    /** Flag indicating if queue is currently processing items */
    private _processing = false;
    /** Flag indicating if queue is paused */
    private _paused = false;
    /** Counter for successful operations */
    private _success = 0;
    /** Counter for failed operations */
    private _error = 0;
    /** Counter for timed out operations */
    private _timeout = 0;

    /**
     * Event emitter for queue processing events
     * @private
     */
    private readonly em = new ComplexEventEmitter<{
        /** Emitted when an item is successfully processed */
        processed: [{
            /** The original item that was processed */
            item: T;
            /** The processing result */
            result: R;
            /** Processing time in milliseconds */
            processingTime: number;
        }];
        /** Emitted when an item fails processing */
        error: [{
            /** The original item that failed */
            item: T;
            /** The error that occurred */
            error: Error;
            /** Processing time before failure in milliseconds */
            processingTime: number;
        }];
        /** Emitted when an item times out */
        timeout: [{
            /** The original item that timed out */
            item: T;
            /** Time the item spent in queue before timeout */
            queueTime: number;
        }];
        /** Emitted when the queue becomes empty */
        empty: void;
        /** Emitted when the queue becomes full */
        full: void;
        /** Emitted when the queue is drained (stopped and emptied) */
        drained: void;
        /** Emitted when the queue is paused */
        paused: void;
        /** Emitted when the queue is resumed */
        resumed: void;
        /** Emitted when the queue is destroyed */
        destroyed: void;
    }>();

    /**
     * Subscribe to queue processing events
     */
    public on = this.em.on.bind(this.em);

    /**
     * Unsubscribe from queue processing events
     */
    public off = this.em.off.bind(this.em);

    /**
     * Subscribe to a queue processing event for a single occurrence
     */
    public once = this.em.once.bind(this.em);

    /**
     * Creates a new queue processor with the specified configuration
     * 
     * @param process - Function that processes individual items
     * @param config - Configuration options for the queue processor
     * @param config.limit - Maximum number of items allowed in the queue
     * @param config.concurrency - Number of items to process simultaneously
     * @param config.interval - Time in milliseconds between processing cycles
     * @param config.timeout - Maximum time in milliseconds for an item to be processed
     * @param config.type - Queue ordering: 'fifo' (first-in-first-out) or 'lifo' (last-in-first-out)
     */
    constructor(
        public readonly process: (item: T) => Promise<R> | R,
        public readonly config: {
            limit: number;
            concurrency: number;
            interval: number;
            timeout: number;
            type: 'fifo' | 'lifo';
        }
    ) {
        if (config.limit <= 0) {
            throw new QueueError("limit must be greater than 0");
        }
        if (config.concurrency <= 0) {
            throw new QueueError("concurrency must be greater than 0");
        }
        if (config.interval < 0) {
            throw new QueueError("interval must be non-negative");
        }
        if (config.timeout <= 0) {
            throw new QueueError("timeout must be greater than 0");
        }
    }

    /**
     * Current number of items in the queue
     */
    get size() {
        return this._items.length;
    }

    /**
     * Array of all items currently in the queue (snapshot copy)
     */
    get items() {
        return this._items.map(i => i.item);
    }

    /**
     * Whether the queue is currently processing items
     */
    get processing() {
        return this._processing;
    }

    /**
     * Whether the queue is paused
     */
    get paused() {
        return this._paused;
    }

    /**
     * Number of items that have been successfully processed
     */
    get success() {
        return this._success;
    }

    /**
     * Number of items that have failed processing
     */
    get error() {
        return this._error;
    }

    /**
     * Number of items that have timed out
     */
    get timeout() {
        return this._timeout;
    }

    /**
     * Whether the queue is initialized and running
     */
    get initialized() {
        return this.interval !== null;
    }

    /**
     * Comprehensive queue statistics for monitoring
     */
    get stats() {
        const totalProcessed = this._success + this._error + this._timeout;
        return {
            /** Current number of items in queue */
            queueSize: this._items.length,
            /** Maximum queue capacity */
            maxSize: this.config.limit,
            /** Queue utilization as percentage (0-100) */
            utilization: Math.round((this._items.length / this.config.limit) * 100),
            /** Number of successful operations */
            successCount: this._success,
            /** Number of failed operations */
            errorCount: this._error,
            /** Number of timed out operations */
            timeoutCount: this._timeout,
            /** Total items processed */
            totalProcessed,
            /** Success rate as percentage (0-100), NaN if no items processed */
            successRate: totalProcessed > 0 ? Math.round((this._success / totalProcessed) * 100) : NaN,
            /** Error rate as percentage (0-100), NaN if no items processed */
            errorRate: totalProcessed > 0 ? Math.round((this._error / totalProcessed) * 100) : NaN,
            /** Timeout rate as percentage (0-100), NaN if no items processed */
            timeoutRate: totalProcessed > 0 ? Math.round((this._timeout / totalProcessed) * 100) : NaN,
            /** Whether queue is currently processing */
            isProcessing: this._processing,
            /** Whether queue is paused */
            isPaused: this._paused,
            /** Whether queue is initialized */
            isInitialized: this.initialized,
            /** Current configuration */
            config: { ...this.config }
        };
    }

    /**
     * Removes and returns items from the queue based on queue type (FIFO/LIFO)
     * @private
     */
    private dequeue(count: number): QueueItem<T, R>[] {
        if (this.config.type === 'fifo') {
            return this._items.splice(0, count);
        } else {
            return this._items.splice(-count, count);
        }
    }

    /**
     * Processes a batch of items concurrently
     * @private
     */
    private async processItems(): Promise<void> {
        if (this._processing || this._paused || this._items.length === 0) {
            return;
        }

        this._processing = true;

        try {
            const itemsToProcess = this.dequeue(
                Math.min(this.config.concurrency, this._items.length)
            );

            // Process items concurrently
            await Promise.allSettled(
                itemsToProcess.map(async (queueItem) => {
                    const startTime = Date.now();
                    
                    try {
                        const result = await this.process(queueItem.item);
                        const processingTime = Date.now() - startTime;
                        
                        // Clear timeout since processing succeeded
                        if (queueItem.timeoutId) {
                            clearTimeout(queueItem.timeoutId);
                            queueItem.timeoutId = null;
                        }
                        
                        this._success++;
                        queueItem.res(result);
                        
                        this.em.emit('processed', {
                            item: queueItem.item,
                            result,
                            processingTime
                        });
                    } catch (error) {
                        const processingTime = Date.now() - startTime;
                        
                        // Clear timeout since processing completed (with error)
                        if (queueItem.timeoutId) {
                            clearTimeout(queueItem.timeoutId);
                            queueItem.timeoutId = null;
                        }
                        
                        this._error++;
                        queueItem.rej(error);
                        
                        this.em.emit('error', {
                            item: queueItem.item,
                            error: error instanceof Error ? error : new Error(String(error)),
                            processingTime
                        });
                    }
                })
            );

            // Check if queue is now empty
            if (this._items.length === 0) {
                this.em.emit('empty');
            }
        } finally {
            this._processing = false;
        }
    }

    /**
     * Initializes the queue and starts processing items at the configured interval
     * 
     * @throws {QueueError} If the queue is already initialized
     */
    init(): void {
        if (this.interval) {
            throw new QueueError("Queue already initialized");
        }
        
        this.interval = setInterval(() => {
            this.processItems();
        }, this.config.interval);
    }

    /**
     * Adds an item to the queue for processing
     * 
     * @param item - The item to be added to the queue
     * @returns Promise that resolves with the processing result for this specific item
     * 
     * @throws {QueueError} When the queue is full (backpressure protection)
     */
    enqueue(item: T) {
        return attemptAsync(async () => {
            if (this._items.length >= this.config.limit) {
                this.em.emit('full');
                throw new QueueError("Queue is full");
            }
            
            return new Promise<R>((resolve, reject) => {
                let timeoutId: ReturnType<typeof setTimeout> | null = null;
                const addedAt = Date.now();
                
                const queueItem: QueueItem<T, R> = {
                    item,
                    res: (data: R) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        resolve(data);
                    },
                    rej: (err: any) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        reject(err);
                    },
                    timeoutId: null,
                    addedAt
                };
                
                // Set up timeout
                timeoutId = setTimeout(() => {
                    // Remove from queue if still there
                    const index = this._items.indexOf(queueItem);
                    if (index !== -1) {
                        this._items.splice(index, 1);
                    }
                    
                    this._timeout++;
                    const queueTime = Date.now() - addedAt;
                    
                    this.em.emit('timeout', {
                        item,
                        queueTime
                    });
                    
                    reject(new QueueError("Queue item timed out"));
                }, this.config.timeout);
                
                queueItem.timeoutId = timeoutId;
                this._items.push(queueItem);
            });
        });
    }

    /**
     * Pauses queue processing (items can still be added)
     */
    pause(): void {
        if (!this._paused) {
            this._paused = true;
            this.em.emit('paused');
        }
    }

    /**
     * Resumes queue processing
     */
    resume(): void {
        if (this._paused) {
            this._paused = false;
            this.em.emit('resumed');
        }
    }

    /**
     * Clears all items from the queue without processing them
     * 
     * @param rejectPending - Whether to reject pending promises (default: true)
     */
    clear(rejectPending = true): void {
        if (rejectPending) {
            this._items.forEach(item => {
                if (item.timeoutId) {
                    clearTimeout(item.timeoutId);
                }
                item.rej(new QueueError("Queue cleared"));
            });
        }
        
        this._items = [];
        this.em.emit('drained');
    }

    /**
     * Processes all remaining items in the queue and stops the processor
     * 
     * @returns Promise that resolves when all items have been processed
     */
    async flush() {
        return attemptAsync(async () => {
            // Allow any pending adds to complete
            await sleep(0);
            this.stop();
            
            while (this._items.length > 0) {
                await this.processItems();
                // Small delay to prevent tight loop
                await sleep(1);
            }
            this.em.emit('drained');
        });
    }

    /**
     * Stops the queue processor and cleans up resources
     */
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this._processing = false;
        this._paused = false;
    }

    /**
     * Resets all counters and statistics
     */
    resetStats(): void {
        this._success = 0;
        this._error = 0;
        this._timeout = 0;
    }

    /**
     * Completely destroys the queue and cleans up all resources
     */
    destroy(): void {
        this.stop();
        this.clear(true);
        this.em.destroyEvents();
        this.em.emit('destroyed');
    }
}
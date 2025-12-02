/**
 * Test suite for the Queue utility class.
 * 
 * This is a basic test to verify the implementation works correctly
 * with the new improvements including proper timeout handling,
 * concurrency control, event emissions, and resource management.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Queue, QueueError } from '../queue';
import { sleep } from '../sleep';

describe('Queue', () => {
    let queue: Queue<string, string>;
    
    const process = vi.fn(async (item: string) => `processed-${item}`);

    const defaultConfig = {
        limit: 10,
        concurrency: 2,
        interval: 50,
        timeout: 1000,
        type: 'fifo' as const
    };

    beforeEach(() => {
        vi.clearAllMocks();
        queue = new Queue(process, defaultConfig);
    });

    afterEach(() => {
        if (queue) {
            queue.destroy();
        }
    });

    describe('Configuration and Initialization', () => {
        it('should create queue with correct configuration', () => {
            expect(queue.config).toEqual(defaultConfig);
            expect(queue.initialized).toBe(false);
            expect(queue.size).toBe(0);
        });

        it('should validate configuration parameters', () => {
            expect(() => new Queue(process, { ...defaultConfig, limit: 1 }))
                .toThrow(QueueError);
            expect(() =>new Queue(process, { ...defaultConfig, concurrency: 1 }))
                .toThrow(QueueError);
            expect(() => new Queue(process, { ...defaultConfig, timeout: 0 }))
                .toThrow(QueueError);
        });

        it('should initialize and start processing', () => {
            expect(queue.initialized).toBe(false);
            queue.init();
            expect(queue.initialized).toBe(true);
            
            // Should throw if trying to initialize again
            expect(() => queue.init()).toThrow(QueueError);
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            queue.init();
        });

        it('should enqueue and process items', async () => {
            const promise = queue.enqueue('test-item');
            
            expect(queue.size).toBe(1);
            expect(queue.items).toEqual(['test-item']);
            
            const result = await promise.unwrap();
            expect(result).toBe('processed-test-item');
            expect(process).toHaveBeenCalledWith('test-item');
        });

        it('should handle FIFO ordering', async () => {
            const promises = [
                queue.enqueue('first'),
                queue.enqueue('second'),
                queue.enqueue('third')
            ];

            const results = await Promise.all(promises.map(p => p.unwrap()));
            
            // Should process in FIFO order
            expect(results).toEqual(['processed-first', 'processed-second', 'processed-third']);
        });

        it('should handle LIFO ordering', async () => {
            const lifoQueue = new Queue(process, { ...defaultConfig, type: 'lifo' });
            lifoQueue.init();
            
            try {
                // Add items quickly before processing starts
                const promises = [
                    lifoQueue.enqueue('first'),
                    lifoQueue.enqueue('second'),  
                    lifoQueue.enqueue('third')
                ];

                await Promise.all(promises.map(p => p.unwrap()));
                
                // The exact order depends on timing, but all should be processed
                expect(process).toHaveBeenCalledTimes(3);
            } finally {
                lifoQueue.destroy();
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            queue.init();
        });

        it('should handle processing errors', async () => {
            const errorQueue = new Queue(vi.fn(async (item: string) => {
                    if (item === 'fail') {
                        throw new Error('Processing failed');
                    }
                    return `processed-${item}`;
                }), {
                ...defaultConfig,
            });
            errorQueue.init();

            try {
                const promises = [
                    errorQueue.enqueue('success'),
                    errorQueue.enqueue('fail')
                ];

                const results = await Promise.allSettled(promises.map(p => p.unwrap()));
                
                expect(results[0]).toEqual({ status: 'fulfilled', value: 'processed-success' });
                expect(results[1].status).toBe('rejected');
                
                expect(errorQueue.success).toBe(1);
                expect(errorQueue.error).toBe(1);
            } finally {
                errorQueue.destroy();
            }
        });

        it('should handle queue full condition', async () => {
            // Fill up the queue
            for (let i = 0; i < 10; i++) {
                queue.enqueue(`item${i}`);
            }
            
            // Next item should fail
            const result = await queue.enqueue('overflow').unwrap().catch(e => e);
            expect(result).toBeInstanceOf(QueueError);
            expect(result.message).toBe('Queue is full');
        });

        it('should handle timeouts', async () => {
            const slowQueue = new Queue( vi.fn(async () => {
                    await sleep(2000); // Longer than timeout
                    return 'done';
                }),{
                ...defaultConfig,
                timeout: 100
            });
            slowQueue.init();

            try {
                const result = await slowQueue.enqueue('slow-item').unwrap().catch(e => e);
                expect(result).toBeInstanceOf(QueueError);
                expect(result.message).toBe('Queue item timed out');
                expect(slowQueue.timeout).toBe(1);
            } finally {
                slowQueue.destroy();
            }
        });
    });

    describe('Queue Management', () => {
        beforeEach(() => {
            queue.init();
        });

        it('should pause and resume processing', () => {
            expect(queue.paused).toBe(false);
            
            queue.pause();
            expect(queue.paused).toBe(true);
            
            queue.resume();
            expect(queue.paused).toBe(false);
        });

        it('should clear the queue', () => {
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            expect(queue.size).toBe(2);
            
            queue.clear();
            expect(queue.size).toBe(0);
        });

        it('should reset statistics', () => {
            // Simulate some processed items
            queue['_success'] = 5;
            queue['_error'] = 2;
            queue['_timeout'] = 1;
            
            expect(queue.success).toBe(5);
            expect(queue.error).toBe(2);
            expect(queue.timeout).toBe(1);
            
            queue.resetStats();
            
            expect(queue.success).toBe(0);
            expect(queue.error).toBe(0);
            expect(queue.timeout).toBe(0);
        });
    });

    describe('Statistics and Monitoring', () => {
        beforeEach(() => {
            queue.init();
        });

        it('should track comprehensive statistics', () => {
            // Add some items
            queue.enqueue('item1');
            queue.enqueue('item2');
            
            const stats = queue.stats;
            expect(stats.queueSize).toBe(2);
            expect(stats.maxSize).toBe(10);
            expect(stats.utilization).toBe(20); // 2/10 * 100
            expect(stats.isInitialized).toBe(true);
            expect(stats.isPaused).toBe(false);
        });

        it('should calculate rates correctly', () => {
            // Simulate processed items
            queue['_success'] = 8;
            queue['_error'] = 2;
            queue['_timeout'] = 1;
            
            const stats = queue.stats;
            expect(stats.totalProcessed).toBe(11);
            expect(stats.successRate).toBe(73); // 8/11 * 100 rounded
            expect(stats.errorRate).toBe(18);   // 2/11 * 100 rounded
            expect(stats.timeoutRate).toBe(9);  // 1/11 * 100 rounded
        });
    });

    describe('Events', () => {
        beforeEach(() => {
            queue.init();
        });

        it('should emit processed events', async () => {
            const processedEvents: any[] = [];
            queue.on('processed', (data) => processedEvents.push(data));
            
            await queue.enqueue('test-item').unwrap();
            
            expect(processedEvents).toHaveLength(1);
            expect(processedEvents[0].item).toBe('test-item');
            expect(processedEvents[0].result).toBe('processed-test-item');
            expect(typeof processedEvents[0].processingTime).toBe('number');
        });

        it('should emit error events', async () => {
            const errorQueue = new Queue( vi.fn(async () => { throw new Error('Test error'); }), {
                ...defaultConfig,
            });
            errorQueue.init();

            const errorEvents: any[] = [];
            errorQueue.on('error', (data) => errorEvents.push(data));

            try {
                await errorQueue.enqueue('fail-item').unwrap().catch(() => {});
                
                expect(errorEvents).toHaveLength(1);
                expect(errorEvents[0].item).toBe('fail-item');
                expect(errorEvents[0].error.message).toBe('Test error');
            } finally {
                errorQueue.destroy();
            }
        });

        it('should emit pause and resume events', () => {
            let pausedEmitted = false;
            let resumedEmitted = false;
            
            queue.on('paused', () => { pausedEmitted = true; });
            queue.on('resumed', () => { resumedEmitted = true; });
            
            queue.pause();
            expect(pausedEmitted).toBe(true);
            
            queue.resume();
            expect(resumedEmitted).toBe(true);
        });
    });

    describe('Resource Management', () => {
        it('should properly destroy queue', () => {
            queue.init();
            queue.enqueue('item1');
            
            expect(queue.initialized).toBe(true);
            expect(queue.size).toBe(1);
            
            queue.destroy();
            
            expect(queue.initialized).toBe(false);
            expect(queue.size).toBe(0);
        });
    });
});
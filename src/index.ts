export * from './batch.js';
export * from './check.js';
export * from './clock.js';
export * from './event-emitter.js';
export * from './loop.js';
export * from './map.js';
export * from './match.js';
export * from './math.js';
export * from './queue.js';
export * from './sleep.js';
export * from './statestack.js';
export * from './stream.js';
export * from './text.js';

/**
 * Debounce function execution
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown | Promise<unknown>>(
	func: T,
	delay: number
) => {
	let timeoutId: NodeJS.Timeout;
	return ((...args: unknown[]) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func(...args);
		}, delay);
	}) as T;
};
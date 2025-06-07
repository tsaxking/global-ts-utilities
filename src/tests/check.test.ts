import { describe, it, expect } from 'vitest';
import { Ok, Err, attempt, attemptAsync, ResultPromise } from '../check';

describe('Ok', () => {
	it('isOk() returns true', () => {
		const result = new Ok('hello');
		expect(result.isOk()).toBe(true);
		expect(result.isErr()).toBe(false);
	});

	it('unwrap() returns value', () => {
		const result = new Ok(123);
		expect(result.unwrap()).toBe(123);
	});

	it('expect() returns value', () => {
		const result = new Ok('yay');
		expect(result.expect('should not throw')).toBe('yay');
	});

	it('unwrapOr() ignores fallback', () => {
		const result = new Ok('value');
		expect(result.unwrapOr('fallback')).toBe('value');
	});
});

describe('Err', () => {
	it('isErr() returns true', () => {
		const result = new Err(new Error('oops'));
		expect(result.isOk()).toBe(false);
		expect(result.isErr()).toBe(true);
	});

	it('unwrap() throws the error', () => {
		const result = new Err(new Error('fail'));
		expect(() => result.unwrap()).toThrow('fail');
	});

	it('expect() throws a new error with given message', () => {
		const result = new Err(new Error('ignored'));
		expect(() => result.expect('custom')).toThrow('custom');
	});

	it('unwrapOr() returns fallback', () => {
		const result = new Err(new Error('nope'));
		expect(result.unwrapOr('fallback')).toBe('fallback');
	});

	it('handle() converts to Ok', () => {
		const result = new Err(new Error('bad')).handle('recovered');
		expect(result.isOk()).toBe(true);
		expect(result.unwrap()).toBe('recovered');
	});
});

describe('attempt', () => {
	it('returns Ok on success', () => {
		const result = attempt(() => 42);
		expect(result.isOk()).toBe(true);
		expect(result.unwrap()).toBe(42);
	});

	it('returns Err on failure', () => {
		const result = attempt(() => {
			throw new Error('boom');
		});
		expect(result.isErr()).toBe(true);
		expect(() => result.unwrap()).toThrow('boom');
	});

	it('uses parseError if provided', () => {
		const result = attempt(
			() => {
				throw new Error('fail');
			},
			err => new Error(`wrapped: ${err.message}`)
		);
		expect(result.isErr()).toBe(true);
		expect(() => result.unwrap()).toThrow('wrapped: fail');
	});
});

describe('attemptAsync', () => {
	it('resolves to Ok on success', async () => {
		const result = await attemptAsync(async () => 'async-ok');
		expect(result.isOk()).toBe(true);
		expect(result.unwrap()).toBe('async-ok');
	});

	it('resolves to Err on failure', async () => {
		const result = await attemptAsync(async () => {
			throw new Error('async-fail');
		});
		expect(result.isErr()).toBe(true);
		expect(() => result.unwrap()).toThrow('async-fail');
	});

	it('unwrap() works on ResultPromise', async () => {
		const promise = attemptAsync(async () => 100);
		const value = await promise.unwrap();
		expect(value).toBe(100);
	});

	it('unwrapOr() uses fallback on Err', async () => {
		const promise = attemptAsync<number>(async () => {
			throw new Error('err');
		});
		const value = await promise.unwrapOr(999);
		expect(value).toBe(999);
	});

	it('expect() throws custom message on Err', async () => {
		const promise = attemptAsync(async () => {
			throw new Error('err');
		});
		await expect(promise.expect('expected failure')).rejects.toThrow('expected failure');
	});
});

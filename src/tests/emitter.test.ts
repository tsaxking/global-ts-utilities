import { describe, it, expect, vi } from 'vitest';
import { EventEmitter, SimpleEventEmitter, ComplexEventEmitter } from '../event-emitter';

type Events = {
  start: void;
  data: [number, string];
  done: void;
};

describe('ComplexEventEmitter', () => {
  it('triggers listeners for void events', () => {
    const emitter = new ComplexEventEmitter<Events>();
    let started = false;

    emitter.on('start', () => {
      started = true;
    });

    const emittedCount = emitter.emit('start');

    expect(started).toBe(true);
    expect(emittedCount).toBe(1);
  });

  it('triggers listeners with tuple arguments', () => {
    const emitter = new ComplexEventEmitter<Events>();
    let received: [number, string] | null = null;

    const listener = (n: number, s: string) => {
      received = [n, s];
    };

    emitter.on('data', listener);

    const emittedCount = emitter.emit('data', 42, 'hello');

    expect(emittedCount).toBe(1);
    expect(received).toEqual([42, 'hello']);

    // Remove listener and emit again
    const removed = emitter.off('data', listener);
    expect(removed).toBe(true);

    const emittedCountAfterRemove = emitter.emit('data', 99, 'test');
    expect(emittedCountAfterRemove).toBe(0);
  });

  it('once listener is called only once', () => {
    const emitter = new ComplexEventEmitter<Events>();
    const fn = vi.fn();

    emitter.once('done', fn);

    emitter.emit('done');
    emitter.emit('done'); // Should not call again

    expect(fn).toHaveBeenCalledOnce();
  });

  it('off without listener removes all listeners for event', () => {
    const emitter = new ComplexEventEmitter<Events>();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    emitter.on('start', fn1);
    emitter.on('start', fn2);

    emitter.off('start');
    const emittedCount = emitter.emit('start');

    expect(emittedCount).toBe(0);
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it('does not fail if off tries to remove unregistered listener', () => {
    const emitter = new ComplexEventEmitter<Events>();
    const fn = vi.fn();
    const result = emitter.off('start', fn);
    expect(result).toBe(false);
  });
});

describe('SimpleEventEmitter (string keys)', () => {
  type Keys = 'start' | 'stop' | 'log';

  const emitter = new SimpleEventEmitter<Keys>();

  it('calls on() and emit()', () => {
    const spy = vi.fn();
    emitter.on('log', spy);
    emitter.emit('log');
    expect(spy).toHaveBeenCalledOnce();
    // expect(spy).toHaveBeenCalledWith();
  });

  it('calls once() only once', () => {
    const spy = vi.fn();
    emitter.once('start', spy);
    emitter.emit('start');
    emitter.emit('start');
    expect(spy).toHaveBeenCalledOnce();
    // expect(spy).toHaveBeenCalledWith();
  });

  it('off() removes the listener', () => {
    const spy = vi.fn();
    emitter.on('stop', spy);
    emitter.off('stop', spy);
    emitter.emit('stop');
    expect(spy).not.toHaveBeenCalled();
  });

  it('off() with no listener clears all', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    emitter.on('log', spy1);
    emitter.on('log', spy2);
    emitter.off('log');
    emitter.emit('log');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});

describe('EventEmitter', () => {
  type TestEvents = {
    test: string;
    error: Error;
  };

  const emitter = new EventEmitter<TestEvents>();

  it('calls on() and emit()', () => {
    const spy = vi.fn();
    emitter.on('test', spy);
    emitter.emit('test', 'hello');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('calls once() only once', () => {
    const spy = vi.fn();
    emitter.once('test', spy);
    emitter.emit('test', 'first');
    emitter.emit('test', 'second');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('first');
  });

  it('off() removes the listener', () => {
    const spy = vi.fn();
    emitter.on('error', spy);
    emitter.off('error', spy);
    emitter.emit('error', new Error('should not fire'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('off() with no listener clears all', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    emitter.on('test', spy1);
    emitter.on('test', spy2);
    emitter.off('test');
    emitter.emit('test', 'gone');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});
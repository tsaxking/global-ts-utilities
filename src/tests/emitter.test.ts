import { describe, it, expect, vi } from 'vitest';
import { EventEmitter, SimpleEventEmitter } from '../event-emitter';

describe('EventEmitter (typed)', () => {
  type Events = {
    ping: void;
    update: boolean;
    data: [string, number];
  };

  const emitter = new EventEmitter<Events>();

  it('calls on() and emit() with correct arguments', () => {
    const spy = vi.fn();
    emitter.on('data', spy);
    emitter.emit('data', 'hi', 123);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('hi', 123);
  });

  it('handles void events correctly', () => {
    const spy = vi.fn();
    emitter.on('ping', spy);
    emitter.emit('ping');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('calls once() only once', () => {
    const spy = vi.fn();
    emitter.once('update', spy);
    emitter.emit('update', true);
    emitter.emit('update', false);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('off() removes the listener', () => {
    const spy = vi.fn();
    emitter.on('update', spy);
    emitter.off('update', spy);
    emitter.emit('update', true);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('SimpleEventEmitter (string keys)', () => {
  type Keys = 'start' | 'stop' | 'log';

  const emitter = new SimpleEventEmitter<Keys>();

  it('calls on() and emit()', () => {
    const spy = vi.fn();
    emitter.on('log', spy);
    emitter.emit('log', 'hello', 42);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('hello', 42);
  });

  it('calls once() only once', () => {
    const spy = vi.fn();
    emitter.once('start', spy);
    emitter.emit('start', 'first');
    emitter.emit('start', 'second');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('first');
  });

  it('off() removes the listener', () => {
    const spy = vi.fn();
    emitter.on('stop', spy);
    emitter.off('stop', spy);
    emitter.emit('stop', 'should not fire');
    expect(spy).not.toHaveBeenCalled();
  });

  it('off() with no listener clears all', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    emitter.on('log', spy1);
    emitter.on('log', spy2);
    emitter.off('log');
    emitter.emit('log', 'gone');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});

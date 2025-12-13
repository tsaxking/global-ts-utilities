/**
 * Branded number types for type-safe numeric operations
 * Provides strongly-typed integer and floating-point types with runtime validation
 * to prevent mixing of incompatible numeric types and ensure value range safety.
 */

import { Brand } from "./brand";
import { attempt } from "../check";

/** 8-bit signed integer (-128 to 127) */
export type i8 = Brand<number, 'i8'>;
/** 16-bit signed integer (-32,768 to 32,767) */
export type i16 = Brand<number, 'i16'>;
/** 32-bit signed integer (-2,147,483,648 to 2,147,483,647) */
export type i32 = Brand<number, 'i32'>;
/** 64-bit signed integer (bigint) */
export type i64 = Brand<bigint, 'i64'>;
/** 8-bit unsigned integer (0 to 255) */
export type u8 = Brand<number, 'u8'>;
/** 16-bit unsigned integer (0 to 65,535) */
export type u16 = Brand<number, 'u16'>;
/** 32-bit unsigned integer (0 to 4,294,967,295) */
export type u32 = Brand<number, 'u32'>;
/** 64-bit unsigned integer (bigint) */
export type u64 = Brand<bigint, 'u64'>;
/** 32-bit IEEE 754 single precision float */
export type f32 = Brand<number, 'f32'>;
/** 64-bit IEEE 754 double precision float */
export type f64 = Brand<number, 'f64'>;

/**
 * Validates that a number is within the specified range
 * @private
 */
const between = (n: number, min: number, max: number, type: string) => {
    if (n < min || n > max) throw new RangeError(`Value ${n} out of range for ${type} (${min} to ${max})`);
}

/**
 * Validates that a bigint is within the specified range
 * @private
 */
const betweenBigInt = (n: bigint, min: bigint, max: bigint, type: string) => {
    if (n < min || n > max) throw new RangeError(`Value ${n} out of range for ${type} (${min} to ${max})`);
}

/**
 * Validates that a number is an integer
 * @private
 */
const isInt = (n: number, type: string) => {
    if (!Number.isInteger(n)) throw new TypeError(`Value ${n} is not an integer for ${type}`);
}

/**
 * Validates that a number is finite
 * @private
 */
const isFinite = (n: number, type: string) => {
    if (!Number.isFinite(n)) throw new TypeError(`Value ${n} is not finite for ${type}`);
}

// Signed Integer Types

/**
 * Creates a validated 8-bit signed integer
 * @param n - Number to validate and brand as i8
 * @returns Result containing the branded i8 value or an error
 */
export const i8 = (n: number) => attempt(() => {
    between(n, -128, 127, 'i8');
    isInt(n, 'i8');
    return n as i8;
});

/**
 * Creates a validated 16-bit signed integer
 */
export const i16 = (n: number) => attempt(() => {
    between(n, -32768, 32767, 'i16');
    isInt(n, 'i16');
    return n as i16;
});

/**
 * Creates a validated 32-bit signed integer
 */
export const i32 = (n: number) => attempt(() => {
    between(n, -2147483648, 2147483647, 'i32');
    isInt(n, 'i32');
    return n as i32;
});

/**
 * Creates a validated 64-bit signed integer
 */
export const i64 = (n: number | bigint) => attempt(() => {
    const bigN = typeof n === 'number' ? BigInt(Math.floor(n)) : n;
    betweenBigInt(bigN, -9223372036854775808n, 9223372036854775807n, 'i64');
    return bigN as i64;
});

// Unsigned Integer Types

/**
 * Creates a validated 8-bit unsigned integer
 */
export const u8 = (n: number) => attempt(() => {
    between(n, 0, 255, 'u8');
    isInt(n, 'u8');
    return n as u8;
});

/**
 * Creates a validated 16-bit unsigned integer
 */
export const u16 = (n: number) => attempt(() => {
    between(n, 0, 65535, 'u16');
    isInt(n, 'u16');
    return n as u16;
});

/**
 * Creates a validated 32-bit unsigned integer
 */
export const u32 = (n: number) => attempt(() => {
    between(n, 0, 4294967295, 'u32');
    isInt(n, 'u32');
    return n as u32;
});

/**
 * Creates a validated 64-bit unsigned integer
 */
export const u64 = (n: number | bigint) => attempt(() => {
    const bigN = typeof n === 'number' ? BigInt(Math.floor(Math.abs(n))) : n;
    betweenBigInt(bigN, 0n, 18446744073709551615n, 'u64');
    return bigN as u64;
});

// Floating Point Types

/**
 * Creates a validated 32-bit IEEE 754 single precision float
 */
export const f32 = (n: number) => attempt(() => {
    isFinite(n, 'f32');
    return Math.fround(n) as f32;
});

/**
 * Creates a validated 64-bit IEEE 754 double precision float
 */
export const f64 = (n: number) => attempt(() => {
    isFinite(n, 'f64');
    return n as f64;
});

// Constants and utilities

/** Minimum and maximum values for each integer type */
export const LIMITS = {
    i8: { min: -128, max: 127 },
    i16: { min: -32768, max: 32767 },
    i32: { min: -2147483648, max: 2147483647 },
    i64: { min: -9223372036854775808n, max: 9223372036854775807n },
    u8: { min: 0, max: 255 },
    u16: { min: 0, max: 65535 },
    u32: { min: 0, max: 4294967295 },
    u64: { min: 0n, max: 18446744073709551615n }
} as const;
/**
 * Branded string types for type-safe string operations
 * Provides strongly-typed string variants with runtime validation
 * to ensure string format compliance and prevent invalid data propagation.
 */

import { Brand } from "./brand";
import { attempt } from "../check";

// Basic String Types

/** A non-empty string */
export type NonEmptyString = Brand<string, 'NonEmpty'>;

/** A single character string */
export type Char = Brand<string, 'Char'>;

/** A string containing only whitespace characters */
export type WhitespaceString = Brand<string, 'Whitespace'>;

/** A string with no leading or trailing whitespace */
export type TrimmedString = Brand<string, 'Trimmed'>;

// Formatted String Types

/** A Base64 encoded string */
export type Base64String = Brand<string, 'Base64'>;

/** A valid JSON string */
export type JsonString = Brand<string, 'Json'>;

/** A hexadecimal string (0-9, a-f, A-F) */
export type HexString = Brand<string, 'Hex'>;

/** A UUID string in standard format */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

/** A valid URL string */
export type URLString = Brand<string, 'URL'>;

/** A valid email address string */
export type EmailString = Brand<string, 'Email'>;

/** A valid IPv4 address string */
export type IpV4String = Brand<string, 'IPv4'>;

/** A valid IPv6 address string */
export type IpV6String = Brand<string, 'IPv6'>;

/** A phone number string */
export type PhoneString = Brand<string, 'Phone'>;

// Character Set Types

/** A string containing only alphabetic characters */
export type AlphaString = Brand<string, 'Alpha'>;

/** A string containing only alphanumeric characters */
export type AlphanumericString = Brand<string, 'Alphanumeric'>;

/** A string containing only numeric characters */
export type NumericString = Brand<string, 'Numeric'>;

/** A string containing only uppercase characters */
export type UppercaseString = Brand<string, 'Uppercase'>;

/** A string containing only lowercase characters */
export type LowercaseString = Brand<string, 'Lowercase'>;

// Date and Time Types

/** An ISO 8601 date string */
export type IsoDateString = Brand<string, 'IsoDate'>;

/** An ISO 8601 time string */
export type IsoTimeString = Brand<string, 'IsoTime'>;

/** An ISO 8601 datetime string */
export type IsoDateTimeString = Brand<string, 'IsoDateTime'>;

// Technical Types

/** A semantic version string (semver) */
export type SemVerString = Brand<string, 'SemVer'>;

/** A valid file path string */
export type FilePathString = Brand<string, 'FilePath'>;

/** A valid filename string */
export type FilenameString = Brand<string, 'Filename'>;

/** A file extension string */
export type FileExtensionString = Brand<string, 'FileExtension'>;

/** A CSS class name string */
export type CssClassString = Brand<string, 'CssClass'>;

/** A JavaScript variable name string */
export type JsVariableString = Brand<string, 'JsVariable'>;

/** An SQL identifier string */
export type SqlIdentifierString = Brand<string, 'SqlIdentifier'>;

/** An HTML tag name string */
export type HtmlTagString = Brand<string, 'HtmlTag'>;

// Security Types

/** A strong password string */
export type StrongPasswordString = Brand<string, 'StrongPassword'>;

/** A hash string (MD5, SHA256, etc.) */
export type HashString = Brand<string, 'Hash'>;

/** A JWT token string */
export type JwtString = Brand<string, 'Jwt'>;

// Constructors

/**
 * Creates a validated non-empty string
 * @param str - String to validate
 * @returns Result containing the branded NonEmptyString or an error
 */
export const nonEmptyString = (str: string) => attempt(() => {
    if (str.length === 0) {
        throw new Error("String cannot be empty");
    }
    return str as NonEmptyString;
});

/**
 * Creates a validated single character string
 * @param char - String to validate as single character
 */
export const char = (char: string) => attempt(() => {
    if (char.length !== 1) {
        throw new Error("String must be a single character");
    }
    return char as Char;
});

/**
 * Creates a validated whitespace-only string
 * @param str - String to validate
 */
export const whitespaceString = (str: string) => attempt(() => {
    if (!/^\s+$/.test(str)) {
        throw new Error("String must contain only whitespace characters");
    }
    return str as WhitespaceString;
});

/**
 * Creates a validated trimmed string (no leading/trailing whitespace)
 * @param str - String to validate
 */
export const trimmedString = (str: string) => attempt(() => {
    if (str !== str.trim()) {
        throw new Error("String must not have leading or trailing whitespace");
    }
    return str as TrimmedString;
});

/**
 * Creates a validated Base64 string
 * @param str - String to validate as Base64
 */
export const base64String = (str: string) => attempt(() => {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str) || str.length % 4 !== 0) {
        throw new Error("String is not valid Base64");
    }
    return str as Base64String;
});

/**
 * Creates a validated JSON string
 * @param str - String to validate as JSON
 */
export const jsonString = (str: string) => attempt(() => {
    try {
        JSON.parse(str);
    } catch {
        throw new Error("String is not valid JSON");
    }
    return str as JsonString;
});

/**
 * Creates a validated hexadecimal string
 * @param str - String to validate as hex
 */
export const hexString = (str: string) => attempt(() => {
    if (!/^[0-9a-fA-F]+$/.test(str)) {
        throw new Error("String is not valid hexadecimal");
    }
    return str as HexString;
});

/**
 * Checks if a character is a valid hex digit
 * @param char - Character to check
 */
export const isHexChar = (char: Char): boolean => {
    return /^[0-9a-fA-F]$/.test(char);
}

/**
 * Creates a validated UUID string
 * @param str - String to validate as UUID
 */
export const uuid = (str: string) => attempt(() => {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(str)) {
        throw new Error("String is not a valid UUID");
    }
    return str as UUID;
});

/**
 * Creates a validated URL string
 * @param str - String to validate as URL
 */
export const urlString = (str: string) => attempt(() => {
    try {
        new URL(str);
    } catch {
        throw new Error("String is not a valid URL");
    }
    return str as URLString;
});

/**
 * Creates a validated email address string
 * @param str - String to validate as email
 */
export const emailString = (str: string) => attempt(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(str)) {
        throw new Error("String is not a valid email address");
    }
    return str as EmailString;
});

/**
 * Creates a validated phone number string
 * @param str - String to validate as phone number
 */
export const phoneString = (str: string) => attempt(() => {
    // Accepts various formats: +1-234-567-8900, (234) 567-8900, 234.567.8900, etc.
    const phoneRegex = /^[+]?[(]?[0-9\s\-().\/]{10,}$/;
    if (!phoneRegex.test(str)) {
        throw new Error("String is not a valid phone number");
    }
    return str as PhoneString;
});

/**
 * Creates a validated IPv4 address string
 * @param str - String to validate as IPv4
 */
export const ipV4String = (str: string) => attempt(() => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(str)) {
        throw new Error("String is not a valid IPv4 address");
    }
    return str as IpV4String;
});

/**
 * Creates a validated IPv6 address string
 * @param str - String to validate as IPv6
 */
export const ipV6String = (str: string) => attempt(() => {
    const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,7}:|(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,5}(?::[a-fA-F0-9]{1,4}){1,2}|(?:[a-fA-F0-9]{1,4}:){1,4}(?::[a-fA-F0-9]{1,4}){1,3}|(?:[a-fA-F0-9]{1,4}:){1,3}(?::[a-fA-F0-9]{1,4}){1,4}|(?:[a-fA-F0-9]{1,4}:){1,2}(?::[a-fA-F0-9]{1,4}){1,5}|[a-fA-F0-9]{1,4}:(?::[a-fA-F0-9]{1,4}){1,6}|:(?::[a-fA-F0-9]{1,4}){1,7}|::$/;
    if (!ipv6Regex.test(str)) {
        throw new Error("String is not a valid IPv6 address");
    }
    return str as IpV6String;
});

// Character Set Validators

/**
 * Creates a validated alphabetic-only string
 * @param str - String to validate
 */
export const alphaString = (str: string) => attempt(() => {
    if (!/^[a-zA-Z]+$/.test(str)) {
        throw new Error("String must contain only alphabetic characters");
    }
    return str as AlphaString;
});

/**
 * Creates a validated alphanumeric string
 * @param str - String to validate
 */
export const alphanumericString = (str: string) => attempt(() => {
    if (!/^[a-zA-Z0-9]+$/.test(str)) {
        throw new Error("String must contain only alphanumeric characters");
    }
    return str as AlphanumericString;
});

/**
 * Creates a validated numeric-only string
 * @param str - String to validate
 */
export const numericString = (str: string) => attempt(() => {
    if (!/^[0-9]+$/.test(str)) {
        throw new Error("String must contain only numeric characters");
    }
    return str as NumericString;
});

/**
 * Creates a validated uppercase-only string
 * @param str - String to validate
 */
export const uppercaseString = (str: string) => attempt(() => {
    if (str !== str.toUpperCase() || !/[A-Z]/.test(str)) {
        throw new Error("String must contain only uppercase characters");
    }
    return str as UppercaseString;
});

/**
 * Creates a validated lowercase-only string
 * @param str - String to validate
 */
export const lowercaseString = (str: string) => attempt(() => {
    if (str !== str.toLowerCase() || !/[a-z]/.test(str)) {
        throw new Error("String must contain only lowercase characters");
    }
    return str as LowercaseString;
});

// Date and Time Validators

/**
 * Creates a validated ISO 8601 date string (YYYY-MM-DD)
 * @param str - String to validate
 */
export const isoDateString = (str: string) => attempt(() => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(str)) {
        throw new Error("String is not a valid ISO date (YYYY-MM-DD)");
    }
    const date = new Date(str + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
        throw new Error("String is not a valid date");
    }
    return str as IsoDateString;
});

/**
 * Creates a validated ISO 8601 time string (HH:MM:SS or HH:MM:SS.sss)
 * @param str - String to validate
 */
export const isoTimeString = (str: string) => attempt(() => {
    const isoTimeRegex = /^\d{2}:\d{2}:\d{2}(\.\d{3})?$/;
    if (!isoTimeRegex.test(str)) {
        throw new Error("String is not a valid ISO time (HH:MM:SS or HH:MM:SS.sss)");
    }
    return str as IsoTimeString;
});

/**
 * Creates a validated ISO 8601 datetime string
 * @param str - String to validate
 */
export const isoDateTimeString = (str: string) => attempt(() => {
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateTimeRegex.test(str)) {
        throw new Error("String is not a valid ISO datetime");
    }
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        throw new Error("String is not a valid datetime");
    }
    return str as IsoDateTimeString;
});

// Technical Validators

/**
 * Creates a validated semantic version string
 * @param str - String to validate as semver
 */
export const semVerString = (str: string) => attempt(() => {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!semverRegex.test(str)) {
        throw new Error("String is not a valid semantic version");
    }
    return str as SemVerString;
});

/**
 * Creates a validated file path string
 * @param str - String to validate as file path
 */
export const filePathString = (str: string) => attempt(() => {
    // Basic validation - no null bytes, reasonable length
    if (str.includes('\0') || str.length > 4096) {
        throw new Error("String is not a valid file path");
    }
    return str as FilePathString;
});

/**
 * Creates a validated filename string (no path separators)
 * @param str - String to validate as filename
 */
export const filenameString = (str: string) => attempt(() => {
    if (/[\/\\\0]/.test(str) || str === '.' || str === '..' || str.length === 0) {
        throw new Error("String is not a valid filename");
    }
    return str as FilenameString;
});

/**
 * Creates a validated file extension string
 * @param str - String to validate as file extension
 */
export const fileExtensionString = (str: string) => attempt(() => {
    if (!/^\.[a-zA-Z0-9]+$/.test(str)) {
        throw new Error("String is not a valid file extension");
    }
    return str as FileExtensionString;
});

/**
 * Creates a validated CSS class name string
 * @param str - String to validate as CSS class
 */
export const cssClassString = (str: string) => attempt(() => {
    if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(str)) {
        throw new Error("String is not a valid CSS class name");
    }
    return str as CssClassString;
});

/**
 * Creates a validated JavaScript variable name string
 * @param str - String to validate as JS variable
 */
export const jsVariableString = (str: string) => attempt(() => {
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)) {
        throw new Error("String is not a valid JavaScript variable name");
    }
    // Check against reserved words
    const reserved = ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'];
    if (reserved.includes(str)) {
        throw new Error("String is a reserved JavaScript keyword");
    }
    return str as JsVariableString;
});

/**
 * Creates a validated SQL identifier string
 * @param str - String to validate as SQL identifier
 */
export const sqlIdentifierString = (str: string) => attempt(() => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)) {
        throw new Error("String is not a valid SQL identifier");
    }
    return str as SqlIdentifierString;
});

/**
 * Creates a validated HTML tag name string
 * @param str - String to validate as HTML tag
 */
export const htmlTagString = (str: string) => attempt(() => {
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]*)*$/.test(str)) {
        throw new Error("String is not a valid HTML tag name");
    }
    return str as HtmlTagString;
});

// Security Validators

/**
 * Creates a validated strong password string
 * @param str - String to validate as strong password
 */
export const strongPasswordString = (str: string) => attempt(() => {
    if (str.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }
    if (!/[a-z]/.test(str)) {
        throw new Error("Password must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(str)) {
        throw new Error("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(str)) {
        throw new Error("Password must contain at least one number");
    }
    if (!/[^a-zA-Z0-9]/.test(str)) {
        throw new Error("Password must contain at least one special character");
    }
    return str as StrongPasswordString;
});

/**
 * Creates a validated hash string (hex format)
 * @param str - String to validate as hash
 */
export const hashString = (str: string) => attempt(() => {
    if (!/^[a-fA-F0-9]+$/.test(str)) {
        throw new Error("String is not a valid hash (must be hexadecimal)");
    }
    // Common hash lengths: MD5(32), SHA1(40), SHA256(64), SHA512(128)
    if (![32, 40, 64, 128].includes(str.length)) {
        throw new Error("String length does not match common hash formats");
    }
    return str as HashString;
});

/**
 * Creates a validated JWT token string
 * @param str - String to validate as JWT
 */
export const jwtString = (str: string) => attempt(() => {
    const parts = str.split('.');
    if (parts.length !== 3) {
        throw new Error("JWT must have exactly 3 parts separated by dots");
    }
    for (const part of parts) {
        if (!/^[A-Za-z0-9_-]+$/.test(part)) {
            throw new Error("JWT parts must be valid base64url encoded");
        }
    }
    return str as JwtString;
});
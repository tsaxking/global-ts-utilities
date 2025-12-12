/**
 * Text utility functions for string manipulation, formatting, and conversion
 * Provides comprehensive string processing capabilities including case conversion,
 * formatting, encoding, and text transformation utilities.
 */

/**
 * Capitalizes the first letter of every word in a string
 * 
 * @param str - The string to capitalize
 * @returns The string with each word's first letter capitalized
 * 
 * @example
 * ```typescript
 * capitalize('hello world') // 'Hello World'
 * capitalize('the quick brown fox') // 'The Quick Brown Fox'
 * capitalize('already Capitalized') // 'Already Capitalized'
 * ```
 */
export const capitalize = (str: string): string =>
    str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substring(1)
    );

/**
 * Converts any string to camelCase
 * 
 * @param str - The string to convert to camelCase
 * @returns The string converted to camelCase format
 * 
 * @example
 * ```typescript
 * toCamelCase('hello world') // 'helloWorld'
 * toCamelCase('the quick brown fox') // 'theQuickBrownFox'
 * toCamelCase('already-hyphenated') // 'alreadyHyphenated'
 * toCamelCase('PascalCase') // 'pascalCase'
 * ```
 */
export const toCamelCase = (str: string): string =>
    str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');

/**
 * Converts a string to snake_case
 * 
 * @param str - The string to convert to snake_case
 * @param del - The delimiter to use (default: '_')
 * @returns The string converted to snake_case format
 * 
 * @example
 * ```typescript
 * toSnakeCase('helloWorld') // 'hello_world'
 * toSnakeCase('theQuickBrownFox') // 'the_quick_brown_fox'
 * toSnakeCase('PascalCase') // '_pascal_case'
 * toSnakeCase('some text here') // 'some_text_here'
 * toSnakeCase('customDelimiter', '-') // 'custom-delimiter'
 * ```
 */
export const toSnakeCase = (str: string, del = '_'): string =>
    str
        .replace(/([A-Z])/g, g => `${del}${g[0].toLowerCase()}`)
        .replace(/\s+/g, '_');

/**
 * Converts a string from camelCase to space-separated words
 * 
 * @param str - The camelCase string to convert
 * @returns The string converted from camelCase with spaces before capital letters
 * 
 * @example
 * ```typescript
 * fromCamelCase('helloWorld') // 'hello world'
 * fromCamelCase('theQuickBrownFox') // 'the quick brown fox'
 * fromCamelCase('XMLHttpRequest') // 'x m l http request'
 * fromCamelCase('simpleString') // 'simple string'
 * ```
 */
export const fromCamelCase = (str: string): string =>
    str.replace(/([A-Z])/g, g => ` ${g[0].toLowerCase()}`);

/**
 * Converts a string from snake_case to space-separated words
 * 
 * @param str - The snake_case string to convert
 * @param del - The delimiter to replace (default: '_')
 * @returns The string converted from snake_case with spaces
 * 
 * @example
 * ```typescript
 * fromSnakeCase('hello_world') // 'hello world'
 * fromSnakeCase('the_quick_brown_fox') // 'the quick brown fox'
 * fromSnakeCase('some-hyphenated-text', '-') // 'some hyphenated text'
 * fromSnakeCase('UPPER_CASE') // 'u p p e r case'
 * ```
 */
export const fromSnakeCase = (str: string, del = '_'): string =>
    str
        .replace(/([A-Z])/g, g => ` ${g[0].toLowerCase()}`)
        .replace(new RegExp(del, 'g'), ' ');

/** Default delimiter used for stream operations */
export const streamDelimiter = '<';

/**
 * Abbreviates a string to a given length by appending ellipsis
 * 
 * @param string - The string to abbreviate
 * @param length - Maximum length including ellipsis (minimum: 3, default: 10)
 * @returns The abbreviated string with '...' if truncated, or original if within length
 * 
 * @throws {Error} When length is less than 3
 * 
 * @example
 * ```typescript
 * abbreviate('Hello World', 8) // 'Hello...'
 * abbreviate('Short', 10) // 'Short'
 * abbreviate('Very long string here', 15) // 'Very long st...'
 * abbreviate('Hi', 5) // 'Hi'
 * ```
 */
export const abbreviate = (string: string, length = 10): string => {
    if (length < 3) throw new Error('Abbreviation length must be at least 3');

    if (string.length <= length) return string;
    return string.substring(0, length - 3) + '...';
};

/**
 * Converts a byte count to a human-readable string with appropriate units
 * 
 * @param byte - The number of bytes to format
 * @returns Formatted string with size and unit (B, KB, MB, GB, or TB)
 * 
 * @example
 * ```typescript
 * toByteString(1024) // '1.00 KB'
 * toByteString(1048576) // '1.00 MB'
 * toByteString(500) // '500.00 B'
 * toByteString(1073741824) // '1.00 GB'
 * toByteString(2500000000) // '2.33 GB'
 * ```
 */
export const toByteString = (byte: number): string => {
    const sizes = {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776
    };

    const i = Math.floor(Math.log(byte) / Math.log(1024));
    return `${(byte / sizes[Object.keys(sizes)[i] as keyof typeof sizes]).toFixed(2)} ${
        Object.keys(sizes)[i]
    }`;
};

/**
 * Recursively parses each key of an object with a given parser function
 * Useful for transforming object keys (e.g., converting from camelCase)
 * 
 * @param obj - The object to parse
 * @param parser - Function to transform each key
 * @returns New object with transformed keys, or original value if not an object
 * 
 * @example
 * ```typescript
 * const obj = { firstName: 'John', lastName: 'Doe' };
 * parseObject(obj, fromCamelCase) // { 'first name': 'John', 'last name': 'Doe' }
 * 
 * const nested = { userInfo: { firstName: 'Jane', emailAddress: 'jane@example.com' } };
 * parseObject(nested, toSnakeCase) // { user_info: { first_name: 'Jane', email_address: 'jane@example.com' } }
 * 
 * const arr = [{ itemName: 'Apple' }, { itemName: 'Banana' }];
 * parseObject(arr, fromCamelCase) // [{ 'item name': 'Apple' }, { 'item name': 'Banana' }]
 * ```
 */
export const parseObject = (
    obj: object,
    parser: (str: string) => string
): unknown => {
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj))
        return obj.map(o => parseObject(o as object, parser));
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // only do the keys, not the values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newObj[parser(key)] = (obj as any)[key];
        }
    }
    return newObj;
};

/**
 * Formats a number with comma separators for thousands
 * 
 * @param num - The number to format (as number or string)
 * @returns The formatted number string with comma separators
 * 
 * @example
 * ```typescript
 * fmtNumber(1234567) // '1,234,567'
 * fmtNumber('1000000') // '1,000,000'
 * fmtNumber(42) // '42'
 * fmtNumber('999.99') // '999.99'
 * ```
 */
export const fmtNumber = (num: number | string): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Formats a number as a currency string with dollar sign
 * 
 * @param amount - The amount to format (as number or string)
 * @returns Formatted currency string with $ prefix and comma separators
 * 
 * @example
 * ```typescript
 * cost(1234.56) // '$1,234.56'
 * cost(-500.25) // '-$500.25'
 * cost('1000000') // '$1,000,000.00'
 * cost(0) // '$0.00'
 * ```
 */
export const cost = (amount: number | string): string => {
    return +amount >= 0
        ? `$${fmtNumber((+amount).toFixed(2))}`
        : `-$${Math.abs(+amount).toFixed(2)}`;
};

/**
 * Encodes a string by converting each character to its position in a custom character set
 * Each character is represented as a zero-padded 2-digit number
 * 
 * @param str - The string to encode
 * @returns Encoded string where each character becomes a 2-digit position number
 * 
 * @example
 * ```typescript
 * encode('AB') // '000102' (A=0, B=1)
 * encode('Hello') // Position-based encoding
 * ```
 * 
 * @see {@link decode} for the reverse operation
 */
export const encode = (str: string) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-=!@#$%^&*()_+[]{}|;:\'",.\<\>?/`~\\\n ';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        result += chars.indexOf(char).toString().padStart(2, '0');
    }

    return result;
};

/**
 * Decodes a string that was encoded using the encode function
 * Converts 2-digit position numbers back to their corresponding characters
 * 
 * @param str - The encoded string to decode
 * @returns Decoded string with original characters restored
 * 
 * @example
 * ```typescript
 * decode('000102') // 'AB'
 * decode(encode('Hello World')) // 'Hello World'
 * ```
 * 
 * @see {@link encode} for the encoding operation
 */
export const decode = (str: string) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-=!@#$%^&*()_+[]{}|;:\'",.<>?/`~\\\n ';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str.slice(i, i + 2);
        result += chars[parseInt(char)];
        i++;
    }

    return result;
};

/**
 * Recursively removes excessive whitespace from a string
 * Converts multiple spaces, tabs, and newlines to single spaces
 * 
 * @param str - The string to clean of excessive whitespace
 * @returns String with normalized whitespace
 * 
 * @example
 * ```typescript
 * removeWhitespace('hello    world') // 'hello world'
 * removeWhitespace('text\twith\n\ntabs') // 'text with tabs'
 * removeWhitespace('  multiple   spaces  ') // ' multiple spaces '
 * ```
 */
export const removeWhitespace = (str: string): string => {
    const res = str
        .replaceAll('  ', ' ')
        .replaceAll('    ', ' ')
        .replace('\n', ' ')
        .replace(/\t/g, ' ');
    if (res === str) return res;
    return removeWhitespace(res);
};

/**
 * Converts a decimal number to its binary representation
 * 
 * @param num - The decimal number to convert
 * @returns Binary representation as a string
 * 
 * @example
 * ```typescript
 * toBinary(5) // '101'
 * toBinary(255) // '11111111'
 * toBinary(0) // '0'
 * toBinary(16) // '10000'
 * ```
 */
export const toBinary = (num: number): string => {
    return num.toString(2);
};

/**
 * Converts a binary string to its decimal number representation
 * 
 * @param bin - The binary string to convert
 * @returns Decimal number representation
 * 
 * @example
 * ```typescript
 * fromBinary('101') // 5
 * fromBinary('11111111') // 255
 * fromBinary('0') // 0
 * fromBinary('10000') // 16
 * ```
 */
export const fromBinary = (bin: string): number => {
    return parseInt(bin, 2);
};

/**
 * Merges two strings by finding their common prefix and handling the remainder
 * Useful for finding common parts between strings
 * 
 * @param a - First string to merge
 * @param b - Second string to merge
 * @returns Merged string based on common prefix logic
 * 
 * @example
 * ```typescript
 * merge('hello', 'help') // 'hel'
 * merge('abc', 'def') // '' (no common prefix)
 * merge('same', 'same') // 'same'
 * merge('prefix_a', 'prefix_b') // 'prefix_'
 * ```
 */
export const merge = (a: string, b: string): string => {
    // merge two strings together

    const common = (a: string, b: string) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.substring(0, i);
    };
    const c = common(a, b);

    a = a.substring(c.length);
    b = b.substring(c.length);

    if (a.length === 0 && b.length === 0) return c;
    if (a.length === 0) return c + b;
    if (b.length === 0) return c + a;
    return c;
};

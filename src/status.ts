export type StatusCode =
    | 100
    | 101
    | 102
    | 103
    | 200
    | 201
    | 202
    | 203
    | 204
    | 205
    | 206
    | 207
    | 208
    | 226
    | 300
    | 301
    | 302
    | 303
    | 304
    | 305
    | 306
    | 307
    | 308
    | 400
    | 401
    | 402
    | 403
    | 404
    | 405
    | 406
    | 407
    | 408
    | 409
    | 410
    | 411
    | 412
    | 413
    | 414
    | 415
    | 416
    | 417
    | 418
    | 421
    | 422
    | 423
    | 424
    | 425
    | 426
    | 428
    | 429
    | 431
    | 451
    | 500
    | 501
    | 502
    | 503
    | 504
    | 505
    | 506
    | 507
    | 508
    | 510
    | 511;

export const validCodes: StatusCode[] = [
    100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300,
    301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406,
    407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423,
    424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507,
    508, 510, 511
];

export enum ServerCode {
    continue = 100,
    switchingProtocols = 101,
    processing = 102,
    earlyHints = 103,

    ok = 200,
    created = 201,
    accepted = 202,
    nonAuthoritativeInformation = 203,
    noContent = 204,
    resetContent = 205,
    partialContent = 206,
    multiStatus = 207,
    alreadyReported = 208,
    imUsed = 226,

    multipleChoices = 300,
    movedPermanently = 301,
    found = 302,
    seeOther = 303,
    notModified = 304,
    useProxy = 305,
    unused = 306,
    temporaryRedirect = 307,
    permanentRedirect = 308,

    badRequest = 400,
    unauthorized = 401,
    paymentRequired = 402,
    forbidden = 403,
    notFound = 404,
    methodNotAllowed = 405,
    notAcceptable = 406,
    proxyAuthenticationRequired = 407,
    requestTimeout = 408,
    conflict = 409,
    gone = 410,
    lengthRequired = 411,
    preconditionFailed = 412,
    payloadTooLarge = 413,
    uriTooLong = 414,
    unsupportedMediaType = 415,
    rangeNotSatisfiable = 416,
    expectationFailed = 417,
    imATeapot = 418,
    misdirectedRequest = 421,
    unprocessableEntity = 422,
    locked = 423,
    failedDependency = 424,
    tooEarly = 425,
    upgradeRequired = 426,
    preconditionRequired = 428,
    tooManyRequests = 429,
    requestHeaderFieldsTooLarge = 431,
    unavailableForLegalReasons = 451,

    internalServerError = 500,
    notImplemented = 501,
    badGateway = 502,
    serviceUnavailable = 503,
    gatewayTimeout = 504,
    httpVersionNotSupported = 505,
    variantAlsoNegotiates = 506,
    insufficientStorage = 507,
    loopDetected = 508,
    notExtended = 510,
    networkAuthenticationRequired = 511
}

export const getMessage = (code: ServerCode) => {
    switch (code) {
        case ServerCode.continue:
            return 'Continue';
        case ServerCode.switchingProtocols:
            return 'Switching Protocols';
        case ServerCode.processing:
            return 'Processing';
        case ServerCode.earlyHints:
            return 'Early Hints';
        case ServerCode.ok:
            return 'OK';
        case ServerCode.created:
            return 'Created';
        case ServerCode.accepted:
            return 'Accepted';
        case ServerCode.nonAuthoritativeInformation:
            return 'Non-Authoritative Information';
        case ServerCode.noContent:
            return 'No Content';
        case ServerCode.resetContent:
            return 'Reset Content';
        case ServerCode.partialContent:
            return 'Partial Content';
        case ServerCode.multiStatus:
            return 'Multi-Status';
        case ServerCode.alreadyReported:
            return 'Already Reported';
        case ServerCode.imUsed:
            return 'IM Used';
        case ServerCode.multipleChoices:
            return 'Multiple Choices';
        case ServerCode.movedPermanently:
            return 'Moved Permanently';
        case ServerCode.found:
            return 'Found';
        case ServerCode.seeOther:
            return 'See Other';
        case ServerCode.notModified:
            return 'Not Modified';
        case ServerCode.useProxy:
            return 'Use Proxy';
        case ServerCode.unused:
            return 'Unused';
        case ServerCode.temporaryRedirect:
            return 'Temporary Redirect';
        case ServerCode.permanentRedirect:
            return 'Permanent Redirect';
        case ServerCode.badRequest:
            return 'Bad Request';
        case ServerCode.unauthorized:
            return 'Unauthorized';
        case ServerCode.paymentRequired:
            return 'Payment Required';
        case ServerCode.forbidden:
            return 'Forbidden';
        case ServerCode.notFound:
            return 'Not Found';
        case ServerCode.methodNotAllowed:
            return 'Method Not Allowed';
        case ServerCode.notAcceptable:
            return 'Not Acceptable';
        case ServerCode.proxyAuthenticationRequired:
            return 'Proxy Authentication Required';
        case ServerCode.requestTimeout:
            return 'Request Timeout';
        case ServerCode.conflict:
            return 'Conflict';
        case ServerCode.gone:
            return 'Gone';
        case ServerCode.lengthRequired:
            return 'Length Required';
        case ServerCode.preconditionFailed:
            return 'Precondition Failed';
        case ServerCode.payloadTooLarge:
            return 'Payload Too Large';
        case ServerCode.uriTooLong:
            return 'URI Too Long';
        case ServerCode.unsupportedMediaType:
            return 'Unsupported Media Type';
        case ServerCode.rangeNotSatisfiable:
            return 'Range Not Satisfiable';
        case ServerCode.expectationFailed:
            return 'Expectation Failed';
        case ServerCode.imATeapot:
            return "I'm a teapot";
        case ServerCode.misdirectedRequest:
            return 'Misdirected Request';
        case ServerCode.unprocessableEntity:
            return 'Unprocessable Entity';
        case ServerCode.locked:
            return 'Locked';
        case ServerCode.failedDependency:
            return 'Failed Dependency';
        case ServerCode.tooEarly:
            return 'Too Early';
        case ServerCode.upgradeRequired:
            return 'Upgrade Required';
        case ServerCode.preconditionRequired:
            return 'Precondition Required';
        case ServerCode.tooManyRequests:
            return 'Too Many Requests';
        case ServerCode.requestHeaderFieldsTooLarge:
            return 'Request Header Fields Too Large';
        case ServerCode.unavailableForLegalReasons:
            return 'Unavailable For Legal Reasons';
        case ServerCode.internalServerError:
            return 'Internal Server Error';
        case ServerCode.notImplemented:
            return 'Not Implemented';
        case ServerCode.badGateway:
            return 'Bad Gateway';
        case ServerCode.serviceUnavailable:
            return 'Service Unavailable';
        case ServerCode.gatewayTimeout:
            return 'Gateway Timeout';
        case ServerCode.httpVersionNotSupported:
            return 'HTTP Version Not Supported';
        case ServerCode.variantAlsoNegotiates:
            return 'Variant Also Negotiates';
        case ServerCode.insufficientStorage:
            return 'Insufficient Storage';
        case ServerCode.loopDetected:
            return 'Loop Detected';
        case ServerCode.notExtended:
            return 'Not Extended';
        case ServerCode.networkAuthenticationRequired:
            return 'Network Authentication Required';
    }
};
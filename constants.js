/**
 * Created on 1398/11/25 (2020/2/14).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

const NBSP = '\u00A0' // No-Break SPace
const LRM = '\u200F'  // Left-to-Right Mark
const RLM = '\u200F'  // Right-to-Left Mark

const HTTP_STATUS = {
	CONTINUE: {status: 'Continue', code: 100},
	SWITCHING_PROTOCOLS: {status: 'Switching Protocols', code: 101},
	EARLY_HINTS: {status: 'Early Hints', code: 103},
	OK: {status: 'OK', code: 200},
	CREATED: {status: 'Created', code: 201},
	ACCEPTED: {status: 'Accepted', code: 202},
	NON_AUTHORITATIVE_INFORMATION: {status: 'Non-Authoritative Information', code: 203},
	NO_CONTENT: {status: 'No Content', code: 204},
	RESET_CONTENT: {status: 'Reset Content', code: 205},
	PARTIAL_CONTENT: {status: 'Partial Content', code: 206},
	MULTIPLE_CHOICES: {status: 'Multiple Choices', code: 300},
	MOVED_PERMANENTLY: {status: 'Moved Permanently', code: 301},
	FOUND: {status: 'Found', code: 302},
	SEE_OTHER: {status: 'See Other', code: 303},
	NOT_MODIFIED: {status: 'Not Modified', code: 304},
	TEMPORARY_REDIRECT: {status: 'Temporary Redirect', code: 307},
	PERMANENT_REDIRECT: {status: 'Permanent Redirect', code: 308},
	BAD_REQUEST: {status: 'Bad Request', code: 400},
	UNAUTHORIZED: {status: 'Unauthorized', code: 401},
	PAYMENT_REQUIRED: {status: 'Payment Required', code: 402},
	FORBIDDEN: {status: 'Forbidden', code: 403},
	NOT_FOUND: {status: 'Not Found', code: 404},
	METHOD_NOT_ALLOWED: {status: 'Method Not Allowed', code: 405},
	NOT_ACCEPTABLE: {status: 'Not Acceptable', code: 406},
	PROXY_AUTHENTICATION_REQUIRED: {status: 'Proxy Authentication Required', code: 407},
	REQUEST_TIMEOUT: {status: 'Request Timeout', code: 408},
	CONFLICT: {status: 'Conflict', code: 409},
	GONE: {status: 'Gone', code: 410},
	LENGTH_REQUIRED: {status: 'Length Required', code: 411},
	PRECONDITION_FAILED: {status: 'Precondition Failed', code: 412},
	PAYLOAD_TOO_LARGE: {status: 'Payload Too Large', code: 413},
	URI_TOO_LONG: {status: 'URI Too Long', code: 414},
	UNSUPPORTED_MEDIA_TYPE: {status: 'Unsupported Media Type', code: 415},
	RANGE_NOT_SATISFIABLE: {status: 'Range Not Satisfiable', code: 416},
	EXPECTATION_FAILED: {status: 'Expectation Failed', code: 417},
	I_M_A_TEAPOT: {status: 'I\'m a teapot', code: 418},
	UNPROCESSABLE_ENTITY: {status: 'Unprocessable Entity', code: 422},
	TOO_EARLY: {status: 'Too Early', code: 425},
	UPGRADE_REQUIRED: {status: 'Upgrade Required', code: 426},
	PRECONDITION_REQUIRED: {status: 'Precondition Required', code: 428},
	TOO_MANY_REQUESTS: {status: 'Too Many Requests', code: 429},
	REQUEST_HEADER_FIELDS_TOO_LARGE: {status: 'Request Header Fields Too Large', code: 431},
	UNAVAILABLE_FOR_LEGAL_REASONS: {status: 'Unavailable For Legal Reasons', code: 451},
	INTERNAL_SERVER_ERROR: {status: 'Internal Server Error', code: 500},
	NOT_IMPLEMENTED: {status: 'Not Implemented', code: 501},
	BAD_GATEWAY: {status: 'Bad Gateway', code: 502},
	SERVICE_UNAVAILABLE: {status: 'Service Unavailable', code: 503},
	GATEWAY_TIMEOUT: {status: 'Gateway Timeout', code: 504},
	HTTP_VERSION_NOT_SUPPORTED: {status: 'HTTP Version Not Supported', code: 505},
	VARIANT_ALSO_NEGOTIATES: {status: 'Variant Also Negotiates', code: 506},
	INSUFFICIENT_STORAGE: {status: 'Insufficient Storage', code: 507},
	LOOP_DETECTED: {status: 'Loop Detected', code: 508},
	NOT_EXTENDED: {status: 'Not Extended', code: 510},
	NETWORK_AUTHENTICATION_REQUIRED: {status: 'Network Authentication Required', code: 511},
}

const CONTENT_TYPES = {
	TEXT: {'Content-Type': 'text/plain; charset=utf-8'},
	HTML: {'Content-Type': 'text/html; charset=utf-8'},
	JSON: {'Content-Type': 'application/json; charset=utf-8'},
}

module.exports = {
	NBSP,
	LRM,
	RLM,
	HTTP_STATUS,
	CONTENT_TYPES,
}

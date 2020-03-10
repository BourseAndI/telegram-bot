/* global require, process, module */

const http = require('http')
const crypto = require('crypto')
const uuidV4 = require('uuid').v4

const {HTTP_STATUS, CONTENT_TYPES} = require('./constants')

/**
 * Created on 1398/11/22 (2020/2/11).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'


/**
 * Parse "set-cookie"s
 * @param setCookieStrs Example: `[ 'SESSION_COOKIE=xxx; path=/; secure; HttpOnly', '...', ... ]`
 * @returns {[{}]} Example: `[ { SESSION_COOKIE: 'xxx', path: '/', secure: true, HttpOnly: true }, ... ]`
 */
const parseSetCookies = setCookieStrs =>
		setCookieStrs.map(cookieStr => {
			const entries = cookieStr.split(';')   // ['SESSION_COOKIE=xxx', ' path=/', ' secure', ' HttpOnly']
					.map(setCookiePartStr => {  // " path=/"
								const [name, value] = setCookiePartStr.split('=')  // [" path", "/"], [" secure", undefined]
								return [name.trimStart(), value === undefined ? true : value] // ["path", "/"], [" secure", true]
							}
					)
			return Object.fromEntries(entries)
		})

/**
 * 'set-cookies' obj[] to 'cookies' obj
 * @param setCookies Example: `[ { SESSION_COOKIE: 'xxx', path: '/', secure: true }, {a: 'b', c: 'd'}, ... ]`
 * @returns {{}} Example: `{ SESSION_COOKIE: 'xxx', a: 'b' }`
 */
const setCookiesToCookies = setCookies =>
		setCookies.reduce((cookies, setCookie) => {
			const entries = Object.entries(setCookie)[0]  // only first member
			cookies[entries[0]] = entries[1]
			return cookies
		}, {})

/**
 * @param cookies Example: `{ SESSION_COOKIE: 'xxx', a: 'b' }`
 * @returns {string} Example: `SESSION_COOKIE=xxx; a=b; c=d`
 */
const stringifyCookies = cookies => Object.entries(cookies).map(cookie => cookie.join('=')).join('; ')

const combineColors = (foreColor, backColor, alpha) => alpha * foreColor + (1 - alpha) * backColor

const parseCookies = cookiesStr =>
		cookiesStr.split(';').reduce((acc, current) => {
			const [name, value] = current.split('=')
			acc[name.trimLeft()] = value
			return acc
		}, {})


const writeHeadAndEnd = function ({
												 status = HTTP_STATUS.OK,
												 statusMessage = status.status,
												 headers = CONTENT_TYPES.HTML,
												 data = `<h1>${status.code}</h1>` +
												 `<h2>${status.status}</h2>`,
												 encoding = 'utf-8',
												 callback = undefined,
											 } = {}) {
	this.writeHead(status.code, statusMessage, headers)
	this.end(data, encoding, callback)
}

const writeHeadAndEndJson = function ({
													  status = HTTP_STATUS.OK,
													  statusMessage = status.status,
													  headers = CONTENT_TYPES.JSON,
													  data = {},
													  encoding = 'utf-8',
													  callback = undefined,
												  } = {}) {
	this.writeHead(status.code, statusMessage, headers)
	this.end(JSON.stringify(data), encoding, callback)
}

const basicAuthParser = (authorization, res) => {
	const unauthorized = (res, ...msg) => {
		console.log(...msg, '/ Authorization:', authorization)
		writeHeadAndEnd.bind(res)({
			status: HTTP_STATUS.UNAUTHORIZED,
			statusMessage: msg.join(' / '),
			headers: {
				...CONTENT_TYPES.HTML,
				'WWW-Authenticate': 'Basic',
			}
		})
		return false
	}
	
	if (!authorization) return unauthorized(res, 'No Authorization')
	
	const isBasicAtFirst = authorization.startsWith('Basic ')
	if (!isBasicAtFirst) return unauthorized(res, 'Bad Authorization', 'No "Basic " at first')
	
	const credentials = Buffer.from(authorization.substr('Basic '.length), 'base64').toString()
	if (!credentials) return unauthorized(res, 'Bad credentials format', 'No base64 phrase provided')
	
	const indexOfColon = credentials.indexOf(':')
	if (indexOfColon === -1) return unauthorized(res, 'Bad credentials format', 'Not in "username:password" format. No colon found.')
	
	return {
		username: credentials.substr(0, indexOfColon),
		password: credentials.substr(indexOfColon + 1),
	}
}

class AesEncryption {
	constructor(key, {
		mode = 'cbc',
		defaultUnencryptedEncoding = 'utf8',
		defaultEncryptedEncoding = 'hex',
	} = {}) {
		this.key = key
		this.algorithm = `aes-${key.length * 8}-${mode}`
		this.defaultUnencryptedEncoding = defaultUnencryptedEncoding
		this.defaultEncryptedEncoding = defaultEncryptedEncoding
	}
	
	encrypt(text, iv, {
		inputEncoding = this.defaultUnencryptedEncoding,
		outputEncoding = this.defaultEncryptedEncoding,
	} = {}) {
		const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
		let encrypted = cipher.update(text, inputEncoding, outputEncoding)
		encrypted += cipher.final(outputEncoding)
		return encrypted
	}
	
	decrypt(encrypted, iv, {
		inputEncoding = this.defaultEncryptedEncoding,
		outputEncoding = this.defaultUnencryptedEncoding,
	} = {}) {
		const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
		let decrypted = decipher.update(encrypted, inputEncoding, outputEncoding)
		decrypted += decipher.final(outputEncoding)
		return decrypted
	}
}

const aesEncrypt = text => this.getAesCtr().encrypt(aesjs.utils.utf8.toBytes(text))

const randomStr10 = (l = undefined) => Math.random().toString(36).substr(2, l)

const getExternalIP = () => new Promise((resolve, reject) =>
		http.get({host: 'ipv4bot.whatismyipaddress.com', port: 80, path: '/'}, res => {
			if (res.statusCode !== 200) reject(`Not OK status code: ${res.statusCode}`)
			res.on('data', chunk => resolve(chunk.toString()))
		}).on('error', reject)
)

/**
 * convert `"/Date(###)/"` to `"###"`
 * @param date Matched in `/\/Date\(\d+\)\//`
 * @returns {number}
 */
const jsonDateToUnixTimestamp = date => parseInt(date.substring(6, date.length - 2))

const deepGet = function (...deepPath) {
	let obj = this
	for (const e of deepPath) {
		const nextObj = obj[e]
		if (nextObj === undefined) return
		obj = nextObj
	}
	return obj
}
const getOrDefineDeepPath = function (...deepPath) {
	let obj = this
	for (let [i, e] of deepPath.entries()) {
		let nextObj = obj[e]
		if (nextObj === undefined) {
			for (const l = deepPath.length - 1; i < l; i++) obj = obj[deepPath[i]] = {}
			return obj[deepPath[i]]
		}
		obj = nextObj
	}
	return obj
}

/**
 *
 * @param text
 * @param callback
 * @param action
 * @returns {CallbackButton}
 */
const callbackBtn = function (text, callback, action = null) {
	if (action === null) action = uuidV4()
	global['actions'][action] = (ctx, next) => {
		ctx.answerCbQuery()
		return callback(ctx, next)
	}
	return this.callbackButton(text, action)
}

module.exports = {
	parseSetCookies,
	setCookiesToCookies,
	stringifyCookies,
	combineColors,
	parseCookies,
	basicAuthParser,
	AesEncryption,
	getExternalIP,
	randomStr10,
	jsonDateToUnixTimestamp,
	deepGet,
	getOrDefineDeepPath,
	callbackBtn,
	writeHeadAndEnd,
	writeHeadAndEndJson,
}

const crypto = require('crypto')
const od = require('outdent')

const {RLM} = require('../constants')
const {AesEncryption} = require('../utils')
const {verifyCredential} = require('../functions')
const {AgahUser, TgUser} = require('../prepareDB')
const {BaseScene} = require('./base-scene')

/**
 * Created on 1398/11/25 (2020/2/14).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

const env = process.env

const aes = new AesEncryption(Buffer.from(env.AES_KEY, 'hex'), {defaultEncryptedEncoding: 'binary'})

// noinspection SpellCheckingInspection
const FLOWER_STICKER_1 = 'CAACAgQAAxkBAAPDXk1_P2rpYOGDJdWPwBklruV40SMAAuMAA_NilgYrEJPrbrOoTBgE'
const HTML_WITHOUT_PREVIEW = {disable_web_page_preview: true, parse_mode: 'HTML'}
//**************************************************************************************************/

class UsernameScene extends BaseScene {
	PLEASE_ENTER_USERNAME = `${RLM}\n\nنام کاربری خود را در <a href="https://bashgah.com/#!/login">سایت بآشگاه</a> وارد کنید:`
	
	constructor() {
		super('username')
	}
	
	async onEnter(ctx) {
		super.onEnter(ctx)
		
		ctx.session.reqCredentialMsg = await ctx[ctx.updateType === 'callback_query' ? 'editMessageText' : 'reply'](
				this.PLEASE_ENTER_USERNAME, HTML_WITHOUT_PREVIEW)
	}
	
	onText(text, ctx) {
		// delete entered username:
		ctx.deleteMessage().then()
		
		ctx.session.username = text
		ctx.scene.enter('password').then()
	}
}

class PasswordScene extends BaseScene {
	PLEASE_ENTER_PASSWORD = RLM + '\n\n' + od`
					رمز عبور خود را در <a href="https://bashgah.com/#!/login">سایت بآشگاه</a> وارد کنید:\n
					‼️ هشدار: ‼️
					<i>«رمزها» اصولاً اطلاعات محرمانه‌ای هستند! آن‌ها را در اختیار کسانی که بهشان اطمینان ندارید، قرار ندهید!</i>
				`
	
	constructor() {
		const name = 'password'
		super(name)
	}
	
	async onEnter(ctx) {
		super.onEnter(ctx)
		
		const reqCredentialMsg = ctx.session.reqCredentialMsg
		await ctx.telegram.editMessageText(reqCredentialMsg.chat.id, reqCredentialMsg.message_id, undefined,
				this.PLEASE_ENTER_PASSWORD, HTML_WITHOUT_PREVIEW)
	}
	
	async onText(text, ctx) {
		// delete entered password:
		ctx.deleteMessage().then()
		
		const session = ctx.session
		
		const username = session.username
		const password = session.password = text
		
		let result
		try {
			do {
				const reqCredentialMsg = ctx.session.reqCredentialMsg
				ctx.telegram.editMessageText(reqCredentialMsg.chat.id, reqCredentialMsg.message_id,
						undefined, 'لطفاً صبر کنید ...').then()
				result = await verifyCredential(username, password)
			} while (result === 'retry')
		} catch (err) {
			return console.error(err)
		}
		const {bashgahInfo} = result
		
		if (!bashgahInfo) {
			await ctx.replyWithHTML('خطا:\n' + `<b>${result}</b>`)
			return ctx.scene.enter('username').then()
		}
		
		console.log('New correct credential:', username)
		
		const telegramInfo = ctx.from
		const aesIv = crypto.randomBytes(16)
		bashgahInfo.autoAnswer = false
		
		const newUserData = {
			name: bashgahInfo.user.customerTitle,
			username,
			encryptedPassword: aes.encrypt(password, aesIv),
			aesIv,
			passwordIsValid: true,
			isActive: true,
			$addToSet: {tgUsers: session.tgUserId},
			bashgah: bashgahInfo,
		}
		
		try {
			const agahUser = await AgahUser.findOneAndUpdate({username}, newUserData, {upsert: true, new: true})
			await TgUser.updateOne({id: telegramInfo.id}, {$addToSet: {agahUsers: agahUser._id}})
		} catch (e) {
			console.error('Upsert Error:', e)
			return await ctx.reply('خطای غیر منتظره شماره ۱۹۴۷')
		}
		
		console.log('Upserted successfully:', username)
		
		const promise1 = ctx.reply('تبریک 🌹\n به جمع کاربران ما خوش آمدید 💐').then()
		
		const promise2 = ctx.replyWithSticker(FLOWER_STICKER_1).then()
		
		ctx.scene.leave().then()
		
		await Promise.all([promise1, promise2])
		
		await mainMenu.rootMenu.renderWith.reply(ctx)
	}
}

module.exports = {
	UsernameScene,
	PasswordScene,
}

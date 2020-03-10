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

const FLOWER_STICKER_1 = 'CAACAgQAAxkBAAPDXk1_P2rpYOGDJdWPwBklruV40SMAAuMAA_NilgYrEJPrbrOoTBgE'
const HTML_WITHOUT_PREVIEW = {disable_web_page_preview: true, parse_mode: 'HTML'}
//**************************************************************************************************/

class PasswordScene extends BaseScene {
	PLEASE_ENTER_PASSWORD = od`
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
				ctx.reply('لطفاً صبر کنید ...').then()
				result = await verifyCredential(username, password)
			} while (result === 'retry')
		} catch (err) {
			return console.error(err)
		}
		const {bashgahInfo} = result
		
		ctx.telegram.deleteMessage(session.reqCredentialMsg.chat.id, session.reqCredentialMsg.message_id).then()
		
		if (bashgahInfo === undefined) {
			ctx.replyWithHTML('خطا:\n' + `<b>${result}</b>`)
			return await ctx.scene.enter('username')
		}
		
		console.log('New correct credential:', username)
		
		const telegramInfo = ctx.from
		const aesIv = crypto.randomBytes(16)
		const encryptedPassword = aes.encrypt(password, aesIv)
		
		bashgahInfo.autoAnswer = false
		const newUserData = {
			name: bashgahInfo.user.customerTitle,
			username,
			encryptedPassword,
			aesIv,
			passwordIsValid: true,
			isActive: true,
			$addToSet: {tgUsers: session.tgUserId},
			bashgah: bashgahInfo,
		}
		
		AgahUser.findOneAndUpdate({username}, newUserData, {upsert: true, new: true}).then(agahUser =>
				TgUser.updateOne({id: telegramInfo.id}, {$addToSet: {agahUsers: agahUser._id}}).then(() => {
					console.log('Upserted successfully:', username)
					ctx.reply('تبریک 🌹\n به جمع کاربران ما خوش آمدید 💐').then()
					ctx.replyWithSticker(FLOWER_STICKER_1).then()
					ctx.scene.leave()
				}))
				.catch(console.error.bind(console, 'Upsert Error:'))
	}
}

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

module.exports = {
	UsernameScene,
	PasswordScene,
}

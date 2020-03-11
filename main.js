/* global require, process */
// require('./intl')
const http = require('http')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const uuidV4 = require('uuid').v4

const {getExternalIP, writeHeadAndEnd} = require('./utils')
const {HTTP_STATUS, CONTENT_TYPES} = require('./constants')
const {dbConnectionPromise, TgUser} = require('./prepareDB')
const {MainMenu} = require('./MainMenu')
const {mainMenuSchema} = require('./mainMenuSchema')

/**
 * Created on 1398/11/24 (2020/2/13).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'
const env = process.env
//*******************************************************************************************/

getExternalIP().then(console.log.bind(console, 'Public IP:')).catch(console.error)
//*******************************************************************************************/

const bot = new Telegraf(process.env.BOT_TOKEN)

// managing sessions and scenes:

const {enter, leave} = Stage

const stage = new Stage()
;['start', 'cancel'].map(command => stage.command(command, async (ctx, next) => {
	userRegistrationMiddleware(ctx, () => {}).then()
	leave()(ctx).then()
	await global.mainMenu.rootMenu.renderWith.reply(ctx)
}))

// register scenes:
const {UsernameScene, PasswordScene} = require('./scenes/add-user')
const {QuestionsScene} = require('./scenes/bashgah-competitions')
stage.register(
		new UsernameScene(),
		new PasswordScene(),
		new QuestionsScene(),
)

bot.use(session())
bot.use(stage.middleware())
//*******************************************************************************************/
// log actions + trigger dynamic-actions:
global.dynamicActions = {}
bot.action(/.+/, async (ctx, next) => {
	const action = ctx.match[0]
	console.log(action)
	
	if (global.dynamicActions[action]) return await global.dynamicActions[action](ctx, next)
	next()
})


// user registration:
async function userRegistrationMiddleware(ctx, next) {
	console.log('\nstate:', ctx.scene.state)
	
	if (ctx.session.started) return next()
	
	ctx.session.started = true
	const telegramInfo = ctx.from
	
	new Promise(async resolve => {
		TgUser.findOneAndUpdate({id: telegramInfo.id}, telegramInfo, {upsert: true, new: true}).then(tgUser => {
			console.log('Upserted: #%d @%s %j', tgUser.id, tgUser.username, tgUser.first_name + ' ' + tgUser.last_name)
			resolve()
		}).catch(e => {
			console.error('Upsert Error:', e, telegramInfo)
			ctx.reply('خطای غیر منتظره شماره ۳۸۶۱')
			resolve()   // resolve anyway
		})
	})
	
	next()
	
	// console.log('ctx.telegram', ctx.telegram)
	// console.log('ctx.message', ctx.message)
	// console.log('ctx.chat', ctx.chat)
	// console.log('ctx.from', ctx.from)
	// console.log('ctx.updateType', ctx.updateType)
	// console.log('ctx.updateSubTypes', ctx.updateSubTypes)
	// console.log('ctx.editedMessage', ctx.editedMessage)
	// console.log('ctx.inlineQuery', ctx.inlineQuery)
	// console.log('ctx.chosenInlineResult', ctx.chosenInlineResult)
	// console.log('ctx.callbackQuery', ctx.callbackQuery)
	// console.log('ctx.shippingQuery', ctx.shippingQuery)
	// console.log('ctx.preCheckoutQuery', ctx.preCheckoutQuery)
	// console.log('ctx.channelPost', ctx.channelPost)
	// console.log('ctx.editedChannelPost', ctx.editedChannelPost)
	// console.log('ctx.poll', ctx.poll)
	// console.log('ctx.pollAnswer', ctx.pollAnswer)
	// console.log('ctx.match', ctx.match)
	// console.log('ctx.webhookReply', ctx.webhookReply)
}

bot.use(userRegistrationMiddleware)
//*******************************************************************************************/

// register global actions:
for (const [trigger, middleware] of Object.entries(require('./actions'))) bot.action(trigger, middleware)
//*******************************************************************************************/

Promise.all([bot.telegram.getMe(), dbConnectionPromise]).then(async ([botInfo, _]) => {
	bot.context.botInfo = botInfo
	bot.options.username = botInfo.username
	
	// create main-menu (after `bot` initialization):
	global.layoutDir = 'rtl'
	
	global.mainMenu = new MainMenu(mainMenuSchema, bot, {
		backBtnTxt: '« برگشت',
		homeBtnTxt: '«« منوی اصلی',
	})
	
	// launch:
	if (env.REMOTE_HOST) {
		const PORT = env.PORT || 6000
		const hookPath = '/' + uuidV4()
		const webhookCallback = bot.webhookCallback(hookPath)
		
		http.createServer(async (req, res) => {
			const url = req.url
			//console.log(url)
			
			if (url === hookPath) return webhookCallback(req, res)
			
			if (url === '/?ping') return writeHeadAndEnd.bind(res)({
				headers: CONTENT_TYPES.TEXT,
				data: 'pong'
			})
			
			writeHeadAndEnd.bind(res)({status: HTTP_STATUS.NOT_FOUND})
		}).listen(PORT)
		console.log(`Listening on port ${PORT} ...`)
		//********************************************************************/
		
		bot.telegram.webhookReply = false  // https://github.com/telegraf/telegraf/issues/917#issuecomment-592128274
		
		const hookUrl = 'https://' + env.REMOTE_HOST + hookPath
		console.log('hookUrl:', hookUrl)
		await bot.telegram.setWebhook(hookUrl)
	} else {
		await bot.telegram.deleteWebhook()
		await bot.startPolling()
	}
	
	console.log('%s: Bot started as @%s',
			new Date().toLocaleString('en-ZA-u-ca-persian'), bot.options.username)
}, console.error)
//***************************************************************************************************/

// Keep services awake:

const Axios = require('axios').default
const cron = require('node-cron')

const every10Minutes = Array.from({length: 60 / 10}, (v, k) => 10 * k).join(',')  // '0,10,20,...,50'

cron.schedule(`${every10Minutes} * * * *`, () => {
	const startTime = new Date()
	Axios.get(process.env.PING_REMOTE_ORIGIN + '?ping', {timeout: 60 * 1000}).then(() =>
			console.log('Response time: %sms', new Date() - startTime)
	).catch(err => console.log('Bad or no response. %s:', err.name, err.message))
}, {})

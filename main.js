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

/**
 * Created on 1398/11/24 (2020/2/13).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'
const env = process.env

getExternalIP().then(console.log.bind(console, 'Public IP:')).catch(console.error.bind(console))

// Handler factories
const {enter, leave} = Stage

// Create scene manager
const stage = new Stage()
stage.command('cancel', leave())

// Scene registration:
const {UsernameScene, PasswordScene} = require('./scenes/greeter')
const {QuestionsScene} = require('./scenes/questions')
stage.register(
		new UsernameScene(),
		new PasswordScene(),
		new QuestionsScene(),
)

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())
bot.use(stage.middleware())

bot.use(async (ctx, next) => {
	console.log('x')
	if (ctx.session.started) return next()
	
	ctx.session.started = true
	const telegramInfo = ctx.from
	
	const tgUserPromise = TgUser.findOneAndUpdate({id: telegramInfo.id}, telegramInfo, {upsert: true, new: true})
	tgUserPromise.then(tgUser => {
		//console.log('Upserted:', tgUser)
		ctx.session.tgUserId = tgUser._id
	}).catch(console.error.bind(console, 'Upsert Error:'))
	
	next().then(async () => await tgUserPromise)
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
})

bot.on('message', (ctx, next) => {
	console.log('state', ctx.scene.state)
	next()
})
bot.start(ctx => ctx.scene.enter('username'))

bot.command(['q', 'questions'], ctx => {
	ctx.scene.enter('questions')
})

global['actions'] = {}
bot.action(/.+/, async (ctx, next) => {
	console.log(ctx.match[0])
	const action = global['actions'][ctx.match[0]]
	
	if (action) return await action(ctx, next)
	
	next()
})

dbConnectionPromise.then(async () => {
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
		
		const botInfo = await bot.telegram.getMe()
		bot.context.botInfo = botInfo
		bot.options.username = botInfo.username
		
		const hookUrl = 'https://' + env.REMOTE_HOST + hookPath
		console.log('hookUrl:', hookUrl)
		await bot.telegram.setWebhook(hookUrl)
	} else
		await bot.launch()
	
	console.log('%s: Bot started as @%s',
			new Date().toLocaleString('en-ZA-u-ca-persian'), bot.options.username)
}, console.error.bind(console, 'DB connection error:'))
//********************************************************************/

// Keep services awake:

const Axios = require('axios').default
const cron = require('node-cron')

const every10Minutes = Array.from({length: 60 / 10}, (v, k) => 10 * k).join(',')  // '0,10,20,...,50'

cron.schedule(`${every10Minutes} * * * *`, () => {
	const startTime = new Date()
	Axios.get(process.env.PING_REMOTE_ORIGIN + '?ping', {timeout: 30000}).then(() =>
			console.log('Response time: %sms', new Date() - startTime)
	).catch(err => console.log('Bad or no response. %s:', err.name, err.message))
}, {})

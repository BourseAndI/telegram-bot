const od = require('outdent')
const {sprintf} = require('sprintf-js')
const Extra = require('telegraf/extra')

const {BaseScene} = require('./base-scene')
const {AgahCompetition} = require('../prepareDB')
const {resolveActiveCompetitions, resolveCompetition} = require('../functions')
const {BASHGAH_ORIGIN} = require('../values')
const {RLM} = require('../constants')
const {getOrDefineDeepPath, callbackBtn, singleDigitToFa} = require('../utils')

/**
 * Created on 1398/12/1 (2020/2/20).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

global.agah = {
	bashgah: {
		competitions: {}
	}
}

class QuestionsScene extends BaseScene {
	constructor() {
		super('questions')
	}
	
	async onEnter(ctx) {
		super.onEnter(ctx)
		if (ctx.updateType === 'callback_query') ctx.answerCbQuery().then()
		ctx.reply('لطفاً صبر کنید ...').then()
		
		const activeCompetitions = await resolveActiveCompetitions()
		const activeCompetitionsNum = activeCompetitions.length
		console.log('activeCompetitions.length:', activeCompetitionsNum)
		if (!activeCompetitionsNum) {
			const replyPr = ctx.reply('فعلاً هیچ مسابقه‌ای در حال برگزاری نیست. لطفاً بعداً مراجعه کنید. همچنین می‌توانید از امکان «دریافت خودکار پرسش‌های جدید» استفاده کنید.')
			ctx.scene.leave().then()
			return await replyPr
		}
		
		// upsert-many (https://stackoverflow.com/a/60330161/5318303):
		const upserts = activeCompetitions.map(competition => ({
			updateOne: {
				filter: {id: competition.id},
				update: competition,
				upsert: true,
			}
		}))
		AgahCompetition.bulkWrite(upserts)
		//.then(bulkWriteOpResult => console.log('BULK update OK:', bulkWriteOpResult))
				.catch(err => console.error('BULK update error:', err))
		
		const gCompetitions = agah.bashgah.competitions
		const QUESTION = 'سؤال'
		const oneCode = '➊'.charCodeAt(0)
		// noinspection JSUnresolvedVariable
		const fa = new Intl.NumberFormat('fa-IR', {useGrouping: false}).format
		const faS = text => text.replace(/\d/g, singleDigitToFa)
		
		const questionsPr = Promise.all(activeCompetitions/*.filter((e, i) => i === 0)*/.map(competition => (async () => {
			const qCode = competition.code
			const url = `${BASHGAH_ORIGIN}/Question/${qCode}`
			
			const qBody = faS(competition.body).replace(/(&zwnj;)|(&nbsp;)|(\d)/ig, (match, zwng, nbsp, digit) => {
				if (zwng) return '\u200C'
				if (nbsp) return '\u00A0'
				if (digit) return singleDigitToFa(digit)
			}).replace(/<\s*?p.*?>|<\s*?\/p\s*?>/ig, '')  // remove all "<p>"s and "</p>"s
			
			const qCodeFa = fa(qCode)
			const qCodeFaLink = `<a href="${url}">${qCodeFa}</a>` + RLM
			const hashTag = competition.score === 0 ? 'جسورانه' : sprintf('%s_امتیازی', fa(competition.score))
			
			const caption = od`
								#${QUESTION} ${qCodeFaLink} (#${hashTag}):\n
								${qBody}\n
								@${mainMenu.bot.options.username}
							`
			
			const keyboardCB = markup => markup.inlineKeyboard(competition.options.map((option, i) =>
					callbackBtn.bind(markup)(`${String.fromCharCode(oneCode + i)}${RLM} ${faS(option.body)} 🚧`,
							async ctx => await ctx.answerCbQuery('این امکان هنوز فعال نشده.'),
							`agah:bashgah:competitionAnswer:${qCode}:${i}`)), {columns: 1})
			
			let photoHandler = getOrDefineDeepPath.bind(gCompetitions)(qCode, 'photoFileId')
			if (!photoHandler) {
				console.log(url)
				ctx.replyWithMarkdown(sprintf(`در حال دریافت [پرسش شماره %s](%s) ...`, qCodeFa, url),
						{disable_web_page_preview: true}).then()
				
				const image = await resolveCompetition(qCode)
				
				if (image === null) return await ctx.reply(caption,
						Extra.load({disable_web_page_preview: true}).HTML().markup(keyboardCB))
				photoHandler = {source: image}
			}
			
			const msg = await ctx.replyWithPhoto(photoHandler, Extra.caption(caption).HTML().markup(keyboardCB))
			
			gCompetitions[qCode].photoFileId = msg.photo[msg.photo.length - 1].file_id
		})()))
		
		ctx.scene.leave().then()
		
		return await questionsPr
	}
}

module.exports = {
	QuestionsScene,
}

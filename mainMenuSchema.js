const Extra = require('telegraf/extra')
const od = require('outdent')

/**
 * Created on 1398/12/19 (2020/3/9).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

const NOT_ENABLED_YET = 'این گزینه هنوز فعال نشده'
//*******************************************************************************************/

const mainMenuSchema = mainMenu => {
	/**
	 * MarkdownLink
	 * @param text
	 * @param link
	 * @returns {string}
	 */
	const mdL = (text, link = 'https://t.me/' + mainMenu.bot.options.username) => `[${text}](${link})`
	
	const fh = text => ({
		text: mdL(text),
		extra: Extra.load({disable_web_page_preview: true}).markdown(),
	})
	
	const fh0 = text => ({
		text: text,
		extra: Extra.load({disable_web_page_preview: true}).markdown(),
	})
	
	return {
		forehead: fh0(`${mdL('من و بورس')} » ${mdL('دستیار بورسی من')}`),
		items: {
			// simple-button:
			codal: {
				text: 'کدال - دریافت اطلاعیه‌ها بر اساس دیده‌بان‌های شما 🚧',
				do: ctx => ctx.answerCbQuery('در دست ساخت ...'),
			},
			
			// simple-button:
			marketWatcher: {
				text: 'ناظر بازار - دریافت پیام‌ها بر اساس دیده‌بان‌های شما 🚧',
				do: ctx => ctx.answerCbQuery('در دست ساخت ...'),
			},
			
			// submenu:
			bashgahCompetitions: {
				text: 'مسابقات بآشگاه آگاه + امکان پاسخگویی از طریق ربات',
				forehead: fh('مسابقاتِ بآشگاه'),
				items: {
					// simple-button:
					getQuestions: {
						text: 'دریافت پرسش‌ها',
						do: async ctx => await ctx.scene.enter('questions'),
					},
					// simple-button:
					autoReceiveQuestions: {
						text: 'دریافت خودکار پرسش‌های جدید 🚧',
						do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
					},
					// simple-button:
					autoAnswer: {
						text: 'پاسخگویی خودکار 🚧',
						do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
					},
				},
			},
			
			// prompt:
			addNewUser: {
				text: '➕ افزودن کاربر 👨',
				prompt: fh0(od`
				${mdL('افزودن کاربر جدید')}
				تذکر ۱: این قسمت مورد نیاز استفاده‌کنندگان از خدماتی چون «سرخطی» یا «شرکت در مسابقات بآشگاه آگاه» است. در صورتی که از این خدمات استفاده نمی‌کنید، نیاز به «افزودن کاربر» ندارید.
				تذکر ۲: در حال حاضر، فقط مشتریان «کارگزاری آگاه» امکان افزوده شدن دارند.
			`),
				items: {
					// simple-button:
					back: {
						text: '« برگشت',
						// rerender main-menu:
						do: async ctx => await ctx.deleteMessage(),
					},
					// simple-button:
					continue: {
						text: 'ادامه »',
						do: async ctx => await ctx.scene.enter('username'),
					},
				},
			},
			
			// submenu:
			watchLists: {
				text: '🔭 دیده‌بان‌های من 🧐 🚧',
				forehead: fh('دیده‌بان‌های من'),
				items: {
					// simple-button:
					todo: {
						text: NOT_ENABLED_YET,
						do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
					},
				},
			},
			
			// submenu:
			featureReq: {
				text: 'پیشنهاد افزودن امکانات جدید به ربات',
				forehead: fh('پیشنهاد افزودن امکانات جدید'),
				items: {
					// simple-button:
					todo: {
						text: NOT_ENABLED_YET,
						do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
					},
				},
			},
		},
	}
}
//console.log(mainMenu.actions);console.log(mainMenu.menus)

module.exports = {
	mainMenuSchema,
}

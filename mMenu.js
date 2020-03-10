const Extra = require('telegraf/extra')
const od = require('outdent')

const MainMenu = require('./MainMenu')

/**
 * Created on 1398/12/19 (2020/3/9).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

const NOT_ENABLED_YET = 'این گزینه هنوز فعال نشده'

/**
 * MarkDownLink
 * @param text
 * @param link
 * @returns {string}
 */
const mdL = (text, link = 'https://t.me/BourseAndI_bot') => `[${text}](${link})`

const markdown = text => ({text, extra: Extra.markdown()})
//*******************************************************************************************/

const mainMenuSchema = mainMenu => ({
	forehead: markdown(`${mdL('من و بورس')} » ${mdL('دستیار بورسی من')}`),
	items: {
		// submenu:
		services: {
			text: 'خدمات (کدال / ناظر / سرخطی / سفارشات زمان‌بندی شده و شرطی / بآشگاه آگاه / ...)',
			forehead: markdown(mdL('خدمات')),
			items: {
				// simple-button:
				codal: {
					text: 'دریافت اطلاعیه‌های کدال بر اساس دیده‌بان‌های شما',
					do: ctx => ctx.answerCbQuery('کدال'),
				},
				// simple-button:
				marketWatcher: {
					text: 'دریافت پیام‌های ناظر بازار بر اساس دیده‌بان‌های شما',
					do: ctx => ctx.answerCbQuery('ناظر'),
				},
				// simple-button:
				bashgahCompetitions: {
					text: 'دریافت پرسش‌های بآشگاه کارگزاری آگاه + امکان پاسخگویی',
					do: ctx => ctx.answerCbQuery('باشگاه'),
				},
			},
		},
		
		// submenu:
		settings: {
			text: '🛠 تنظیمات ربات ⚙️',
			forehead: markdown(mdL('تنظیمات')),
			items: {
				// simple-button:
				todo: {
					text: NOT_ENABLED_YET,
					do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
				},
			},
		},
		
		// prompt:
		addNewUser: {
			text: '➕ افزودن کاربر 👨',
			prompt: markdown(od`
				${mdL('افزودن کاربر جدید')}
				تذکر ۱: این قسمت مورد نیاز استفاده‌کنندگان از خدماتی چون «سرخطی» یا «شرکت در مسابقات بآشگاه آگاه» است. در صورتی که از این خدمات استفاده نمی‌کنید، نیاز به «افزودن کاربر» ندارید.
				تذکر ۲: در حال حاضر، فقط مشتریان «کارگزاری آگاه» امکان افزوده شدن دارند.
			`),
			items: {
				// simple-button:
				back: {
					text: '« برگشت',
					// rerender main-menu:
					do: async ctx => await mainMenu.menuLikes[mainMenu.rootAction].renderWith.editMessageText(ctx),
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
			text: '🔎 دیده‌بان‌های من 🧐',
			forehead: markdown(mdL('دیده‌بان‌های من')),
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
			forehead: markdown(mdL('پیشنهاد افزودن امکانات جدید')),
			items: {
				// simple-button:
				todo: {
					text: NOT_ENABLED_YET,
					do: ctx => ctx.answerCbQuery(NOT_ENABLED_YET),
				},
			},
		},
	},
})

const mainMenu = new MainMenu(mainMenuSchema, {
	backButton: '« برگشت',
	homeButton: '«« منوی اصلی',
})
//console.log(mainMenu.actions);console.log(mainMenu.menus)

module.exports = {
	mainMenuSchema,
	mainMenu,
}

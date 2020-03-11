const Extra = require('telegraf/extra')

/**
 * Created on 1398/12/19 (2020/3/9).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

class MenuLike {
	constructor(forehead, inlineKeyboard) {
		this.forehead = forehead
		this.inlineKeyboard = inlineKeyboard
	}
	
	renderWith = {
		reply: async ctx => await ctx.reply(this.forehead.text, this.forehead.extra.markup(this.inlineKeyboard)),
		editMessageText: async ctx => await ctx.editMessageText(this.forehead.text, this.forehead.extra.markup(this.inlineKeyboard)),
	}
}

class MainMenu {
	actions = {}
	menuLikes = {}
	
	constructor(schema, bot, {
		rootAction = '/',
		actionsSeparator = '/',
		backBtnTxt = '« Back',
		homeBtnTxt = '«« Main Menu',
	} = {}) {
		this.bot = bot
		this.schema = schema(this)
		this.rootAction = rootAction
		this.actionsSeparator = actionsSeparator
		this.backBtnTxt = backBtnTxt
		this.homeBtnTxt = homeBtnTxt
		//***********************************************************************/
		
		// define actions:
		this.defineActions(this.schema, this.rootAction)
		
		this.rootMenu = this.menuLikes[this.rootAction]
		
		for (const [trigger, middleware] of Object.entries(this.actions)) bot.action(trigger, middleware)
	}
	
	static normalizeForehead(forehead) {
		return typeof forehead === 'string' || forehead instanceof String ?
				{text: forehead, extra: Extra} :
				forehead
	}
	
	/**
	 * @param menuItem
	 * @param action Pass `this.rootAction` for root menu.
	 * @param parentAction Leave it `undefined` for root menu.
	 */
	defineActions(menuItem, action, parentAction) {
		// button:
		if (menuItem.do) this.actions[action] = menuItem.do
		
		// prompt-item (question):
		if (menuItem.prompt) this.actions[action] = menuItem.do
		
		const items = (menuItem.items ? Object.entries(menuItem.items) : []).map(([itemKey, item]) => ({
			action: action + itemKey + (item.items && Object.keys(item.items).length ? this.actionsSeparator : ''),
			...item,
		}))
		
		const isMenu = !!menuItem.forehead
		
		// menu or prompt-item (question):
		if (isMenu || menuItem.prompt) {
			let forehead
			
			if (isMenu) {  // menu:
				forehead = menuItem.forehead
				
				if (parentAction) { // render navigation-buttons:
					// render back-button:
					items.push({
						text: this.backBtnTxt,
						action: parentAction,
					})
					
					if (parentAction !== this.rootAction) // render home-button:
						items.push({
							text: this.homeBtnTxt,
							action: this.rootAction,
						})
				}
				
				for (const item of items)
					if (item.wrap === undefined) item.wrap = (btn, index) => index !== items.length + 1  // wrap all except `homeButton` (by default)
			} else
				forehead = menuItem.prompt
			
			const menuLike = this.menuLikes[action] = new MenuLike(MainMenu.normalizeForehead(forehead), m => {
				const choices = items.map(item => m.callbackButton(
						item.text,
						item.action,
						item.hide,
				))
				
				if (layoutDir.toLowerCase() === 'rtl') {
					const rows = []
					m.inlineKeyboard(choices, {
						wrap: (btn, index, currentRow) => {
							const item = items[index]
							const wrap = item.wrap
							const wrapResult = typeof wrap === 'function' ? wrap(btn, index, currentRow) : wrap
							
							if (wrapResult || !rows.length) rows.push([{btn, item}])
							else rows[rows.length - 1].push({btn, item})
							
							return wrapResult
						}
					})
					//console.log(rows)
					
					const rearrangedChoices = []
					const rearrangedItems = []
					
					for (const row of rows) {
						const reversedRow = row.reverse()
						rearrangedChoices.push(...reversedRow.map(e => e.btn))
						rearrangedItems.push(...reversedRow.map(e => e.item))
					}
					
					return m.inlineKeyboard(rearrangedChoices, {
						wrap: (btn, index, currentRow) => {
							const wrap = rearrangedItems[index].wrap
							return typeof wrap === 'function' ? wrap(btn, index, currentRow) : wrap
						},
					})
				}
				
				return m.inlineKeyboard(choices, {
					wrap: (btn, index, currentRow) => {
						const wrap = items[index].wrap
						return typeof wrap === 'function' ? wrap(btn, index, currentRow) : wrap
					},
				})
			})
			
			this.actions[action] = async (ctx, next) => {
				ctx.answerCbQuery().then().catch(console.error)
				
				const editMenuPr = menuLike.renderWith[isMenu ? 'editMessageText' : 'reply'](ctx)
				
				next()
				await editMenuPr
			}
		}
		
		for (const item of items) this.defineActions(item, item.action, action)
	}
}

module.exports = {MainMenu}

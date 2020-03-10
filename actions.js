/**
 * Created on 1398/12/13 (2020/3/3).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

module.exports = {
	'prompt-add-user/continue': async ctx => {
		ctx.answerCbQuery().then()
		await ctx.scene.enter('username')
	},
	
	'prompt-add-user/cancel': async ctx => {
		ctx.answerCbQuery().then()
		await ctx.deleteMessage()
	},
}

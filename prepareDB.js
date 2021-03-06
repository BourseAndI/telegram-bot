const mongoose = require('mongoose')
/**
 * Created on 1398/11/20 (2020/2/9).
 * @author {@link https://mirismaili.github.io S. Mahdi Mir-Ismaili}
 */
'use strict'

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useUnifiedTopology', true)
mongoose.set('runValidators', true)
const Schema = mongoose.Schema

const dbConnectionPromise = mongoose.connect(process.env.DB_URI)

const db = mongoose.connection

db.on('error', console.error.bind(console, 'DB ERROR:'))

const collections = {
	TgUser: {
		name: {type: String, index: true},
		id: {type: Number, required: true, unique: true},
		is_bot: {type: Boolean, required: true},
		first_name: {type: String, required: true, default: null},
		last_name: String,
		username: {type: String, index: true},
		language_code: String,
		agahUsers: [{type: Schema.Types.ObjectId, ref: 'AgahUser'}]
		//permissions: {},
	},
	
	AgahUser: {
		name: {type: String, index: true},
		username: {type: String, unique: true},
		encryptedPassword: Buffer, //{type: Buffer, required: true, default: null},
		aesIv: Buffer, //{type: Buffer, required: true, default: null},
		passwordIsValid: {type: Boolean, required: true, default: true},
		isActive: {type: Boolean, required: true, default: true},
		bashgah: {
			autoAnswer: {type: Boolean, required: true, default: false},
			firstLoginState: Boolean,
			isMergeWindowVisibleForNewCustomer: Boolean,
			user: {
				clubId: String,
				firstLoginState: Boolean,
				email: String,
				customerTitle: String,
				isCustomer: Boolean,
				ccmsMemberType: Number,
				reagentRegistrationState: Number,
				clubMemberCode: String,
				aggreeToDepositMoney: Boolean,
				aggreeToDepositMoneyDate: Date,
				isMarketer: Boolean,
				BlogEncData: String,
				UnreadPopupPublicMessageCount: Number,
				UnreadPopupPrivateMessageCount: Number,
				HasStateCenter: Boolean,
			},
			level: {
				title: String,
				score: Number,
				remainingRial: Number,
				totalRial: Number,
				credit: Number,
				order: Number,
			},
		},
		tgUsers: [{type: Schema.Types.ObjectId, ref: 'TgUser'}]
	},
	
	AgahCompetition: {
		code: {type: Number, required: true, unique: true},
		id: {type: String, required: true, unique: true},
		score: {type: Number, required: true, default: null},
		title: String,
		body: String,
		bodyClearText: String,
		deadlineTime: Date,
		deadlineTimeS: String,
		publishDate: Date,
		publishDateS: String,
		maker: String,
		createDate: Date,
		answerType: Number,
		type: Number,
		isBourse: Boolean,
		categoryId: Number,
		categoryS: String,
		pictureBase64: String,
		pictureThumbnailBase64: String,
		options: [{
			id: {type: String, required: true, unique: true},
			body: String,
		}],
		answer: Number,
		agahUsers: [{type: Schema.Types.ObjectId, ref: 'AgahUser', cascadeDelete: false}]
	}
}

const models = {}

const schemas = Object.fromEntries(Object.keys(collections).map(collectionName => {
	const collection = collections[collectionName]
	
	const schema = new Schema(collection, {
		timestamps: true,
	})
	schema.pre('updateOne', function (next) {
		this.options.setDefaultsOnInsert = true
		next()
	})
	schema.pre('findOneAndUpdate', function (next) {
		this.options.setDefaultsOnInsert = true
		next()
	})
	
	return [collectionName, schema]
}))

// This loop-block should be after evaluation of `schemas` and before evaluation of `models`:
for (const collectionName in collections) {
	const collection = collections[collectionName]
	
	for (const fieldName in collection) {
		const field = collection[fieldName]
		const fieldProps = field[0]
		
		if (!(Array.isArray(field) &&
				fieldProps &&
				fieldProps.type === Schema.Types.ObjectId &&
				fieldProps.ref &&
				fieldProps.cascadeDelete !== false))
			continue
		
		const referencedSchema = schemas[(field[0].ref)]
		
		// Cascade delete:
		referencedSchema.post('remove', async function (doc) {  // this === doc
			models[collectionName].updateMany({[fieldName]: doc._id}, {$pull: {[fieldName]: doc._id}})
					.then(console.log.bind(console, 'Deleted cascade:'))
					.catch(console.error.bind(console, 'Error during remove dependent elements'))
		})
	}
}

for (const collection in schemas) models[collection] = db.model(collection, schemas[collection])

models.AgahUser.on('index', err => console.warn('Disable `autoIndex` on production mode. See:', 'https://mongoosejs.com/docs/guide.html#indexes'))

module.exports = {
	...models,
	dbConnectionPromise,
}

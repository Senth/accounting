import { MongoDbGateway, Collections } from './MongoDbGateway'
import { Verification } from '../../app/core/entities/Verification'
import { MongoClient, Db, ObjectId } from 'mongodb'
import { config } from '../../config'
import * as faker from 'faker'
import { MongoConverter } from './MongoConverter'
import { OutputError } from '../../app/core/definitions/OutputError'
import { Account } from '../../app/core/entities/Account'
import { ParserSingle } from '../../app/core/entities/ParserSingle'
import { ParserMulti } from '../../app/core/entities/ParserMulti'
import { Parser } from '../../app/core/entities/Parser'
import { User } from '../../app/core/entities/User'
import { Currency } from '../../app/core/entities/Currency'
import { FiscalYear } from '../../app/core/entities/FiscalYear'
import { Consts } from '../../app/core/definitions/Consts'

const USER_ID = new ObjectId().toHexString()

describe('MongoDBGateway testing connection to the DB #db', () => {
	let gateway: MongoDbGateway
	let client: MongoClient
	let db: Db

	beforeAll(async () => {
		gateway = new MongoDbGateway()
		const connectedPromise = MongoClient.connect(config.mongoDb.url(), { useUnifiedTopology: true })
			.then((mongoClient) => {
				client = mongoClient
				db = client.db(config.mongoDb.database)
			})
			.catch(() => {
				throw new Error('Could not connect to Mongo DB')
			})

		await connectedPromise
	})

	afterEach(async () => {
		await db.dropDatabase()
	})

	afterAll(async () => {
		await client.close()
	})

	it('Test connection', async () => {
		const gateway = new MongoDbGateway()
		await expect(gateway.waitUntilConnected()).resolves.toBe(undefined)
	})

	it('saveVerification() full', async () => {
		const verification = fakerVerificationFull()
		delete verification.id
		const promise = gateway.saveVerification(verification)

		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const dbVerification = MongoConverter.toVerification(object)
				verification.id = dbVerification.id
				expect(dbVerification).toEqual(verification)
			})
	})

	it('saveVerification() Minimal', async () => {
		const verification = fakerVerificationMinimal()
		const promise = gateway.saveVerification(verification)

		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const dbVerification = MongoConverter.toVerification(object)
				verification.id = dbVerification.id
				expect(dbVerification).toEqual(verification)
			})
	})

	it('saveVerification() update existing', async () => {
		const verification = fakerVerificationMinimal()
		const promise = gateway.saveVerification(verification)

		expect.assertions(2)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const option: Verification.Option = MongoConverter.toOption(object)
				verification.id = option.id
				const dbVerification = new Verification(option)
				expect(dbVerification).toEqual(verification)

				verification.files = ['some files']
				verification.name = 'Another name'
				return gateway.saveVerification(verification)
			})
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const dbVerification = MongoConverter.toVerification(object)
				expect(dbVerification).toEqual(verification)
			})
	})

	it('saveVerification() - Invalid', async () => {
		const verification = fakerVerificationMinimal()
		verification.name = '12'
		const promise = gateway.saveVerification(verification)

		await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.nameTooShort, '12'))
	})

	it('getVerification() get existing', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const promise = gateway.getVerification(USER_ID, verification.id)
		await expect(promise).resolves.toStrictEqual(verification)
	})

	it('getVerification() searching for id that does not exist', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const otherId = new ObjectId().toHexString()
		const promise = gateway.getVerification(USER_ID, otherId)
		const validError = OutputError.create(OutputError.Types.verificationNotFound, otherId)
		await expect(promise).rejects.toStrictEqual(validError)
	})

	it('getVerification() verification id exists, but wrong userId', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const promise = gateway.getVerification(new ObjectId().toHexString(), verification.id)
		const validError = OutputError.create(OutputError.Types.verificationNotFound, verification.id)
		await expect(promise).rejects.toStrictEqual(validError)
	})

	it('getVerifications()', async () => {
		const fiscalId1 = new ObjectId().toHexString()
		const fiscalId2 = new ObjectId().toHexString()

		const userVer1 = fakerVerificationFull()
		const userVer2 = fakerVerificationFull()
		const userVer3 = fakerVerificationFull()
		const otherVer = fakerVerificationMinimal()
		otherVer.userId = new ObjectId().toHexString()

		otherVer.fiscalYearId = fiscalId1
		userVer1.fiscalYearId = fiscalId1
		userVer2.fiscalYearId = fiscalId2
		userVer3.fiscalYearId = fiscalId2

		const objects = [
			MongoConverter.toDbObject(userVer1),
			MongoConverter.toDbObject(userVer2),
			MongoConverter.toDbObject(userVer3),
			MongoConverter.toDbObject(otherVer),
		]

		await db.collection(Collections.Verification).insert(objects)

		// First verification for fiscal id 1 (should not get otherVer even though they have same fiscal id)
		await expect(gateway.getVerifications(USER_ID, fiscalId1)).resolves.toStrictEqual([userVer1])

		// Two verifications from the second fiscal id
		let promise = gateway.getVerifications(USER_ID, fiscalId2)
		await expect(promise).resolves.toContainEqual(expect.objectContaining(userVer2))
		await expect(promise).resolves.toContainEqual(expect.objectContaining(userVer3))

		// No verifications found
		await expect(
			gateway.getVerifications(new ObjectId().toHexString(), new ObjectId().toHexString())
		).resolves.toStrictEqual([])
		await expect(gateway.getVerifications(USER_ID, new ObjectId().toHexString())).resolves.toStrictEqual([])
	})

	it('getExistingVerification()', async () => {
		const testVerification = fakerVerificationFull()
		const validVerification = new Verification(testVerification)
		let insertObject = MongoConverter.toDbObject(validVerification)
		await db.collection(Collections.Verification).insertOne(insertObject)
		testVerification.id = undefined

		// Found
		let comparable = testVerification.getComparable()
		let promise = gateway.getExistingVerification(comparable)
		await expect(promise).resolves.toStrictEqual(validVerification)

		// Not found - not equal
		testVerification.internalName = 'something else'
		comparable = testVerification.getComparable()
		promise = gateway.getExistingVerification(comparable)
		await expect(promise).resolves.toStrictEqual(undefined)

		// Not found - undefined fields
		testVerification.internalName = undefined
		comparable = testVerification.getComparable()
		promise = gateway.getExistingVerification(comparable)
		await expect(promise).resolves.toStrictEqual(undefined)

		// Remove the internal name from the verification, and now it should be found
		validVerification.internalName = undefined
		insertObject = MongoConverter.toDbObject(validVerification)
		await db.collection(Collections.Verification).replaceOne({ _id: new ObjectId(validVerification.id) }, insertObject)
		promise = gateway.getExistingVerification(comparable)
		await expect(promise).resolves.toStrictEqual(validVerification)
	})

	it('getAccount()', async () => {
		const account = new Account({
			userId: new ObjectId().toHexString(),
			number: 1234,
		})

		let insertObject = MongoConverter.toDbObject(account)
		account.id = insertObject._id.toHexString()
		await db.collection(Collections.Account).insertOne(insertObject)

		// Found
		let promise = gateway.getAccount(account.userId, 1234)
		await expect(promise).resolves.toStrictEqual(account)

		// Not found - other user id
		promise = gateway.getAccount(new ObjectId().toHexString(), 1234)
		let validError = OutputError.create(OutputError.Types.accountNumberNotFound, String(1234))
		await expect(promise).rejects.toStrictEqual(validError)

		// Not found - no account number
		promise = gateway.getAccount(account.userId, 1235)
		validError = OutputError.create(OutputError.Types.accountNumberNotFound, String(1235))
		await expect(promise).rejects.toStrictEqual(validError)
	})

	it('saveParser() single', async () => {
		const parser = fakerParserSingle()

		const promise = gateway.saveParser(parser)
		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Parser).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const dbParser = MongoConverter.toParser(object)
				expect(dbParser).toEqual(parser)
			})
	})

	it('saveParser() multi', async () => {
		const parser = fakerParserMulti()

		const promise = gateway.saveParser(parser)
		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Parser).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const dbParser = MongoConverter.toParser(object)
				expect(dbParser).toEqual(parser)
			})
	})

	it('saveParser() invalid', async () => {
		const parser = new ParserMulti({
			userId: new ObjectId().toHexString(),
			identifier: /none/,
			matcher: /none/,
			lineMatchers: [],
			currencyCodeDefault: 'SEK',
			accountFrom: 999,
			name: '12',
		})

		const promise = gateway.saveParser(parser)
		await expect(promise).rejects.toBeInstanceOf(OutputError)
	})

	it('getParsers()', async () => {
		const userParserSingle = fakerParserSingle()
		const userParserMulti = fakerParserMulti()
		const otherParserSingle = fakerParserSingle()
		otherParserSingle.userId = new ObjectId().toHexString()

		const objects = []
		objects.push(MongoConverter.toDbObject(userParserSingle))
		objects.push(MongoConverter.toDbObject(userParserMulti))
		objects.push(MongoConverter.toDbObject(otherParserSingle))

		await db.collection(Collections.Parser).insertMany(objects)

		// Found correct number
		const promise = gateway.getParsers(USER_ID)
		await expect(promise).resolves.toHaveLength(2)
		await expect(promise).resolves.toContainEqual(expect.objectContaining(userParserSingle))
		await expect(promise).resolves.toContainEqual(expect.objectContaining(userParserMulti))

		// No parser
		await expect(gateway.getParsers(new ObjectId().toHexString())).resolves.toStrictEqual([])
	})

	it('getLocalCurrency()', async () => {
		const user = fakerUser()
		await db.collection(Collections.User).insertOne(MongoConverter.toDbObject(user))

		let promise = gateway.getLocalCurrency(USER_ID)
		await expect(promise).resolves.toStrictEqual(Currency.Codes.SEK)

		// Not found user
		const otherId = new ObjectId().toHexString()
		promise = gateway.getLocalCurrency(otherId)
		await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.userNotFound, otherId))
	})

	it('getLocalCurrency() invalid currency code', async () => {
		const user = fakerUser()
		user.localCurrencyCode = 'INVALID'
		await db.collection(Collections.User).insertOne(MongoConverter.toDbObject(user))

		const promise = gateway.getLocalCurrency(USER_ID)
		await expect(promise).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.currencyCodeInvalid, user.localCurrencyCode)
		)
	})

	it('getUser()', async () => {
		const user = new User(fakerUser())
		await db.collection(Collections.User).insertOne(MongoConverter.toDbObject(user))

		let promise = gateway.getUser(user.apiKey)
		await expect(promise).resolves.toStrictEqual(user)

		// Not found
		promise = gateway.getUser('invalid')
		await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.userNotFound))
	})

	it('getFiscalYear()', async () => {
		const fiscal2012 = fakerFiscalYear(2012)
		const fiscal2013 = fakerFiscalYear(2013)
		const fiscal2014 = fakerFiscalYear(2014)

		const objects = [
			MongoConverter.toDbObject(fiscal2012),
			MongoConverter.toDbObject(fiscal2013),
			MongoConverter.toDbObject(fiscal2014),
		]

		await db.collection(Collections.FiscalYear).insertMany(objects)

		// 2012
		await expect(gateway.getFiscalYear(USER_ID, '2012-01-01')).resolves.toStrictEqual(fiscal2012)
		await expect(gateway.getFiscalYear(USER_ID, '2012-05-31')).resolves.toStrictEqual(fiscal2012)
		await expect(gateway.getFiscalYear(USER_ID, '2012-12-31')).resolves.toStrictEqual(fiscal2012)

		// 2013
		await expect(gateway.getFiscalYear(USER_ID, '2013-01-01')).resolves.toStrictEqual(fiscal2013)
		await expect(gateway.getFiscalYear(USER_ID, '2013-05-31')).resolves.toStrictEqual(fiscal2013)
		await expect(gateway.getFiscalYear(USER_ID, '2013-12-31')).resolves.toStrictEqual(fiscal2013)

		// 2014
		await expect(gateway.getFiscalYear(USER_ID, '2014-01-01')).resolves.toStrictEqual(fiscal2014)
		await expect(gateway.getFiscalYear(USER_ID, '2014-05-31')).resolves.toStrictEqual(fiscal2014)
		await expect(gateway.getFiscalYear(USER_ID, '2014-12-31')).resolves.toStrictEqual(fiscal2014)

		// 2011 - Not found
		await expect(gateway.getFiscalYear(USER_ID, '2011-01-01')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2011-01-01')
		)
		await expect(gateway.getFiscalYear(USER_ID, '2011-05-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2011-05-31')
		)
		await expect(gateway.getFiscalYear(USER_ID, '2011-12-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2011-12-31')
		)

		// 2015 - Not found
		await expect(gateway.getFiscalYear(USER_ID, '2015-01-01')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2015-01-01')
		)
		await expect(gateway.getFiscalYear(USER_ID, '2015-05-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2015-05-31')
		)
		await expect(gateway.getFiscalYear(USER_ID, '2015-12-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2015-12-31')
		)

		// Not Found, different user id
		const otherId = new ObjectId().toHexString()
		// 2012
		await expect(gateway.getFiscalYear(otherId, '2012-01-01')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2012-01-01')
		)
		await expect(gateway.getFiscalYear(otherId, '2012-05-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2012-05-31')
		)
		await expect(gateway.getFiscalYear(otherId, '2012-12-31')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.fiscalYearNotFound, '2012-12-31')
		)

		// Invalid date format
		await expect(gateway.getFiscalYear(USER_ID, '2016-u1-12')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.dateFormatInvalid, '2016-u1-12')
		)
		await expect(gateway.getFiscalYear(USER_ID, '2017-02-29')).rejects.toStrictEqual(
			OutputError.create(OutputError.Types.dateFormatInvalid, '2017-02-29')
		)
	})
})

/////////////////////
//			FAKERS
////////////////////
function fakerTime(): number {
	return faker.date.between('2000-01-01', new Date()).getTime()
}

function fakerVerificationFull(): Verification {
	const created = fakerTime()
	const modified = created + 1

	const option: Verification.Option = {
		id: new ObjectId().toHexString(),
		userId: USER_ID,
		name: faker.commerce.productName(),
		internalName: faker.commerce.product(),
		number: faker.random.number(),
		date: '2020-01-01',
		dateFiled: modified,
		dateCreated: created,
		dateModified: modified,
		dateDeleted: modified,
		type: Verification.Types.TRANSACTION,
		fiscalYearId: new ObjectId().toHexString(),
		description: 'A description',
		totalAmount: {
			amount: 1n,
			localAmount: 10n,
			code: 'USD',
			localCode: 'SEK',
			exchangeRate: 10,
		},
		files: ['hello', 'another file'],
		invoiceId: new ObjectId().toHexString(),
		paymentId: new ObjectId().toHexString(),
		requireConfirmation: true,
		transactions: [
			{
				dateCreated: created,
				dateModified: modified,
				accountNumber: 2020,
				currency: {
					amount: 1n,
					localAmount: 10n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				},
			},
			{
				dateCreated: created,
				dateModified: modified,
				accountNumber: 4661,
				currency: {
					amount: -1n,
					localAmount: -10n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				},
			},
		],
	}

	const verification = new Verification(option)
	return verification
}

function fakerVerificationMinimal(): Verification {
	const option: Verification.Option = {
		userId: USER_ID,
		name: faker.commerce.productName(),
		date: '2020-01-01',
		type: Verification.Types.TRANSACTION,
		transactions: [
			{
				accountNumber: 2020,
				currency: {
					amount: 1n,
					code: 'USD',
				},
			},
			{
				accountNumber: 4661,
				currency: {
					amount: -1n,
					code: 'USD',
				},
			},
		],
	}

	const verification = new Verification(option)
	return verification
}

function fakerParserSingle(): Parser {
	return new ParserSingle({
		id: new ObjectId().toHexString(),
		name: 'Test parser',
		identifier: /test/,
		userId: USER_ID,
		verification: {
			name: 'Name',
			internalName: 'INTERNAL_NAME',
			type: Verification.Types.INVOICE_IN,
			accountFrom: 2499,
			accountTo: 4330,
		},
		matcher: {
			date: {
				find: /\d{4}-\d{2}-\d{2}/,
			},
			currencyCode: {
				find: /(?<=code: )\w{3}/,
			},
			amount: {
				find: /(?<=total: )\d{1,4}/,
			},
		},
	})
}

function fakerParserMulti(): Parser {
	return new ParserMulti({
		id: new ObjectId().toHexString(),
		userId: USER_ID,
		name: 'Skattekonto',
		identifier: /Omfattar transaktionstyp/,
		accountFrom: 1630,
		currencyCodeDefault: 'SEK',
		matcher: /(?<year>\d{2})(?<month>\d{2})(?<day>\d{2})\s+(?<name>.*?)\s{4}\s+(?<amount>-?\d*?\s?\d*)\s{4}/g,
		lineMatchers: [
			{
				identifier: /Debiterad preliminärskatt/,
				internalName: 'TAX_ACCOUNT_PRELIMINARY_TAX',
				type: Verification.Types.TRANSACTION,
				accountTo: 2518,
			},
			{
				identifier: /Moms/,
				internalName: 'TAX_ACCOUNT_TAX_COLLECT',
				type: Verification.Types.TRANSACTION,
				accountTo: 1650,
			},
			{
				identifier: /ostnadsränta/,
				internalName: 'TAX_ACCOUNT_INTEREST_EXPENSE',
				type: Verification.Types.TRANSACTION,
				accountTo: 8423,
				currencyCodeDefault: 'USD',
			},
		],
	})
}

function fakerUser(): User.Option {
	return {
		id: USER_ID,
		username: faker.internet.userName(),
		firstName: faker.name.firstName(),
		lastName: faker.name.lastName(),
		localCurrencyCode: 'SEK',
		apiKey: new ObjectId().toHexString(),
	}
}

function fakerFiscalYear(year: number): FiscalYear {
	return new FiscalYear({
		id: new ObjectId().toHexString(),
		userId: USER_ID,
		simpleName: faker.date.past().toISOString(),
		from: `${year}-01-01`,
		to: `${year}-12-31`,
		startingBalances: [
			{
				accountNumber: faker.random.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END }),
				amount: BigInt(faker.random.number()),
			},
		],
	})
}

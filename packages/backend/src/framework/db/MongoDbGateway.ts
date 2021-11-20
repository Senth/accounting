import { DbGateway } from './DbGateway'
import { Verification } from '../../app/core/entities/Verification'
import { Parser } from '../../app/core/entities/Parser'
import { Id } from '../../app/core/definitions/Id'
import { MongoClient, Db, Collection, ObjectId } from 'mongodb'
import { Currency } from '../../app/core/entities/Currency'
import { Account } from '../../app/core/entities/Account'
import { User } from '../../app/core/entities/User'
import { config } from '../../config'
import { InternalError } from '../../app/core/definitions/InternalError'
import { Entity } from '../../app/core/entities/Entity'
import { MongoConverter } from './MongoConverter'
import { OutputError } from '../../app/core/definitions/OutputError'
import { FiscalYear } from '../../app/core/entities/FiscalYear'
import '../../app/core/definitions/String'

export enum Collections {
	Verification = 'Verification',
	User = 'User',
	Account = 'Account',
	FiscalYear = 'FiscalYear',
	Parser = 'Parser',
}

export class MongoDbGateway implements DbGateway {
	private mongoClient?: MongoClient
	private db?: Db
	private connectedPromise: Promise<void>

	constructor() {
		this.connectedPromise = MongoClient.connect(config.mongoDb.url(), { useUnifiedTopology: true })
			.then((mongoClient) => {
				this.mongoClient = mongoClient
				this.db = this.mongoClient.db(config.mongoDb.database)
			})
			.catch((reason) => {
				throw new InternalError(InternalError.Types.dbConnectionError, reason)
			})
	}

	/**
	 * @return promise that is resolved once the gateway has connected to Mongo DB
	 */
	async waitUntilConnected(): Promise<void> {
		return this.connectedPromise
	}

	/**
	 * Get a promise of returning a collection
	 * @param collection the collection to get from the DB
	 * @return promise containing a collection
	 */
	private async collection(collection: Collections): Promise<Collection> {
		return this.waitUntilConnected().then(() => {
			return this.db!.collection(collection)
		})
	}

	private async save(entity: Entity, collection: Collections): Promise<{}> {
		const validation = entity.validate()

		if (validation.length > 0) {
			throw new OutputError(validation)
		}

		const dbObject = MongoConverter.toDbObject(entity)

		return this.collection(collection)
			.then(async (collection) => {
				return collection.updateOne({ _id: dbObject._id }, { $set: dbObject }, { upsert: true })
			})
			.then((result) => {
				if (result.modifiedCount + result.upsertedCount === 1) {
					return dbObject
				} else {
					throw new InternalError(InternalError.Types.dbError, 'Could save Entity to MongoDB')
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					throw reason
				} else {
					throw new InternalError(InternalError.Types.dbError, reason)
				}
			})
	}

	async saveVerification(verification: Verification): Promise<Verification> {
		return this.save(verification, Collections.Verification).then((dbObject) => {
			return MongoConverter.toVerification(dbObject)
		})
	}

	async getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined> {
		// Only search by id if Id is specified
		if (verification.id) {
			return this.getVerification(verification.userId, verification.id)
		}

		const searchObject = MongoConverter.toDbObject(verification, 'dont-add-id')

		return this.collection(Collections.Verification)
			.then(async (collection) => {
				return collection.findOne(searchObject)
			})
			.then((foundObject) => {
				// Found object, but might still be different from the comparable verification
				if (foundObject) {
					const foundVerification = MongoConverter.toVerification(foundObject)

					if (verification.isEqualTo(foundVerification.getComparable())) {
						return foundVerification
					}
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async saveParser(parser: Parser): Promise<Parser> {
		return this.save(parser, Collections.Parser).then((dbObject) => {
			return MongoConverter.toParser(dbObject)
		})
	}

	async saveUser(user: User): Promise<User> {
		return this.save(user, Collections.User).then((dbObject) => {
			return MongoConverter.toUser(dbObject)
		})
	}

	async getLocalCurrency(userId: Id): Promise<Currency.Codes> {
		return this.collection(Collections.User)
			.then((collection) => {
				return collection.findOne({ _id: new ObjectId(userId) }, { projection: { localCurrencyCode: 1 } })
			})
			.then((foundObject) => {
				if (foundObject && foundObject.localCurrencyCode) {
					const code = Currency.Codes.fromString(foundObject.localCurrencyCode)
					if (code) {
						return code
					}
					throw OutputError.create(OutputError.Types.currencyCodeInvalid, foundObject.localCurrencyCode)
				} else {
					throw OutputError.create(OutputError.Types.userNotFound, String(userId))
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getAccount(userId: Id, accountNumber: number): Promise<Account> {
		return this.collection(Collections.Account)
			.then(async (collection) => {
				return collection.findOne({
					userId: new ObjectId(userId),
					number: accountNumber,
				})
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toAccount(foundObject)
				}
				throw OutputError.create(OutputError.Types.accountNumberNotFound, String(accountNumber))
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getVerification(userId: Id, verificationId: Id): Promise<Verification> {
		return this.collection(Collections.Verification)
			.then(async (collection) => {
				return collection.findOne({
					_id: new ObjectId(verificationId),
					userId: new ObjectId(userId),
				})
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toVerification(foundObject)
				}
				throw OutputError.create(OutputError.Types.verificationNotFound, String(verificationId))
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getUser(apiKey: string): Promise<User> {
		return this.collection(Collections.User)
			.then(async (collection) => {
				return collection.findOne({ apiKey: apiKey })
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toUser(foundObject)
				} else {
					throw OutputError.create(OutputError.Types.userNotFound)
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getParsers(userId: Id): Promise<Parser[]> {
		return this.collection(Collections.Parser)
			.then(async (collection) => {
				const cursor = collection.find({ userId: new ObjectId(userId) })
				return cursor.toArray()
			})
			.then((foundParsers) => {
				const parsers = new Array<Parser>()

				if (foundParsers) {
					for (const object of foundParsers) {
						const parser = MongoConverter.toParser(object)
						parsers.push(parser)
					}
				}

				return parsers
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getFiscalYear(userId: Id, date: string): Promise<FiscalYear> {
		if (!date.isValidIsoDate()) {
			throw OutputError.create(OutputError.Types.dateFormatInvalid, date)
		}

		return this.collection(Collections.FiscalYear)
			.then(async (collection) => {
				const query = {
					userId: new ObjectId(userId),
					from: { $lte: date },
					to: { $gte: date },
				}
				return collection.findOne(query)
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toFiscalYear(foundObject)
				}
				throw OutputError.create(OutputError.Types.fiscalYearNotFound, date)
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getVerifications(userId: Id, fiscalYearId: Id): Promise<Verification[]> {
		return this.collection(Collections.Verification)
			.then(async (collection) => {
				const query = {
					userId: new ObjectId(userId),
					fiscalYearId: new ObjectId(fiscalYearId),
				}
				return collection.find(query).toArray()
			})
			.then((foundObjects) => {
				const verifications: Verification[] = []
				if (foundObjects) {
					for (const object of foundObjects) {
						const verification = MongoConverter.toVerification(object)
						verifications.push(verification)
					}
				}
				return verifications
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getUnboundVerifications(userId: Id): Promise<Verification[]> {
		return this.collection(Collections.Verification)
			.then(async (collection) => {
				const query = {
					userId: new ObjectId(userId),
					paymentId: { $exists: false },
					invoiceId: { $exists: false },
					type: {
						$in: [
							Verification.Types.INVOICE_IN,
							Verification.Types.INVOICE_IN_PAYMENT,
							Verification.Types.INVOICE_OUT,
							Verification.Types.INVOICE_OUT_PAYMENT,
						],
					},
				}
				return collection.find(query).toArray()
			})
			.then((foundObjects) => {
				// Convert objects to verifications
				return foundObjects.reduce((array, object) => {
					array.push(MongoConverter.toVerification(object))
					return array
				}, new Array<Verification>())
			})
	}

	async getFiscalYears(userId: Id): Promise<FiscalYear[]> {
		return this.collection(Collections.FiscalYear)
			.then(async (collection) => {
				const query = { userId: new ObjectId(userId) }
				return collection.find(query).toArray()
			})
			.then((foundObjects) => {
				return foundObjects.reduce((array, object) => {
					array.push(MongoConverter.toFiscalYear(object))
					return array
				}, new Array<FiscalYear>())
			})
	}
}

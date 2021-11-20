import { ApiAdapter } from '../../adapters/api/ApiAdapter'
import { Id } from '../../app/core/definitions/Id'
import { VerificationNewCustomTransactionInput } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInput'
import { VerificationNewFromParserInput } from '../../app/verification/new-from-parser/VerificationNewFromParserInput'
import { VerificationNewInput } from '../../app/verification/new/VerificationNewInput'
import { ExpressApiHelper } from './ExpressApiHelper'
import { ExpressSerializer } from './ExpressSerializer'

export class ExpressApi {
	readonly api: ExpressApiHelper

	constructor(apiAdapter: ApiAdapter) {
		this.api = new ExpressApiHelper(apiAdapter)
		this.bindApi()
	}

	private bindApi() {
		this.bindVerification()
		this.bindUser()
		this.bindFiscalYear()
	}

	private bindVerification() {
		// Get all
		this.api.getAuthorized('/api/verification/:fiscalYearId', (adapter, request, userId) => {
			const fiscalYearId: Id = ExpressSerializer.deserialize(request.params.fiscalYearId)
			return adapter.verification.getAll({ userId: userId, fiscalYearId: fiscalYearId })
		})

		// Add single
		this.api.postAuthorized('/api/verification/add', async (adapter, request, userId, files) => {
			const verificationData = ExpressSerializer.deserialize(request.body)
			verificationData.files = files
			const input: VerificationNewInput = { userId: userId, verification: verificationData }
			if (VerificationNewInput.validate(input)) {
				return adapter.verification.add(input)
			}
		})

		// Add custom transaction
		this.api.postAuthorized('/api/verification/add-custom', async (adapter, request, userId, files) => {
			const verifictationData = ExpressSerializer.deserialize(request.body)
			verifictationData.files = files
			const input: VerificationNewCustomTransactionInput = { userId: userId, verification: verifictationData }
			if (VerificationNewCustomTransactionInput.validate(input)) {
				return adapter.verification.addCustom(input)
			}
		})

		// Add from parser
		this.api.postAuthorized('/api/verification/add-from-files', async (adapter, request, userId, files) => {
			const input: VerificationNewFromParserInput = { userId: userId, files: files }
			if (VerificationNewFromParserInput.validate(input)) {
				return adapter.verification.addFromParser(input)
			}
		})
	}

	private bindUser() {
		// Create user
		this.api.post('/api/user', (adapter, request) => {
			const userData = ExpressSerializer.deserialize(request.body)
			return adapter.user.create({ user: userData })
		})

		// Get user by Api key
		this.api.get('/api/user/:apiKep', (adapter, request) => {
			return adapter.user.getByKey({ apiKey: request.params.apiKey })
		})
	}

	private bindFiscalYear() {
		// Get all
		this.api.getAuthorized('/api/fiscal-year', (adapter, request, userId) => {
			return adapter.fiscalYear.getAll({ userId: userId })
		})
	}
}

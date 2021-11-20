import { VerificationGetAllInteractor } from './VerificationGetAllInteractor'
import { VerificationGetAllRepository } from './VerificationGetAllRepository'
import { VerificationGetAllInput } from './VerificationGetAllInput'
import { VerificationGetAllOutput } from './VerificationGetAllOutput'
import { Id } from '../../core/definitions/Id'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'

describe('VerificationGetAll() #cold #use-case', () => {
	let interactor: VerificationGetAllInteractor
	let repository: VerificationGetAllRepository
	let input: VerificationGetAllInput
	let output: VerificationGetAllOutput
	let promise: Promise<VerificationGetAllOutput>

	beforeAll(() => {
		repository = {
			async getVerifications(userId: Id, fiscalYearId: Id): Promise<Verification[]> {
				if (userId === -1) {
					throw Error('Test error')
				} else if (userId === 1) {
					return [
						new Verification({
							userId: 1,
							date: '2020-01-01',
							name: 'Just a name',
							type: Verification.Types.INVOICE_IN,
							transactions: [],
						}),
					]
				} else {
					return []
				}
			},
		}
		interactor = new VerificationGetAllInteractor(repository)
	})

	it('VerificationGetAll()', async () => {
		// Found verifications
		input = {
			userId: 1,
			fiscalYearId: 0,
		}
		output = await interactor.execute(input)
		expect(output.verifications).toHaveLength(1)

		// Didn't find any verifications
		input = {
			userId: 123,
			fiscalYearId: 1,
		}
		output = await interactor.execute(input)
		expect(output.verifications).toHaveLength(0)

		// Internal error
		input = {
			userId: -1,
			fiscalYearId: 1,
		}
		promise = interactor.execute(input)
		await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
	})
})

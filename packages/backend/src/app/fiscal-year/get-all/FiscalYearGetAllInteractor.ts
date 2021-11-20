import { Interactor } from '../../core/definitions/Interactor'
import { FiscalYearGetAllInput } from './FiscalYearGetAllInput'
import { FiscalYearGetAllOutput } from './FiscalYearGetAllOutput'
import { FiscalYearGetAllRepository } from './FiscalYearGetAllRepository'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Get all the user's fiscal years
 */
export class FiscalYearGetAllInteractor extends Interactor<
	FiscalYearGetAllInput,
	FiscalYearGetAllOutput,
	FiscalYearGetAllRepository
> {
	constructor(repository: FiscalYearGetAllRepository) {
		super(repository)
	}

	/**
	 * Get all the user's fiscal years
	 */
	async execute(input: FiscalYearGetAllInput): Promise<FiscalYearGetAllOutput> {
		return this.repository
			.getFiscalYears(input.userId)
			.then((fiscalYears) => {
				return {
					fiscalYears: fiscalYears,
				}
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					throw reason
				}
				// Log error
				else if (!(reason instanceof InternalError)) {
					new InternalError(InternalError.Types.unknown, reason)
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}
}

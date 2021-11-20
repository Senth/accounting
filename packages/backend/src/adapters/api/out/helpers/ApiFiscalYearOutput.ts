import { FiscalYear } from '../../../../app/core/entities/FiscalYear'
import { Id } from '../../../../app/core/definitions/Id'
import { Immutable } from '../../../../app/core/definitions/Immutable'

export interface ApiFiscalYearBaseOutput {
	readonly id: Id
	readonly simpleName?: string
	readonly from: string
	readonly to: string
	readonly startingBalances: Immutable<
		{
			readonly accountNumber: number
			readonly amount: bigint
		}[]
	>
}

export namespace ApiFiscalYearBaseOutput {
	export function fromFiscalYear(fiscalYear: Immutable<FiscalYear>): Immutable<ApiFiscalYearBaseOutput> {
		return {
			id: fiscalYear.id!,
			simpleName: fiscalYear.simpleName,
			from: fiscalYear.from,
			to: fiscalYear.to,
			startingBalances: fiscalYear.startingBalances,
		}
	}
}

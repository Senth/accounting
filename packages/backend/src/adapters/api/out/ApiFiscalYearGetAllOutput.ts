import { ApiFiscalYearBaseOutput } from './helpers/ApiFiscalYearOutput'
import { FiscalYearGetAllOutput } from '../../../app/fiscal-year/get-all/FiscalYearGetAllOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'

export interface ApiFiscalYearGetAllOutput {
	readonly years: Immutable<ApiFiscalYearBaseOutput[]>
}

export namespace ApiFiscalYearGetAllOutput {
	export function fromInteractorOutput(interactorOutput: FiscalYearGetAllOutput): Immutable<ApiFiscalYearGetAllOutput> {
		// Convert Fiscal
		const years = interactorOutput.fiscalYears.reduce((array, fiscalYear) => {
			array.push(ApiFiscalYearBaseOutput.fromFiscalYear(fiscalYear))
			return array
		}, new Array<ApiFiscalYearBaseOutput>())

		return { years: years }
	}
}

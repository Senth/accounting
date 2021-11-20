import { Output } from '../../core/definitions/Output'
import { FiscalYear } from '../../core/entities/FiscalYear'

export interface FiscalYearGetAllOutput extends Output {
	fiscalYears: FiscalYear[]
}

import { Verification } from '../../../../app/core/entities/Verification'
import { Id } from '../../../../app/core/definitions/Id'
import { ApiTransactionOutput } from './ApiTransactionOutput'
import { Immutable } from '../../../../app/core/definitions/Immutable'

export interface ApiVerificationOutput {
	readonly id: Id
	readonly name: string
	readonly number?: number
	readonly date: string
	readonly dateFiled?: number
	readonly dateDeleted?: number
	readonly type: Verification.Types
	readonly description?: string
	readonly files?: Immutable<string[]>
	readonly invoiceId: Id | undefined
	readonly paymentId: Id | undefined
	readonly transactions: Immutable<ApiTransactionOutput[]>
}

export namespace ApiVerificationOutput {
	export function fromVerification(verification: Immutable<Verification>): Immutable<ApiVerificationOutput> {
		const transactions = verification.transactions.reduce((array, transaction) => {
			const apiTransaction = ApiTransactionOutput.fromTransaction(transaction)
			array.push(apiTransaction)
			return array
		}, new Array<ApiTransactionOutput>())
		return {
			id: verification.id!,
			name: verification.name,
			number: verification.number,
			date: verification.date,
			dateFiled: verification.dateFiled,
			dateDeleted: verification.dateDeleted,
			type: verification.type,
			description: verification.description,
			files: verification.files,
			invoiceId: verification.invoiceId,
			paymentId: verification.paymentId,
			transactions: transactions,
		}
	}
}

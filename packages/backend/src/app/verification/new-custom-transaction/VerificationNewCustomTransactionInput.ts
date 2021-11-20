import { Id } from '../../core/definitions/Id'
import { Input } from '../../core/definitions/Input'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Transaction Data
 */
export interface TransactionInputData {
	readonly accountNumber: number
	readonly amount: number | bigint
	readonly currencyCode: string
}

namespace TransactionInputData {
	export function validate(object: {}): object is TransactionInputData {
		const implementation = object as TransactionInputData
		if (typeof implementation.accountNumber !== 'number') {
			throw OutputError.create(OutputError.Types.accountNumberMissing)
		}
		if (typeof implementation.amount !== 'number' && typeof implementation.amount !== 'bigint') {
			throw OutputError.create(OutputError.Types.amountMissing)
		}
		if (typeof implementation.currencyCode !== 'string') {
			throw OutputError.create(OutputError.Types.currencyCodeMissing)
		}
		return true
	}
}

/**
 * Custom transaction input.
 */
export interface VerificationNewCustomTransactionInput extends Input {
	readonly userId: Id
	readonly verification: {
		readonly name: string
		readonly description?: string
		readonly files?: string[]
		readonly date: string
		readonly transactions: TransactionInputData[]
	}
}

export namespace VerificationNewCustomTransactionInput {
	export function validate(object: {}): object is VerificationNewCustomTransactionInput {
		const implementation = object as VerificationNewCustomTransactionInput
		if (typeof implementation.userId !== 'string' || typeof implementation.userId !== 'number') {
			throw OutputError.create(OutputError.Types.userIdMissing)
		}
		if (implementation.verification === undefined) {
			throw OutputError.create(OutputError.Types.verificationMissing)
		} else {
			if (typeof implementation.verification.name !== 'string') {
				throw OutputError.create(OutputError.Types.nameMissing)
			}
			if (typeof implementation.verification.date !== 'string') {
				throw OutputError.create(OutputError.Types.dateMissing)
			}
			if (!(implementation.verification.transactions instanceof Array)) {
				throw OutputError.create(OutputError.Types.transactionsMissing)
			} else {
				for (const transaction of implementation.verification.transactions) {
					TransactionInputData.validate(transaction)
				}
			}

			// Optional description
			if (
				implementation.verification.description !== undefined &&
				typeof implementation.verification.description !== 'string'
			) {
				throw OutputError.create(OutputError.Types.descriptionInvalidFormat)
			}
			// Optional files
			if (implementation.verification.files !== undefined && !(implementation.verification.files instanceof Array)) {
				throw new InternalError(InternalError.Types.invalidEntityState, 'verification.files not an array')
			} else if (implementation.verification.files instanceof Array) {
				for (const file of implementation.verification.files) {
					if (typeof file !== 'string') {
						throw new InternalError(InternalError.Types.invalidEntityState, 'verification.files[index] not a string')
					}
				}
			}
		}

		return true
	}
}

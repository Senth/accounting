import { Verification } from '../../app/core/entities/Verification'
import { VerificationSaveRepository } from '../../app/verification/save/VerificationSaveRepository'
import { BaseAdapter } from './BaseAdapter'

export class VerificationSaveRepositoryAdapter extends BaseAdapter implements VerificationSaveRepository {
	async saveVerification(verification: Verification): Promise<Verification> {
		return BaseAdapter.dbGateway.saveVerification(verification)
	}

	async saveFiles(verification: Verification): Promise<Verification> {
		return BaseAdapter.fileGateway.save(verification)
	}

	async getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined> {
		return BaseAdapter.dbGateway.getExistingVerification(verification)
	}
}

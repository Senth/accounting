import * as fs from 'fs-extra'
import * as path from 'path'
import * as crypto from 'crypto'
import { InternalError } from '../../app/core/definitions/InternalError'
import { Verification } from '../../app/core/entities/Verification'
import { config } from '../../config'
import { FileGateway } from './FileGateway'
import { FileReaderFactory } from './FileReaderFactory'

export class FileSystemGateway implements FileGateway {
	private readonly fileReaderFactory = new FileReaderFactory()
	private static readonly outputDir = path.join(config.fileSystem.writeDir, 'verifications')

	async read(file: string): Promise<string> {
		const fileReader = this.fileReaderFactory.create(file)
		return fileReader.read(file)
	}

	async remove(file: string): Promise<void> {
		return fs.remove(file)
	}

	async save(verification: Verification): Promise<Verification> {
		// Skip if no files are available
		if (!verification.files) {
			return verification
		}

		// Get unique files and delete duplicates
		return (
			FileSystemGateway.getUniqueAndDeleteDuplicateFiles(verification.files)
				// Save files
				.then((uniqueFiles) => {
					const savePromises = uniqueFiles.reduce((array, file, index) => {
						array.push(FileSystemGateway.saveFile(file, index + 1, verification))
						return array
					}, new Array<Promise<string>>())

					return Promise.all(savePromises)
				})
				// Update verification
				.then((files) => {
					const updatedVerifcation = new Verification(verification)
					updatedVerifcation.files = files
					return updatedVerifcation
				})
				.catch((reason) => {
					throw new InternalError(InternalError.Types.fileSave, reason)
				})
		)
	}

	private static async getUniqueAndDeleteDuplicateFiles(files: string[]): Promise<string[]> {
		const hashPromises = files.map((file) => {
			return FileSystemGateway.getFileHash(file)
		})

		return Promise.all(hashPromises).then((hashedFiles) => {
			const uniqueFiles: { [key: string]: string } = {}
			const duplicates: string[] = []

			for (const hashFile of hashedFiles) {
				// Duplicate
				if (uniqueFiles[hashFile.hash]) {
					duplicates.push(hashFile.file)
				} else {
					uniqueFiles[hashFile.hash] = hashFile.file
				}
			}

			// Remove duplicates
			duplicates.map((file) => {
				fs.removeSync(file)
			})

			return Object.values(uniqueFiles)
		})
	}

	private static async getFileHash(file: string): Promise<{ file: string; hash: string }> {
		return fs.readFile(file).then((contents) => {
			const md5sum = crypto.createHash('md5')
			md5sum.update(contents)
			return { file: file, hash: md5sum.digest('base64') }
		})
	}

	private static async saveFile(file: string, index: number, verification: Verification): Promise<string> {
		const verificationFullName = verification.getFullName()
		const ext = path.extname(file)
		const fileNameOut = `${verificationFullName} (${index})${ext}`
		const outPath = path.join(FileSystemGateway.outputDir, verification.date.substr(0, 4), fileNameOut)

		// Only move if files are in different locations
		if (file !== outPath) {
			// Create parent dirs
			return fs
				.ensureDir(path.dirname(outPath))
				.then(() => {
					// Move files
					return fs.move(file, outPath)
				})
				.then(() => {
					return outPath
				})
		} else {
			return outPath
		}
	}
}

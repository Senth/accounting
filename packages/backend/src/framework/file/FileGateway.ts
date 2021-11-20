import { Verification } from '../../app/core/entities/Verification'

export interface FileGateway {
	/**
	 * Reads a file and returns it as a string.
	 * @param file the file to read.
	 * @return all the text in the file
	 * @throws {InternalError.Types.fileNotFound} if the file doesn't exist
	 * @throws {InternalError.Types.readingFile} if the file couldn't be read properly
	 * @throws {InternalError.Types.notImplemented} if a reader for the file's extension hasn't been implemented
	 */
	read(file: string): Promise<string>

	/**
	 * Save (move) all verification files to the correct location
	 * @param verification save all the files of this verification
	 * @throws {InternalError.Types.fileSave} if something went wrong saving one or more files
	 */
	save(verification: Verification): Promise<Verification>

	/**
	 * Remove the specified file
	 * @param file the file to remove
	 */
	remove(file: string): Promise<void>
}

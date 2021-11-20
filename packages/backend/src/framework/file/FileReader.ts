export interface FileReader {
	/**
	 * Reads a file and returns it as a string.
	 * @param file the file to read.
	 * @return all the text in the file
	 * @throws {InternalError.Types.fileNotFound} if the file doesn't exist
	 * @throws {InternalError.Types.readingFile} if the file couldn't be read properly
	 */
	read(file: string): Promise<string>
}

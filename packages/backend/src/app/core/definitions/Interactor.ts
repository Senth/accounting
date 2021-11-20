import { Input } from './Input'
import { Output } from './Output'
import { Repository } from './Repository'

export abstract class Interactor<InputType extends Input, OutputType extends Output, RepoType extends Repository> {
	protected repository: RepoType
	protected input!: InputType

	public constructor(repository: RepoType) {
		this.repository = repository
	}

	/**
	 * Execute the use case
	 * @param input input from the adapter
	 * @return {Promise.<OutputType>}
	 */
	public abstract execute(input: InputType): Promise<OutputType>
}

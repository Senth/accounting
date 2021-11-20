import { DbGateway } from '../../framework/db/DbGateway'
import { FileGateway } from '../../framework/file/FileGateway'
import { ExchangeGateway } from '../../framework/exchange/ExchangeGateway'

export abstract class BaseAdapter {
	protected static dbGateway: DbGateway
	protected static fileGateway: FileGateway
	protected static exchangeGateway: ExchangeGateway

	/**
	 * Set all gateways for all the adapters. This must be called before any adapters can be used correctly
	 * @param dbGateway the db gateway used in all adapters
	 * @param fileGateway the file gateway used in all adapters
	 * @param exchangeGateway the exchange gateway used in all adapters
	 */
	static init(dbGateway: DbGateway, fileGateway: FileGateway, exchangeGateway: ExchangeGateway) {
		BaseAdapter.dbGateway = dbGateway
		BaseAdapter.fileGateway = fileGateway
		BaseAdapter.exchangeGateway = exchangeGateway
	}
}

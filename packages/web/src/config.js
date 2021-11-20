let configInput
if (process.env.NODE_ENV === 'development') {
	configInput = require('./config.development').config
} else if (process.env.NODE_ENV === 'production') {
	configInput = require('./config.production').config
} else if (process.env.NODE_ENV === 'test') {
	configInput = require('./config.testing').config
} else {
	throw new Error('Could not load config file')
}

const config = {
	API_URL: configInput.API_URL,
	apiUrl(extension, addApiKey = true) {
		let addSlash = ''
		if (typeof extension === 'string' && extension.charAt(0) !== '/') {
			addSlash = '/'
		}
		// Add api key
		let apiKeyExt = ''
		if (addApiKey) {
			const apiKey = localStorage.getItem('apiKey')
			if (apiKey) {
				if (typeof extension === 'string' && extension.includes('?')) {
					apiKeyExt = '&apiKey=' + apiKey
				} else {
					apiKeyExt = '?apiKey=' + apiKey
				}
			}
		}
		return this.API_URL + addSlash + extension + apiKeyExt
	},
}

export default config

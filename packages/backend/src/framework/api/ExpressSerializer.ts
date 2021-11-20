export namespace ExpressSerializer {
	/**
	 * Serialize an apiOutput to be JSON compatible
	 * @param apiOutput the output object to serialize
	 * @return serialized object
	 */
	export function serialize(apiOutput: {}): {} {
		const object: any = {}

		for (let [key, value] of Object.entries(apiOutput)) {
			// Convert bigint
			if (typeof value === 'bigint') {
				object[key] = `${value}n`
			}

			// Regexp - Use value directly
			else if (value instanceof RegExp) {
				object[key] = value
			}

			// Recursive object
			else if (typeof value === 'object' && value) {
				const child = serialize(value!)
				if (child) {
					object[key] = child
				}
			}

			// Use value
			else {
				object[key] = value
			}
		}

		return object
	}

	/**
	 * Deserialize an web object to input object
	 * Meaning convert all number strings into a number or bigint
	 * @param webObject the web object to serialize to internal objects.
	 */
	export function deserialize(webObject: any): any {
		let inputObject: any

		// Convert number
		if (typeof webObject === 'string' && !isNaN(Number(webObject))) {
			inputObject = Number(webObject)
		}

		// Convert bigint
		else if (typeof webObject === 'string' && /^-?\d+n$/.test(webObject)) {
			inputObject = BigInt(webObject.substr(0, webObject.length - 1))
		}

		// Regexp - use value directly
		else if (webObject instanceof RegExp) {
			inputObject = webObject
		}

		// Recursive qbject
		else if (typeof webObject === 'object' && webObject) {
			inputObject = {}
			for (let [key, value] of Object.entries(webObject)) {
				inputObject[key] = deserialize(value)
			}
		}

		// Use value
		else {
			inputObject = webObject
		}

		return inputObject
	}
}

import React, { Fragment } from 'react'
import Axios from 'axios'
import config from '../config'
import './vat_export.css'

class VatExport extends React.Component {
	state = {
		vat_amounts: {}
	}

	async componentDidMount() {
		console.log('compontentDidMount()')
		Axios.get(
			config.apiUrl('/account/get-vat-info')
		).then(response => {
			console.log('Got response')
			if (typeof response.data !== 'undefined') {
				this.setState({ vat_amounts: response.data })
			}
		}).catch(error => {
			console.log(error)
		})
	}

	render() {
		const amounts = this.state.vat_amounts

		const listAmounts = Object.keys(amounts).map((keyName, i) => {
			const amount = amounts[keyName]
			return (
				<div key={i}>
					<p>
						<span className="vat_code">{keyName}:</span>
						<span className="amount">{amount}</span>
					</p>
				</div>
			)
		})
		return (
			<Fragment>
				<h1>VAT Export</h1>
				{listAmounts}
			</Fragment >
		)
	}
}

export default VatExport
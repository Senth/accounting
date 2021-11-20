import React from 'react'
import './payment_new.css'
import AccountSelect, { getAllAccountsAsOptions } from '../helpers/AccountInfo'
import Axios from 'axios'
import config from '../config'
import VerificationInfo from '../ui/VerificationEdit'

const INVOICE_IN = 'INVOICE_IN'
const INVOICE_IN_PAYMENT = 'INVOICE_IN_PAYMENT'
const PAYMENT_DIRECT_OUT = 'PAYMENT_DIRECT_OUT'

class PaymentNew extends React.Component {
	constructor(props) {
		super(props)

		this.fileRef = React.createRef()

		this.onSubmit = this.onSubmit.bind(this)
		this.onChange = this.onChange.bind(this)
		this.onTypeChange = this.onTypeChange.bind(this)
		this.onAccountToChange = this.onAccountToChange.bind(this)
		this.onAccountFromChange = this.onAccountFromChange.bind(this)
		this.onGetAllAccounts = this.onGetAllAccounts.bind(this)
	}

	state = {
		header: '',
		input: {
			date: '',
			type: '',
			name: '',
			invoice_amount: '',
			payed_in_sek: '',
			currency: localStorage.getItem('localCurrencyCode'),
			account_to: null,
			account_from: null,
		},
		accounts: {},
	}

	componentDidMount() {
		getAllAccountsAsOptions(this.onGetAllAccounts)
	}

	onGetAllAccounts(accounts) {
		this.setState({ accounts: accounts })
		this.onTypeChange(INVOICE_IN)
	}

	render() {
		return (
			<div id='paymentNew'>
				<h1>{this.state.header}</h1>
				<form onSubmit={this.onSubmit}>
					<VerificationInfo
						date={this.state.input.date}
						name={this.state.input.name}
						options={this.getSelectOptions()}
						fileRef={this.fileRef}
						onChange={this.onChange}
						onTypeChange={this.onTypeChange}
					/>
					<div className='info'>
						<div>
							<span className='label'>{this.state.type === PAYMENT_DIRECT_OUT ? 'Payed' : 'Invoice'} amount</span>
							<input
								type='text'
								name='invoice_amount'
								placeholder='Amount'
								value={this.state.input.invoice_amount}
								onChange={this.onChange}
							/>
							<input
								type='text'
								className='currency'
								name='currency'
								placeholder='Currency'
								value={this.state.input.currency}
								onChange={this.onChange}
							/>
						</div>
						<div
							className={
								this.state.input.currency === localStorage.getItem('localCurrencyCode') ||
								this.state.input.type === INVOICE_IN
									? 'hidden'
									: ''
							}
						>
							<span className='label'>Payed in SEK</span>
							<input
								type='text'
								name='payed_in_sek'
								placeholder='Amount'
								value={this.state.input.payed_in_sek}
								onChange={this.onChange}
							/>
						</div>
						<div className={this.state.input.type === INVOICE_IN_PAYMENT ? 'hidden' : ''}>
							<span className='label'>Cost account (debit)</span>
							<AccountSelect
								options={this.state.accounts}
								value={this.state.input.account_to}
								onChange={this.onAccountToChange}
							/>
						</div>
						<div className={this.state.input.type === INVOICE_IN ? 'hidden' : ''}>
							<span className='label'>From account (credit)</span>
							<AccountSelect
								options={this.state.accounts}
								value={this.state.input.account_from}
								onChange={this.onAccountFromChange}
							/>
						</div>
					</div>
					<input type='submit' value='Add' />
				</form>
			</div>
		)
	}

	renderHideWhenSek() {
		if (this.state === 'SEK') {
			return 'hidden'
		} else {
			return ''
		}
	}

	getSelectOptions() {
		return [
			{ value: INVOICE_IN, label: 'Invoice' },
			{ value: INVOICE_IN_PAYMENT, label: 'Payed invoice' },
			{ value: PAYMENT_DIRECT_OUT, label: 'Payed directly' },
		]
	}

	async onSubmit(event) {
		event.preventDefault()

		let accountData = {}
		// Account From
		if (this.state.input.account_from !== null) {
			accountData = {
				account_from: this.state.input.account_from.value,
			}
		}
		// Account to
		if (this.state.input.account_to !== null) {
			accountData = {
				...accountData,
				account_to: this.state.input.account_to.value,
			}
		}

		let toJson = {
			...this.state.input,
			...accountData,
		}
		const formData = new FormData()
		formData.append('json', JSON.stringify(toJson))
		formData.append('file', this.fileRef.current.files[0])

		Axios.post(config.apiUrl('/verification/create-payment'), formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})
			.then((response) => {})
			.catch((error) => {
				console.log(error)
			})
	}

	onChange(event) {
		this.setState({
			input: {
				...this.state.input,
				[event.target.name]: event.target.value,
			},
		})
	}

	onAccountToChange(selectedOption) {
		this.setState({
			input: {
				...this.state.input,
				account_to: selectedOption,
			},
		})
	}

	onAccountFromChange(selectedOption) {
		console.log(selectedOption)
		this.setState({
			input: {
				...this.state.input,
				account_from: selectedOption,
			},
		})
	}

	onTypeChange(type) {
		this.setState((prevState) => ({
			input: {
				...prevState.input,
				type: type,
			},
		}))
		switch (type) {
			case 'INVOICE_IN':
				this.setState({ header: 'New Invoice Received' })
				break
			case 'INVOICE_IN_PAYMENT':
				this.setState({ header: 'New Invoice Payment' })
				break
			case 'PAYMENT_DIRECT':
				this.setState({ header: 'New Direct Payment' })
				break
			default:
				this.setState({ header: 'Invalid' })
				break
		}
	}
}

export default PaymentNew

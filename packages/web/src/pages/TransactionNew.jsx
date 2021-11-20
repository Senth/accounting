import React from 'react'
import './transaction_new.css'
import VerificationInfo from '../ui/VerificationEdit'
import Select from 'react-select'
import { getAllAccountsAsOptions } from '../helpers/AccountInfo'
import Button from '../ui/Button'
import Axios from 'axios'
import config from '../config'

class TransactionNew extends React.Component {
	constructor(props) {
		super(props)

		this.fileRef = React.createRef()

		this.onSubmit = this.onSubmit.bind(this)
		this.onChange = this.onChange.bind(this)
		this.onGetAllAccounts = this.onGetAllAccounts.bind(this)
		this.onTransactionChange = this.onTransactionChange.bind(this)
		this.appendTransaction = this.appendTransaction.bind(this)
	}

	state = {
		sum: 0,
		date: '',
		name: '',
		accounts: {},
		transactions: {
			0: {

			}
		},
	}

	componentDidMount() {
		getAllAccountsAsOptions(this.onGetAllAccounts)
	}

	onGetAllAccounts(accounts) {
		this.setState({ accounts: accounts })
	}

	render() {
		return (
			<div id="transactionNew">
				<h1>New Transaction</h1>
				<form onSubmit={this.onSubmit}>
					<VerificationInfo
						date={this.state.date}
						name={this.state.name}
						fileRef={this.fileRef}
						onChange={this.onChange}
					/>
					<h3>Transactions</h3>
					{this.renderTransactions()}
					<Button type="submit" onClick={this.onSubmit}>
						Add
					</Button>
				</form>
				<p className="sum" >Sum:
					<span className={this.state.sum !== 0 ? 'invalid' : ''}>
						{this.state.sum}
					</span>
				</p>
			</div>
		)
	}

	renderTransactions() {
		const keys = Object.keys(this.state.transactions)
		const lastIndex = keys.length - 1
		return keys.map((key, index) => {
			let appendTransaction = null
			if (index === lastIndex) {
				appendTransaction = this.appendTransaction
			}
			return (
				< Transaction
					id={key}
					key={key}
					accounts={this.state.accounts}
					appendTransaction={appendTransaction}
					onChange={this.onTransactionChange}
				/>
			)
		})
	}

	onSubmit(event) {
		event.preventDefault()

		const data = {
			date: this.state.date,
			name: this.state.name,
			transactions: this.state.transactions
		}

		const formData = new FormData()
		formData.append('json', JSON.stringify(data))
		formData.append('file', this.fileRef.current.files[0])

		Axios.post(
			config.apiUrl('/verification/create-transaction'),
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } }
		).then(response => {
			console.log('success')
		}).catch(error => {
			console.log(error)
		})
	}

	onChange(event) {
		this.setState({ [event.target.name]: event.target.value })
	}

	onTransactionChange(key, account, amount, currency) {
		console.log('Updating transaction: ' + key)
		this.setState({
			transactions: {
				...this.state.transactions,
				[key]: {
					account_id: account,
					amount: amount,
					currency: currency
				}
			}
		}, this.updateSum)
	}

	updateSum() {
		console.log('New transaction list: ' + this.state.transactions)
		let sum = 0
		for (let key in this.state.transactions) {
			const transaction = this.state.transactions[key]
			sum += transaction.amount
		}

		this.setState({ sum: sum })
	}

	appendTransaction() {
		console.log('Append transaction')
		const nextIndex = Object.keys(this.state.transactions).length + 1
		this.setState({
			transactions: {
				...this.state.transactions,
				[nextIndex]: { amount: 0 }
			}
		})
	}
}

class Transaction extends React.Component {
	constructor(props) {
		super(props)

		this.onAccountSelect = this.onAccountSelect.bind(this)
		this.onChange = this.onChange.bind(this)
		this.updateParent = this.updateParent.bind(this)
		this.listenForTab = this.listenForTab.bind(this)
	}

	state = {
		account: null,
		amount: '',
		currency: 'SEK',
	}

	render() {
		return (
			<div className="transaction">
				<Select options={this.props.accounts} value={this.state.account} onChange={this.onAccountSelect} />
				<input type="text" name="amount" placeholder="Amount" value={this.state.amount} onChange={this.onChange} />
				<input type="text" name="currency" placeholder="Currency" value={this.state.currency} onChange={this.onChange} onKeyDown={this.listenForTab} />
			</div>
		)
	}

	onAccountSelect(selected) {
		this.setState({ account: selected }, () => this.updateParent())
	}

	onChange(event) {
		this.setState({ [event.target.name]: event.target.value }, () => this.updateParent())
	}

	listenForTab(event) {
		if (event.key === 'Tab') {
			if (typeof this.props.appendTransaction !== 'undefined' && this.props.appendTransaction !== null) {
				this.props.appendTransaction()
			}
		}
	}

	updateParent() {
		const account = this.state.account !== null ? parseInt(this.state.account.value) : null
		const amount = this.state.amount !== '' ? parseFloat(this.state.amount) : 0
		this.props.onChange(this.props.id, account, amount, this.state.currency)
	}
}

export default TransactionNew
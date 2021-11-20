import React from 'react';
import Select from 'react-select';
import Axios from 'axios';
import config from '../config';

export async function getAllAccountsAsOptions(callback) {
	Axios.get(
		config.apiUrl('/accounts')
	).then(response => {
		let accounts = [];
		if (typeof response.data !== 'undefined') {
			response.data.forEach(account => {
				if (account.id >= 1000) {
					accounts.push({ value: account.id, label: account.id + " " + account.name });
				}
			});
			console.log('Got and processed accounts');
		}
		callback(accounts);
	}).catch(error =>
		console.log(error)
	);
}

class AccountSelect extends React.Component {
	constructor(props) {
		super(props);
		this.onChange = this.onChange.bind(this);
	}

	render() {
		return (
			<Select key={this.props.name} name={this.props.name} value={this.props.value} options={this.props.options} onChange={this.onChange} />
		);
	}

	onChange(event) {
		this.props.onChange(event);
	}
}

export default AccountSelect;
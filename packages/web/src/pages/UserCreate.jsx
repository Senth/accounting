import React from 'react'
import TextInput from '../ui/TextInput'
import Button from '../ui/Button'
import Axios from 'axios'
import config from '../config'

class UserCreate extends React.Component {
	constructor(props) {
		super(props)

		this.onChange = this.onChange.bind(this)
		this.onSubmit = this.onSubmit.bind(this)

		this.state = {
			email: '',
			firstName: '',
			lastName: '',
			localCurrencyCode: '',
		}
	}

	render() {
		return (
			<div className='CreateUser'>
				<h3>Create User</h3>
				<form onSubmit={this.onSubmit}>
					<div className='CreateUserFields'>
						<TextInput name='email' placeholder='Email' onChange={this.onChange} />
						<br />
						<TextInput name='firstName' placeholder='FirstName' onChange={this.onChange} />
						<br />
						<TextInput name='lastName' placeholder='LastName' onChange={this.onChange} />
						<br />
						<TextInput name='localCurrencyCode' placeholder='LocalCurrencyCode' onChange={this.onChange} />
						<br />
					</div>
					<div className='LoginButtons'>
						<Button type='submit' text='Create' />
					</div>
				</form>
			</div>
		)
	}

	async onSubmit(event) {
		console.log('submit')
		event.preventDefault()
		const data = this.state

		Axios.post(config.apiUrl('/user', false), data)
			.then((response) => {
				const user = response.data
				localStorage.setItem('apiKey', user.apiKey)
				localStorage.setItem('localCurrencyCode', user.localCurrencyCode)
				console.log(`ApiKey: ${user.apiKey}`)
				this.context.history.push('/verifications')
			})
			.catch((exception) => {
				console.log(exception)
			})
	}

	onChange(event) {
		this.setState({
			...this.state,
			[event.target.name]: event.target.value,
		})
	}
}

export default UserCreate

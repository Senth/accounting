import React from 'react'
import TextInput from '../ui/TextInput'
import Button from '../ui/Button'
import { PageFunctionContext } from '../contexts/PageFunctions'
import Axios from 'axios'
import config from '../config'

class Login extends React.Component {
	render() {
		return <LoginForm />
	}
}

class LoginForm extends React.Component {
	static contextType = PageFunctionContext

	constructor(props) {
		super(props)

		this.onEmailChange = this.onEmailChange.bind(this)
		this.onPasswordChange = this.onPasswordChange.bind(this)
		this.onSubmit = this.onSubmit.bind(this)

		this.state = {
			email: '',
			password: '',
		}
	}

	render() {
		return (
			<div className='Login'>
				<h3>Login</h3>
				<form onSubmit={this.onSubmit}>
					<div className='LoginFields'>
						<TextInput name='email' placeholder='Email' onChange={this.onEmailChange} />
						<br />
						<TextInput name='password' placeholder='Password' onChange={this.onPasswordChange} />
					</div>
					<div className='LoginButtons'>
						<Button type='submit' text='Login' />
					</div>
				</form>
			</div>
		)
	}

	async onSubmit(event) {
		event.preventDefault()

		Axios.post(config.apiUrl('/user/login'), this.state)
			.then((response) => {
				console.log(response)
				if (typeof response.data !== 'undefined') {
					const apiKey = response.data.api_key
					localStorage.setItem('apiKey', apiKey)
					console.log('ApiKey: ' + apiKey)
					this.context.history.push('/verifications')
				} else {
					console.log('Failed to log in')
				}
			})
			.catch((error) => console.log(error))
	}

	onEmailChange(email) {
		this.setState({ email: email })
	}

	onPasswordChange(password) {
		this.setState({ password: password })
	}
}

export default Login

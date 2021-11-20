import React from 'react'
import Login from './pages/Login'
import './App.css'
import { Switch, Route, withRouter } from 'react-router-dom'
import Verifications from './pages/Verifications'
import { PageFunctionContext } from './contexts/PageFunctions'
import Menu from './pages/Menu'
import PaymentNew from './pages/PaymentNew'
import TransactionNew from './pages/TransactionNew'
import VatExport from './pages/VatExport'
import UserCreate from './pages/UserCreate'

class App extends React.Component {
	static contextType = PageFunctionContext

	constructor(props) {
		super(props)

		this.checkForRedirects()
	}

	render() {
		this.context.history = this.props.history

		let menu = ''
		if (this.isLoggedIn) {
			menu = <Menu />
		}

		return (
			<div id='flex'>
				{menu}
				<div id='content'>
					<Switch>
						<Route exact path='/verifications'>
							<Verifications />
						</Route>
						<Route exact path='/verification/paymentAdd'>
							<PaymentNew />
						</Route>
						<Route exact path='/verification/transactionAdd'>
							<TransactionNew />
						</Route>
						<Route exact path='/helper/vat-export'>
							<VatExport />
						</Route>
						<Route exact path='/user/create'>
							<UserCreate />
						</Route>
						<Route exact path='/'>
							<Login />
						</Route>
					</Switch>
				</div>
			</div>
		)
	}

	isLoggedIn() {
		return localStorage.getItem('apiKey') !== null
	}

	checkForRedirects() {
		let loggedIn = this.isLoggedIn()
		let onLoginPage = this.props.location.pathname === '/'

		// Redirect to login page
		if (!loggedIn && !onLoginPage) {
			this.props.history.push('/')
		}
		// Redirect to verifications once we've logged in
		else if (loggedIn && onLoginPage) {
			this.props.history.push('/verifications')
		}
	}
}

export default withRouter(App)

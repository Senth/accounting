import React from 'react'
import Axios from 'axios'
import './verifications.css'
import config from '../config'

class Verifications extends React.Component {
  state = {
    verifications: []
  }

  render() {
    const verifications = this.state.verifications
    const listVerifications = verifications.map((verification) =>
      <Verification
        key={verification.id}
        number={verification.verification_number}
        name={verification.name}
        date={verification.date}
        transactions={verification.transactions}
      />
    )
    return (
      <React.Fragment>
        <h1>Verifications</h1>
        <div id="verifications">
          {listVerifications}
        </div>
      </React.Fragment>
    )
  }

  async componentDidMount() {
    Axios.get(
      config.apiUrl("/verifications")
    ).then(response => {
      if (typeof response.data !== 'undefined') {
        this.setState({ verifications: response.data })
      }
    }).catch(error =>
      console.log(error)
    )
  }
}

class Verification extends React.Component {
  render() {
    let number = '#???'
    if (this.props.number !== null) {
      number = '#' + this.props.number
    }

    return (
      <div className="verification">
        <div className="verificationInfo">
          <span className="verificationNumber">{number}</span>
          <span className="verificationDate">{this.props.date}</span>
          <span className="verificationName">{this.props.name}</span>
        </div>
        <Transactions transactions={this.props.transactions} />
      </div>
    )
  }
}

class Transactions extends React.Component {
  render() {
    const transactions = this.props.transactions
    const listTransactions = transactions.map((transaction) =>
      <Transaction
        key={transaction.id}
        date={transaction.date}
        accountId={transaction.account_id}
        accountName={transaction.account_name}
        amount={transaction.amount}
        currency={transaction.currency}
        originalAmount={transaction.original_amount}
      />
    )
    return (
      <div className="transactions">
        <Transaction
          date="Date"
          accountId="#"
          accountName="Account Name"
          debit="Debit"
          credit="Credit"
        />
        {listTransactions}
      </div>
    )
  }
}

class Transaction extends React.Component {
  render() {
    // Format the amount
    let credit = this.props.credit
    let debit = this.props.debit
    // Debit
    if (this.props.amount > 0) {
      debit = this.formatAmount(this.props.amount)
      credit = this.formatAmount(0)
    } else if (this.props.amount < 0) {
      debit = this.formatAmount(0)
      credit = this.formatAmount(-this.props.amount)
    }

    // Add extra currency information
    let renderCurrency = ''
    if (typeof this.props.currency !== 'undefined' && this.props.currency !== 'SEK') {
      const originalAmount = this.addCurrencySymbol(this.formatAmount(this.props.originalAmount))
      renderCurrency = (
        <span className="amount originalAmount">{originalAmount}</span>
      )
    }

    return (
      <div className="transaction">
        <span className="accountId">{this.props.accountId}</span>
        <span className="accountName">{this.props.accountName}</span>
        <span className="amount debit">{debit}</span>
        <span className="amount credit">{credit}</span>
        {renderCurrency}
      </div>
    )
  }

  addCurrencySymbol(amount) {
    switch (this.props.currency) {
      case 'USD':
        return '$' + amount
      case 'EUR':
        return '€' + amount
      default:
        return amount
    }
  }

  formatAmount(amount) {
    if (amount) {
      return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } else {
      return this.formatAmount("0.00")
    }
  }
}

export default Verifications
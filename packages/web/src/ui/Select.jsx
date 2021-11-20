import React from 'react';

class Select extends React.Component {
	constructor(props) {
		super(props);
		this.onChange = this.onChange.bind(this);
	}

	render() {
		return (
			<select name={this.name} onChange={this.onChange}>
				{this.renderOptions()}
			</select>
		);
	}

	renderOptions() {
		const optionsList = this.props.options.map((option) =>
			<option key={option.value} value={option.value}>{option.label}</option>
		);
		return optionsList;
	}

	onChange(event) {
		this.props.onChange(event.target.value);
	}
}

export default Select;
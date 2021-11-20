import React from 'react';
import Select from '../ui/Select'

class VerificationInfo extends React.Component {
	render() {
		return (
			<div className="verification">
				<input type="text" name="date" placeholder="Date" value={this.props.date} onChange={this.props.onChange} />
				{this.renderType()}
				<input type="text" name="name" placeholder="Name" value={this.props.name} onChange={this.props.onChange} />
				<input type="file" ref={this.props.fileRef} name="file" placeholder="PDF" />
			</div>
		);
	}

	renderType() {
		if (this.props.options) {
			return (
				<Select options={this.props.options} onChange={this.props.onTypeChange} />
			);
		}
	}
}

export default VerificationInfo;
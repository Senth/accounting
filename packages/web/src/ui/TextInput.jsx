import React from 'react';

class TextInput extends React.Component {
  render() {
    const type = this.props.name.includes('password') ? 'password' : 'text';
    return (
      <input type={type} name={this.props.name} value={this.props.value} placeholder={this.props.placeholder} onChange={this.props.onChange} />
    );
  }
}

export default TextInput;
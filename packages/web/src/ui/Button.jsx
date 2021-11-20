import React from 'react';

class Button extends React.Component {
  render() {
    let type = 'button';
    if (typeof this.props.type !== 'undefined') {
      type = this.props.type
    }
    return (
      <button type={type} onClick={this.props.onClick}>{this.props.text}{this.props.children}</button>
    );
  }
}

export default Button;
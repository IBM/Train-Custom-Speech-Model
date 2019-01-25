import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';

/**
 * Class to handle the rendering of a dismissiable alert to use for things like errors.
 * @extends React.Component
 */
class AlertDismissable extends Component {

  render() {
    if (this.props.show) {
      return (
        <Alert bsStyle="danger" onDismiss={this.props.onDismiss}>
          <h4><strong>{this.props.title}</strong></h4>
          <p>
            {this.props.message}
          </p>
        </Alert>
      );
    }
    return null;
  }
}

export default AlertDismissable;

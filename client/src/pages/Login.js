import React, { Component } from 'react';
import {
  Button, FormGroup, FormControl, ControlLabel, InputGroup, Glyphicon
} from 'react-bootstrap';
import AlertDismissable from '../components/AlertDismissable';
import config from '../config';
import './Login.css';
import { handleFetchNonOK } from './util';

/**
 * Class to handle the rendering of the Login page.
 * @extends React.Component
 */
export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      error: ''
    };
  }

  validateForm() {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = async event => {
    event.preventDefault();
    fetch(`${config.API_ENDPOINT}/login`, {
      method: 'POST',
      body: JSON.stringify({'username': this.state.username, 'password': this.state.password}),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('customLanguageModel', data.user.langModel);
        localStorage.setItem('customAcousticModel', data.user.acousticModel);
        localStorage.setItem('baseModel', data.user.baseModel);
        this.props.userHasAuthenticated(true);
      });
    })
    .catch((err) => {
      this.setState({ error: `Could not authenticate: ${err.message}` });
    });
  }

  handleDismiss = event => {
    this.setState({ error: '' });
  }

  render() {
    return (
      <div className="Login">
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="username" bsSize="large">
            <ControlLabel>Username</ControlLabel>
            <InputGroup>
              <InputGroup.Addon><Glyphicon glyph="user" /></InputGroup.Addon>
              <FormControl
                autoFocus
                type="text"
                value={this.state.username}
                onChange={this.handleChange}
                placeholder="Username"
                autoComplete="username"
              />
            </InputGroup>
          </FormGroup>
          <FormGroup controlId="password" bsSize="large">
            <ControlLabel>Password</ControlLabel>
            <InputGroup>
              <InputGroup.Addon><Glyphicon glyph="lock" /></InputGroup.Addon>
              <FormControl
                value={this.state.password}
                onChange={this.handleChange}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
              />
            </InputGroup>
          </FormGroup>
          <Button
            block
            bsSize="large"
            disabled={!this.validateForm()}
            type="submit"
          >
            Log In
          </Button>
          <AlertDismissable
            title="Login Error"
            message={this.state.error}
            show={this.state.error}
            onDismiss={this.handleDismiss} />
        </form>
      </div>
    );
  }
}

import React, { Component, Fragment } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Routes from './Routes';
import config from './config';
import './App.css';
import { handleFetchNonOK } from './pages/util';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isAuthenticating: true,
    };
  }

  async componentDidMount() {
    fetch(`${config.API_ENDPOINT}/user`, {
      method: 'GET',
      credentials: 'include',
    })
    .then(handleFetchNonOK)
    .then((response) => {
      this.userHasAuthenticated(true);
      response.json().then((data) => {
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('customLanguageModel', data.user.langModel);
        localStorage.setItem('customAcousticModel', data.user.acousticModel);
        localStorage.setItem('baseModel', data.user.baseModel);
      });
      this.setState({ isAuthenticating: false });
    })
    .catch((err) => {
      console.log('Not logged in.', err.message);
      this.setState({ isAuthenticating: false });
    });
  }

  userHasAuthenticated = (authenticated) => {
    this.setState({ isAuthenticated: authenticated });
  }

  handleLogout = (event) => {
    fetch(`${config.API_ENDPOINT}/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    .then(handleFetchNonOK)
    .then((response) => {
      this.userHasAuthenticated(false);
      localStorage.clear();
      const { history } = this.props;
      history.push('/');
    })
    .catch((err) => {
      console.log('Error logging out user.', err.message);
    });
  }

  render() {
    const { isAuthenticated } = this.state;
    const childProps = {
      isAuthenticated: isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
    };

    return (
      !this.state.isAuthenticating &&
      <div className="App container">
        <Navbar fluid collapseOnSelect>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">Watson STT Customizer</Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <LinkContainer to="/transcribe">
                <NavItem>Transcribe</NavItem>
              </LinkContainer>
              <LinkContainer to="/corpora">
                <NavItem>Corpora</NavItem>
              </LinkContainer>
              <LinkContainer to="/words">
                <NavItem>Words</NavItem>
              </LinkContainer>
              <LinkContainer to="/audio">
                <NavItem>Audio</NavItem>
              </LinkContainer>
              <LinkContainer to="/train">
                <NavItem>Train</NavItem>
              </LinkContainer>
            </Nav>
            <Nav pullRight>
              {this.state.isAuthenticated
                ? <Fragment>
                    <NavItem disabled>
                      Account: <strong>{localStorage.getItem('username')}</strong>
                    </NavItem>
                    <NavItem onClick={this.handleLogout}>Logout</NavItem>
                  </Fragment>
                : <Fragment>
                    <LinkContainer to="/login">
                      <NavItem>Login</NavItem>
                    </LinkContainer>
                  </Fragment>
              }
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Routes childProps={childProps} />
      </div>
    );
  }
}

export default withRouter(App);

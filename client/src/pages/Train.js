import React, { Component } from 'react';
import { Grid, Row, Col, Well, Glyphicon } from 'react-bootstrap';
import LoadButton from '../components/LoadButton';
import AlertDismissable from '../components/AlertDismissable';
import config from '../config';
import './Train.css';
import { handleFetchNonOK } from './util';

/**
 * Class to handle the rendering of the Train page where users can initialize
 * the training for their custom models.
 * @extends React.Component
 */
export default class Train extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLanguageSubmitting: false,
      isLanguageStatusLoading: false,
      isAcousticSubmitting: false,
      isAcousticStatusLoading: false,
      languageModelData: null,
      acousticModelData: null,
      languageModelError: '',
      acousticModelError: ''
    };
  }

  async componentDidMount() {
    this.getStatusLanguageModel();
    this.getStatusAcousticModel();
  }

  componentWillUnmount() {
   clearInterval(this.interval);
  }

  handleDismiss = errorType => {
    this.setState({ [errorType]: '' });
  }

  trainLanguageModel = async event => {
    event.preventDefault();
    this.setState({ isLanguageSubmitting: true });
    this.setState({ languageModelError: '' });
    fetch(`${config.API_ENDPOINT}/train`, {
      method: 'POST',
      credentials: 'include',
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        this.getStatusLanguageModel();
        this.setState({ isLanguageSubmitting: false });
      });
    })
    .catch((err) => {
      this.setState({ languageModelError:
        `Error initializing the training: ${err.message}`});
      this.setState({ isLanguageSubmitting: false });
    });
  }

  trainAcousticModel = async event => {
    event.preventDefault();
    this.setState({ isAcousticSubmitting: true });
    fetch(`${config.API_ENDPOINT}/train-acoustic`, {
      method: 'POST',
      credentials: 'include',
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        this.getStatusAcousticModel();
        this.setState({ isAcousticSubmitting: false });
      });
    })
    .catch((err) => {
      this.setState({ acousticModelError:
        `Error initializing the training: ${err.message}`});
      this.setState({ isAcousticSubmitting: false });
    });
  }


  /**
   * Check if model is in a state that needs continuous polling to check for
   * updates.
   */
  checkModelStatusDone = status => {
    let nonPollStatuses = ['ready', 'available', 'failed'];
    return nonPollStatuses.includes(status);

  }

  /**
   * This function will check if the model is in a state from which you can kick
   * off a training session from (i.e. not updating, pending, or training).
   */
  checkModelTrainable = data => {
    if (!data) {
      return false;
    }
    else if (['ready', 'failed'].includes(data.status)) {
      return true;
    }
    return false;
  }

  /**
   * This function will give the appropriate CSS class to color the given
   * status.
   */
  getStatusColor = status => {
    if (status === 'ready') {
      return 'text-info';
    }
    else if (status === 'available') {
      return 'text-success';
    }
    else if (status === 'training') {
      return 'text-warning';
    }
    else if (status === 'failed') {
      return 'text-danger';
    }
    else {
      return 'text-secondary';
    }
  }

  pollLanguageModelStatus = async () => {
    this.getStatusLanguageModel(true);
  }

  pollAcousticModelStatus = async () => {
    this.getStatusAcousticModel(true);
  }

  getStatusLanguageModel = async (poll = false) => {
    if (!poll) this.setState({ isLanguageStatusLoading: true });
    fetch(`${config.API_ENDPOINT}/model`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        this.setState({ languageModelData: data.data });
        let isNotActive = this.checkModelStatusDone(data.data.status);
        // If polling and if the model is no longer in an active state, stop
        // polling.
        if (isNotActive && poll) {
          clearInterval(this.interval);
        }
        // If it is in an active state, initiate the polling.
        else if (!isNotActive && !poll) {
          this.interval = setInterval(this.pollLanguageModelStatus, 5000);
        }
        if (!poll) this.setState({ isLanguageStatusLoading: false });
      });
    })
    .catch((err) => {
      this.setState({ languageModelError:
        `Error getting language model data: ${err.message}`});
      if (!poll) this.setState({ isLanguageStatusLoading: false });
    });
  }

  getStatusAcousticModel = async (poll = false) => {
    if (!poll) this.setState({ isAcousticStatusLoading: true });
    fetch(`${config.API_ENDPOINT}/acoustic-model`, {
      method: 'GET',
      credentials: 'include'
    })
    .then((response) => {
      response.json().then((data) => {
        this.setState({ acousticModelData: data.data });
        let isNotActive = this.checkModelStatusDone(data.data.status);
        // If polling and if the model is no longer in an active state, stop
        // polling.
        if (isNotActive && poll) {
          clearInterval(this.interval);
        }
        // If it is in an active state, initiate the polling.
        else if (!isNotActive && !poll) {
          this.interval = setInterval(this.pollAcousticModelStatus, 5000);
        }
        if (!poll) this.setState({ isAcousticStatusLoading: false });
      });
    })
    .catch((err) => {
      this.setState({ acousticModelError:
        `Error getting acoustic model data: ${err.message}` });
      if (!poll) this.setState({ isAcousticStatusLoading: false });
    });
  }

  render() {
    return (
      <div className="Train">
        <h1>Train Custom Models</h1>
        <p>If you have recently added language or audio resources, the model
        needs to be trained to account for the new data. Kick off a training session here. If a
        model's status is <code>ready</code>, then this indicates that the model contains data and
        is ready to be trained. A status of <code>available</code> indicates that the model is
        trained and ready to use. </p>

        <Grid>
        <Row className="show-grid">
          <Col md={6}>
            <h3>Language Model Status</h3>
            <Well>
            {this.state.isLanguageStatusLoading &&
              <Glyphicon glyph="refresh" className="loadingstatus" />
            }
            {this.state.languageModelData && !this.state.isLanguageStatusLoading &&
              <div className="modelstatus">
                <strong>Name:</strong> {this.state.languageModelData.name}<br />
                <strong>Status:</strong>{' '}
                <span className={this.getStatusColor(this.state.languageModelData.status)}>
                  {this.state.languageModelData.status}{' '}
                  {this.state.languageModelData.status ==='training' &&
                    <Glyphicon glyph="refresh" className="training" />
                  }
                </span>
              </div>
            }
            </Well>
            <LoadButton
             block
             bsStyle="primary"
             type="button"
             disabled={
               this.state.isLanguageStatusLoading ||
               !this.checkModelTrainable(this.state.languageModelData)
             }
             isLoading={this.state.isLanguageSubmitting}
             onClick={this.trainLanguageModel}
             text="Train Language Model"
             loadingText="Initializing…"
            />
            <AlertDismissable
              title="Language Model Error"
              message={this.state.languageModelError}
              show={this.state.languageModelError}
              onDismiss={() => this.handleDismiss('languageModelError')} />
          </Col>
          <Col md={6}>
            <h3>Acoustic Model Status</h3>
            <Well>
            {this.state.isAcousticStatusLoading &&
              <Glyphicon glyph="refresh" className="loadingstatus" />
            }
            {this.state.acousticModelData && !this.state.isAcousticStatusLoading &&
              <div className="modelstatus">
                <strong>Name:</strong> {this.state.acousticModelData.name}<br />
                <strong>Status:</strong>{' '}
                <span className={this.getStatusColor(this.state.acousticModelData.status)}>
                  {this.state.acousticModelData.status}{' '}
                  {this.state.acousticModelData.status ==='training' &&
                    <Glyphicon glyph="refresh" className="training" />
                  }
                </span>
              </div>
            }
            </Well>
            <LoadButton
             block
             bsStyle="primary"
             type="button"
             disabled={
               this.state.isAcousticStatusLoading ||
               !this.checkModelTrainable(this.state.acousticModelData)
             }
             isLoading={this.state.isAcousticSubmitting}
             onClick={this.trainAcousticModel}
             text="Train Acoustic Model"
             loadingText="Initializing…"
            />
            <AlertDismissable
              title="Acoustic Model Error"
              message={this.state.acousticModelError}
              show={this.state.acousticModelError}
              onDismiss={() => this.handleDismiss('acousticModelError')} />
          </Col>
        </Row>
        </Grid>
      </div>
    );
  }
}

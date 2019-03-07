import React, { Component, Fragment } from 'react';
import {
  Checkbox, Panel, Form, FormGroup, FormControl, ControlLabel,
  Glyphicon, HelpBlock, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import LoadButton from '../components/LoadButton';
import AlertDismissable from '../components/AlertDismissable';
import config from '../config';
import './Transcribe.css';
import { handleFetchNonOK } from './util';

/**
 * Class to handle the rendering of the Transcribe page where users can submit audio files to have
 * transcribed.
 * @extends React.Component
 */
export default class Transcribe extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isTranscribing: false,
      isSubmitting: false,
      content: '',
      filename: null,
      hasTranscribed: false,
      improveAcousticChecked: false,
      transcribeError: '',
      submitError: '',
      fileSettingsOpen: true,
      corpusName: ''
    };
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleFileChange = event => {
    this.file = event.target.files[0];
    this.setState({ 'filename': this.file.name });
  }

  handlePanelToggle = event => {
    this.setState({ 'fileSettingsOpen': !this.state.fileSettingsOpen });
  }

  handleAcousticChange = event => {
    this.setState({ 'improveAcousticChecked': !this.state.improveAcousticChecked });
  }

  handleTranscribe = async event => {
    event.preventDefault();

    this.setState({ transcribeError: '' });
    if (this.file && this.file.size > config.MAX_AUDIO_SIZE) {
      this.setState({
        transcribeError:
          `Please pick a file smaller than ${config.MAX_AUDIO_SIZE/1000000} MB.`
      });
      return;
    }

    this.setState({ isTranscribing: true });
    let formData  = new FormData();
    formData.append('audio', this.file);
    formData.append('languageModel', this.languageModelType.value);
    formData.append('acousticModel', this.acousticModelType.value);

    fetch(`${config.API_ENDPOINT}/transcribe`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        this.setState({ hasTranscribed: true });
        this.setState({ content: data.transcription });
        this.setState({ isTranscribing: false });
        this.setState({ fileSettingsOpen: false });
      });
    })
    .catch((err) => {
      this.setState({ transcribeError: `Could not transcribe: ${err.message}`});
      this.setState({ isTranscribing: false });
    });
  }

  handleDismiss = errorType => {
    this.setState({ [errorType]: '' });
  }

  validateCorpusName = () => {
    let invalidChars = /\s|\/|\\/;
    return (
      this.state.corpusName.length > 0 &&
      this.state.corpusName.length <= 128 &&
      !invalidChars.test(this.state.corpusName)
    );
  }

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isSubmitting: true });
    this.setState({ submitError: '' });


    // Upload corpora.
    fetch(`${config.API_ENDPOINT}/corpora`, {
      method: 'POST',
      body: JSON.stringify({'corpusName': this.state.corpusName,
                            'corpus': this.state.content}),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        // Corpora uploaded successfully, so upload audio resource if option
        // was selected.
        if (this.state.improveAcousticChecked) {

          let formData  = new FormData();
          formData.append('audio', this.file);
          formData.append('audioName', this.state.corpusName + '-audio');
          fetch(`${config.API_ENDPOINT}/audio`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          })
          .then(handleFetchNonOK)
          .then((response) => {
            response.json().then((data) => {
              // Redirect to corpora page to see status.
              this.props.history.push('/corpora');
              this.setState({ isSubmitting: false });
            });
          })
          .catch((err) => {
            this.setState({ submitError:
              `Could not add audio: ${err.message}`});
            this.setState({ isSubmitting: false });
          });
        }
        // User chose not to upload audio.
        else {
          // Redirect to corpora page to see status.
          this.props.history.push('/corpora');
          this.setState({ isSubmitting: false });
        }
      });
    })
    .catch((err) => {
      this.setState({ submitError: `Could not add corpus: ${err.message}`});
      this.setState({ isSubmitting: false });
    });
  }

  render() {
    return (
      <div className="STTForm">
        <h2>Custom Speech Transcriber</h2>
        <p>Convert audio to text using the customized models.</p>
        <Panel
          id="collapsible-panel-example-2"
          onToggle={this.handlePanelToggle}
          expanded={this.state.fileSettingsOpen}
        >
          <Panel.Heading>
            <Panel.Title toggle>
              Select models and audio file{' '}
              <span className='panel-arrow'>
              { this.state.fileSettingsOpen
                ? <Glyphicon glyph="chevron-down" />
                : <Glyphicon glyph="chevron-right" />
              }
              </span>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <Form onSubmit={this.handleTranscribe}>
                <FormGroup controlId="formControlsSelect">
                  <ControlLabel>Select Language Model</ControlLabel>
                  <FormControl
                    componentClass="select"
                    placeholder="select"
                    inputRef={languageModelType => this.languageModelType = languageModelType}>
                    { localStorage.getItem('customLanguageModel') &&
                      <option value={localStorage.getItem('customLanguageModel')}>
                        Custom Language Model</option>
                    }
                    <option value={config.BASE_STT_MODEL}>Base Language Model</option>
                  </FormControl>
                  <HelpBlock>Choose your customized language model or the base model.</HelpBlock>

                  <ControlLabel>Select Acoustic Model</ControlLabel>
                  <FormControl
                    componentClass="select"
                    placeholder="select"
                    inputRef={acousticModelType => this.acousticModelType = acousticModelType}>
                    { localStorage.getItem('customAcousticModel') &&
                      <option value={localStorage.getItem('customAcousticModel')}>
                        Custom Acoustic Model</option>
                    }
                    <option value={config.BASE_STT_MODEL}>Base Acoustic Model</option>
                  </FormControl>
                  <HelpBlock>Choose your customized acoustic model or the base model.</HelpBlock>
                </FormGroup>
                <FormGroup controlId="file">
                  <ControlLabel>Select Audio File</ControlLabel><br />
                  <ControlLabel className="audiolabel">
                    <Glyphicon glyph="open" />{' '}
                    {this.state.filename ? this.state.filename : 'Browse...'}
                  </ControlLabel>
                  <FormControl
                    onChange={this.handleFileChange}
                    type="file"
                    accept="audio/*"
                    className="audiofile"/>
                  <HelpBlock>Accepted file types: .wav, .mp3, and .flac</HelpBlock>
                </FormGroup>
                <LoadButton
                 block
                 bsStyle="primary"
                 disabled={!this.state.filename}
                 type="submit"
                 isLoading={this.state.isTranscribing}
                 text="Transcribe"
                 loadingText="Transcribing…"
                />
              </Form>
              <AlertDismissable
                title="Transcribe Error"
                message={this.state.transcribeError}
                show={this.state.transcribeError}
                onDismiss={() => this.handleDismiss('transcribeError')} />
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        <form>
          <h4>Your Transcription</h4>
          <FormGroup controlId="content">
            <FormControl
              onChange={this.handleChange}
              value={this.state.content}
              componentClass="textarea"
              disabled={!this.state.hasTranscribed}
            />
          </FormGroup>
        </form>
        { this.state.hasTranscribed &&
          <Fragment>
            <div className="adjustmentinfo">
              <Glyphicon glyph="bullhorn text-info" />{' '}
              <strong>Not quite correct?</strong> Make adjustments in the text box above and submit
              it as a corpus to help improve the language model. Just give the corpus a name and
              click the submit button below.<br /><br />

              <FormGroup>
                <Checkbox
                  onChange={this.handleAcousticChange}
                  inline
                > Add audio file to acoustic model{' '}
                  <OverlayTrigger placement="top" overlay={
                    <Tooltip id="tooltip">
                    Additionally, you can improve the quality of the acoustic model by uploading
                    your audio with the transcription.
                    </Tooltip>
                  }>
                    <Glyphicon glyph="info-sign" />
                  </OverlayTrigger>
                </Checkbox>
              </FormGroup>
              <FormGroup controlId="corpusName">
                <ControlLabel>Corpus Name</ControlLabel>
                <FormControl
                  type="text"
                  value={this.state.corpusName}
                  placeholder="Enter name"
                  onChange={this.handleChange}
                />
                <HelpBlock>
                  Add a name to this corpus to help identify it.
                  The name must be no more than 128 characters with no spaces or slashes.
                </HelpBlock>
              </FormGroup>
              <LoadButton
               block
               bsStyle="primary"
               disabled={!this.state.hasTranscribed || !this.validateCorpusName()}
               type="button"
               isLoading={this.state.isSubmitting}
               onClick={this.handleSubmit}
               text="Submit"
               loadingText="Submitting…"
              />
              <AlertDismissable
                title="Submission Error"
                message={this.state.submitError}
                show={this.state.submitError}
                onDismiss={() => this.handleDismiss('submitError')} />
            </div>
          </Fragment>
        }
      </div>
    );
  }
}

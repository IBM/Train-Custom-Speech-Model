import React, { Component } from 'react';
import {
  Button, Table, Glyphicon, FormGroup, FormControl, ControlLabel, HelpBlock, Panel
} from 'react-bootstrap';
import LoadButton from '../components/LoadButton';
import './Audio.css';

/**
 * Class to handle the rendering of the Audio page where a list of all audio resources
 * for the user's custom acoustic model is displayed.
 * @extends React.Component
 */
export default class Audio extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isLoading: false,
      audio: [],
      error: '',
      isDeleting: false,
      isUploading: false,
      fileUploadOpen: false,
      filename: ''
    };
  }

  async componentDidMount() {
    this.handleGetList();
    this.interval = setInterval(this.pollAudio, 3000);
  }

  componentWillUnmount() {
   clearInterval(this.interval);
  }

  handlePanelToggle = event => {
    this.setState({ 'fileUploadOpen': !this.state.fileUploadOpen });
  }

  handleFileChange = event => {
    this.file = event.target.files[0];
    this.setState({ 'filename': this.file.name });
  }

  uploadAudio = event => {
    event.preventDefault();

    this.setState({ isUploading: true });
    let formData  = new FormData();
    formData.append('audio', this.file);
    formData.append('audioName', this.state.filename);
    fetch('/api/audio', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          // Start polling audio
          this.file = null;
          this.handlePanelToggle();
          this.setState({ 'filename': '' });
          this.handleGetList();
          this.interval = setInterval(this.pollAudio, 3000);
        });
      }
      else {
        this.setState({ error: 'Could not add audio resource. HTTP Status Code: '
                      + response.status });
      }
      this.setState({ isUploading: false });
    })
    .catch((err) => {
      console.log('Could not add audio resource: ', err);
      this.setState({ error: 'Could not add audio resource: ' + err });
      this.setState({ isUploading: false });
    });
  }

  checkAudioProcessing = () => {
    let being_processed = function(element) {
      return element.status === 'being_processed';
    };
    return this.state.audio.some(being_processed);
  }

  /**
   * Sort the given list of audio, first by status, then by name. We sort by status first
   * to make sure the audio being processed are listed at the top.
   */
  sortAudio = audio => {
    audio.sort((a, b) => {
      if (a.status === b.status) {
        return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0);
      }
      return (a.status < b.status) ? -1 : ((a.status > b.status) ? 1 : 0);
    });
    return audio;
  }


  pollAudio = async () => {
    fetch('/api/audio', {
      method: 'GET',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          let sortedAudio = this.sortAudio(data.audio);
          this.setState({ audio: sortedAudio });
          if (!this.checkAudioProcessing()) {
            clearInterval(this.interval);
          }
        });
      }
    });
  }

  handleGetList = async () => {
    this.setState({ isLoading: true });
    fetch('/api/audio', {
      method: 'GET',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          let sortedAudio = this.sortAudio(data.audio);
          this.setState({ audio: sortedAudio });
        });
      }
      this.setState({ isLoading: false });
    })
    .catch((err) => {
      this.setState({ error: err });
      console.log('Error getting audio.', err);
      this.setState({ isLoading: false });
    });
  }

  handleDelete = async audioName => {
    this.setState({ isDeleting: true });
    fetch('/api/audio/' + audioName, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        this.handleGetList();
      }
      else {
        this.setState({ error: 'There was a problem deleting the audio resource.' });
      }
      this.setState({ isDeleting: false });
    })
    .catch((err) => {
      this.setState({ error: err });
      this.setState({ isDeleting: false });
    });
  }

  render() {
    return (
      <div className="Audio">
        <h2>Audio Resource List</h2>
        <p>After a new audio resource has been added and processed, you must initialize
           a <a href="/train" title="Train">training session</a> for the custom acoustic model
           with the new data.
        </p>
        <Panel
          id="collapsible-panel-upload"
          onToggle={this.handlePanelToggle}
          expanded={this.state.fileUploadOpen}
        >
          <Panel.Heading>
            <Panel.Title toggle>
              Upload Audio Resource{' '}
              <span className='panel-arrow'>
              { this.state.fileUploadOpen
                ? <Glyphicon glyph="chevron-down" />
                : <Glyphicon glyph="chevron-right" />
              }
              </span>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <form onSubmit={this.uploadAudio}>
              <FormGroup controlId="file">
                <ControlLabel>Upload Audio File or Archive</ControlLabel><br />
                <ControlLabel className="audiolabel">
                  <Glyphicon glyph="open" />{' '}
                  {this.state.filename ? this.state.filename : 'Browse...'}
                </ControlLabel>
                <FormControl
                  onChange={this.handleFileChange}
                  type="file"
                  accept="audio/*, .zip, .tgz, .tar.gz"
                  className="audiofile"/>
                <HelpBlock>
                  Accepted file types: .wav, .mp3, .flac, .zip, .tar.gz<br />
                  Adding multiple audio files via a single archive file is significantly more
                  efficient than adding each file individually.
                </HelpBlock>
              </FormGroup>
              <LoadButton
               block
               bsStyle="primary"
               disabled={!this.state.filename}
               type="submit"
               isLoading={this.state.isUploading}
               text="Upload"
               loadingText="Uploading…"
              />
              </form>
            </Panel.Body>
          </Panel.Collapse>
        </Panel>

        { this.state.isLoading && <Glyphicon glyph="refresh" className="tableload" /> }
        { !this.state.isLoading && this.state.audio.length <= 0 &&
          <p><br /><strong>No audio resources</strong></p>
        }
        { !this.state.isLoading && this.state.audio.length > 0 &&
          <Table striped bordered condensed hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Duration (s)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {this.state.audio.map((audio, index) => {
                  return (
                    <tr key={index}>
                      <td>{audio.name}</td>
                      <td>{audio.details.type || '-' }</td>
                      <td>{audio.duration || '-'}</td>
                      <td>
                        <span className={
                          audio.status === 'ok' ? 'text-success' : 'text-warning'
                        }>
                        {audio.status}{' '}
                        {audio.status ==='being_processed' &&
                          <Glyphicon glyph="refresh" className="processing" />
                        }
                        </span>
                      </td>
                      <td>
                        <Button
                          bsStyle="danger"
                          bsSize="xsmall"
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this audio resource?')) {
                              this.handleDelete(audio.name);
                            }}}>Delete
                        </Button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </Table>
        }
      </div>
    );
  }
}

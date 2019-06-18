import React, { Component } from 'react';
import {
  Button, Table, Glyphicon, FormGroup, FormControl, ControlLabel, HelpBlock, Panel
} from 'react-bootstrap';
import LoadButton from '../components/LoadButton';
import AlertDismissable from '../components/AlertDismissable';
import config from '../config';
import './Corpora.css';
import { handleFetchNonOK } from './util';

/**
 * Class to handle the rendering of the Corpora page where a list of all corpora for the user's
 * custom model is displayed.
 * @extends React.Component
 */
export default class Corpora extends Component {
  constructor(props) {
    super(props);

    this.fileContents = '';

    this.state = {
      isLoading: false,
      corpora: [],
      uploadError: '',
      listError: '',
      isDeleting: false,
      isUploading: false,
      fileUploadOpen: false,
      filename: ''
    };
  }

  async componentDidMount() {
    this.handleGetList();
    this.interval = setInterval(this.pollCorpora, 3000);
  }

  componentWillUnmount() {
   clearInterval(this.interval);
  }

  handlePanelToggle = event => {
    this.setState({ 'fileUploadOpen': !this.state.fileUploadOpen });
  }

  handleFileChange = event => {
    if (event.target.files.length) {
      this.fileReader = new FileReader();
      this.fileReader.onloadend = () => { this.fileContents = this.fileReader.result; };
      this.fileReader.readAsText(event.target.files[0]);
      this.setState({ 'filename': event.target.files[0].name });
    }
  }

  handleDismiss = errorType => {
    this.setState({ [errorType]: '' });
  }

  uploadCorpora = event => {
    event.preventDefault();
    this.setState({ isUploading: true });
    this.setState({ uploadError: '' });
    fetch(`${config.API_ENDPOINT}/corpora`, {
      method: 'POST',
      body: JSON.stringify({'corpusName': this.state.filename,
                            'corpus': this.fileContents}),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        // Start polling corpora
        this.fileContents = '';
        this.handlePanelToggle();
        this.setState({ 'filename': '' });
        this.handleGetList();
        this.interval = setInterval(this.pollCorpora, 3000);
        this.setState({ isUploading: false });
      });
    })
    .catch((err) => {
      this.setState({ uploadError: `Could not add corpus: ${err.message}` });
      this.setState({ isUploading: false });
    });
  }

  checkCorporaProcessing = () => {
    let being_processed = function(element) {
      return element.status === 'being_processed';
    };
    return this.state.corpora.some(being_processed);
  }

  /**
   * Sort the given list of corpora, first by status, then by name. We sort by
   * status first to make sure the corpora being processed are listed at the
   * top.
   */
  sortCorpora = corpora => {
    corpora.sort((a, b) => {
      if (a.status === b.status) {
        return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0);
      }
      return (a.status > b.status) ? -1 : ((a.status < b.status) ? 1 : 0);
    });
    return corpora;
  }


  pollCorpora = async () => {
    fetch(`${config.API_ENDPOINT}/corpora`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        let sortedCorpora = this.sortCorpora(data.corpora);
        this.setState({ corpora: sortedCorpora });
        if (!this.checkCorporaProcessing()) {
          clearInterval(this.interval);
        }
      });
    })
    .catch((err) => {
      this.setState({ listError: err.message });
      this.setState({ isLoading: false });
      clearInterval(this.interval);
    });
  }

  handleGetList = async () => {
    this.setState({ listError: '' });
    this.setState({ isLoading: true });
    fetch(`${config.API_ENDPOINT}/corpora`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(handleFetchNonOK)
    .then((response) => {
      response.json().then((data) => {
        let sortedCorpora = this.sortCorpora(data.corpora);
        this.setState({ corpora: sortedCorpora });
        this.setState({ isLoading: false });
      });
    })
    .catch((err) => {
      this.setState({ listError: err.message });
      this.setState({ isLoading: false });
    });
  }

  handleDelete = async corpusName => {
    this.setState({ isDeleting: true });
    fetch(`${config.API_ENDPOINT}/corpora/` + corpusName, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then(handleFetchNonOK)
    .then((response) => {
      this.handleGetList();
      this.setState({ isDeleting: false });
    })
    .catch((err) => {
      this.setState({ error: err.message });
      this.setState({ isDeleting: false });
    });
  }

  render() {
    return (
      <div className="Corpora">
        <h2>Corpus List</h2>
        <p>After new corpora have been analyzed, you must initialize
           a <a href="/train" title="Train">training session</a> for the custom language model
           with the new data.
        </p>
        <Panel
          id="collapsible-panel-upload"
          onToggle={this.handlePanelToggle}
          expanded={this.state.fileUploadOpen}
        >
          <Panel.Heading>
            <Panel.Title toggle>
              Upload Corpus{' '}
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
              <form onSubmit={this.uploadCorpora}>
              <FormGroup controlId="file">
                <ControlLabel>Upload Corpus Text File</ControlLabel><br />
                <ControlLabel className="corpuslabel">
                  <Glyphicon glyph="open" />{' '}
                  {this.state.filename ? this.state.filename : 'Browse...'}
                </ControlLabel>
                <FormControl
                  onChange={this.handleFileChange}
                  type="file"
                  accept=".txt"
                  className="corpusfile"/>
                <HelpBlock>
                  Accepted file types: .txt
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
              <AlertDismissable
                title="Corpus Upload Error"
                message={this.state.uploadError}
                show={this.state.uploadError}
                onDismiss={() => this.handleDismiss('uploadError')} />
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        { this.state.isLoading && <Glyphicon glyph="refresh" className="tableload" /> }
        { !this.state.isLoading && this.state.corpora.length <= 0 && !this.state.listError &&
          <p><br /><strong>No corpora added</strong></p>
        }
        { !this.state.isLoading && this.state.corpora.length > 0 &&
          <Table striped bordered condensed hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Out of Vocab Words</th>
                <th>Total Words</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {this.state.corpora.map((corpus, index) => {
                  return (
                    <tr key={index}>
                      <td>{corpus.name}</td>
                      <td>{corpus.out_of_vocabulary_words}</td>
                      <td>{corpus.total_words}</td>
                      <td>
                        <span className={
                          corpus.status === 'analyzed' ? 'text-success' : 'text-warning'
                        }>
                        {corpus.status}{' '}
                        {corpus.status ==='being_processed' &&
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
                            if (window.confirm('Delete this corpus?')) {
                              this.handleDelete(corpus.name);
                            }}}>Delete
                        </Button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </Table>
        }
        <AlertDismissable
          title="Corpus List Error"
          message={this.state.listError}
          show={this.state.listError}
          onDismiss={() => this.handleDismiss('listError')} />
      </div>
    );
  }
}

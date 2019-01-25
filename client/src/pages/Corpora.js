import React, { Component } from 'react';
import { Button, Table, Glyphicon } from 'react-bootstrap';
import './Corpora.css';

/**
 * Class to handle the rendering of the Corpora page where a list of all corpora for the user's
 * custom model is displayed.
 * @extends React.Component
 */
export default class Corpora extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      corpora: [],
      error: '',
      isDeleting: false,
    };
  }

  async componentDidMount() {
    this.handleGetList();
    this.interval = setInterval(this.pollCorpora, 3000);
  }

  componentWillUnmount() {
   clearInterval(this.interval);
  }

  checkCorporaProcessing = () => {
    let being_processed = function(element) {
      return element.status === 'being_processed';
    };
    return this.state.corpora.some(being_processed);
  }

  /**
   * Sort the given list of corpora, first by status, then by name. We sort by status first
   * to make sure the corpora being processed are listed at the top.
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
    fetch('/api/corpora', {
      method: 'GET',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          let sortedCorpora = this.sortCorpora(data.corpora);
          this.setState({ corpora: sortedCorpora });
          if (!this.checkCorporaProcessing()) {
            clearInterval(this.interval);
          }
        });
      }
    });
  }

  handleGetList = async () => {
    this.setState({ isLoading: true });
    fetch('/api/corpora', {
      method: 'GET',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          let sortedCorpora = this.sortCorpora(data.corpora);
          this.setState({ corpora: sortedCorpora });
        });
      }
      this.setState({ isLoading: false });
    })
    .catch((err) => {
      this.setState({ error: err });
      console.log('Error getting corpora.', err);
      this.setState({ isLoading: false });
    });
  }

  handleDelete = async corpusName => {
    this.setState({ isDeleting: true });
    fetch('/api/corpora/' + corpusName, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then((response) => {
      if (response.status === 200) {
        this.handleGetList();
      }
      else {
        this.setState({ error: 'There was a problem deleting the corpus.' });
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
      <div className="Corpora">
        <h2>Corpus List</h2>
        <p>After new corpora have been analyzed, you must initialize
           a <a href="/train" title="Train">training session</a> for the new data.
        </p>
        { this.state.isLoading && <Glyphicon glyph="refresh" className="tableload" /> }
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
      </div>
    );
  }
}

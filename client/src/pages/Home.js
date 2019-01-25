import React, { Component } from 'react';
import { Grid, Row, Col, Glyphicon } from 'react-bootstrap';
import './Home.css';

/**
 * Class to handle the rendering of the Home page.
 * @extends React.Component
 */
export default class Home extends Component {
  render() {
    return (
      <div className="Home">
        <div className="lander">
          <h1>Watson Speech to Text Customizer</h1>
          <p>Use a medical transcription dataset to train a customized speech to text model.</p>
        </div>
        <Grid className="tilecontainer">
          <Row className="show-grid">
            <Col md={6}>
              <a href="/transcribe" title="Transcribe" className="menubutton">
                Transcribe<br />
                <Glyphicon glyph="pencil" />
              </a>
            </Col>
            <Col md={6}>
              <a href="/corpora" title="View Corpora" className="menubutton">
                View Corpora<br />
                <Glyphicon glyph="file" />
              </a>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col md={6}>
              <a href="/words" title="View Words" className="menubutton">
                View Words<br />
                <Glyphicon glyph="list-alt" />
              </a>
            </Col>
            <Col md={6}>
              <a href="/train" title="Train" className="menubutton">
                Train<br />
                <Glyphicon glyph="repeat" />
              </a>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

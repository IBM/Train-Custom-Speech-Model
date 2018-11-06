import React, { Component } from "react";
import "./Home.css";

export default class Home extends Component {
  render() {
    return (
      <div className="Home">
        <div className="lander">
          <h1>Watson Speech to Text Customizer</h1>
          <p>Use a medical transcription dataset to train a customized speech to text model.</p>
        </div>
      </div>
    );
  }
}

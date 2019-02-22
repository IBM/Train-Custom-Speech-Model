import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AppliedRoute from './components/AppliedRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import UnauthenticatedRoute from './components/UnauthenticatedRoute';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Transcribe from './pages/Transcribe.js';
import Corpora from './pages/Corpora.js';
import Words from './pages/Words.js';
import Audio from './pages/Audio.js';
import Train from './pages/Train.js';

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Home} props={childProps} />
    <AuthenticatedRoute path="/transcribe" exact component={Transcribe} props={childProps} />
    <AuthenticatedRoute path="/corpora" exact component={Corpora} props={childProps} />
    <AuthenticatedRoute path="/words" exact component={Words} props={childProps} />
    <AuthenticatedRoute path="/audio" exact component={Audio} props={childProps} />
    <AuthenticatedRoute path="/train" exact component={Train} props={childProps} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <Route component={NotFound} />
  </Switch>;

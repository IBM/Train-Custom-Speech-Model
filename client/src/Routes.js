import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./components/Home";
import NotFound from "./components/NotFound";

export default () =>
  <Switch>
    <Route path="/" exact component={ Home } />
    <Route component={ NotFound } />
  </Switch>;

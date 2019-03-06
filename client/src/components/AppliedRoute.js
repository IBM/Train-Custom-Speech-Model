import React from 'react';
import { Route } from 'react-router-dom';

/**
 * This handles routes where it doesn't matter if the user is logged in or not.
 */
export default ({ component: C, props: cProps, ...rest }) =>
  <Route {...rest} render={props => <C {...props} {...cProps} />} />;

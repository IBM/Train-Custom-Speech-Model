import React from 'react';
import { Route, Redirect } from 'react-router-dom';

/**
 * This handles routes/pages where the user must be logged in to view.
 */
export default ({ component: C, props: cProps, ...rest }) =>
  <Route
    {...rest}
    render={props =>
      cProps.isAuthenticated
        ? <C {...props} {...cProps} />
        : <Redirect
            to={`/login?redirect=${props.location.pathname}${props.location
              .search}`}
          />}
  />;

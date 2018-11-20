import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import './LoadButton.css';

/**
 * This produces a button that will have a loading animation while the isLoading property is true.
 */
export default ({
  isLoading,
  text,
  loadingText,
  className = '',
  disabled = false,
  ...props
}) =>
  <Button
    className={`LoadButton ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <Glyphicon glyph="refresh" className="spinning" />}
    {isLoading ? loadingText : text}
  </Button>;

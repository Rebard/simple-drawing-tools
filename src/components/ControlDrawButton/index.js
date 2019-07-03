import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import './index.css';

const ControlDrawButton = ({ icon, iconAlt, hoverTitle, onClick }) => {
  const [isHover, setIsHover] = useState(false); 
  const handleButton = (e) => {
    e.stopPropagation();
    onClick(e);
  }
  return (
    <div className="control-button" onClick={handleButton}>
      <img src={icon} alt={iconAlt} className="control-button__icon"/>
    </div>
  )
}

ControlDrawButton.defaultProps = {
  hoverTitle: '',
  icon: null,
  onClick: Function.prototype,
};

ControlDrawButton.propTypes = {
  hoverTitle: PropTypes.string,
  icon: PropTypes.string,
  onClick: PropTypes.func,
}

export default ControlDrawButton;
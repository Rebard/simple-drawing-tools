import React, { memo } from 'react';
import ControlDrawButton from '../ControlDrawButton';
import Hexagon from '../../assets/images/hexagon.svg';
import Circle from '../../assets/images/circle.svg';
import './index.css';

const DrawControl = ({ handlePolygon, handleCircle }) => {
  return (
    <div className="draw-control">
      <ControlDrawButton icon={Hexagon} iconAlt="polygon" onClick={handlePolygon}/>
      <ControlDrawButton icon={Circle} iconAlt="circle" onClick={handleCircle}/>
    </div>
  )
}

export default DrawControl;
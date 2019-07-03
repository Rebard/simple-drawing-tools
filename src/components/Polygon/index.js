import React, { memo } from 'react';

const Polygon = React.forwardRef((props, ref) => (
  <polygon ref={ref} {...props}/>
));

export default memo(Polygon);
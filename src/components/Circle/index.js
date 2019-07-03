import React, { memo } from 'react';

const Circle = React.forwardRef((props, ref) => (
  <circle ref={ref} {...props} />
));

export default memo(Circle);
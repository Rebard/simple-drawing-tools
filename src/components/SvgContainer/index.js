import React, { memo } from 'react';

const SvgContainer = React.forwardRef(({ children, ...props}, ref) => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="100%"
    height="100%"
    ref={ref}
    style={{ position: 'relative' }}
    {...props}
  > 
    {children}
  </svg> 
));

export default memo(SvgContainer);
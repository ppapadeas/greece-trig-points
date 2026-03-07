import React from 'react';

const LogoMark = ({ size = 28, variant = 'light', ...props }) => {
  const height = size * (110 / 100);
  const isLight = variant === 'light';

  const stroke = isLight ? '#1C1A14' : '#F7F2E8';
  const mountainFill = isLight ? '#EDE4D3' : '#2A2820';
  const discHoleFill = isLight ? '#F7F2E8' : '#1C1A14';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 110"
      width={size}
      height={height}
      role="img"
      aria-label="vathra logo"
      {...props}
    >
      <polygon points="0,108 22,62 42,84 50,74 58,84 78,56 100,108" fill={mountainFill} />
      <polyline
        points="0,108 22,62 42,84 50,74 58,84 78,56 100,108"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line x1="44" y1="46" x2="50" y2="72" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="56" y1="46" x2="50" y2="72" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="57" x2="54" y2="57" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="31" r="15" fill="#C2652A" stroke={stroke} strokeWidth="2.8" />
      <circle cx="50" cy="31" r="6" fill={discHoleFill} stroke={stroke} strokeWidth="2" />
    </svg>
  );
};

export default LogoMark;

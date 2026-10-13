import './BrandLogo.css';

const letterform =
  'M14 53V11h19.5c11.7 0 18.2 5.3 18.2 14.8 0 7.9-4.1 12.4-11.5 14l12.5 13.2H40.8L29.6 41H22.5v12H14Zm8.5-19.3h10.7c6.7 0 9.9-2.5 9.9-7.8s-3.2-7.8-9.9-7.8H22.5v15.6Z';
const leg = 'M34.6 39.6 47.4 53';

const BrandLogo = () => (
  <svg
    className="brand-logo"
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="36"
    viewBox="0 0 64 64"
    fill="none"
    role="img"
    aria-labelledby="brand-logo-title"
  >
    <title id="brand-logo-title">CodeWithRahul</title>
    <g className="brand-logo__art">
      <path className="brand-logo__letter" d={letterform} />
      <path className="brand-logo__glow" d={leg} />
      <path className="brand-logo__accent" d={leg} />
    </g>
    <g aria-hidden="true">
      <path className="brand-logo__outline" pathLength="1" d={letterform} />
      <path className="brand-logo__leg-trace" pathLength="1" d={leg} />
      <path className="brand-logo__glint" pathLength="1" d={leg} />
    </g>
  </svg>
);

export default BrandLogo;

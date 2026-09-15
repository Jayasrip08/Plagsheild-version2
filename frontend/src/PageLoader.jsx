import logoImage from './images/nc.png';

export default function PageLoader({ label = 'Loading NovelCheckr…' }) {
  return (
    <div className="page-loader">
      <img src={logoImage} alt="NovelCheckr" className="page-loader-logo" />
      <div className="page-loader-bar">
        <div className="page-loader-bar-fill"></div>
      </div>
      <p className="page-loader-label">{label}</p>
    </div>
  );
}

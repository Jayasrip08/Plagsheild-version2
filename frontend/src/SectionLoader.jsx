export default function SectionLoader({ label }) {
  return (
    <div className="section-loader">
      <div className="section-loader-bar">
        <div className="section-loader-bar-fill"></div>
      </div>
      {label && <p className="section-loader-label">{label}</p>}
    </div>
  );
}

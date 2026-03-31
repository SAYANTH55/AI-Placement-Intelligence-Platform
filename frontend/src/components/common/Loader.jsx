import './Loader.css';

export default function Loader({ text = "Processing..." }) {
  return (
    <div className="loader-container animate-fade-in">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}

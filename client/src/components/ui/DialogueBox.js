import './DialogueBox.css';

export default function DialogueBox({ text, speaker, onAdvance }) {
  return (
    <div className="dialogue-box" onClick={onAdvance}>
      {speaker && <span className="dialogue-box__speaker">{speaker}</span>}
      <p className="dialogue-box__text">{text}</p>
      <span className="dialogue-box__indicator">▼</span>
    </div>
  );
}

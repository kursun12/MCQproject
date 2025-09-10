import { useState } from 'react';

function ImportQuestions() {
  const [count, setCount] = useState(0);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = reader.result.trim().split(/\r?\n/).filter(Boolean);
      setCount(rows.length);
    };
    reader.readAsText(file);
  };

  return (
    <div className="card">
      <h2>Import Questions</h2>
      <input type="file" accept=".csv" onChange={handleFile} />
      {count > 0 && <p>Loaded {count} rows from CSV.</p>}
    </div>
  );
}

export default ImportQuestions;

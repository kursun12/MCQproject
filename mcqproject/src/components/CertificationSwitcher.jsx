import { useMemo } from 'react';
import { useCertification } from '../context/CertificationContext.jsx';

function CertificationSwitcher() {
  const { certificationId, catalog, setCertificationId, isReady } = useCertification();
  const options = useMemo(() => catalog || [], [catalog]);

  return (
    <div className="certification-switcher">
      <label className="sr-only" htmlFor="certification-select">
        Active certification
      </label>
      <select
        id="certification-select"
        aria-label="Active certification"
        value={certificationId}
        onChange={(event) => setCertificationId(event.target.value)}
        disabled={!isReady || options.length === 0}
      >
        {options.map((cert) => (
          <option
            key={cert.id}
            value={cert.id}
            disabled={cert.comingSoon && cert.id !== certificationId}
          >
            {cert.label}{cert.comingSoon ? ' (coming soon)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CertificationSwitcher;

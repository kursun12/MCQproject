import { useMemo } from 'react';
import { useCertification } from '../context/CertificationContext.jsx';

function CertificationSwitcher() {
  const { certificationId, catalog, setCertificationId, isReady } = useCertification();
  const options = useMemo(() => catalog || [], [catalog]);

  return (
    <div className="certification-switcher">
      <label htmlFor="certification-select">Certification</label>
      <select
        id="certification-select"
        value={certificationId}
        onChange={(event) => setCertificationId(event.target.value)}
        disabled={!isReady || options.length === 0}
      >
        {options.map((cert) => (
          <option key={cert.id} value={cert.id}>
            {cert.label}{cert.comingSoon ? ' (coming soon)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CertificationSwitcher;

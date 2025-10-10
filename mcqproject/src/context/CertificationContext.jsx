import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  certifications,
  certificationCatalog,
  DEFAULT_CERTIFICATION_ID,
  getCertification,
} from '../questions.js';
import { syncLocalStorage } from '../utils/storage.js';

const CertificationContext = createContext({
  certificationId: DEFAULT_CERTIFICATION_ID,
  certification: getCertification(DEFAULT_CERTIFICATION_ID),
  catalog: certificationCatalog,
  setCertificationId: () => {},
  isReady: false,
});

const ACTIVE_CERT_KEY = 'activeCertification';
const CERT_SCOPED_KEYS = ['questions', 'sets', 'bookmarks', 'notes', 'stats', 'mcqSession', 'retryIds', 'maxStreak'];

function getStorage() {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function patchSetMetadata(certId, storage, cert) {
  if (!cert) return;
  const setsKey = `sets:${certId}`;
  const raw = storage.getItem(setsKey);
  if (!raw) return;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  const metaMap = new Map((cert.sets || []).map((set) => [set.id, set]));
  const patched = parsed.map((set) => {
    const meta = metaMap.get(set.id);
    if (!meta) {
      return { ...set, certification: cert.id };
    }
    return {
      ...set,
      name: meta.name || set.name,
      certification: cert.id,
    };
  });
  try {
    storage.setItem(setsKey, JSON.stringify(patched));
  } catch {
    /* ignore */
  }
}

function ensureSeed(certId, storage, existingCert) {
  if (!certId || !storage) return;
  const cert = existingCert || certifications[certId];
  if (!cert) return;
  const questionsKey = `questions:${certId}`;
  const setsKey = `sets:${certId}`;

  const parseJSON = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const storedQuestions = parseJSON(storage.getItem(questionsKey));
  const storedSets = parseJSON(storage.getItem(setsKey));
  const needsQuestions = !Array.isArray(storedQuestions) || storedQuestions.length === 0;
  const needsSets = !Array.isArray(storedSets) || storedSets.length === 0;

  if (needsQuestions || needsSets) {
    const defaultSets = Object.fromEntries((cert.sets || []).map((set) => [set.id, set.questions]));
    syncLocalStorage(defaultSets, cert.questions, storage, questionsKey, setsKey);
  }
  patchSetMetadata(certId, storage, cert);
}

function stashCertificationData(certId, storage) {
  if (!certId || !storage) return;
  CERT_SCOPED_KEYS.forEach((key) => {
    const scopedKey = `${key}:${certId}`;
    const value = storage.getItem(key);
    if (value === null || value === undefined) {
      return;
    }
    try {
      storage.setItem(scopedKey, value);
    } catch {
      /* ignore */
    }
  });
}

function restoreCertificationData(certId, storage) {
  if (!certId || !storage) return;
  const cert = certifications[certId];
  if (!cert) return;
  ensureSeed(certId, storage, cert);

  CERT_SCOPED_KEYS.forEach((key) => {
    const scopedKey = `${key}:${certId}`;
    const stored = storage.getItem(scopedKey);
    if (stored !== null && stored !== undefined) {
      try {
        storage.setItem(key, stored);
      } catch {
        /* ignore */
      }
      return;
    }

    if (key === 'questions') {
      const serialized = JSON.stringify(cert.questions);
      try {
        storage.setItem(scopedKey, serialized);
        storage.setItem(key, serialized);
      } catch {
        /* ignore */
      }
      return;
    }

    if (key === 'sets') {
      const setsPayload = (cert.sets || []).map((set) => ({
        id: set.id,
        name: set.name,
        certification: cert.id,
        questionIds: (set.questions || []).map((q) => q.id),
      }));
      const serialized = JSON.stringify(setsPayload);
      try {
        storage.setItem(scopedKey, serialized);
        storage.setItem(key, serialized);
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
  });

  try {
    storage.setItem(ACTIVE_CERT_KEY, certId);
  } catch {
    /* ignore */
  }
}

function CertificationProvider({ children }) {
  const [certificationId, setCertificationId] = useState(DEFAULT_CERTIFICATION_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storage = getStorage();
    if (!storage) {
      setCertificationId(DEFAULT_CERTIFICATION_ID);
      setIsReady(true);
      return;
    }
    const stored = storage.getItem(ACTIVE_CERT_KEY);
    const initialId = certifications[stored] ? stored : DEFAULT_CERTIFICATION_ID;

    stashCertificationData(initialId, storage);
    restoreCertificationData(initialId, storage);
    setCertificationId(initialId);
    setIsReady(true);
  }, []);

  const handleSwitch = useCallback((nextId) => {
    if (!nextId || !certifications[nextId]) return;
    setCertificationId((current) => {
      if (current === nextId) return current;
      const storage = getStorage();
      if (!storage) return nextId;
      stashCertificationData(current, storage);
      restoreCertificationData(nextId, storage);
      return nextId;
    });
  }, []);

  const value = useMemo(() => ({
    certificationId,
    certification: getCertification(certificationId),
    catalog: certificationCatalog,
    setCertificationId: handleSwitch,
    isReady,
  }), [certificationId, handleSwitch, isReady]);

  return (
    <CertificationContext.Provider value={value}>
      {children}
    </CertificationContext.Provider>
  );
}

function useCertification() {
  return useContext(CertificationContext);
}

export { CertificationProvider, useCertification };

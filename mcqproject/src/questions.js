import sc200Set1 from './assets/SC-200/_MConverter.eu_1-30.json' assert { type: 'json' };
import sc200Set2 from './assets/SC-200/_MConverter.eu_31-60.json' assert { type: 'json' };
import sc200Set3 from './assets/SC-200/_MConverter.eu_61-90.json' assert { type: 'json' };
import sc200Set4 from './assets/SC-200/_MConverter.eu_91-120.json' assert { type: 'json' };
import sc200Set5 from './assets/SC-200/_MConverter.eu_youtube50.json' assert { type: 'json' };
import sc200Set6 from './assets/SC-200/_MConverter.eu_121-150.json' assert { type: 'json' };
import sc200Set7 from './assets/SC-200/_MConverter.eu_151-180.json' assert { type: 'json' };
import sc200Set8 from './assets/SC-200/_MConverter.eu_181-210.json' assert { type: 'json' };
import sc200Set9 from './assets/SC-200/_MConverter.eu_211-254.json' assert { type: 'json' };
import { generateId } from './utils/id.js';

const sc200RawSets = [
  { id: 'sc200-set-1', name: 'SC-200 Set 1', shortName: 'Set 1', data: sc200Set1 },
  { id: 'sc200-set-2', name: 'SC-200 Set 2', shortName: 'Set 2', data: sc200Set2 },
  { id: 'sc200-set-3', name: 'SC-200 Set 3', shortName: 'Set 3', data: sc200Set3 },
  { id: 'sc200-set-4', name: 'SC-200 Set 4', shortName: 'Set 4', data: sc200Set4 },
  { id: 'sc200-set-5', name: 'SC-200 YouTube 50', shortName: 'YouTube 50', data: sc200Set5 },
  { id: 'sc200-set-6', name: 'SC-200 Set 6', shortName: 'Set 6', data: sc200Set6 },
  { id: 'sc200-set-7', name: 'SC-200 Set 7', shortName: 'Set 7', data: sc200Set7 },
  { id: 'sc200-set-8', name: 'SC-200 Set 8', shortName: 'Set 8', data: sc200Set8 },
  { id: 'sc200-set-9', name: 'SC-200 Set 9', shortName: 'Set 9', data: sc200Set9 },
];

function buildCertification({ id, label, shortLabel, slug, description = '', comingSoon = false, rawSets = [] }) {
  const uniqueQuestions = new Map();

  const processedSets = rawSets.map(({ id: setId, name, shortName, data }) => {
    const processedQuestions = data.map((question) => {
      const { id: legacyId, set: legacySet, ...rest } = question;
      const key = JSON.stringify(rest);
      let existing = uniqueQuestions.get(key);
      if (!existing) {
        existing = {
          ...rest,
          id: generateId(),
          set: name,
          certification: id,
        };
        uniqueQuestions.set(key, existing);
      }
      return existing;
    });

    return {
      id: setId,
      name,
      shortName: shortName || name,
      certification: id,
      questions: processedQuestions,
    };
  });

  return {
    id,
    label,
    shortLabel: shortLabel || label,
    slug,
    description,
    comingSoon,
    sets: processedSets,
    questions: Array.from(uniqueQuestions.values()),
  };
}

const sc200Certification = buildCertification({
  id: 'SC-200',
  label: 'SC-200 Microsoft Security Operations Analyst',
  shortLabel: 'SC-200',
  slug: 'sc-200',
  description: 'Security Operations Analyst question bank.',
  rawSets: sc200RawSets,
});


const kcdaCertification = {
  id: 'KCDA',
  label: 'KCDA Knowledge Discovery & Classification Analyst',
  shortLabel: 'KCDA',
  slug: 'kcda',
  description: 'KCDA question bank is coming soon.',
  comingSoon: true,
  sets: [],
  questions: [],
};

const certificationOrder = ['SC-200', 'KCDA'];
const certificationsArray = [sc200Certification, kcdaCertification];
const certifications = Object.fromEntries(certificationsArray.map((cert) => [cert.id, cert]));
const DEFAULT_CERTIFICATION_ID = sc200Certification.id;

const defaultQuestions = certifications[DEFAULT_CERTIFICATION_ID].questions;

const sc200SetQuestions = sc200Certification.sets.map((set) => set.questions);
const [
  set1 = [],
  set2 = [],
  set3 = [],
  set4 = [],
  set5 = [],
  set6 = [],
  set7 = [],
  set8 = [],
  set9 = [],
] = sc200SetQuestions;

const bundledSets = sc200Certification.sets.map(({ id, name, certification, questions }) => ({
  id,
  name,
  certification,
  data: questions,
}));

function getCertification(id) {
  return certifications[id] || certifications[DEFAULT_CERTIFICATION_ID];
}

function getCertificationQuestions(id) {
  return getCertification(id).questions;
}

function getCertificationSets(id) {
  return getCertification(id).sets;
}

const certificationCatalog = certificationOrder.map((id) => certifications[id]);

export default defaultQuestions;
export {
  set1,
  set2,
  set3,
  set4,
  set5,
  set6,
  set7,
  set8,
  set9,
  bundledSets,
  certifications,
  certificationCatalog,
  certificationOrder,
  DEFAULT_CERTIFICATION_ID,
  getCertification,
  getCertificationQuestions,
  getCertificationSets,
};


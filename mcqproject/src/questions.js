import { generateId } from './utils/id.js';

const sc200FileOrder = [
  '_MConverter.eu_1-30',
  '_MConverter.eu_31-60',
  '_MConverter.eu_61-90',
  '_MConverter.eu_91-120',
  '_MConverter.eu_youtube50',
  '_MConverter.eu_121-150',
  '_MConverter.eu_151-180',
  '_MConverter.eu_181-210',
  '_MConverter.eu_211-254',
];

const sc200LabelOverrides = {
  '_MConverter.eu_1-30': { shortName: 'Set 1', name: 'SC-200 Set 1' },
  '_MConverter.eu_31-60': { shortName: 'Set 2', name: 'SC-200 Set 2' },
  '_MConverter.eu_61-90': { shortName: 'Set 3', name: 'SC-200 Set 3' },
  '_MConverter.eu_91-120': { shortName: 'Set 4', name: 'SC-200 Set 4' },
  '_MConverter.eu_youtube50': { shortName: 'YouTube 50', name: 'SC-200 YouTube 50' },
  '_MConverter.eu_121-150': { shortName: 'Set 6', name: 'SC-200 Set 6' },
  '_MConverter.eu_151-180': { shortName: 'Set 7', name: 'SC-200 Set 7' },
  '_MConverter.eu_181-210': { shortName: 'Set 8', name: 'SC-200 Set 8' },
  '_MConverter.eu_211-254': { shortName: 'Set 9', name: 'SC-200 Set 9' },
};

const sc200Modules = import.meta.glob('./assets/SC-200/*.json', { eager: true });
const kcdaModules = import.meta.glob('./assets/KCDA/*.json', { eager: true });

function normalizeModule(mod) {
  if (!mod) return [];
  return Array.isArray(mod.default) ? mod.default : (Array.isArray(mod) ? mod : []);
}

function toTitleCase(slug) {
  return slug
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function buildCertification({ id, label, shortLabel, slug, description = '', rawSets = [] }) {
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
      shortName,
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
    comingSoon: processedSets.length === 0,
    sets: processedSets,
    questions: Array.from(uniqueQuestions.values()),
  };
}

const sc200RawSets = sc200FileOrder
  .map((base, index) => {
    const mod = sc200Modules[`./assets/SC-200/${base}.json`];
    if (!mod) return null;
    const override = sc200LabelOverrides[base] || {};
    const shortName = override.shortName || `Set ${index + 1}`;
    const name = override.name || `SC-200 ${shortName}`;
    return {
      id: `sc200-set-${index + 1}`,
      name,
      shortName,
      data: normalizeModule(mod),
    };
  })
  .filter(Boolean);

const kcdaRawSets = Object.entries(kcdaModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod], index) => {
    const file = path.split('/').pop()?.replace('.json', '') || `KCDA ${index + 1}`;
    const title = toTitleCase(file);
    return {
      id: `kcda-set-${index + 1}`,
      name: `KCDA ${title}`,
      shortName: title,
      data: normalizeModule(mod),
    };
  });

const sc200Certification = buildCertification({
  id: 'SC-200',
  label: 'SC-200 Microsoft Security Operations Analyst',
  shortLabel: 'SC-200',
  slug: 'sc-200',
  description: 'Security Operations Analyst question bank.',
  rawSets: sc200RawSets,
});

const kcdaCertification = buildCertification({
  id: 'KCDA',
  label: 'KCDA Knowledge Discovery & Classification Analyst',
  shortLabel: 'KCDA',
  slug: 'kcda',
  description: 'KCDA question bank.',
  rawSets: kcdaRawSets,
});

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

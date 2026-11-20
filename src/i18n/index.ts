import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import en from './en';
import ar from './ar';

const LANG_KEY = 'workauth-lang';

function initialLang(): 'ar' | 'en' {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

function applyDir(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}
applyDir(i18n.language);
i18n.on('languageChanged', (lng) => {
  applyDir(lng);
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    /* ignore */
  }
});

export function setLang(lng: 'ar' | 'en') {
  void i18n.changeLanguage(lng);
}

/** Convenience hook: translation function plus helpers for bilingual data fields. */
export function useT() {
  const { t, i18n: inst } = useTranslation();
  const isAr = inst.language === 'ar';
  const num = (n: number, digits = 0) =>
    n.toLocaleString(isAr ? 'ar-JO-u-nu-latn' : 'en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const date = (iso?: string) =>
    iso ? new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString(isAr ? 'ar-JO-u-nu-latn' : 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  return { t, isAr, lang: inst.language as 'ar' | 'en', num, date };
}

export default i18n;

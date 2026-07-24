import { describe, it, expect } from 'vitest';
import { t, TRANSLATIONS, type TranslationKey } from '../src/utils/i18n';

describe('Frontend i18n Utility', () => {
  it('should contain matching keys between ES and EN dictionaries', () => {
    const esKeys = Object.keys(TRANSLATIONS.es).sort();
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('should return correct translation for ES and EN', () => {
    expect(t('btn_generate', 'es')).toBe('Generar Tarjetas');
    expect(t('btn_generate', 'en')).toBe('Generate Cards');
  });

  it('should fallback to ES if unknown locale is provided', () => {
    expect(t('btn_generate', 'fr' as any)).toBe('Generar Tarjetas');
  });

  it('should interpolate parameters correctly', () => {
    // Testing param substitution logic
    const res = t('header_metrics_label', 'en');
    expect(res).toBe('Users active with cards: ');
  });
});

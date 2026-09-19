import { useLanguage } from '../language'

export function JourneyLoader({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()
  return <div className={`journey-loader ${compact ? 'journey-loader--compact' : ''}`} role="status">
    <div className="journey-loader__seal" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" /><path d="M32 49V25m0 9C13 33 19 13 19 13l9 10 4-15 4 15 9-10s6 20-13 21ZM32 47c-15 0-18-13-18-13 13 0 18 13 18 13Zm0 0c15 0 18-13 18-13-13 0-18 13-18 13Z" /></svg></div>
    <span>{t('Открываем историю…', 'Тарихны ачабыз…')}</span>
  </div>
}

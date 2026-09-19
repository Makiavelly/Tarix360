import { LanguageContext, useLanguage, type Language } from './language'
import { useEffect, useState, type ReactNode } from 'react'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (localStorage.getItem('tarix360.language-default-v2') !== 'applied') {
      localStorage.setItem('tarix360.language-default-v2', 'applied')
      return 'tt'
    }
    return localStorage.getItem('tarix360.language') === 'ru' ? 'ru' : 'tt'
  })
  useEffect(() => {
    localStorage.setItem('tarix360.language', language)
    document.documentElement.lang = language
  }, [language])
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  return <button className="language-toggle" type="button"
    aria-label={t('Язык интерфейса: переключить на татарский', 'Интерфейс теле: русчага күчү')}
    onClick={() => setLanguage(language === 'ru' ? 'tt' : 'ru')}>
    <span lang="ru" className={language === 'ru' ? 'is-active' : ''}>РУС</span>
    <span lang="tt" className={language === 'tt' ? 'is-active' : ''}>ТАТ</span>
  </button>
}

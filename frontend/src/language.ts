import { createContext, useContext } from 'react'

export type Language = 'ru' | 'tt'
export const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({
  language: 'ru' as Language,
  setLanguage: () => {},
})

export function useLanguage() {
  const context = useContext(LanguageContext)
  return { ...context, localize: (value?: string, translated?: string) => context.language === 'tt' && translated ? translated : value ?? '', t: (ru: string, tt: string) => context.language === 'tt' ? tt : ru }
}


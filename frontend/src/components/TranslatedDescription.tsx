import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../language'

type Props = { description: string; descriptionTt?: string }

export function TranslatedDescription({ description, descriptionTt }: Props) {
  const { language } = useLanguage()
  const [override, setOverride] = useState<{ language: string; tatar: boolean } | null>(null)
  const tatar = override?.language === language ? override.tatar : language === 'tt'
  return (
    <div className="translated-description">
      {descriptionTt && <button
        className="translation-toggle"
        type="button"
        aria-pressed={tatar}
        onClick={() => setOverride({ language, tatar: !tatar })}
      ><Languages size={15} />{tatar ? 'На русском' : 'Татарча'}</button>}
      <p key={tatar ? 'tt' : 'ru'} lang={tatar && descriptionTt ? 'tt' : 'ru'} aria-live="polite">
        {tatar && descriptionTt ? descriptionTt : description}
      </p>
    </div>
  )
}

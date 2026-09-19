import { useEffect, useRef, useState } from 'react'
import { Check, Copy, UserRound, Users, X } from 'lucide-react'
import { useLanguage } from '../language'

export function LobbyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [code] = useState(() => {
    const existing = sessionStorage.getItem('tarix360.lobby')
    if (existing && /^[A-HJ-NP-Z2-9]{6}$/.test(existing)) return existing
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const value = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => alphabet[byte % alphabet.length]).join('')
    sessionStorage.setItem('tarix360.lobby', value)
    return value
  })
  useEffect(() => { dialogRef.current?.showModal() }, [])
  return <dialog className="lobby-dialog ornament-panel" ref={dialogRef} onCancel={onClose} aria-labelledby="lobby-title" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button className="lobby-dialog__close" onClick={onClose} aria-label={t('Закрыть', 'Ябу')}><X /></button>
    <div className="lobby-dialog__icon"><Users /></div>
    <span className="eyebrow">{t('Ваше пространство', 'Сезнең бүлмә')}</span>
    <h2 id="lobby-title">{t('Лобби создано', 'Лобби булдырылды')}</h2>
    <p>{t('Код вашей комнаты', 'Бүлмәгезнең коды')}</p>
    <output className="lobby-code" aria-label={t('Код комнаты', 'Бүлмә коды')}>{code}</output>
    <button className="primary-button" onClick={async () => {
      try { await navigator.clipboard.writeText(code); setCopied(true); setCopyFailed(false) }
      catch { setCopyFailed(true) }
    }}>{copied ? <Check /> : <Copy />}{copied ? t('Скопировано', 'Күчерелде') : t('Скопировать код', 'Кодны күчерү')}</button>
    <div className="lobby-slots" aria-label={t('Игроки: 1 из 5', 'Уенчылар: 5 урыннан 1')}>
      {Array.from({ length: 5 }, (_, index) => <div key={index} className={`lobby-slot ${index === 0 ? 'is-occupied' : ''}`}>
        <UserRound /><span>{index === 0 ? t('Гость', 'Кунак') : t('Свободное место', 'Буш урын')}</span>
        <small>{index === 0 ? t('Вы', 'Сез') : `0${index + 1}`}</small>
      </div>)}
    </div>
    {copyFailed && <p role="status">{t('Выделите код и скопируйте вручную', 'Кодны сайлап, кулдан күчерегез')}</p>}
  </dialog>
}

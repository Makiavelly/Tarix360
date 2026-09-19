import { useEffect, useState } from 'react'

export function usePresence(visible: boolean, duration = 300) {
  const [mounted, setMounted] = useState(visible)
  useEffect(() => {
    if (visible) { setMounted(true); return }
    const timer = setTimeout(() => setMounted(false), duration)
    return () => clearTimeout(timer)
  }, [visible, duration])
  return visible || mounted
}

export function useFadingValue<T>(value: T | null, duration = 300) {
  const [retained, setRetained] = useState(value)
  useEffect(() => {
    if (value !== null) { setRetained(value); return }
    const timer = setTimeout(() => setRetained(null), duration)
    return () => clearTimeout(timer)
  }, [value, duration])
  return value ?? retained
}

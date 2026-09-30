import { useState, type CSSProperties, type ReactNode } from 'react'
import { useAuth } from '../state/auth'

/*
 * Tycho-Logo. Die Dateien kommen aus dem Design-Ordner (design/logo/) und werden nach
 * web/public/brand/ kopiert: logo-light.svg (für helle Flächen) und logo-dark.svg (für dunkle).
 * Fehlt eine Datei, steht die Wortmarke „Tycho“ – so bricht nichts, bevor das Logo eingecheckt ist.
 */
const SRC = { light: 'brand/logo-light.svg', dark: 'brand/logo-dark.svg' }
const HEIGHT = { sm: 22, md: 32, lg: 44, hero: 180 }
const missing = new Set<string>()

export default function Brand({ size = 'sm', tone, compact = false, className = '', style, fallback }: {
  size?: keyof typeof HEIGHT; tone?: 'dark' | 'light'; compact?: boolean; className?: string; style?: CSSProperties; fallback?: ReactNode
}) {
  const { theme } = useAuth()
  const t = tone ?? theme
  const src = SRC[t]
  const [, bump] = useState(0)
  if (missing.has(src)) {
    if (fallback) return <>{fallback}</>
    const fs = { sm: 15, md: 22, lg: 30, hero: 120 }[size]
    return <span className={`font-semibold tracking-tight ${className}`} style={{ fontSize: fs, ...style }}>{compact ? 'T' : 'Tycho'}</span>
  }
  return <img src={src} alt="Tycho" draggable={false} className={className} style={{ height: HEIGHT[size], width: 'auto', ...style }} onError={() => { missing.add(src); bump((n) => n + 1) }} />
}

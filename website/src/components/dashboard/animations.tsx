'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}

/**
 * Animated number counter — easing out from 0 to value on mount
 * and smoothly transitioning when value changes.
 */
export function AnimatedNumber({
  value,
  duration = 800,
  format = (n) => n.toLocaleString('vi-VN'),
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const from = prevRef.current
    const to = value
    const delta = to - from

    if (delta === 0) return

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + delta * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        prevRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      prevRef.current = to
    }
  }, [value, duration])

  return <span className={className}>{format(Math.round(display))}</span>
}

/**
 * Live clock — updates every second.
 * Initial state lấy từ lazy initializer (client-side), effect chỉ setup interval.
 */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null
    return new Date()
  })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!now) {
    return <span className={className}>--:--:--</span>
  }

  return (
    <span className={className}>
      {now.toLocaleTimeString('vi-VN', { hour12: false })}
    </span>
  )
}

/**
 * Mini sparkline from array of numbers — pure SVG, no chart lib needed.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'var(--primary)',
  className,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}) {
  if (data.length === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = width / Math.max(data.length - 1, 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return [x, y] as [number, number]
  })

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')

  const areaPath = `${path} L${width},${height} L0,${height} Z`
  const gradId = `spark-${Math.random().toString(36).slice(2, 9)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

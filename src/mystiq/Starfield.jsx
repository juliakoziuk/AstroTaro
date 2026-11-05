import { useEffect, useRef } from 'react'

// Фонове зоряне небо: зорі мерехтять, раз на кілька секунд пролітає метеор.
// При prefers-reduced-motion малюється одна статична картинка.
export default function Starfield() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let stars = []
    let meteor = null
    let nextMeteor = performance.now() + 5000
    let frame = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round((width * height) / 5200)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.15 + 0.2,
        base: Math.random() * 0.55 + 0.2,
        speed: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.18,
      }))
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const twinkle = reduce ? 1 : 0.65 + 0.35 * Math.sin(time * 0.001 * s.speed + s.phase)
        ctx.globalAlpha = s.base * twinkle
        ctx.fillStyle = s.gold ? '#f3dfa8' : '#dfe3ff'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduce) {
        if (!meteor && time > nextMeteor) {
          meteor = { x: Math.random() * width * 0.8 + width * 0.2, y: Math.random() * height * 0.4, life: 0 }
        }
        if (meteor) {
          meteor.life += 1
          const t = meteor.life / 55
          const x = meteor.x - t * 260
          const y = meteor.y + t * 130
          const grad = ctx.createLinearGradient(x, y, x + 90, y - 45)
          grad.addColorStop(0, 'rgba(243,223,168,0.9)')
          grad.addColorStop(1, 'rgba(243,223,168,0)')
          ctx.globalAlpha = 1 - t
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 90, y - 45)
          ctx.stroke()
          if (meteor.life >= 55) {
            meteor = null
            nextMeteor = time + 7000 + Math.random() * 9000
          }
        }
      }
      ctx.globalAlpha = 1
      if (!reduce) frame = requestAnimationFrame(draw)
    }

    resize()
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="mq-stars" aria-hidden="true" />
}

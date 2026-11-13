import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * Mouvement de la page d'introduction, sans rien afficher : défilement fluide (Lenis),
 * entrée du titre et apparition des sections au défilement (GSAP + ScrollTrigger).
 * Cible les éléments `[data-hero]` et `[data-reveal]`. Sans animation si l'utilisateur
 * a demandé « réduire les animations ».
 */
export default function IntroMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('[data-hero]', { opacity: 0, y: 28, duration: 1, ease: 'expo.out', stagger: 0.1 })

      gsap.set('[data-reveal]', { opacity: 0, y: 36 })
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (elements) =>
          gsap.to(elements, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 }),
      })
    })

    // Lenis et ScrollTrigger partagent la même boucle (recette officielle de Lenis).
    const lenis = new Lenis({ duration: 1.1 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      context.revert()
    }
  }, [])

  return null
}

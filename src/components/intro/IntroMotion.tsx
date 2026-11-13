import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useLayoutEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * Mouvement de la page d'introduction, sans rien afficher : défilement fluide (Lenis),
 * entrée du titre et apparition des sections au défilement (GSAP + ScrollTrigger).
 * Cible les éléments `[data-hero]` et `[data-reveal]`. Sans animation si l'utilisateur
 * a demandé « réduire les animations ».
 */
export default function IntroMotion() {
  // Avant la peinture : l'état de départ est posé sans flash du contenu final.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      // Titre mot par mot (échelonnement court), puis texte, scène et onglets.
      gsap.from('[data-split-now] [data-word]', {
        opacity: 0,
        y: 26,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.045,
      })
      gsap.from('[data-hero]', { opacity: 0, y: 20, duration: 0.9, ease: 'expo.out', delay: 0.25, clearProps: 'all' })
      // Jamais depuis zéro : la scène apparaît par le bas, déjà un peu présente.
      gsap.fromTo(
        '[data-stage]',
        { opacity: 0, clipPath: 'inset(12% 0% 0% 0% round 24px)' },
        { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.1, ease: 'expo.out', delay: 0.3, clearProps: 'clipPath' },
      )
      gsap.from('[data-tabs]', { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out', delay: 0.55, clearProps: 'all' })

      gsap.set('[data-split] [data-word]', { opacity: 0, y: 26 })
      ScrollTrigger.create({
        trigger: '[data-split]',
        start: 'top 88%',
        once: true,
        onEnter: () =>
          gsap.to('[data-split] [data-word]', { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.045 }),
      })

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

// Animación de la UI in-world. react-ecs no tiene transiciones CSS ni la librería Motion:
// se anima interpolando valores por frame en un system y re-renderizando. Aquí centralizamos
// ese estado de animación siguiendo los principios de motion (ease-out al entrar, duración
// corta, 1-2 elementos con foco, movimiento con significado).

import { getFireState } from '../systems/minigame'
import { currentStep, isOnboardingActive } from './onboardingState'

let t = 0 // reloj acumulado (segundos), para osciladores
let displayedHealth = 0 // salud mostrada, persigue suavemente el valor autoritativo
let bannerPulse = 0 // 0..1 respiración del banner "encendiendo la fogata…"
let onboardingReveal = 1 // 0..1 entrada de la tarjeta de onboarding (fade + slide)
let lastStep = -1

// System registrado en el main del cliente. dt en segundos.
export function uiAnimSystem(dt: number) {
  t += dt

  // Salud del fuego: lerp exponencial hacia el objetivo → la barra no salta, fluye.
  const target = getFireState().value
  displayedHealth += (target - displayedHealth) * Math.min(1, dt * 6)

  // Banner: respiración lenta (seno), sutil, para que "lata" mientras conecta.
  bannerPulse = (Math.sin(t * 2.4) + 1) / 2

  // Onboarding: cada cambio de pantalla reinicia la entrada; ease-out hacia 1.
  const step = currentStep()
  if (!isOnboardingActive()) {
    onboardingReveal = 1
  } else if (step !== lastStep) {
    lastStep = step
    onboardingReveal = 0
  } else {
    onboardingReveal = Math.min(1, onboardingReveal + dt * 4.5)
  }
}

export function getDisplayedHealth(): number {
  return Math.round(displayedHealth)
}

// Opacidad del banner (respiración entre 0.55 y 1).
export function getBannerAlpha(): number {
  return 0.55 + bannerPulse * 0.45
}

// Progreso de entrada del onboarding con ease-out expo (0..1).
export function getOnboardingReveal(): number {
  return easeOutExpo(onboardingReveal)
}

function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

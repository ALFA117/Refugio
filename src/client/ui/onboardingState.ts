// Estado del onboarding (paso 7). Vive en memoria por sesión — se muestra al entrar y se
// oculta al terminar o al Saltar. No se persiste: es liviano y el requisito no lo pide.
// La UI de react-ecs se re-renderiza cada tick leyendo estos getters.

export type OnboardingScreen = { title: string; body: string }

// 3 pantallas — docs/especificaciones-tecnicas.md sección 7 / master-prompt.
export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    title: 'Bienvenido a Refugio',
    body: 'Reúnete alrededor del fuego. Mientras más guardianes se acercan, más alto arde la fogata.'
  },
  {
    title: 'Siéntate y acompaña',
    body: 'Toca un tronco para sentarte junto al fuego. La fogata responde a quién esté presente, sin necesidad de un anfitrión.'
  },
  {
    title: 'Guardianes del Fuego',
    body: 'Cuando aparezca leña, tócala a tiempo para alimentar el fuego. Si entre todos lo mantienen vivo, ganan brasas.'
  }
]

let step = 0
let done = false

export function isOnboardingActive(): boolean {
  return !done
}

export function currentScreen(): OnboardingScreen {
  return ONBOARDING_SCREENS[step]
}

export function currentStep(): number {
  return step
}

export function screenCount(): number {
  return ONBOARDING_SCREENS.length
}

// Avanza a la siguiente pantalla; en la última, cierra el onboarding.
export function advanceOnboarding() {
  if (done) return
  if (step < ONBOARDING_SCREENS.length - 1) {
    step++
  } else {
    done = true
  }
}

export function skipOnboarding() {
  done = true
}

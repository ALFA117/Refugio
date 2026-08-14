import { engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { FOGATA_CENTER_X, FOGATA_CENTER_Z } from '../shared/constants'
import { ensureFireEntity } from '../shared/fire'
import { createFogataEntity } from './factory/fogata'
import { createSeats } from './factory/seats'
import { createFlame } from './factory/flame'
import { fogataSystem } from './systems/fogataSystem'
import { seatSystem } from './systems/seatSystem'
import { registerMinigameHandlers, fireHealthSystem } from './systems/minigame'
import { initReferral } from './referral'
import { setupUi } from './ui/ui'
import { uiAnimSystem } from './ui/uiAnim'

const FOGATA_CENTER = Vector3.create(FOGATA_CENTER_X, 0, FOGATA_CENTER_Z)

export function main() {
  // Presencia social (paso 2) y asientos (paso 3)
  createFogataEntity(FOGATA_CENTER)
  createSeats(FOGATA_CENTER)
  engine.addSystem(fogataSystem)
  engine.addSystem(seatSystem)

  // Minijuego "Guardianes del Fuego" (paso 4) — estado autoritativo en el servidor.
  ensureFireEntity(FOGATA_CENTER) // misma entidad de red que crea el servidor
  createFlame(FOGATA_CENTER)
  registerMinigameHandlers()
  engine.addSystem(fireHealthSystem)

  // Invitación (paso 6): si el jugador entró con ?ref=<wallet>, registrar el referido.
  void initReferral()

  // Onboarding + HUD (paso 7) + animación de UI (interpolación por frame)
  setupUi()
  engine.addSystem(uiAnimSystem)
}

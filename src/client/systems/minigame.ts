import { engine, Material, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { FireHealth } from '../../shared/fire'
import { room } from '../../shared/messages'
import { log } from '../../shared/log'
import { FIRE_MAX_HEALTH } from '../../shared/constants'
import { spawnWoodVisual, removeWoodVisual, clearAllWood } from '../factory/wood'
import { getFlame } from '../factory/flame'

// Cablea los mensajes servidor→cliente del minijuego. Llamar una vez en el main del cliente.
export function registerMinigameHandlers() {
  room.onMessage('roundStarted', () => {
    clearAllWood()
  })

  room.onMessage('woodSpawned', (data) => {
    spawnWoodVisual(data.id, data.x, data.z)
  })

  room.onMessage('woodResolved', (data) => {
    removeWoodVisual(data.id)
  })

  room.onMessage('roundEnded', () => {
    clearAllWood()
  })

  // Balance de brasas del propio jugador tras cerrar la ronda (mensaje dirigido).
  // Se guarda para el HUD (paso de onboarding/UI); por ahora se registra en consola.
  room.onMessage('brasasAwarded', (data) => {
    brasasBalance = data.balance
    log.info('brasas_awarded_client', { earned: data.earned, balance: data.balance })
  })

  // Leaderboard para el panel in-world.
  room.onMessage('leaderboardUpdated', (data) => {
    leaderboard = data.entries
  })

  // Estado de conexión al Multiplayer Server. Arranca dormido (~15s en despertar en
  // producción); mostramos "encendiendo la fogata…" hasta que el room esté listo.
  roomReady = room.isReady()
  room.onReady((ready) => {
    roomReady = ready
  })
}

// Leaderboard conocido (top N, sin address). Vacío hasta el primer broadcast del servidor.
let leaderboard: { displayName: string; brasas: number; gamesPlayed: number }[] = []
export function getLeaderboard(): { displayName: string; brasas: number; gamesPlayed: number }[] {
  return leaderboard
}

// ¿El room del Multiplayer Server ya está listo? Mientras no, la escena muestra estado de carga.
let roomReady = false
export function isServerReady(): boolean {
  return roomReady
}

// Balance local conocido de brasas del jugador. -1 = aún sin dato del servidor.
let brasasBalance = -1
export function getBrasasBalance(): number {
  return brasasBalance
}

// Estado actual del fuego (autoritativo, sincronizado) para el HUD.
export function getFireState(): { value: number; roundActive: boolean } {
  for (const [, fire] of engine.getEntitiesWith(FireHealth)) {
    return { value: fire.value, roundActive: fire.roundActive }
  }
  return { value: 0, roundActive: false }
}

let elapsed = 0
const RECALC_INTERVAL = 0.2

// Traduce FireHealth (autoritativo, sincronizado) al visual de la llama. Throttled, no
// por frame. La llama crece y brilla con la salud; se oculta fuera de ronda.
export function fireHealthSystem(dt: number) {
  elapsed += dt
  if (elapsed < RECALC_INTERVAL) return
  elapsed = 0

  const flame = getFlame()
  if (flame === undefined) return

  let value = 0
  let roundActive = false
  for (const [, fire] of engine.getEntitiesWith(FireHealth)) {
    value = fire.value
    roundActive = fire.roundActive
    break
  }

  const transform = Transform.getMutable(flame)
  if (!roundActive) {
    transform.scale = Vector3.create(0, 0, 0)
    return
  }

  const t = Math.max(0, Math.min(1, value / FIRE_MAX_HEALTH))
  // Alto: llama grande y amarilla. Bajo: pequeña y roja apagada.
  const height = 0.4 + t * 1.6
  const width = 0.3 + t * 0.5
  transform.scale = Vector3.create(width, height, width)

  const material = Material.getMutableOrNull(flame)
  if (material?.material?.$case === 'pbr' && material.material.pbr) {
    material.material.pbr.emissiveIntensity = 0.5 + t * 2
    material.material.pbr.emissiveColor = { r: 1, g: 0.25 + t * 0.45, b: 0.05 + t * 0.1 }
  }
}

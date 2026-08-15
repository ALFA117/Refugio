// Lógica server-authoritative del minijuego "Guardianes del Fuego" (paso 4 del orden de
// construcción, docs/especificaciones-tecnicas.md sección 4). El servidor es la única
// autoridad: decide cuándo aparece la leña, valida los taps y escribe FireHealth.
//
// APIs verificadas contra node_modules/@dcl/sdk (build @auth-server), no asumidas de la doc:
//   - isServer() / syncEntity → @dcl/sdk/network
//   - room.send/onMessage → @dcl/sdk/network (registerMessages en shared/messages.ts)
//   - FireHealth sincronizado → shared/fire.ts
//
// Requisito duro de descalificación: funciona SIN host. El ciclo de rondas corre solo
// mientras el servidor esté vivo; la plataforma lo duerme ~2 min tras irse el último jugador.

import { engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/players'
import { FireHealth, ensureFireEntity } from '../shared/fire'
import { room } from '../shared/messages'
import { awardBrasasToParticipants, registerReferral } from './brasas'
import {
  FOGATA_CENTER_X,
  FOGATA_CENTER_Z,
  FIRE_START_HEALTH,
  FIRE_MAX_HEALTH,
  HEALTH_DECAY_PER_SECOND,
  FEED_HEALTH_GAIN,
  MISS_HEALTH_PENALTY,
  ROUND_DURATION_SECONDS,
  ROUND_INTERMISSION_SECONDS,
  ROUND_SUCCESS_HEALTH_THRESHOLD,
  SERVER_TICK_SECONDS,
  WOOD_SPAWN_MIN_SECONDS,
  WOOD_SPAWN_MAX_SECONDS,
  WOOD_SPAWN_RADIUS,
  FEED_WINDOW_SECONDS,
  FEED_PROXIMITY_METERS,
  WOOD_Y
} from '../shared/constants'

type Phase = 'intermission' | 'round'
type PendingWood = { remaining: number; fed: boolean; x: number; z: number }

// Estado autoritativo del servidor. Vive sólo en memoria del Multiplayer Server (< 256MB).
const state = {
  phase: 'intermission' as Phase,
  phaseTimer: ROUND_INTERMISSION_SECONDS, // segundos restantes de la fase actual
  health: 0, // fracción real 0-100; se escribe a FireHealth (Int) sólo al cambiar el entero
  spawnTimer: 0, // segundos para la próxima leña
  nextWoodId: 1,
  wood: new Map<number, PendingWood>(),
  participants: new Set<string>(), // addresses que alimentaron el fuego en la ronda actual
  tickAccum: 0 // acumulador para recalcular a SERVER_TICK, nunca por frame
}

export function main() {
  const center = Vector3.create(FOGATA_CENTER_X, 0, FOGATA_CENTER_Z)
  ensureFireEntity(center)

  // El cliente sólo puede pedir "alimenté esta leña"; el servidor valida y decide.
  // context.from = address del emisor (verificado por el servidor, no dato del cliente).
  room.onMessage('feedFire', (data, context) => onFeedFire(data.woodId, context?.from))

  // Invitación: el nuevo jugador (context.from) declara quién lo invitó. El servidor valida.
  room.onMessage('registerReferral', (data, context) => {
    if (context?.from) void registerReferral(context.from, data.referredBy)
  })

  engine.addSystem(serverTick)
}

function serverTick(dt: number) {
  state.tickAccum += dt
  if (state.tickAccum < SERVER_TICK_SECONDS) return
  const step = state.tickAccum
  state.tickAccum = 0

  if (state.phase === 'intermission') {
    tickIntermission(step)
  } else {
    tickRound(step)
  }
}

function tickIntermission(dt: number) {
  state.phaseTimer -= dt
  if (state.phaseTimer <= 0) startRound()
}

function startRound() {
  state.phase = 'round'
  state.phaseTimer = ROUND_DURATION_SECONDS
  state.health = FIRE_START_HEALTH
  state.spawnTimer = randomSpawnDelay()
  state.wood.clear()
  state.participants.clear()

  writeFireHealth(true)
  room.send('roundStarted', { durationSeconds: ROUND_DURATION_SECONDS, startHealth: FIRE_START_HEALTH })
}

function tickRound(dt: number) {
  // 1. El fuego se apaga solo con el tiempo.
  state.health = clampHealth(state.health - HEALTH_DECAY_PER_SECOND * dt)

  // 2. Aparición de leña (el servidor decide, no un cliente "host").
  state.spawnTimer -= dt
  if (state.spawnTimer <= 0) {
    spawnWood()
    state.spawnTimer = randomSpawnDelay()
  }

  // 3. Expirar la leña no alimentada a tiempo → penalización.
  for (const [id, w] of state.wood) {
    if (w.fed) continue
    w.remaining -= dt
    if (w.remaining <= 0) {
      state.health = clampHealth(state.health - MISS_HEALTH_PENALTY)
      room.send('woodResolved', { id, fed: false })
      state.wood.delete(id)
    }
  }

  writeFireHealth(true)

  // 4. Cierre de ronda.
  state.phaseTimer -= dt
  if (state.phaseTimer <= 0) endRound()
}

function spawnWood() {
  const id = state.nextWoodId++
  const angle = Math.random() * Math.PI * 2
  const x = FOGATA_CENTER_X + Math.cos(angle) * WOOD_SPAWN_RADIUS
  const z = FOGATA_CENTER_Z + Math.sin(angle) * WOOD_SPAWN_RADIUS

  state.wood.set(id, { remaining: FEED_WINDOW_SECONDS, fed: false, x, z })
  room.send('woodSpawned', { id, x, z, ttlSeconds: FEED_WINDOW_SECONDS })
}

// Autoridad + validación server-side: sólo cuenta si la leña sigue viva y no fue alimentada.
// Un cliente no puede inventar salud ni reclamar una leña dos veces. TODO(anti-cheat extra):
// validar proximidad del jugador vía PlayerIdentityData antes de aceptar (patrón de la doc).
function onFeedFire(woodId: number, from?: string) {
  if (state.phase !== 'round') return

  // Cuenta como participante a quien intenta alimentar durante la ronda (para el reparto
  // de brasas al cierre). El servidor conoce `from` de forma verificada.
  if (from) state.participants.add(from)

  const w = state.wood.get(woodId)
  if (!w || w.fed) return

  // Anti-cheat: rechazar si el jugador no está realmente cerca de esta leña. Sin posición
  // conocida (jugador recién desconectado, race de red) se rechaza por defecto — nunca se
  // acredita a ciegas.
  if (from && !isNearWood(from, w)) return

  w.fed = true
  state.health = clampHealth(state.health + FEED_HEALTH_GAIN)
  writeFireHealth(true)

  room.send('woodResolved', { id: woodId, fed: true })
  state.wood.delete(woodId)
}

function endRound() {
  const finalHealth = Math.round(state.health)
  const success = finalHealth >= ROUND_SUCCESS_HEALTH_THRESHOLD

  room.send('roundEnded', { success, finalHealth })

  // Otorga brasas a los participantes y persiste balances + leaderboard (fire-and-forget:
  // la cadena async no debe bloquear el tick; el módulo maneja sus propios errores).
  void awardBrasasToParticipants([...state.participants], success, finalHealth)

  state.phase = 'intermission'
  state.phaseTimer = ROUND_INTERMISSION_SECONDS
  state.health = 0
  state.wood.clear()
  writeFireHealth(false)
}

// Escribe FireHealth (Int, sincronizado) sólo cuando cambia el valor entero o la fase,
// nunca en cada frame — respeta el límite de mensajería del Multiplayer Server.
function writeFireHealth(roundActive: boolean) {
  const rounded = Math.round(state.health)
  const fire = engine.getEntitiesWith(FireHealth)
  for (const [entity, current] of fire) {
    if (current.value === rounded && current.roundActive === roundActive) continue
    const mutable = FireHealth.getMutable(entity)
    mutable.value = rounded
    mutable.roundActive = roundActive
  }
}

function clampHealth(v: number): number {
  return Math.max(0, Math.min(FIRE_MAX_HEALTH, v))
}

// Real proximity check instead of trusting the client's claim. `getPlayer` is the same
// engine-backed helper used client-side (src/server also has it available); if the position
// can't be resolved we fail closed (reject) rather than assume the player is present.
function isNearWood(address: string, wood: PendingWood): boolean {
  const player = getPlayer({ userId: address })
  const pos = player?.position
  if (!pos) return false
  const dx = pos.x - wood.x
  const dz = pos.z - wood.z
  return Math.sqrt(dx * dx + dz * dz) <= FEED_PROXIMITY_METERS
}

function randomSpawnDelay(): number {
  return WOOD_SPAWN_MIN_SECONDS + Math.random() * (WOOD_SPAWN_MAX_SECONDS - WOOD_SPAWN_MIN_SECONDS)
}

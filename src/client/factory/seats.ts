import { engine, Transform, MeshRenderer, MeshCollider, Material, InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { syncEntity } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/players'
import { movePlayerTo } from '~system/RestrictedActions'
import { N_ASIENTOS, SEAT_RADIUS, SEAT_HEIGHT, SEAT_SIT_OFFSET } from '../../shared/constants'
import { SeatState } from './components'

// Rango de enum ids reservado para asientos en syncEntity. Cada asiento usa
// SEAT_ENUM_BASE + índice, garantizando que la MISMA entidad de red se resuelva en
// todos los clientes (createSeats corre idéntico en cada cliente, mismo orden/enum id).
const SEAT_ENUM_BASE = 1000

/**
 * Crea N_ASIENTOS troncos en círculo alrededor del centro de la fogata.
 * El estado de ocupación se sincroniza serverless; la interacción (sentarse/
 * levantarse) es local por gesto del jugador (movePlayerTo requiere user gesture).
 */
export function createSeats(fogataCenter: Vector3) {
  for (let i = 0; i < N_ASIENTOS; i++) {
    const pos = seatPosition(fogataCenter, i)
    const seat = engine.addEntity()

    Transform.create(seat, {
      position: pos,
      scale: Vector3.create(0.6, SEAT_HEIGHT, 0.6),
      // Mira hacia el centro para que el tronco quede alineado con el círculo.
      rotation: Quaternion.fromLookAt(pos, fogataCenter)
    })
    MeshRenderer.setCylinder(seat)
    MeshCollider.setCylinder(seat)
    Material.setPbrMaterial(seat, SEAT_MATERIAL_FREE)

    SeatState.create(seat, { occupiedBy: '', seatIndex: i })
    // Solo se sincroniza el componente de estado; el Transform es fijo y no cambia.
    syncEntity(seat, [SeatState.componentId], SEAT_ENUM_BASE + i)

    registerSeatInteraction(seat, fogataCenter)
  }
}

// Posición de cada asiento sobre el círculo alrededor de la fogata.
function seatPosition(center: Vector3, index: number): Vector3 {
  const angle = (index / N_ASIENTOS) * Math.PI * 2
  return Vector3.create(
    center.x + Math.cos(angle) * SEAT_RADIUS,
    SEAT_HEIGHT / 2,
    center.z + Math.sin(angle) * SEAT_RADIUS
  )
}

function registerSeatInteraction(seat: ReturnType<typeof engine.addEntity>, fogataCenter: Vector3) {
  pointerEventsSystem.onPointerDown(
    { entity: seat, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Sentarse junto al fuego' } },
    () => {
      const me = getPlayer()
      if (!me) return

      const state = SeatState.getMutable(seat)

      // Asiento propio → levantarse.
      if (state.occupiedBy === me.userId) {
        state.occupiedBy = ''
        return
      }

      // Ocupado por otro → sin acción (feedback sutil ya lo da el hoverText/tono del asiento).
      if (state.occupiedBy !== '') return

      // Libre → liberar cualquier otro asiento que yo ocupara y sentarme aquí.
      releaseMySeats(me.userId, seat)
      state.occupiedBy = me.userId
      sitPlayerOnSeat(seat, fogataCenter)
    }
  )
}

// Un jugador solo puede ocupar un asiento: al sentarse, libera los demás que tuviera.
function releaseMySeats(userId: string, except: ReturnType<typeof engine.addEntity>) {
  for (const [entity] of engine.getEntitiesWith(SeatState)) {
    if (entity === except) continue
    const s = SeatState.getMutable(entity)
    if (s.occupiedBy === userId) s.occupiedBy = ''
  }
}

// Ancla al avatar sobre el asiento mirando la fogata. TODO(paso posterior): reemplazar
// el teletransporte por un emote de "sentado" propio (triggerSceneEmote con .emote) cuando
// exista el asset — hoy no hay un emote predefinido de sentarse fiable en todos los clientes.
function sitPlayerOnSeat(seat: ReturnType<typeof engine.addEntity>, fogataCenter: Vector3) {
  const { position } = Transform.get(seat)
  // Ligero acercamiento al centro para que el avatar quede "sobre" el tronco, no a un lado.
  const toCenter = Vector3.normalize(Vector3.subtract(fogataCenter, position))
  const target = Vector3.create(
    position.x + toCenter.x * SEAT_SIT_OFFSET,
    position.y + SEAT_HEIGHT / 2,
    position.z + toCenter.z * SEAT_SIT_OFFSET
  )
  void movePlayerTo({ newRelativePosition: target, cameraTarget: fogataCenter, avatarTarget: fogataCenter })
}

// Materiales compartidos (no crear uno nuevo por asiento).
const SEAT_MATERIAL_FREE = {
  albedoColor: { r: 0.35, g: 0.22, b: 0.12, a: 1 },
  emissiveColor: { r: 0, g: 0, b: 0 },
  emissiveIntensity: 0
}

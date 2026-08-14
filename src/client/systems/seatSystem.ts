import { engine, Material } from '@dcl/sdk/ecs'
import { SeatState } from '../factory/components'

// Última ocupación conocida por asiento, para escribir material solo cuando cambia
// (nunca cada frame — ver límites en docs/especificaciones-tecnicas.md sección 1).
const lastOccupied = new Map<number, boolean>()

// Refleja visualmente la ocupación: un asiento ocupado toma un tono cálido con brillo,
// para que TODOS los clientes vean quién está sentado, no solo el propio jugador.
export function seatSystem() {
  for (const [seat] of engine.getEntitiesWith(SeatState)) {
    const state = SeatState.get(seat)
    const occupied = state.occupiedBy !== ''
    if (lastOccupied.get(seat) === occupied) continue
    lastOccupied.set(seat, occupied)

    Material.setPbrMaterial(seat, occupied ? SEAT_MATERIAL_OCCUPIED : SEAT_MATERIAL_FREE)
  }
}

const SEAT_MATERIAL_FREE = {
  albedoColor: { r: 0.35, g: 0.22, b: 0.12, a: 1 },
  emissiveColor: { r: 0, g: 0, b: 0 },
  emissiveIntensity: 0
}

const SEAT_MATERIAL_OCCUPIED = {
  albedoColor: { r: 0.55, g: 0.3, b: 0.12, a: 1 },
  emissiveColor: { r: 1, g: 0.5, b: 0.15 },
  emissiveIntensity: 0.6
}

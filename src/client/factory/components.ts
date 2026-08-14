import { engine, Schemas } from '@dcl/sdk/ecs'

// Marca la entidad de la fogata para que el sistema la encuentre sin acoplarse al ID.
export const FogataMarker = engine.defineComponent('fogata-marker', {})

// Estado de cada asiento. Se sincroniza serverless vía syncEntity (ver
// docs/especificaciones-tecnicas.md sección 3): riesgo de cheating nulo, no vale la
// pena subirlo al Multiplayer Server. `occupiedBy` guarda el userId del ocupante,
// cadena vacía = libre. `seatIndex` permite reconstruir posición/orden en cualquier cliente.
export const SeatState = engine.defineComponent('refugio::seat-state', {
  occupiedBy: Schemas.String,
  seatIndex: Schemas.Int
})

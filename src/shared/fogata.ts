import {
  FOGATA_BASE_INTENSITY,
  FOGATA_INCREMENT_PER_PLAYER,
  FOGATA_MAX_INTENSITY,
  FOGATA_MIN_INTENSITY
} from './constants'

// Pura, sin dependencias de ECS — testeable y reusable desde cualquier sistema.
export function calculateFogataIntensity(playersPresentes: number): number {
  const raw = FOGATA_BASE_INTENSITY + playersPresentes * FOGATA_INCREMENT_PER_PLAYER
  return Math.min(FOGATA_MAX_INTENSITY, Math.max(FOGATA_MIN_INTENSITY, raw))
}

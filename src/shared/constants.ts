// Centro de la fogata en la parcela (compartido por cliente y servidor — deben coincidir)
export const FOGATA_CENTER_X = 8
export const FOGATA_CENTER_Z = 8

// Fogata — ver docs/especificaciones-tecnicas.md sección 2
export const FOGATA_BASE_INTENSITY = 0.3
export const FOGATA_INCREMENT_PER_PLAYER = 0.08
export const FOGATA_MIN_INTENSITY = 0.3
export const FOGATA_MAX_INTENSITY = 1.5
export const FOGATA_RECALC_INTERVAL_SECONDS = 1.5

// Asientos — docs/especificaciones-tecnicas.md sección 3
export const N_ASIENTOS = 8
export const SEAT_RADIUS = 2.6 // distancia de cada asiento al centro de la fogata
export const SEAT_HEIGHT = 0.45 // altura del cojín/tronco placeholder
export const SEAT_SIT_OFFSET = 0.1 // cuánto se acerca el avatar al centro al sentarse

// Minijuego "Guardianes del Fuego" — docs/especificaciones-tecnicas.md sección 4
export const ROUND_DURATION_SECONDS = 180
export const WOOD_SPAWN_MIN_SECONDS = 8
export const WOOD_SPAWN_MAX_SECONDS = 12
export const FEED_WINDOW_SECONDS = 3 // ventana (TTL de la leña) para alimentar a tiempo
export const ROUND_SUCCESS_HEALTH_THRESHOLD = 50

// Salud del fuego (0-100), sólo la escribe el servidor
export const FIRE_START_HEALTH = 70
export const FIRE_MAX_HEALTH = 100
export const HEALTH_DECAY_PER_SECOND = 2.5 // el fuego se apaga solo si nadie lo alimenta
export const FEED_HEALTH_GAIN = 12 // sube al alimentar leña a tiempo
export const MISS_HEALTH_PENALTY = 8 // baja si una leña expira sin alimentar
export const ROUND_INTERMISSION_SECONDS = 8 // pausa entre rondas
export const SERVER_TICK_SECONDS = 0.25 // el servidor recalcula 4x/s, nunca por frame

// Ubicación de la leña que aparece durante la ronda
export const WOOD_SPAWN_RADIUS = 1.9 // dentro del anillo de asientos, alcanzable
export const WOOD_Y = 0.6

// Brasas (moneda/progreso) — docs/especificaciones-tecnicas.md sección 5. Sólo el servidor
// otorga brasas y las persiste en Storage; nunca cero para no castigar la participación.
export const BRASAS_FULL_REWARD = 100 // ronda exitosa (salud final ≥ umbral)
export const BRASAS_REDUCED_REWARD = 30 // ronda fallida pero participó
export const LEADERBOARD_SIZE = 10 // top N en World Storage

// Invitación — docs/especificaciones-tecnicas.md sección 6. Bonus a AMBOS (invitado e
// invitador) cuando completan una ronda juntos, una sola vez (flag referralBonusClaimed).
export const REFERRAL_BONUS = 50
export const REFERRAL_URL_PARAM = 'ref' // ?ref=<wallet del invitador>

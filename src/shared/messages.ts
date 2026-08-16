import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

// Mensajería cliente↔servidor del minijuego (docs/especificaciones-tecnicas.md sección 4).
// registerMessages debe llamarse una sola vez antes de main(); este módulo lo importan
// ambas ramas (client/server) a través de src/index.ts, así que se registra una única vez.
export const RefugioMessages = {
  // Cliente → Servidor: "alimenté esta leña". El servidor valida y decide.
  feedFire: Schemas.Map({ woodId: Schemas.Int }),

  // Cliente → Servidor: "entré con ?ref=<wallet>". El servidor valida (no self-referral,
  // una sola vez) y guarda el vínculo; el bonus se paga al completar una ronda juntos.
  registerReferral: Schemas.Map({ referredBy: Schemas.String }),

  // Servidor → Clientes
  roundStarted: Schemas.Map({ durationSeconds: Schemas.Int, startHealth: Schemas.Int }),
  woodSpawned: Schemas.Map({
    id: Schemas.Int,
    x: Schemas.Float,
    z: Schemas.Float,
    ttlSeconds: Schemas.Float
  }),
  // `streak` = racha global actual de leña alimentada a tiempo sin ningún miss (de cualquier
  // jugador) — combo cooperativo, no individual: en un minijuego multijugador donde cualquiera
  // puede alimentar cualquier leña, no hay una forma limpia de atribuir un "miss" a un jugador
  // específico, así que la racha refleja el ritmo colectivo del grupo.
  woodResolved: Schemas.Map({ id: Schemas.Int, fed: Schemas.Boolean, streak: Schemas.Int }),
  roundEnded: Schemas.Map({ success: Schemas.Boolean, finalHealth: Schemas.Int, bestStreak: Schemas.Int }),

  // Servidor → jugador participante (dirigido con {to:[address]}): su nuevo balance de
  // brasas tras cerrar la ronda. `earned` = brasas ganadas en esta ronda.
  brasasAwarded: Schemas.Map({ balance: Schemas.Int, earned: Schemas.Int }),

  // Servidor → Clientes (broadcast): top del leaderboard para mostrarlo in-world.
  // Sin address (privacidad en UI), sólo nombre visible y brasas.
  leaderboardUpdated: Schemas.Map({
    entries: Schemas.Array(
      Schemas.Map({ displayName: Schemas.String, brasas: Schemas.Int, gamesPlayed: Schemas.Int })
    )
  })
}

// Room tipado, único para toda la escena. El servidor hace room.send(...) y escucha
// feedFire; los clientes hacen room.send('feedFire', ...) y escuchan el resto.
export const room = registerMessages(RefugioMessages)

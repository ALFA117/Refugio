# 🔥 REFUGIO — Especificaciones Técnicas de Sistemas (v2)
### Documento complementario al Master Prompt — infraestructura definida, cero ambigüedad

---

## 0. Actualización de contexto real (del listing oficial en DoraHacks)

| Dato | Valor confirmado |
|---|---|
| Prize pool | $8,000 en MANA — 5 lugares pagados (1º $3,000 / 2º $2,000 / 3º $1,500 / 4º $1,000 / 5º $500), no top 3 |
| Bonus extra | Primeros 50 submissions válidos → voucher $30 en Decentraland Merch Shop, sin importar el lugar |
| Top 10 | Posible featuring en DCL Mobile App Discover |
| Hackers registrados | 64 (más competitivo que el estimado anterior de 15 — sigue siendo un campo manejable) |
| Pre-registro | 2026/08/06 14:00 (ya pasó) |
| **Inicio de build phase** | **2026/08/14 14:00 (mañana)** |
| **Deadline** | ⚠️ **Conflicto real en el propio listing**: el resumen superior dice `2026/09/03 18:00`, el cronograma detallado dice `September 4, 2026`. Esto no es un error tuyo ni mío — está así en la página oficial. **Apunta internamente al 3 de septiembre, 18:00** y pregunta en el canal de Discord de Friendzone cuál es la hora/zona horaria exacta antes de la última semana. |
| Judging | 5–11 de septiembre |
| Anuncio de ganadores | 13 de septiembre |
| Equipos | Permitidos (no tienes que ir solo si consigues partner) |
| Requisito duro | Debe funcionar sin host/moderador/evento programado — un "venue vacío" o experiencia single-player sin componente social **descalifica** |

---

## 1. Infraestructura — decisión de arquitectura (resuelto)

**Hallazgo clave de la documentación oficial de SDK7:** Decentraland tiene su propio **Multiplayer Server** (antes llamado "Authoritative Server", mismo feature, solo cambió el nombre). Es un servidor headless que:

- Corre tu mismo código TypeScript del proyecto, con una rama de ejecución `isServer()` separada del cliente
- **Decentraland lo hostea y despliega automáticamente al publicar tu escena — cero costo, cero servidor propio que mantener, cero cuenta en Railway/Fly.io/Render**
- Incluye **Storage** nativo (key-value persistente) a nivel de mundo (leaderboard, estado del entorno) y a nivel de jugador (balance de brasas, progreso) — sobrevive reinicios y redeploys
- Incluye **EnvVar** para guardar secretos sin exponerlos al cliente
- Valida cambios de estado server-side (`validateBeforeChange`) — anti-cheat real, no de juguete
- Puede hacer `signedFetch` a APIs externas desde el servidor (hasta 32 concurrentes, 15s timeout) — esto importa para el punto de abajo

**Conclusión: no necesitas Node/Express ni Supabase para el backend del juego.** Todo lo que planeábamos resolver con un servidor propio (brasas, leaderboard, validación del minijuego, referidos) lo cubre esto nativamente, gratis, sin infraestructura que tú tengas que operar.

🟡 **Dónde SÍ entra tu stack de siempre (React/Node/Supabase) — opcional, no bloqueante:**
Si quieres un sitio web público de "Muro de Guardianes" (leaderboard visible fuera de Decentraland, para compartir en redes o meter en el video de submission), eso sí necesita algo externo porque el Storage de DCL no es consultable públicamente desde afuera. Ahí sí tiene sentido:
- El Multiplayer Server de DCL hace `signedFetch` periódico (ej. cada vez que se cierra una ronda) empujando un snapshot del leaderboard a una tabla de Supabase (free tier)
- Un sitio Next.js (Vercel free tier) lee esa tabla y muestra el leaderboard públicamente

Esto es 100% opcional — súmalo solo si te sobra tiempo en semana 3, porque ayuda al criterio de "Retention and Discovery Value" (algo compartible fuera del propio mundo) pero no es requisito de submission.

**Límites técnicos del Multiplayer Server que hay que respetar desde el diseño** (para que Claude Code no genere algo que truene en producción):
- 256 MB de memoria por instancia — nada de guardar históricos gigantes en memoria, solo estado activo
- 10s de CPU síncrono por turno, 60s por cadena async — nada de loops pesados sin trocear
- ~300 mensajes/segundo por jugador conectado — nunca mandar mensajes cada frame, usar throttling (ejemplo: cada 100ms o menos)
- El servidor se apaga ~2 min después de que se va el último jugador, y tarda ~15s en "despertar" en producción cuando llega el primero — el cliente debe mostrar un estado de "encendiendo la fogata..." mientras espera, no asumir que el servidor ya está listo

---

## 2. Sistema Fogata

Sin cambios respecto a la v1 — sigue sin necesitar servidor. Cada cliente calcula la intensidad localmente en base a jugadores conectados en la escena.

```
intensidad = clamp(BASE_INTENSITY + (jugadores_presentes * INCREMENTO), MIN, MAX)
```

Controla: escala del emisor de partículas, radio de luz puntual, velocidad de animación del shader de llama. Recalcula cada 1-2s, no cada frame.

---

## 3. Sistema de Asientos

Sin cambios de diseño — pero ahora la implementación es más simple de lo que pensábamos. Empieza con **serverless multiplayer** (`syncEntity` llamado desde cada cliente, sin servidor) porque la documentación confirma que es "trivial" subir esto al Multiplayer Server después si hace falta. Para asientos, el riesgo de "cheating" es básicamente nulo (nadie gana nada exploitando un asiento), así que no vale la pena la complejidad extra del servidor aquí.

- `N_ASIENTOS = 8`, entidad con `Transform` fijo + `PointerEvents` + componente `SeatState { occupiedBy: string | null }`
- Tap en vacío → ancla avatar + emote sentado. Tap en propio → se levanta. Tap en ocupado → feedback sutil, sin acción

---

## 4. Minijuego cooperativo: "Guardianes del Fuego" — ahora con arquitectura servidor real

Mismo diseño de reglas que v1, pero ahora especificado con el patrón oficial del Multiplayer Server:

**Reglas (sin cambios):**
1. Ronda de 3 minutos
2. Cada ~8-12s aparece un ícono de leña en un punto aleatorio del círculo
3. Cualquier jugador tap dentro de ~3s para "alimentar el fuego" — un solo tap, sin drag
4. Salud del fuego sube si se alimenta a tiempo, baja si no
5. ≥50% de salud al final → brasas completas para todos los que participaron; <50% → brasas reducidas (nunca cero)

**Implementación server-authoritative (esto es lo que cambia vs. v1):**

```typescript
// shared/schemas.ts — solo el servidor puede escribir esto
export const FireHealth = engine.defineComponent("FireHealth", {
  value: Schemas.Int,        // 0-100
  roundActive: Schemas.Boolean,
})

// shared/messages.ts
export const Messages = {
  feedFire: Schemas.Map({}),                                    // Cliente → Servidor
  woodSpawned: Schemas.Map({ x: Schemas.Float, z: Schemas.Float, id: Schemas.Int }), // Servidor → Clientes
  roundEnded: Schemas.Map({ success: Schemas.Boolean, finalHealth: Schemas.Int }),
}
```

- El **servidor** decide cuándo aparece cada ícono de leña (usa su propio timer, no depende de que un cliente "sea el host")
- Cuando un jugador hace tap, el cliente manda `feedFire` — el servidor valida timing y proximidad (`validateBeforeChange` + posición server-verificada vía `PlayerIdentityData`, igual que el ejemplo de anti-cheat de la doc oficial) antes de aceptar el cambio en `FireHealth`
- Al cerrar la ronda, el servidor calcula brasas y llama `Storage.player.set()` por cada jugador participante, más `Storage.set("leaderboard", ...)` para el ranking global
- Esto resuelve de raíz el problema de "¿quién es la autoridad si nadie tiene servidor propio?" — ya no es un tema

---

## 5. Sistema de Brasas — con Storage nativo (reemplaza la sección de backend de la v1)

**Modelo de datos (usando Storage, no una tabla SQL):**

```typescript
// Player Storage (por wallet, vía Storage.player)
{
  balance: number,
  referredBy: string | null,
  gamesPlayed: number,
  version: 1
}

// World Storage (compartido, vía Storage)
"leaderboard" → [{ address: string, displayName: string, brasas: number }, ...]  // top 10, ordenado
```

**Flujo de otorgamiento** (todo corre en `isServer()`):
1. Ronda de minijuego termina → servidor calcula brasas por jugador
2. `Storage.player.set(address, "brasas", ...)` — actualiza balance individual
3. Servidor recalcula top 10 y hace `Storage.set("leaderboard", JSON.stringify(top10))`
4. Sigue el patrón de "guardar en checkpoints, no en cada cambio" que recomienda la doc — nunca escribas a Storage en cada frame

**Anti-cheat real, no de juguete:** como el servidor es quien decide cuándo se otorgan brasas (nunca el cliente pidiendo "dame X brasas"), no necesitas inventar validación custom — el patrón `validateBeforeChange` + `AUTH_SERVER_PEER_ID` ya lo cubre. Esto es mejor que lo que te había propuesto en la v1 con un backend Node propio, y te cuesta menos tiempo de desarrollo.

---

## 6. Sistema de Invitación

Mismo flujo de v1 (link con `?ref=wallet`), pero el registro de referido ahora es un mensaje al Multiplayer Server en vez de un `POST` a un backend externo:

```typescript
Messages.registerReferral = Schemas.Map({ referredBy: Schemas.String })
Messages.referralBonus = Schemas.Map({ bonusAmount: Schemas.Int })
```

- Jugador nuevo entra con `?ref=X` en la URL → cliente lee el param, manda `registerReferral` al servidor
- Servidor guarda `referredBy` en `Storage.player` del nuevo jugador
- Cuando el referido y quien invitó completan una ronda del minijuego **juntos** (el servidor ya sabe quién participó en cada ronda, porque él arbitra el minijuego) → otorga bonus a ambos, una sola vez (marca un flag `referralBonusClaimed: true` en Storage para evitar loops)

---

## 7. Onboarding

Sin cambios respecto a v1 — 3 pantallas, tap para avanzar, botón "Saltar" siempre visible.

---

## 8. Orden de construcción recomendado

1. **Setup del proyecto** — Creator Hub, `npm install @dcl/sdk@auth-server` + `@dcl/js-runtime@auth-server`, estructura de carpetas `src/client` / `src/server` / `src/shared`
2. **Fogata** (sin servidor, valida performance y assets temprano)
3. **Asientos** (serverless `syncEntity`, primer test de sync entre 2 ventanas de preview)
4. **Minijuego + FireHealth server-authoritative** (aquí vive el "Social Value" del judging — prioridad más alta que brasas)
5. **Brasas + Storage** (depende de que el minijuego ya otorgue resultados)
6. **Invitación** (depende de que brasas/Storage ya funcione)
7. **Onboarding** (al final, cuando ya sabes exactamente qué explicar)
8. 🟡 **Opcional, solo si sobra tiempo:** sitio companion en Next.js + Supabase mostrando el leaderboard fuera de Decentraland

---

## 9. Preguntas abiertas — ya reducidas

1. ¿Confirmaste ya en el Discord de Friendzone cuál de las dos fechas (3 o 4 sept) es la real?
2. ¿Vas a ir solo o vas a buscar partner? (los equipos están permitidos según las bases)
3. ¿Quieres que directamente arranque el scaffold del proyecto (Creator Hub + estructura server/client/shared + Sistema Fogata en código), o prefieres revisar este doc primero?

---

*Complementa a `Refugio — Master Prompt & Project Bible`. Reemplaza por completo la sección de backend de la v1 — ya no aplica Node/Express/Railway como arquitectura núcleo, solo como stretch goal opcional para un sitio companion.*

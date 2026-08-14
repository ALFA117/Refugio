# 🔥 REFUGIO — Master Prompt & Project Bible

### Documento madre del proyecto. Toda decisión de diseño, negocio o arquitectura vive aquí o en un doc que este referencia.

---

## 0. Qué es Refugio

Refugio es una experiencia social multiplayer para **Decentraland (SDK7)**, construida para el hackathon de Friendzone en DoraHacks. El concepto: un campamento/fogata donde los jugadores se reúnen, se sientan alrededor del fuego, y cooperan en un minijuego para mantenerlo encendido. La fogata crece con la cantidad de jugadores presentes — la escena literalmente responde a la presencia social, que es el criterio central de judging.

**Requisito duro que gobierna todo el diseño:** la experiencia debe funcionar sin host, sin moderador y sin evento programado. Un "venue vacío" o algo que dependa de que alguien organice el momento social **descalifica**. Todo el sistema (fogata, asientos, minijuego, brasas, invitación) está diseñado para que la interacción emerja orgánicamente de quien sea que entre a la escena, sin coordinación previa.

---

## 1. Contexto del hackathon

| Dato | Valor |
|---|---|
| Prize pool | $8,000 MANA — 5 lugares pagados (1º $3,000 / 2º $2,000 / 3º $1,500 / 4º $1,000 / 5º $500) |
| Bonus | Primeros 50 submissions válidos → voucher $30 Decentraland Merch Shop, sin importar lugar |
| Top 10 | Posible featuring en DCL Mobile App Discover |
| Hackers registrados | 64 |
| Inicio de build phase | 2026/08/14 14:00 |
| Deadline | ⚠️ Conflicto en el listing oficial: resumen dice `2026/09/03 18:00`, cronograma detallado dice `September 4, 2026`. Trabajar internamente contra **3 de septiembre 18:00** y confirmar en Discord de Friendzone antes de la última semana |
| Judging | 5–11 de septiembre |
| Anuncio de ganadores | 13 de septiembre |
| Equipos | Permitidos |
| Descalificación | Experiencia single-player o que dependa de evento programado/host |

Detalle completo de infraestructura y decisiones técnicas: [`especificaciones-tecnicas.md`](./especificaciones-tecnicas.md).

---

## 2. Decisión de arquitectura (resumen)

Decentraland provee un **Multiplayer Server** (Authoritative Server) hosteado automáticamente al publicar la escena — sin costo, sin infraestructura propia. Cubre:

- Storage nativo (por jugador y por mundo) para brasas y leaderboard, persistente entre redeploys
- Validación server-side de cambios de estado (anti-cheat real)
- EnvVar para secretos

**No se necesita Node/Express/Supabase para el backend del juego.** El stack tradicional (React/Node/Supabase) queda como *stretch goal opcional* únicamente para un sitio companion (leaderboard público fuera de Decentraland) — no bloqueante, no requerido para submission.

Límites técnicos a respetar desde el diseño: 256MB RAM por instancia, 10s CPU síncrono / 60s por cadena async, ~300 msg/s por jugador (usar throttling), y ~15s de "despertar" del servidor tras el primer jugador (mostrar estado de carga, nunca asumir servidor listo).

---

## 3. Sistemas del producto

| Sistema | Resumen | Requiere servidor |
|---|---|---|
| **Fogata** | Intensidad visual escala con jugadores presentes, calculado localmente por cada cliente | No |
| **Asientos** | 8 asientos, tap para sentarse/levantarse, sync entre clientes | No (`syncEntity`) |
| **Minijuego "Guardianes del Fuego"** | Ronda cooperativa de 3 min, alimentar el fuego a tiempo, ≥50% salud final = brasas completas | Sí (server-authoritative) |
| **Brasas** | Moneda/progreso del jugador, otorgada al cierre de cada ronda, guardada en Storage | Sí |
| **Invitación** | Link con `?ref=wallet`, bonus a ambos jugadores al completar una ronda juntos | Sí |
| **Onboarding** | 3 pantallas, tap para avanzar, "Saltar" siempre visible | No |

Especificación técnica completa (schemas, mensajes, flujos) de cada sistema: ver [`especificaciones-tecnicas.md`](./especificaciones-tecnicas.md) secciones 2–7.

---

## 4. Orden de construcción

1. Setup del proyecto (Creator Hub, `@dcl/sdk@auth-server`, estructura `src/client` / `src/server` / `src/shared`)
2. Fogata (sin servidor — valida performance y assets temprano)
3. Asientos (serverless `syncEntity` — primer test de sync entre 2 ventanas de preview)
4. Minijuego + FireHealth server-authoritative (mayor peso en "Social Value" del judging)
5. Brasas + Storage (depende del minijuego)
6. Invitación (depende de brasas/Storage)
7. Onboarding (al final)
8. 🟡 Opcional si sobra tiempo: sitio companion Next.js + Supabase con leaderboard público

Checklist y cronograma día a día: [`gestion/checklist-submission.md`](./gestion/checklist-submission.md) y [`gestion/cronograma.md`](./gestion/cronograma.md).

---

## 5. Preguntas abiertas

Ver [`gestion/preguntas-pendientes.md`](./gestion/preguntas-pendientes.md) — incluye la fecha de deadline a confirmar en Discord y la decisión solo/equipo.

---

*Este documento es la fuente de verdad de alto nivel. Los detalles de implementación server-authoritative, schemas y límites técnicos viven en `especificaciones-tecnicas.md` y no se duplican aquí.*

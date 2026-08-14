# Cronograma — Refugio

Build phase: **2026-08-14** → deadline objetivo **2026-09-03 18:00** (confirmar vs. 4 sept, ver [preguntas-pendientes.md](./preguntas-pendientes.md)).

Basado en el orden de construcción del Master Prompt (sección 4).

## Semana 1 — 14 al 20 de agosto: Base técnica
- Setup Creator Hub, `@dcl/sdk@auth-server`, estructura `src/client` / `src/server` / `src/shared`
- Sistema Fogata (sin servidor)
- Sistema de Asientos (`syncEntity`, test con 2 ventanas de preview)
- Checkpoint fin de semana: escena publicable con fogata + asientos funcionando en preview multiplayer

## Semana 2 — 21 al 27 de agosto: Núcleo social (mayor peso en judging)
- Minijuego "Guardianes del Fuego" con FireHealth server-authoritative
- Validación anti-cheat (`validateBeforeChange`, timing/proximidad)
- Sistema de Brasas + Storage (depende del minijuego)
- Checkpoint fin de semana: ronda completa jugable de principio a fin con brasas otorgadas correctamente

## Semana 3 — 28 de agosto al 3 de septiembre: Cierre y submission
- Sistema de Invitación (`?ref=wallet`, bonus compartido)
- Onboarding (3 pantallas + Saltar)
- Testing con grupo real (mínimo 2-3 personas simultáneas, no solo preview local)
- 🟡 Si sobra tiempo: sitio companion Next.js + Supabase (leaderboard público)
- Grabación de video de submission
- Llenado de BUIDL page en DoraHacks
- Buffer de 1-2 días antes del deadline para imprevistos — **no dejar el submission para las últimas horas**

## Post-deadline
- 5–11 sept: judging
- 13 sept: anuncio de ganadores

---
*Actualizar este archivo si el alcance cambia — es el tracker vivo, no un plan fijo.*

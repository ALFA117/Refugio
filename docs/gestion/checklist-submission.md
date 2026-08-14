# Checklist de Submission — Refugio

## Producto
- [ ] Fogata: intensidad escala con jugadores presentes, recalculo cada 1-2s
- [ ] Asientos: 8 asientos, tap para sentar/levantar, sync entre clientes
- [ ] Minijuego cooperativo funcionando de punta a punta (spawn de leña, tap, salud del fuego, cierre de ronda)
- [ ] FireHealth y otorgamiento de brasas corren en el servidor (`isServer()`), no en el cliente
- [ ] Brasas persisten en Storage entre sesiones (probar: cerrar y volver a entrar)
- [ ] Leaderboard (top 10) se actualiza correctamente en World Storage
- [ ] Invitación: link `?ref=wallet` registra referido y otorga bonus compartido una sola vez
- [ ] Onboarding: 3 pantallas, botón Saltar visible siempre
- [x] Estado de "encendiendo la fogata..." mientras el Multiplayer Server despierta (~15s) — implementado (banner vía `room.onReady`); falta confirmar visualmente en explorador
- [ ] Probado con 3+ jugadores reales simultáneos, no solo 2 ventanas de preview

## Requisito de descalificación (crítico)
- [ ] La experiencia funciona sin host/moderador/evento programado — verificar entrando "en frío" sin nadie coordinando

## Técnico
- [ ] Escena publicada y accesible en Decentraland (URL de la parcela)
- [ ] Sin errores de consola en producción
- [ ] Throttling de mensajes respetado (no enviar cada frame)
- [ ] Memoria y CPU dentro de límites del Multiplayer Server (256MB / 10s sync / 60s async)

## Submission en DoraHacks
- [~] BUIDL page completa (descripción, tech stack, integración con Decentraland) — borrador listo en `docs/submission/buidl-page.md`, faltan 3 links + team
- [ ] Video de demo grabado (mostrar el componente social — jugadores reales interactuando, no solo un jugador solo) — guion listo en `docs/submission/video-guion.md`
- [~] Repo de GitHub público con README — README real escrito; falta crear el repo (aún no es repositorio git) y publicarlo
- [ ] Link a la escena publicada incluido en el submission
- [ ] Submission enviado con margen antes del deadline (no en las últimas horas)

## Post-submission
- [ ] Confirmar recepción del voucher $30 si aplica (primeros 50 submissions válidos)
- [ ] Revisar canal de Discord de Friendzone por updates de judging

---
*Cruzar con [cronograma.md](./cronograma.md) para fechas y con [preguntas-pendientes.md](./preguntas-pendientes.md) para bloqueos.*

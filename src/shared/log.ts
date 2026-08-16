// Logging estructurado del servidor — antes cada sitio usaba console.error/log con su propio
// formato de texto libre. Un prefijo + evento + campos consistentes hace que los logs del
// Multiplayer Server (sólo accesibles como texto plano, sin dashboard) sean grep-eables: buscar
// "round_end" o "anti_cheat_reject" encuentra todas las ocurrencias sin depender de que el
// mensaje humano-legible no haya cambiado de wording entre ediciones.
type Fields = Record<string, string | number | boolean | null | undefined>;

// Nivel en el propio texto, no vía console.warn — el `console` de la sandbox de la escena
// sólo expone `log`/`error` (verificado por el type checker, no asumido de la doc de Node).
function format(level: string, event: string, fields?: Fields): string {
  const parts = [`[refugio] ${level} ${event}`];
  if (fields) {
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) parts.push(`${k}=${v}`);
    }
  }
  return parts.join(' ');
}

export const log = {
  info(event: string, fields?: Fields): void {
    console.log(format('info', event, fields))
  },
  warn(event: string, fields?: Fields): void {
    console.log(format('warn', event, fields))
  },
  error(event: string, err: unknown, fields?: Fields): void {
    console.error(format('error', event, fields), err)
  }
}

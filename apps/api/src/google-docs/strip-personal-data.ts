// Enlaces de videollamada: Meet, Zoom y Teams.
const VIDEO_CALL_LINK = /(?:https?:\/\/)?(?:meet\.google\.com|[\w.-]*\bzoom\.us|teams\.microsoft\.com)\/\S*/i;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

// Etiquetas típicas de un encabezado de clase: lo que viene después suele ser
// una lista de nombres.
const PERSONAL_LABEL =
  /^\s*(?:participantes|asistentes|presentes|integrantes|estudiantes|alumn[oa]s?|compañer[oa]s?|profesor[ae]?s?|docente|invitad[oa]s?)\s*:/i;

/**
 * Quita del texto los datos personales que trae el encabezado de cada clase:
 * enlaces de videollamada, correos y listas de nombres con etiqueta.
 *
 * Trabaja por líneas y descarta la línea completa, porque en un diario de clase
 * estos datos viven en su propia línea y no incrustados en el material.
 *
 * ATENCIÓN: estas reglas son **provisionales**. Se escribieron sin haber visto
 * el documento real, así que hay que calibrarlas con el script
 * `docs:print` en cuanto haya credenciales. En particular, no hay forma fiable
 * de detectar un nombre suelto sin etiqueta que lo preceda.
 */
export function stripPersonalData(text: string): string {
  return text
    .split('\n')
    .filter(
      (line) =>
        !VIDEO_CALL_LINK.test(line) && !EMAIL.test(line) && !PERSONAL_LABEL.test(line),
    )
    .join('\n');
}

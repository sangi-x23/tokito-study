export interface ParseOptions {
  /** Pestañas que no son clases (temario, notas…) y no se devuelven. */
  readonly skipTabIds?: readonly string[];
  /** Términos a descartar que ninguna regla detecta (ver `withPersonalTerms`). */
  readonly personalTerms?: readonly string[];
}

/** Nombres de personas reales sacados del propio documento. */
export interface PersonalNames {
  readonly latin: readonly string[];
  readonly katakana: readonly string[];
  /**
   * Términos que ninguna regla detecta (un diminutivo, el negocio de alguien),
   * configurados a mano. Se buscan como texto literal, sin distinguir
   * mayúsculas.
   */
  readonly literal?: readonly string[];
}

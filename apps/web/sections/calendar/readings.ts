/**
 * Clase de toda lectura que `ReadingsToggle` puede ocultar. Vive fuera del
 * componente porque una constante exportada desde un archivo `'use client'`
 * llega a los Server Components como referencia, no como string.
 */
export const READING_CLASS = 'group-data-[readings=off]/readings:invisible';

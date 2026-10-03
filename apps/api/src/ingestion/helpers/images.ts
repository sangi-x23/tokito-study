import sharp from 'sharp';

export interface DownloadedImage {
  readonly data: Buffer;
  readonly mimeType: string;
}

/** La `contentUri` del documento es temporal y no necesita credenciales. */
export async function downloadImage(contentUri: string): Promise<DownloadedImage> {
  const response = await fetch(contentUri);
  if (!response.ok) {
    throw new Error(`No se pudo descargar una imagen del documento: HTTP ${response.status}`);
  }

  return {
    data: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream',
  };
}

// Suficiente para leer el texto de una captura o una tabla, y mucho más
// liviano que el original para los límites de tokens del nivel gratuito.
const MAX_WIDTH = 1024;

/**
 * Reduce la imagen antes de mandarla al LLM. JPEG de calidad alta conserva
 * legible el texto pequeño y pesa bastante menos que un PNG.
 */
export async function shrinkForLlm(data: Buffer): Promise<DownloadedImage> {
  const output = await sharp(data)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 85 })
    .toBuffer();

  return { data: output, mimeType: 'image/jpeg' };
}

import { google, type docs_v1 } from 'googleapis';
import { loadGoogleEnv } from './google-docs.env';

/**
 * Cliente de la API de Google Docs autenticado con el refresh token del autor.
 *
 * El scope es `documents.readonly` y se fija al emitir el refresh token, no
 * aquí: esta app nunca escribe en el documento.
 */
export function createDocsClient(): docs_v1.Docs {
  const env = loadGoogleEnv();

  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  });

  // La librería canjea el refresh token por un access token cuando hace falta
  // y lo renueva sola al expirar.
  auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });

  return google.docs({ version: 'v1', auth });
}

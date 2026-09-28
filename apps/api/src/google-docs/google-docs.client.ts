import { google, type docs_v1 } from 'googleapis';
import { loadGoogleEnv } from './google-docs.env';

/** Solo lectura: esta app nunca escribe en el documento. */
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

/**
 * Cliente de la API de Google Docs autenticado con una cuenta de servicio.
 *
 * Se usa cuenta de servicio y no OAuth de usuario porque el documento del curso
 * es accesible por enlace: la app no necesita actuar en nombre de nadie. Además
 * su credencial no caduca, mientras que un refresh token de una app en estado
 * "Testing" muere a los 7 días y dejaría el cron semanal sin token.
 */
export function createDocsClient(): docs_v1.Docs {
  const env = loadGoogleEnv();

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_KEY.client_email,
    key: env.GOOGLE_SERVICE_ACCOUNT_KEY.private_key,
    scopes: SCOPES,
  });

  return google.docs({ version: 'v1', auth });
}

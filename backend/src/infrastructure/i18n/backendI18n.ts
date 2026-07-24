export type SupportedLocale = 'es' | 'en';

export interface BackendMessages {
  readonly invalidGithubUser: string;
  readonly tokenNotProvided: string;
  readonly consentRequired: string;
  readonly tokenRegisterError: string;
  readonly tokenRevokeError: string;
  readonly tokenIdentityRequired: string;
  readonly purgeTokenRequired: string;
  readonly purgeDataError: string;
  readonly tokenExpiredOrInvalid: string;
  readonly accessDenied: (tokenOwner: string, target: string) => string;
  readonly purgeSuccess: string;
  readonly metricsDisabled: string;
  readonly metricsUnauthorized: string;
  readonly metricsHistoryError: string;
  readonly userMetricsError: string;
  readonly userCountError: string;
}

const messages: Record<SupportedLocale, BackendMessages> = {
  es: {
    invalidGithubUser: 'Usuario de GitHub inválido.',
    tokenNotProvided: 'Token de GitHub no proporcionado.',
    consentRequired: 'Debes aceptar los términos y condiciones de almacenamiento de datos.',
    tokenRegisterError: 'Error interno del servidor al registrar el token.',
    tokenRevokeError: 'Error interno del servidor al revocar el token.',
    tokenIdentityRequired: 'Se requiere proveer un token de GitHub válido para confirmar tu identidad.',
    purgeTokenRequired:
      'Se requiere proveer tu token de GitHub válido para confirmar y autorizar la purga de datos.',
    purgeDataError: 'Error interno del servidor al procesar la purga de datos.',
    tokenExpiredOrInvalid: 'El token de GitHub provisto no es válido o ha expirado.',
    accessDenied: (tokenOwner: string, target: string) =>
      `Acceso denegado. El token proporcionado pertenece al usuario '${tokenOwner}', pero estás intentando purgar los datos de '${target}'.`,
    purgeSuccess: 'Todos tus datos (token, historial, métricas de uso y logs) han sido eliminados de forma definitiva.',
    metricsDisabled: 'Las métricas no están configuradas o el acceso está deshabilitado.',
    metricsUnauthorized: 'Acceso no autorizado. Se requiere una clave de métrica válida.',
    metricsHistoryError: 'Error interno al obtener el historial de métricas.',
    userMetricsError: 'Error interno al obtener las métricas de usuarios.',
    userCountError: 'Error interno al obtener el conteo de usuarios.',
  },
  en: {
    invalidGithubUser: 'Invalid GitHub username.',
    tokenNotProvided: 'GitHub token not provided.',
    consentRequired: 'You must accept the data storage terms and conditions.',
    tokenRegisterError: 'Internal server error while registering the token.',
    tokenRevokeError: 'Internal server error while revoking the token.',
    tokenIdentityRequired: 'A valid GitHub token is required to confirm your identity.',
    purgeTokenRequired: 'A valid GitHub token is required to confirm and authorize the data purge.',
    purgeDataError: 'Internal server error while processing the data purge.',
    tokenExpiredOrInvalid: 'The provided GitHub token is invalid or has expired.',
    accessDenied: (tokenOwner: string, target: string) =>
      `Access denied. The provided token belongs to user '${tokenOwner}', but you are trying to purge data for '${target}'.`,
    purgeSuccess: 'All your data (token, history, usage metrics, and logs) have been permanently deleted.',
    metricsDisabled: 'Metrics are not configured or access is disabled.',
    metricsUnauthorized: 'Unauthorized access. A valid metrics key is required.',
    metricsHistoryError: 'Internal error while fetching metrics history.',
    userMetricsError: 'Internal error while fetching user metrics.',
    userCountError: 'Internal error while fetching user count.',
  },
};

/**
 * Resolves the supported locale from a raw locale string.
 * Falls back to 'es' if not recognized.
 */
export function resolveLocale(raw?: string): SupportedLocale {
  const normalized = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  if (normalized === 'en') return 'en';
  return 'es';
}

/**
 * Returns the i18n message object for the given locale.
 */
export function getMessages(locale: SupportedLocale): BackendMessages {
  return messages[locale];
}

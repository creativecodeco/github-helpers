export type SupportedLocale = 'es' | 'en';

export const TRANSLATIONS = {
  es: {
    // Configuration panel
    settings_title: "Configuración",
    username_label: "Usuario de GitHub",
    username_placeholder: "ej. github",
    repo_label: "Repositorio Específico (Opcional)",
    repo_placeholder: "ej. github-helpers (o el más popular)",
    btn_generate: "Generar Tarjetas",
    theme_label: "Selecciona un Estilo",
    card_width_label: "Ancho de Tarjeta",
    width_standard: "Estándar (495px)",
    width_full: "Ancho Completo (100%)",
    custom_width_placeholder: "Personalizado, ej: 600",
    btn_apply: "Aplicar",
    locale_label: "Idioma de Tarjetas",
    locale_es: "Español (es)",
    locale_en: "English (en)",
    preview_title: "Vista Previa",
    header_subtitle: "Potencia la visibilidad de tus proyectos. Genera métricas y tarjetas estéticas en caliente para tu README.md.",
    header_metrics_label: "Usuarios usando las cards: ",

    // Sample README elements
    sample_readme_title: "README.md de Ejemplo",
    sample_readme_desc: "Plantilla completa lista para copiar e insertar en tu repositorio de perfil.",
    btn_copy_sample_readme: "Copiar README.md Completo",
    profile_help_link: "¿Cómo crear tu perfil en GitHub?",
    sample_readme_placeholder: "Genera tus tarjetas para ver el README.md de ejemplo...",
    readme_layout_label: "Diseño:",
    readme_layout_vertical: "Vertical",
    readme_layout_grid: "Tabla (2 Col)",
    tab_readme_code: "Código Markdown",
    tab_readme_preview: "Vista Previa Live",

    // Card titles & labels
    title_views: "Contador de Visitas del Perfil",
    code_label_views: "Contador de Visitas",
    title_stats: "Estadísticas Generales",
    code_label_stats: "Estadísticas Generales",
    title_languages: "Lenguajes más Usados",
    code_label_languages: "Lenguajes más Usados",
    title_streak: "Racha de Commits",
    code_label_streak: "Racha de Commits",
    title_trophies: "Trofeos de GitHub",
    code_label_trophies: "Trofeos de GitHub",
    title_top_repos: "Top Repositorios",
    code_label_top_repos: "Top Repositorios",
    title_rank: "Rango de Desarrollador",
    title_repo: "Repositorio Destacado",
    placeholder_msg: "Ingresa tu usuario de GitHub para cargar la vista previa",
    copy_btn: "Copiar",

    // Footer elements
    footer_rights: "Todos los derechos reservados.",
    footer_help: "Ayuda",
    footer_privacy: "Privacidad",

    // Private stats elements
    private_stats_title: "Estadísticas Privadas",
    private_stats_desc: "Para incluir tus repositorios privados, registra un Personal Access Token (PAT). Tus datos se cifran en el servidor.",
    private_stats_guide: "Leer Guía de Ayuda →",
    private_stats_username: "Usuario de GitHub",
    private_stats_pat: "Personal Access Token (PAT)",
    private_stats_consent: "Acepto que esta aplicación guarde mi token cifrado en su base de datos para consultar mis estadísticas. Puedo revocarlo cuando quiera.",
    private_stats_register_btn: "Registrar Token",
    private_stats_active_label: "Token Registrado Activo",
    private_stats_active_desc: "Tus repositorios privados ya se están sumando en las consultas.",
    private_stats_revoke_label: "Introduce tu token para confirmar revocación",
    private_stats_revoke_btn: "Revocar Token",
    private_stats_purge_label: "¿Deseas eliminar todo tu registro de forma permanente?",
    private_stats_purge_open_btn: "Eliminar todos mis datos",

    // Purge modal elements
    purge_modal_title: "Eliminar todos mis datos",
    purge_modal_desc: "Esta acción es permanente e irreversible. Eliminará tu token cifrado, tu historial de estadísticas, tus métricas de consumo de cards y todos tus registros de logs del servidor.",
    purge_modal_confirm_label: "Escribe tu usuario de GitHub para confirmar",
    purge_modal_token_label: "Introduce tu Token de Acceso para autorizar",
    purge_modal_cancel_btn: "Cancelar",
    purge_modal_confirm_btn: "Eliminar todo definitivamente",

    // Dynamic Notifications & Toast Messages
    msg_network_error: "Error de red al intentar comunicarse con el servidor.",
    msg_copy_readme_success: "¡README.md de ejemplo copiado al portapapeles con éxito!",
    msg_copy_readme_error: "Error al copiar el README de ejemplo al portapapeles",
    msg_copy_code_success: "Código copiado al portapapeles con éxito",
    msg_copy_code_error: "Error al copiar al portapapeles",

    // Form Validation & Status Messages
    msg_enter_username: "Por favor, ingresa tu usuario de GitHub.",
    msg_enter_token: "Por favor, ingresa tu Personal Access Token (PAT).",
    msg_accept_consent: "Debes aceptar el almacenamiento cifrado de datos.",
    msg_register_token_error: "Error al registrar el token.",
    msg_no_registered_user: "No se reconoce ningún usuario registrado.",
    msg_token_required_revoke: "Debes ingresar un token de GitHub válido tuyo para verificar tu propiedad antes de revocar.",
    msg_revoke_token_error: "Error al revocar el token.",
    msg_purge_error: "Error al intentar purgar los datos.",
    // Live README HTML preview
    readme_preview_greeting: "¡Hola! Soy @{username} 👋",
    readme_preview_welcome: "Bienvenido/a a mi perfil de GitHub.",
    readme_preview_desc: "Bienvenido/a a mi perfil de GitHub. Aquí puedes ver algunas de mis estadísticas de GitHub en tiempo real:",
    readme_preview_section_title: "📊 Estadísticas de GitHub",
    readme_preview_footer: "⚡ Tarjetas de estadísticas de GitHub generadas en tiempo real"
  },
  en: {
    // Configuration panel
    settings_title: "Configuration",
    username_label: "GitHub Username",
    username_placeholder: "e.g. github",
    repo_label: "Specific Repository (Optional)",
    repo_placeholder: "e.g. github-helpers (or the most popular)",
    btn_generate: "Generate Cards",
    theme_label: "Select a Style",
    card_width_label: "Card Width",
    width_standard: "Standard (495px)",
    width_full: "Full Width (100%)",
    custom_width_placeholder: "Custom, e.g. 600",
    btn_apply: "Apply",
    locale_label: "Card Language",
    locale_es: "Spanish (es)",
    locale_en: "English (en)",
    preview_title: "Live Preview",
    header_subtitle: "Boost your project visibility. Generate aesthetic real-time metrics and cards for your README.md.",
    header_metrics_label: "Users active with cards: ",

    // Sample README elements
    sample_readme_title: "Sample README.md",
    sample_readme_desc: "Complete template ready to copy and paste into your GitHub profile repository.",
    btn_copy_sample_readme: "Copy Full README.md",
    profile_help_link: "How to create your GitHub profile?",
    sample_readme_placeholder: "Generate your cards to preview your custom sample README.md...",
    readme_layout_label: "Layout:",
    readme_layout_vertical: "Vertical",
    readme_layout_grid: "Table (2 Col)",
    tab_readme_code: "Markdown Code",
    tab_readme_preview: "Live Preview",

    // Card titles & labels
    title_views: "Profile Views Counter Badge",
    code_label_views: "Views Counter",
    title_stats: "General Statistics",
    code_label_stats: "General Statistics",
    title_languages: "Most Used Languages",
    code_label_languages: "Most Used Languages",
    title_streak: "Commit Streak",
    code_label_streak: "Commit Streak",
    title_trophies: "GitHub Trophies",
    code_label_trophies: "GitHub Trophies",
    title_top_repos: "Top Repositories",
    code_label_top_repos: "Top Repositories",
    title_rank: "Developer Rank",
    title_repo: "Featured Repository",
    placeholder_msg: "Enter your GitHub username to load the preview",
    copy_btn: "Copy",

    // Footer elements
    footer_rights: "All rights reserved.",
    footer_help: "Help",
    footer_privacy: "Privacy",

    // Private stats elements
    private_stats_title: "Private Statistics",
    private_stats_desc: "To include your private repositories, register a Personal Access Token (PAT). Your data is encrypted on the server.",
    private_stats_guide: "Read Help Guide →",
    private_stats_username: "GitHub Username",
    private_stats_pat: "Personal Access Token (PAT)",
    private_stats_consent: "I agree that this application saves my encrypted token in its database to query my statistics. I can revoke it at any time.",
    private_stats_register_btn: "Register Token",
    private_stats_active_label: "Active Registered Token",
    private_stats_active_desc: "Your private repositories are now included in the queries.",
    private_stats_revoke_label: "Enter your token to confirm revocation",
    private_stats_revoke_btn: "Revoke Token",
    private_stats_purge_label: "Do you want to delete your entire record permanently?",
    private_stats_purge_open_btn: "Delete all my data",

    // Purge modal elements
    purge_modal_title: "Delete all my data",
    purge_modal_desc: "This action is permanent and irreversible. It will delete your encrypted token, your statistics history, your card consumption metrics, and all your log records from the server.",
    purge_modal_confirm_label: "Type your GitHub username to confirm",
    purge_modal_token_label: "Enter your Access Token to authorize",
    purge_modal_cancel_btn: "Cancel",
    purge_modal_confirm_btn: "Permanently delete everything",

    // Dynamic Notifications & Toast Messages
    msg_network_error: "Network error trying to communicate with the server.",
    msg_copy_readme_success: "Sample README.md copied to clipboard successfully!",
    msg_copy_readme_error: "Failed to copy sample README to clipboard",
    msg_copy_code_success: "Code copied to clipboard successfully",
    msg_copy_code_error: "Failed to copy to clipboard",

    // Form Validation & Status Messages
    msg_enter_username: "Please enter your GitHub username.",
    msg_enter_token: "Please enter your Personal Access Token (PAT).",
    msg_accept_consent: "You must accept the encrypted data storage consent.",
    msg_register_token_error: "Error registering token.",
    msg_no_registered_user: "No registered user recognized.",
    msg_token_required_revoke: "You must enter a valid GitHub token of yours to verify ownership before revoking.",
    msg_revoke_token_error: "Error revoking token.",
    msg_purge_error: "Failed to purge data.",
    // Live README HTML preview
    readme_preview_greeting: "Hi there, I'm @{username} 👋",
    readme_preview_welcome: "Welcome to my GitHub profile!",
    readme_preview_desc: "Welcome to my GitHub profile! Here are some of my automated GitHub stats:",
    readme_preview_section_title: "📊 GitHub Stats",
    readme_preview_footer: "⚡ Real-time generated GitHub stats cards"
  }
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.es;

/**
 * Gets a localized translation string by key for the specified locale.
 * Supports string interpolation via `{paramName}`.
 */
export function t(
  key: TranslationKey,
  locale: string = 'es',
  params?: Record<string, string>
): string {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];
  let text: string = dict[key] || TRANSLATIONS.es[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal);
    });
  }

  return text;
}

/**
 * Updates DOM elements containing `[data-i18n]` and `[data-i18n-placeholder]`.
 */
export function updateDomTranslations(locale: string = 'es'): void {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];

  // 1. Text elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && key in dict) {
      el.textContent = dict[key as TranslationKey];
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && key in dict) {
      (el as HTMLInputElement).placeholder = dict[key as TranslationKey];
    }
  });
}

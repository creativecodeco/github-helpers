document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const usernameInput = document.getElementById('username-input');
  const repoInput = document.getElementById('repo-input');
  const btnGenerate = document.getElementById('btn-generate');
  const themesContainer = document.getElementById('themes-container');
  const themeOptions = document.querySelectorAll('.theme-option');

  const statsImg = document.getElementById('stats-img');
  const statsPlaceholder = document.getElementById('stats-placeholder');

  const languagesImg = document.getElementById('languages-img');
  const languagesPlaceholder = document.getElementById('languages-placeholder');

  const repoImg = document.getElementById('repo-img');
  const repoPlaceholder = document.getElementById('repo-placeholder');

  const rankImg = document.getElementById('rank-img');
  const rankPlaceholder = document.getElementById('rank-placeholder');

  const streakImg = document.getElementById('streak-img');
  const streakPlaceholder = document.getElementById('streak-placeholder');

  const trophiesImg = document.getElementById('trophies-img');
  const trophiesPlaceholder = document.getElementById('trophies-placeholder');

  const viewsImg = document.getElementById('views-img');
  const viewsPlaceholder = document.getElementById('views-placeholder');

  const codeBlockWrappers = document.querySelectorAll('.code-block-wrapper');
  const markdownStatsCode = document.getElementById('markdown-stats-code');
  const markdownLanguagesCode = document.getElementById('markdown-languages-code');
  const markdownRepoCode = document.getElementById('markdown-repo-code');
  const markdownRankCode = document.getElementById('markdown-rank-code');
  const markdownStreakCode = document.getElementById('markdown-streak-code');
  const markdownTrophiesCode = document.getElementById('markdown-trophies-code');
  const markdownViewsCode = document.getElementById('markdown-views-code');

  const btnCopyStats = document.getElementById('btn-copy-stats');
  const btnCopyLanguages = document.getElementById('btn-copy-languages');
  const btnCopyRepo = document.getElementById('btn-copy-repo');
  const btnCopyRank = document.getElementById('btn-copy-rank');
  const btnCopyStreak = document.getElementById('btn-copy-streak');
  const btnCopyTrophies = document.getElementById('btn-copy-trophies');
  const btnCopyViews = document.getElementById('btn-copy-views');

  const viewsLabel = document.getElementById('views-label');
  const viewsColor = document.getElementById('views-color');
  const viewsStyle = document.getElementById('views-style');

  // Theme Toggle Elements
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  // Metrics Elements
  const metricsBadge = document.getElementById('metrics-badge');
  const metricsCount = document.getElementById('metrics-count');

  // Private Stats Elements
  const privateStatsBadge = document.getElementById('private-stats-badge');
  const tokenFormContainer = document.getElementById('token-form-container');

  // Global Loading Overlay
  const globalLoading = document.getElementById('global-loading');

  // Application State
  let currentTheme = 'dark';
  let currentUsername = '';
  let currentRepo = '';

  // --- SVG Themes Selector disabled state ---
  function updateThemeSelectorsState() {
    const hasUser = !!currentUsername;
    themeOptions.forEach((opt) => {
      opt.disabled = !hasUser;
    });
  }
  updateThemeSelectorsState();

  // --- Metrics Load Logic ---
  async function loadMetrics() {
    if (!metricsBadge || !metricsCount) return;

    // Show loading state
    metricsCount.textContent = 'Cargando...';
    metricsBadge.classList.remove('hidden');

    try {
      const response = await fetch('/api/metrics/users/count');
      if (response.ok) {
        const count = await response.json();
        metricsCount.textContent = Number(count).toLocaleString();
      } else {
        metricsBadge.classList.add('hidden');
      }
    } catch (err) {
      console.warn('Could not fetch usage metrics:', err);
      metricsBadge.classList.add('hidden');
    }
  }

  // Load initial metrics on start
  loadMetrics();


  // --- Theme Toggle Logic (Home Page Light/Dark Mode) ---
  const savedTheme = localStorage.getItem('site-theme') || 'dark';
  if (savedTheme === 'light') {
    enableLightMode();
  } else {
    enableDarkMode();
  }

  btnThemeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    if (isLight) {
      enableDarkMode();
    } else {
      enableLightMode();
    }
  });

  function enableLightMode() {
    document.body.classList.add('light-mode');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
    localStorage.setItem('site-theme', 'light');
  }

  function enableDarkMode() {
    document.body.classList.remove('light-mode');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
    localStorage.setItem('site-theme', 'dark');
  }

  // --- SVG Themes Selection logic ---
  themesContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.theme-option');
    if (!option) return;

    themeOptions.forEach((opt) => opt.classList.remove('active'));
    option.classList.add('active');

    currentTheme = option.dataset.theme;

    if (currentUsername) {
      updateCards();
    }
  });

  // Generate button handler
  btnGenerate.addEventListener('click', () => {
    submitUsername();
  });

  // Enter key support in inputs
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitUsername();
    }
  });

  repoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitUsername();
    }
  });

  function submitUsername() {
    const usernameVal = usernameInput.value.trim();
    if (!usernameVal) {
      usernameInput.focus();
      return;
    }

    currentUsername = usernameVal;
    currentRepo = repoInput.value.trim();
    updateThemeSelectorsState();
    updateCards();
  }

  let completedImagesCount = 0;
  const totalImagesToLoad = 7;

  function imageFinishedLoading() {
    completedImagesCount++;
    if (completedImagesCount >= totalImagesToLoad) {
      if (globalLoading) {
        globalLoading.classList.add('hidden');
      }
    }
  }

  // Update image previews and Markdown blocks
  function updateCards() {
    if (!currentUsername) return;

    completedImagesCount = 0;
    if (globalLoading) {
      globalLoading.classList.remove('hidden');
    }

    const origin = window.location.origin;
    const statsUrl = `${origin}/api/stats?username=${currentUsername}&theme=${currentTheme}`;
    const languagesUrl = `${origin}/api/languages?username=${currentUsername}&theme=${currentTheme}`;
    const rankUrl = `${origin}/api/rank?username=${currentUsername}&theme=${currentTheme}`;
    const streakUrl = `${origin}/api/streak?username=${currentUsername}&theme=${currentTheme}`;
    const trophiesUrl = `${origin}/api/trophies?username=${currentUsername}&theme=${currentTheme}`;

    let repoUrl = `${origin}/api/repo?username=${currentUsername}&theme=${currentTheme}`;
    if (currentRepo) {
      repoUrl += `&repo=${encodeURIComponent(currentRepo)}`;
    }

    const labelVal = viewsLabel ? viewsLabel.value.trim() : '';
    const colorVal = viewsColor ? viewsColor.value.trim() : '';
    const styleVal = viewsStyle ? viewsStyle.value : '';

    let viewsUrl = `${origin}/api/views?username=${currentUsername}&theme=${currentTheme}`;
    if (labelVal) viewsUrl += `&label=${encodeURIComponent(labelVal)}`;
    if (colorVal) viewsUrl += `&color=${encodeURIComponent(colorVal)}`;
    if (styleVal) viewsUrl += `&style=${encodeURIComponent(styleVal)}`;

    // 1. Show Loading State
    showImageLoading(statsImg, statsPlaceholder);
    showImageLoading(languagesImg, languagesPlaceholder);
    showImageLoading(repoImg, repoPlaceholder);
    showImageLoading(rankImg, rankPlaceholder);
    showImageLoading(streakImg, streakPlaceholder);
    showImageLoading(trophiesImg, trophiesPlaceholder);
    showImageLoading(viewsImg, viewsPlaceholder);

    // 2. Set image sources with cache buster to force rendering updates in preview
    const cacheBuster = `&t=${Date.now()}`;
    statsImg.src = statsUrl + cacheBuster;
    statsImg.alt = `Tarjeta de estadísticas generales de GitHub para el usuario @${currentUsername}`;
    languagesImg.src = languagesUrl + cacheBuster;
    languagesImg.alt = `Tarjeta de lenguajes más usados de GitHub para el usuario @${currentUsername}`;
    repoImg.src = repoUrl + cacheBuster;
    repoImg.alt = `Tarjeta de repositorio destacado de GitHub para el usuario @${currentUsername}${currentRepo ? ` (repo: ${currentRepo})` : ''}`;
    rankImg.src = rankUrl + cacheBuster;
    rankImg.alt = `Tarjeta de rango de GitHub para el usuario @${currentUsername}`;
    streakImg.src = streakUrl + cacheBuster;
    streakImg.alt = `Tarjeta de racha de commits de GitHub para el usuario @${currentUsername}`;
    trophiesImg.src = trophiesUrl + cacheBuster;
    trophiesImg.alt = `Tarjeta de trofeos de GitHub para el usuario @${currentUsername}`;
    viewsImg.src = viewsUrl + cacheBuster;
    viewsImg.alt = `Contador de visitas de GitHub para el usuario @${currentUsername}`;

    // 3. Update Markdown Codes
    const markdownStats = `![GitHub Stats](${statsUrl})`;
    const markdownLanguages = `![Lenguajes más usados](${languagesUrl})`;
    const markdownRepo = `![Repositorio Destacado](${repoUrl})`;
    const markdownRank = `![Rango de Desarrollador](${rankUrl})`;
    const markdownStreak = `![Racha de Contribuciones](${streakUrl})`;
    const markdownTrophies = `![Trofeos de GitHub](${trophiesUrl})`;
    const markdownViews = `![Visitas de Perfil](${viewsUrl})`;

    markdownStatsCode.textContent = markdownStats;
    markdownLanguagesCode.textContent = markdownLanguages;
    markdownRepoCode.textContent = markdownRepo;
    markdownRankCode.textContent = markdownRank;
    markdownStreakCode.textContent = markdownStreak;
    markdownTrophiesCode.textContent = markdownTrophies;
    markdownViewsCode.textContent = markdownViews;

    // Re-fetch metrics after a short delay to account for the new renders
    setTimeout(() => {
      loadMetrics();
    }, 1500);
  }

  // Manage image load cycles
  function showImageLoading(imgElement, placeholderElement) {
    imgElement.classList.add('hidden');
    placeholderElement.classList.remove('hidden');

    // Hide the code block wrapper for this card during loading
    const codeBlock = imgElement.closest('.card-preview-wrapper')?.querySelector('.code-block-wrapper');
    if (codeBlock) {
      codeBlock.classList.add('hidden');
    }

    // Set appropriate SVG loader depending on which card it is
    let svgIcon = '';
    if (placeholderElement.id === 'stats-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      `;
    } else if (placeholderElement.id === 'languages-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      `;
    } else if (placeholderElement.id === 'repo-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v3H6.5a1.5 1.5 0 0 0 0 3H20v2H6.5A2.5 2.5 0 0 1 4 22.5v-3z" />
          <path d="M6 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5V3A1 1 0 0 1 5 2h1z" />
        </svg>
      `;
    } else if (placeholderElement.id === 'trophies-placeholder') {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
        </svg>
      `;
    } else {
      svgIcon = `
        <svg class="placeholder-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      `;
    }

    placeholderElement.querySelector('.pulse-icon').innerHTML = svgIcon;
    placeholderElement.querySelector('p').textContent = 'Consultando datos en GitHub...';
  }

  // Setup Image Load Listeners Helper
  function setupImageEvents(imgElement, placeholderElement, errorText) {
    imgElement.addEventListener('load', () => {
      placeholderElement.classList.add('hidden');
      imgElement.classList.remove('hidden');
      
      // Reveal code output section on successful load
      const codeBlock = imgElement.closest('.card-preview-wrapper')?.querySelector('.code-block-wrapper');
      if (codeBlock) {
        codeBlock.classList.remove('hidden');
      }
      imageFinishedLoading();
    });

    imgElement.addEventListener('error', () => {
      placeholderElement.querySelector('.pulse-icon').innerHTML = `
        <svg class="placeholder-svg error" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f85149" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      `;
      placeholderElement.querySelector('p').textContent = errorText;
      
      // Keep code output section hidden on load failure
      const codeBlock = imgElement.closest('.card-preview-wrapper')?.querySelector('.code-block-wrapper');
      if (codeBlock) {
        codeBlock.classList.add('hidden');
      }
      imageFinishedLoading();
    });
  }

  // Bind image event listeners
  setupImageEvents(statsImg, statsPlaceholder, 'Error al cargar tarjeta. Verifica el usuario.');
  setupImageEvents(languagesImg, languagesPlaceholder, 'Error al cargar lenguajes.');
  setupImageEvents(repoImg, repoPlaceholder, 'Error al cargar repositorio.');
  setupImageEvents(rankImg, rankPlaceholder, 'Error al cargar rango.');
  setupImageEvents(streakImg, streakPlaceholder, 'Error al cargar racha de contribuciones.');
  setupImageEvents(trophiesImg, trophiesPlaceholder, 'Error al cargar trofeos.');
  setupImageEvents(viewsImg, viewsPlaceholder, 'Error al cargar contador de visitas.');

  // Setup Clipboard Copy handlers
  setupCopyButton(btnCopyStats, markdownStatsCode);
  setupCopyButton(btnCopyLanguages, markdownLanguagesCode);
  setupCopyButton(btnCopyRepo, markdownRepoCode);
  setupCopyButton(btnCopyRank, markdownRankCode);
  setupCopyButton(btnCopyStreak, markdownStreakCode);
  setupCopyButton(btnCopyTrophies, markdownTrophiesCode);
  setupCopyButton(btnCopyViews, markdownViewsCode);

  // Setup views badge options change listeners
  if (viewsStyle) {
    viewsStyle.addEventListener('change', () => {
      if (currentUsername) updateCards();
    });
  }
  if (viewsLabel) {
    viewsLabel.addEventListener('change', () => {
      if (currentUsername) updateCards();
    });
  }
  if (viewsColor) {
    viewsColor.addEventListener('change', () => {
      if (currentUsername) updateCards();
    });
  }

  // --- Private Token Management UI Logic ---
  const tokenUsername = document.getElementById('token-username');
  const tokenInput = document.getElementById('token-input');
  const tokenConsent = document.getElementById('token-consent');
  const btnSaveToken = document.getElementById('btn-save-token');

  const tokenUnregistered = document.getElementById('token-unregistered');
  const tokenRegistered = document.getElementById('token-registered');
  const tokenRevokeInput = document.getElementById('token-revoke-input');
  const btnRevokeToken = document.getElementById('btn-revoke-token');
  const tokenStatusMsg = document.getElementById('token-status-msg');

  // Helper to show status messages
  function showStatus(text, type = 'success') {
    tokenStatusMsg.textContent = text;
    tokenStatusMsg.className = 'token-status-msg'; // reset classes
    tokenStatusMsg.classList.remove('hidden');
    if (type === 'success') {
      tokenStatusMsg.style.background = 'rgba(74, 222, 128, 0.1)';
      tokenStatusMsg.style.color = '#4ade80';
      tokenStatusMsg.style.border = '1px solid rgba(74, 222, 128, 0.2)';
      tokenStatusMsg.style.padding = '10px';
      tokenStatusMsg.style.borderRadius = '6px';
      tokenStatusMsg.style.marginTop = '10px';
    } else {
      tokenStatusMsg.style.background = 'rgba(248, 81, 73, 0.1)';
      tokenStatusMsg.style.color = '#f85149';
      tokenStatusMsg.style.border = '1px solid rgba(248, 81, 73, 0.2)';
      tokenStatusMsg.style.padding = '10px';
      tokenStatusMsg.style.borderRadius = '6px';
      tokenStatusMsg.style.marginTop = '10px';
    }
  }

  function hideStatus() {
    tokenStatusMsg.classList.add('hidden');
  }

  // Load and show initial token state
  const storedRegUser = localStorage.getItem('registered-github-username');
  if (storedRegUser) {
    showRegisteredState();
    if (usernameInput) {
      usernameInput.value = storedRegUser;
      submitUsername();
    }
  }

  function showRegisteredState() {
    tokenUnregistered.classList.add('hidden');
    tokenRegistered.classList.remove('hidden');
    hideStatus();
  }

  function showUnregisteredState() {
    tokenRegistered.classList.add('hidden');
    tokenUnregistered.classList.remove('hidden');
    hideStatus();
    tokenInput.value = '';
    tokenRevokeInput.value = '';
    tokenConsent.checked = false;
    if (tokenUsername) {
      tokenUsername.value = '';
    }
  }

  // Completely reset the entire dashboard UI and statistics
  function resetAppUI() {
    if (usernameInput) usernameInput.value = '';
    if (repoInput) repoInput.value = '';
    currentUsername = '';
    currentRepo = '';

    updateThemeSelectorsState();

    // Hide images and show placeholders
    if (statsImg) statsImg.classList.add('hidden');
    if (statsPlaceholder) statsPlaceholder.classList.remove('hidden');

    if (languagesImg) languagesImg.classList.add('hidden');
    if (languagesPlaceholder) languagesPlaceholder.classList.remove('hidden');

    if (repoImg) repoImg.classList.add('hidden');
    if (repoPlaceholder) repoPlaceholder.classList.remove('hidden');

    if (rankImg) rankImg.classList.add('hidden');
    if (rankPlaceholder) rankPlaceholder.classList.remove('hidden');

    if (streakImg) streakImg.classList.add('hidden');
    if (streakPlaceholder) streakPlaceholder.classList.remove('hidden');

    if (trophiesImg) trophiesImg.classList.add('hidden');
    if (trophiesPlaceholder) trophiesPlaceholder.classList.remove('hidden');

    if (viewsImg) viewsImg.classList.add('hidden');
    if (viewsPlaceholder) viewsPlaceholder.classList.remove('hidden');

    if (viewsLabel) viewsLabel.value = 'Profile views';
    if (viewsColor) viewsColor.value = '';
    if (viewsStyle) viewsStyle.value = 'flat';

    // Hide code block wrappers
    if (codeBlockWrappers) {
      codeBlockWrappers.forEach((wrapper) => {
        wrapper.classList.add('hidden');
      });
    }
  }

  // Handle register
  if (btnSaveToken) {
    btnSaveToken.addEventListener('click', async () => {
      hideStatus();
      const username = tokenUsername.value.trim();
      const token = tokenInput.value.trim();
      const consentAccepted = tokenConsent.checked;

      if (!username) {
        showStatus('Por favor, ingresa tu usuario de GitHub.', 'error');
        return;
      }
      if (!token) {
        showStatus('Por favor, ingresa tu Personal Access Token (PAT).', 'error');
        return;
      }
      if (!consentAccepted) {
        showStatus('Debes aceptar el almacenamiento cifrado de datos.', 'error');
        return;
      }

      try {
        globalLoading.classList.remove('hidden');
        const response = await fetch('/api/tokens/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, token, consentAccepted })
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('registered-github-username', username);
          showRegisteredState();
          showStatus(data.message, 'success');

          // Auto-load and refresh statistics
          if (usernameInput) {
            usernameInput.value = username;
            submitUsername();
          }
        } else {
          showStatus(data.error || 'Error al registrar el token.', 'error');
        }
      } catch (err) {
        console.error(err);
        showStatus('Error de red al intentar comunicarse con el servidor.', 'error');
      } finally {
        globalLoading.classList.add('hidden');
      }
    });
  }

  // Handle revoke
  if (btnRevokeToken) {
    btnRevokeToken.addEventListener('click', async () => {
      hideStatus();
      const username =
        localStorage.getItem('registered-github-username') || tokenUsername.value.trim();
      const token = tokenRevokeInput.value.trim();

      if (!username) {
        showStatus('No se reconoce ningún usuario registrado.', 'error');
        return;
      }
      if (!token) {
        showStatus(
          'Debes ingresar un token de GitHub válido tuyo para verificar tu propiedad antes de revocar.',
          'error'
        );
        return;
      }

      try {
        globalLoading.classList.remove('hidden');
        const response = await fetch('/api/tokens/revoke', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.removeItem('registered-github-username');
          showUnregisteredState();
          showStatus(data.message, 'success');

          // Completely reset the UI and clear all statistics
          resetAppUI();
        } else {
          showStatus(data.error || 'Error al revocar el token.', 'error');
        }
      } catch (err) {
        console.error(err);
        showStatus('Error de red al intentar comunicarse con el servidor.', 'error');
      } finally {
        globalLoading.classList.add('hidden');
      }
    });
  }

  // Handle Purge Data
  const btnOpenPurgeModal = document.getElementById('btn-open-purge-modal');
  const purgeModal = document.getElementById('purge-modal');
  const purgeUsername = document.getElementById('purge-username');
  const purgeToken = document.getElementById('purge-token');
  const btnClosePurge = document.getElementById('btn-close-purge');
  const btnConfirmPurge = document.getElementById('btn-confirm-purge');

  if (btnOpenPurgeModal) {
    btnOpenPurgeModal.addEventListener('click', () => {
      if (purgeModal) {
        purgeModal.classList.remove('hidden');
      }
      if (purgeUsername) purgeUsername.value = '';
      if (purgeToken) purgeToken.value = '';
      updatePurgeConfirmButtonState();
    });
  }

  if (btnClosePurge) {
    btnClosePurge.addEventListener('click', () => {
      if (purgeModal) {
        purgeModal.classList.add('hidden');
      }
    });
  }

  function updatePurgeConfirmButtonState() {
    if (!btnConfirmPurge) return;
    const hasUsername = purgeUsername && purgeUsername.value.trim() !== '';
    const hasToken = purgeToken && purgeToken.value.trim() !== '';
    if (hasUsername && hasToken) {
      btnConfirmPurge.style.opacity = '1';
      btnConfirmPurge.style.pointerEvents = 'auto';
    } else {
      btnConfirmPurge.style.opacity = '0.5';
      btnConfirmPurge.style.pointerEvents = 'none';
    }
  }

  if (purgeUsername) {
    purgeUsername.addEventListener('input', updatePurgeConfirmButtonState);
  }
  if (purgeToken) {
    purgeToken.addEventListener('input', updatePurgeConfirmButtonState);
  }

  if (btnConfirmPurge) {
    btnConfirmPurge.addEventListener('click', async () => {
      const username = purgeUsername.value.trim();
      const token = purgeToken.value.trim();

      if (!username || !token) return;

      try {
        globalLoading.classList.remove('hidden');
        const response = await fetch('/api/users/purge', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (response.ok) {
          if (purgeModal) {
            purgeModal.classList.add('hidden');
          }
          localStorage.removeItem('registered-github-username');
          showUnregisteredState();
          showStatus(data.message, 'success');
          resetAppUI();
        } else {
          alert(data.error || 'Error al intentar purgar los datos.');
        }
      } catch (err) {
        console.error(err);
        alert('Error de red al intentar purgar los datos.');
      } finally {
        globalLoading.classList.add('hidden');
      }
    });
  }

  function setupCopyButton(button, codeElement) {
    button.addEventListener('click', async () => {
      const codeText = codeElement.textContent;
      try {
        await navigator.clipboard.writeText(codeText);

        // Success Feedback
        button.classList.add('copied');
        button.querySelector('.copy-text').textContent = '¡Copiado!';

        // Toggle SVGs
        button.querySelector('.icon-copy').classList.add('hidden');
        button.querySelector('.icon-check').classList.remove('hidden');

        setTimeout(() => {
          button.classList.remove('copied');
          button.querySelector('.copy-text').textContent = 'Copiar';
          button.querySelector('.icon-copy').classList.remove('hidden');
          button.querySelector('.icon-check').classList.add('hidden');
        }, 2000);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    });
  }

  // --- Config Load Logic ---
  async function loadConfig() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.privateStatsComingSoon === false) {
          if (privateStatsBadge) {
            privateStatsBadge.classList.add('hidden');
          }
          if (tokenFormContainer) {
            tokenFormContainer.style.opacity = '1';
            tokenFormContainer.style.pointerEvents = 'auto';
            tokenFormContainer.removeAttribute('title');
          }
          if (tokenUsername) tokenUsername.removeAttribute('disabled');
          if (tokenInput) tokenInput.removeAttribute('disabled');
          if (tokenConsent) tokenConsent.removeAttribute('disabled');
          if (btnSaveToken) btnSaveToken.removeAttribute('disabled');
        } else {
          if (privateStatsBadge) {
            privateStatsBadge.classList.remove('hidden');
          }
          if (tokenFormContainer) {
            tokenFormContainer.style.opacity = '0.55';
            tokenFormContainer.style.pointerEvents = 'none';
            tokenFormContainer.setAttribute('title', 'Esta característica estará disponible próximamente');
          }
          if (tokenUsername) tokenUsername.setAttribute('disabled', '');
          if (tokenInput) tokenInput.setAttribute('disabled', '');
          if (tokenConsent) tokenConsent.setAttribute('disabled', '');
          if (btnSaveToken) btnSaveToken.setAttribute('disabled', '');
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }
  loadConfig();
});

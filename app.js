/* UTM Builder — app.js */

(function () {
  'use strict';

  // ── Storage Keys ──
  const STORAGE_KEY = 'utm_builder_presets';
  const HISTORY_KEY = 'utm_builder_history';

  // ── Default Presets ──
  const DEFAULT_PRESETS = [
    { id: 'default-1', name: 'Google Ads', source: 'google', medium: 'cpc', campaign: '' },
    { id: 'default-2', name: 'Facebook Ads', source: 'facebook', medium: 'cpc', campaign: '' },
    { id: 'default-3', name: 'Email Newsletter', source: 'newsletter', medium: 'email', campaign: '' },
    { id: 'default-4', name: 'LinkedIn', source: 'linkedin', medium: 'social', campaign: '' },
    { id: 'default-5', name: 'Twitter / X', source: 'twitter', medium: 'social', campaign: '' },
    { id: 'default-6', name: 'Direct Mail', source: 'direct_mail', medium: 'offline', campaign: '' },
  ];

  // ── State ──
  let presets = loadPresets();

  // ── DOM ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Tabs
  const tabs = $$('.tab');
  const panels = $$('.tab-panel');

  // Builder fields
  const urlField = $('#builder-url');
  const sourceField = $('#builder-source');
  const mediumField = $('#builder-medium');
  const campaignField = $('#builder-campaign');
  const termField = $('#builder-term');
  const contentField = $('#builder-content');
  const generatedDisplay = $('#generated-url-display');
  const copyBtn = $('#copy-url-btn');
  const clearBtn = $('#clear-btn');
  const presetSelect = $('#preset-select');
  const managePresetsBtn = $('#manage-presets-btn');
  const savePresetBtn = $('#save-preset-btn');
  const savePresetForm = $('#save-preset-form');
  const presetNameField = $('#preset-name');
  const confirmSaveBtn = $('#confirm-save-preset');
  const cancelSaveBtn = $('#cancel-save-preset');

  // Bulk
  const bulkUrls = $('#bulk-urls');
  const bulkSource = $('#bulk-source');
  const bulkMedium = $('#bulk-medium');
  const bulkCampaign = $('#bulk-campaign');
  const bulkTerm = $('#bulk-term');
  const bulkContent = $('#bulk-content');
  const bulkGenerateBtn = $('#bulk-generate-btn');
  const bulkOutput = $('#bulk-output');
  const bulkOutputArea = $('#bulk-output-area');
  const bulkCopyBtn = $('#bulk-copy-btn');
  const bulkCsvBtn = $('#bulk-csv-btn');
  const bulkClearBtn = $('#bulk-clear-btn');

  // Decoder
  const decoderInput = $('#decoder-input');
  const decodeBtn = $('#decode-btn');
  const decoderResult = $('#decoder-result');
  const decoderParams = $('#decoder-params');
  const decoderClearBtn = $('#decoder-clear-btn');
  const decoderUseBtn = $('#decoder-use-in-builder');

  // Options
  const lowercaseToggle = $('#lowercase-toggle');

  // Modal
  const modalOverlay = $('#preset-modal');
  const modalList = $('#preset-list');
  const modalCloseBtn = $('#modal-close-btn');
  const modalDoneBtn = $('#modal-done-btn');

  // ── Tab Switching ──
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // ── URL Builder Logic ──
  const builderFields = [urlField, sourceField, mediumField, campaignField, termField, contentField];

  builderFields.forEach((field) => {
    field.addEventListener('input', updateGeneratedUrl);
    field.addEventListener('input', () => field.classList.remove('error'));
  });

  function normalizeUrl(raw) {
    let url = raw.trim();
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  function isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  function buildUtmUrl(baseUrl, params) {
    if (!baseUrl) return '';
    let url;
    try {
      url = new URL(baseUrl);
    } catch {
      return '';
    }
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmParams.forEach((key) => {
      const val = params[key];
      if (val && val.trim()) {
        url.searchParams.set(key, val.trim());
      }
    });
    return url.toString();
  }

  function getBuilderParams() {
    return {
      utm_source: sourceField.value,
      utm_medium: mediumField.value,
      utm_campaign: campaignField.value,
      utm_term: termField.value,
      utm_content: contentField.value,
    };
  }

  function updateGeneratedUrl() {
    const baseUrl = normalizeUrl(urlField.value);
    const params = getBuilderParams();
    const hasAnyParam = Object.values(params).some((v) => v.trim());

    if (!baseUrl && !hasAnyParam) {
      generatedDisplay.innerHTML = '<span class="empty-state">Fill in the fields above to generate your URL</span>';
      return;
    }

    if (!baseUrl || !isValidUrl(baseUrl)) {
      generatedDisplay.innerHTML = '<span class="empty-state">Enter a valid URL to get started</span>';
      return;
    }

    const fullUrl = buildUtmUrl(baseUrl, params);
    if (!fullUrl) return;

    // Color-code the URL
    generatedDisplay.innerHTML = colorCodeUrl(fullUrl);
  }

  function colorCodeUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      const base = url.origin + url.pathname;
      const paramMap = {
        utm_source: 'param-source',
        utm_medium: 'param-medium',
        utm_campaign: 'param-campaign',
        utm_term: 'param-term',
        utm_content: 'param-content',
      };

      let html = `<span class="base-url">${escapeHtml(base)}</span>`;

      // Use the raw search string so encoded values display correctly
      const searchStr = url.search.slice(1); // remove leading ?
      if (!searchStr) return html;

      const pairs = searchStr.split('&');
      pairs.forEach((pair, i) => {
        const sep = i === 0 ? '?' : '&';
        const [key, ...rest] = pair.split('=');
        const encodedValue = rest.join('=');
        const cls = paramMap[key] || '';
        html += `<span class="separator">${sep}</span>`;
        if (cls) {
          html += `<span class="${cls}">${escapeHtml(key)}=${escapeHtml(encodedValue)}</span>`;
        } else {
          html += `${escapeHtml(key)}=${escapeHtml(encodedValue)}`;
        }
      });

      return html;
    } catch {
      return escapeHtml(urlStr);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getGeneratedUrlText() {
    const baseUrl = normalizeUrl(urlField.value);
    const params = getBuilderParams();
    return buildUtmUrl(baseUrl, params);
  }

  // ── Copy ──
  copyBtn.addEventListener('click', () => {
    // Validate required fields
    const requiredFields = [
      { field: urlField, name: 'url' },
      { field: sourceField, name: 'source' },
      { field: mediumField, name: 'medium' },
      { field: campaignField, name: 'campaign' },
    ];
    let hasError = false;
    requiredFields.forEach(({ field }) => {
      if (!field.value.trim()) {
        field.classList.add('error');
        hasError = true;
      }
    });
    if (hasError) {
      // Focus first empty required field
      const first = requiredFields.find(({ field }) => !field.value.trim());
      if (first) first.field.focus();
      return;
    }

    const url = getGeneratedUrlText();
    if (!url) return;
    copyToClipboard(url, copyBtn);
  });

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    });
  }

  // ── Clear ──
  clearBtn.addEventListener('click', () => {
    builderFields.forEach((f) => {
      f.value = '';
      f.classList.remove('error');
    });
    presetSelect.value = '';
    savePresetForm.classList.remove('active');
    updateGeneratedUrl();
  });

  // ── Presets ──
  function loadPresets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fall through
      }
    }
    // First visit — seed defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS));
    return [...DEFAULT_PRESETS];
  }

  function savePresets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }

  function renderPresetSelect() {
    presetSelect.innerHTML = '<option value="">Select a preset...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${p.name} (${p.source} / ${p.medium})`;
      presetSelect.appendChild(opt);
    });
  }

  presetSelect.addEventListener('change', () => {
    const idx = presetSelect.value;
    if (idx === '') return;
    const preset = presets[parseInt(idx)];
    if (!preset) return;
    sourceField.value = preset.source || '';
    mediumField.value = preset.medium || '';
    campaignField.value = preset.campaign || '';
    updateGeneratedUrl();
  });

  // Save Preset
  savePresetBtn.addEventListener('click', () => {
    savePresetForm.classList.toggle('active');
    if (savePresetForm.classList.contains('active')) {
      const src = sourceField.value.trim();
      const med = mediumField.value.trim();
      presetNameField.value = src && med ? `${src} / ${med}` : '';
      presetNameField.focus();
    }
  });

  confirmSaveBtn.addEventListener('click', () => {
    const name = presetNameField.value.trim();
    if (!name) {
      presetNameField.classList.add('error');
      return;
    }
    presets.push({
      id: 'custom-' + Date.now(),
      name: name,
      source: sourceField.value.trim(),
      medium: mediumField.value.trim(),
      campaign: campaignField.value.trim(),
    });
    savePresets();
    renderPresetSelect();
    savePresetForm.classList.remove('active');
    presetNameField.value = '';
    presetNameField.classList.remove('error');
  });

  cancelSaveBtn.addEventListener('click', () => {
    savePresetForm.classList.remove('active');
    presetNameField.value = '';
    presetNameField.classList.remove('error');
  });

  presetNameField.addEventListener('input', () => presetNameField.classList.remove('error'));

  // Manage Presets Modal
  managePresetsBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalDoneBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function openModal() {
    renderModalList();
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderModalList() {
    if (presets.length === 0) {
      modalList.innerHTML = '<li class="preset-empty">No presets saved yet.</li>';
      return;
    }
    modalList.innerHTML = '';
    presets.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'preset-item';
      li.innerHTML = `
        <div class="preset-info">
          <div class="preset-name">${escapeHtml(p.name)}</div>
          <div class="preset-detail">${escapeHtml(p.source)} / ${escapeHtml(p.medium)}${p.campaign ? ' / ' + escapeHtml(p.campaign) : ''}</div>
        </div>
        <div class="preset-actions">
          <button class="btn btn-sm btn-danger" data-delete="${i}" title="Delete preset">Delete</button>
        </div>
      `;
      modalList.appendChild(li);
    });

    modalList.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delete);
        presets.splice(idx, 1);
        savePresets();
        renderPresetSelect();
        renderModalList();
      });
    });
  }

  // ── Bulk Generator ──
  bulkGenerateBtn.addEventListener('click', () => {
    const urls = bulkUrls.value.split('\n').map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;

    const params = {
      utm_source: bulkSource.value,
      utm_medium: bulkMedium.value,
      utm_campaign: bulkCampaign.value,
      utm_term: bulkTerm.value,
      utm_content: bulkContent.value,
    };

    const results = urls.map((raw) => {
      const base = normalizeUrl(raw);
      if (!isValidUrl(base)) return `# Invalid: ${raw}`;
      return buildUtmUrl(base, params);
    });

    bulkOutputArea.value = results.join('\n');
    bulkOutput.style.display = 'block';
  });

  bulkCopyBtn.addEventListener('click', () => {
    copyToClipboard(bulkOutputArea.value, bulkCopyBtn);
  });

  bulkCsvBtn.addEventListener('click', () => {
    const lines = bulkOutputArea.value.split('\n').filter(Boolean);
    let csv = 'URL,utm_source,utm_medium,utm_campaign,utm_term,utm_content\n';
    lines.forEach((line) => {
      if (line.startsWith('#')) return;
      try {
        const url = new URL(line);
        const base = url.origin + url.pathname;
        csv += [
          `"${base}"`,
          `"${url.searchParams.get('utm_source') || ''}"`,
          `"${url.searchParams.get('utm_medium') || ''}"`,
          `"${url.searchParams.get('utm_campaign') || ''}"`,
          `"${url.searchParams.get('utm_term') || ''}"`,
          `"${url.searchParams.get('utm_content') || ''}"`,
        ].join(',') + '\n';
      } catch {
        // skip invalid
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'utm-urls.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  bulkClearBtn.addEventListener('click', () => {
    bulkUrls.value = '';
    bulkSource.value = '';
    bulkMedium.value = '';
    bulkCampaign.value = '';
    bulkTerm.value = '';
    bulkContent.value = '';
    bulkOutputArea.value = '';
    bulkOutput.style.display = 'none';
  });

  // ── URL Decoder ──
  decodeBtn.addEventListener('click', decodeUrl);
  decoderInput.addEventListener('paste', () => {
    setTimeout(decodeUrl, 50);
  });

  function decodeUrl() {
    const raw = decoderInput.value.trim();
    if (!raw) {
      decoderResult.style.display = 'none';
      return;
    }

    const normalized = normalizeUrl(raw);
    if (!isValidUrl(normalized)) {
      decoderParams.innerHTML = '<div class="decoder-param"><span class="decoder-param-key">Error</span><span class="decoder-param-value">Not a valid URL</span></div>';
      decoderResult.style.display = 'block';
      return;
    }

    try {
      const url = new URL(normalized);
      const base = url.origin + url.pathname;
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

      let html = `<div class="decoder-param"><span class="decoder-param-key">Base URL</span><span class="decoder-param-value">${escapeHtml(base)}</span></div>`;

      utmKeys.forEach((key) => {
        const val = url.searchParams.get(key);
        if (val !== null) {
          html += `<div class="decoder-param"><span class="decoder-param-key">${escapeHtml(key)}</span><span class="decoder-param-value">${escapeHtml(val)}</span></div>`;
        }
      });

      // Show non-UTM params too
      url.searchParams.forEach((val, key) => {
        if (!utmKeys.includes(key)) {
          html += `<div class="decoder-param"><span class="decoder-param-key">${escapeHtml(key)}</span><span class="decoder-param-value">${escapeHtml(val)}</span></div>`;
        }
      });

      decoderParams.innerHTML = html;
      decoderResult.style.display = 'block';
    } catch {
      decoderParams.innerHTML = '<div class="decoder-param"><span class="decoder-param-key">Error</span><span class="decoder-param-value">Could not parse URL</span></div>';
      decoderResult.style.display = 'block';
    }
  }

  decoderClearBtn.addEventListener('click', () => {
    decoderInput.value = '';
    decoderResult.style.display = 'none';
  });

  // ── Keyboard Shortcuts ──
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to copy generated URL
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const url = getGeneratedUrlText();
      if (url) copyToClipboard(url, copyBtn);
    }

    // Escape closes modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Prevent form submission on Enter
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });
  });

  // ── Auto-lowercase ──
  const utmTextFields = [sourceField, mediumField, campaignField, termField, contentField,
                          bulkSource, bulkMedium, bulkCampaign, bulkTerm, bulkContent];

  utmTextFields.forEach((field) => {
    field.addEventListener('input', () => {
      if (lowercaseToggle.checked && field.value !== field.value.toLowerCase()) {
        const pos = field.selectionStart;
        field.value = field.value.toLowerCase();
        field.setSelectionRange(pos, pos);
      }
    });
  });

  // ── Use in Builder (from Decoder) ──
  decoderUseBtn.addEventListener('click', () => {
    const raw = decoderInput.value.trim();
    if (!raw) return;
    const normalized = normalizeUrl(raw);
    if (!isValidUrl(normalized)) return;

    try {
      const url = new URL(normalized);
      const base = url.origin + url.pathname;
      urlField.value = base;
      sourceField.value = url.searchParams.get('utm_source') || '';
      mediumField.value = url.searchParams.get('utm_medium') || '';
      campaignField.value = url.searchParams.get('utm_campaign') || '';
      termField.value = url.searchParams.get('utm_term') || '';
      contentField.value = url.searchParams.get('utm_content') || '';

      // Switch to Builder tab
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      document.querySelector('[data-tab="panel-builder"]').classList.add('active');
      document.getElementById('panel-builder').classList.add('active');
      updateGeneratedUrl();
      urlField.focus();
    } catch {
      // ignore
    }
  });

  // ── Init ──
  renderPresetSelect();
  updateGeneratedUrl();
})();

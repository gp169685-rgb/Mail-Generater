/**
 * MailCraft AI - Main Application Controller
 * Handles user interactions, state management, live preview synchronization,
 * rewrites, history persistence, and file exports.
 */

import { EMAIL_PRESETS, TONE_DEFINITIONS, PURPOSE_SUGGESTIONS } from './presets.js';
import { generateEmail, rewriteSection } from './emailGenerator.js';
import { generateWithAI, validateGeminiApiKey } from './geminiApi.js';
import confetti from 'canvas-confetti';

// Robust API caller with Vite Proxy & multi-host fallback
async function callApi(endpoint, options = {}) {
  // 1. Try relative path (Vite proxy - completely immune to CORS and IPv6 issues)
  try {
    const res = await fetch(endpoint, options);
    if (res.status !== 404) return res;
  } catch (e) {
    console.warn('Proxy fetch failed, trying direct localhost:3001:', e.message);
  }

  // 2. Direct localhost:3001 fallback
  try {
    const res = await fetch(`http://localhost:3001${endpoint}`, options);
    return res;
  } catch (e) {
    console.warn('localhost:3001 failed, trying 127.0.0.1:3001:', e.message);
  }

  // 3. Direct 127.0.0.1:3001 fallback
  return await fetch(`http://127.0.0.1:3001${endpoint}`, options);
}

// State Object
const state = {
  activePresetId: 'meeting-request',
  tone: 'polite',
  detailLevel: 'standard',
  includeBullets: true,
  currentGeneration: null,
  activeViewTab: 'client', // 'client' | 'sections' | 'raw'
  apiKey: localStorage.getItem('mailcraft_gemini_key') || '',
  history: JSON.parse(localStorage.getItem('mailcraft_history') || '[]'),
  theme: localStorage.getItem('mailcraft_theme') || 'dark',
  gmailConfigured: false
};

// DOM Element Selectors
const elements = {
  // Theme & Modals
  themeToggleBtn: document.getElementById('btn-theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  historyToggleBtn: document.getElementById('btn-history-toggle'),
  historyModal: document.getElementById('history-modal'),
  closeHistoryBtn: document.getElementById('btn-close-history'),
  historyListContainer: document.getElementById('history-list-container'),
  historyBadgeCount: document.getElementById('history-badge-count'),
  settingsToggleBtn: document.getElementById('btn-settings-toggle'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettingsBtn: document.getElementById('btn-close-settings'),
  apiKeyInput: document.getElementById('input-api-key'),
  saveKeyBtn: document.getElementById('btn-save-key'),
  clearKeyBtn: document.getElementById('btn-clear-key'),
  btnTestGeminiKey: document.getElementById('btn-test-gemini-key'),
  geminiStatusBox: document.getElementById('gemini-status-box'),
  engineStatusText: document.getElementById('engine-status-text'),
  engineStatusIndicator: document.getElementById('engine-status-indicator'),

  // Presets
  presetsContainer: document.getElementById('presets-chip-container'),

  // Form Inputs
  inputRecipient: document.getElementById('input-recipient'),
  inputRecipientRole: document.getElementById('input-recipient-role'),
  inputSender: document.getElementById('input-sender'),
  inputSenderRole: document.getElementById('input-sender-role'),
  selectPurpose: document.getElementById('select-purpose'),
  groupCustomPurpose: document.getElementById('group-custom-purpose'),
  inputCustomPurpose: document.getElementById('input-custom-purpose'),
  toneContainer: document.getElementById('tone-selector-container'),
  toneBadgeDisplay: document.getElementById('tone-badge-display'),
  detailControl: document.getElementById('control-detail-level'),
  labelDetailLevel: document.getElementById('label-detail-level'),
  toggleBullets: document.getElementById('toggle-bullets'),
  keyPointsList: document.getElementById('key-points-list'),
  btnAddPoint: document.getElementById('btn-add-point'),
  btnClearPoints: document.getElementById('btn-clear-points'),
  btnQuickSuggest: document.getElementById('btn-quick-suggest'),
  selectCta: document.getElementById('select-cta'),
  inputTimeframe: document.getElementById('input-timeframe'),
  groupCustomCta: document.getElementById('group-custom-cta'),
  inputCustomCta: document.getElementById('input-custom-cta'),
  btnGenerate: document.getElementById('btn-generate-email'),

  // Tabs
  tabClientView: document.getElementById('tab-client-view'),
  tabSectionsView: document.getElementById('tab-sections-view'),
  tabRawView: document.getElementById('tab-raw-view'),
  viewClientContainer: document.getElementById('view-client-container'),
  viewSectionsContainer: document.getElementById('view-sections-container'),
  viewRawContainer: document.getElementById('view-raw-container'),

  // Client Preview
  previewSubjectHeading: document.getElementById('preview-subject-heading'),
  subjectOptionsContainer: document.getElementById('subject-options-container'),
  previewSenderAvatar: document.getElementById('preview-sender-avatar'),
  previewSenderName: document.getElementById('preview-sender-name'),
  previewSenderRole: document.getElementById('preview-sender-role'),
  previewRecipientPill: document.getElementById('preview-recipient-pill'),
  previewTimestamp: document.getElementById('preview-timestamp'),
  previewBodyContent: document.getElementById('preview-body-content'),

  // Structured Sections
  partSubject: document.getElementById('part-subject'),
  partSalutation: document.getElementById('part-salutation'),
  partOpening: document.getElementById('part-opening'),
  partBody: document.getElementById('part-body'),
  partCta: document.getElementById('part-cta'),
  partSignoff: document.getElementById('part-signoff'),

  // Raw Markdown
  rawMarkdownDisplay: document.getElementById('raw-markdown-display'),

  // Metrics
  metricWordCount: document.getElementById('metric-word-count'),
  metricReadTime: document.getElementById('metric-read-time'),
  metricToneName: document.getElementById('metric-tone-name'),
  metricFormalityBar: document.getElementById('metric-formality-bar'),
  metricFormalityPercent: document.getElementById('metric-formality-percent'),

  // Action Buttons
  btnCopyFull: document.getElementById('btn-copy-full'),
  btnCopySubject: document.getElementById('btn-copy-subject'),
  btnOpenMailto: document.getElementById('btn-open-mailto'),
  btnExportDropdown: document.getElementById('btn-export-dropdown'),
  exportMenu: document.getElementById('export-menu'),
  toastContainer: document.getElementById('toast-container'),

  // Gmail SMTP Settings
  inputGmailUser: document.getElementById('input-gmail-user'),
  inputGmailPass: document.getElementById('input-gmail-pass'),
  btnSaveGmail: document.getElementById('btn-save-gmail'),
  btnTestGmail: document.getElementById('btn-test-gmail'),
  gmailStatusBox: document.getElementById('gmail-status-box'),

  // Send Email Modal
  sendModal: document.getElementById('send-modal'),
  btnCloseSend: document.getElementById('btn-close-send'),
  sendSmtpStatus: document.getElementById('send-smtp-status'),
  sendSubjectPreview: document.getElementById('send-subject-preview'),
  inputSendTo: document.getElementById('input-send-to'),
  sendBodyPreview: document.getElementById('send-body-preview'),
  btnConfirmSend: document.getElementById('btn-confirm-send'),
  sendResultBox: document.getElementById('send-result-box')
};

/**
 * Initialize application
 */
function init() {
  applyTheme(state.theme);
  updateEngineIndicator();
  checkBackendHealth();
  renderPresetChips();
  renderToneCards();
  loadPreset(EMAIL_PRESETS[0]);
  setupEventListeners();
  updateHistoryCount();
  setupPromptWizard();
  runGeneration();
}

/**
 * Theme Toggle Handler
 */
function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('mailcraft_theme', theme);
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

/**
 * Engine Indicator Update
 */
function updateEngineIndicator() {
  if (state.apiKey) {
    elements.engineStatusIndicator.style.background = '#8B5CF6';
    elements.engineStatusText.textContent = 'Google Gemini LLM Connected (Live Cloud)';
  } else {
    elements.engineStatusIndicator.style.background = '#10B981';
    elements.engineStatusText.textContent = 'Instant Neural Synthesizer Active (Zero Latency)';
  }
}

/**
 * Render Presets Bar
 */
function renderPresetChips() {
  elements.presetsContainer.innerHTML = '';
  EMAIL_PRESETS.forEach(preset => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `preset-chip ${preset.id === state.activePresetId ? 'active' : ''}`;
    chip.innerHTML = `<span>${preset.name}</span>`;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activePresetId = preset.id;
      loadPreset(preset);
      runGeneration();
      showToast(`Loaded preset: ${preset.name}`, 'info');
    });
    elements.presetsContainer.appendChild(chip);
  });
}

/**
 * Render Tone Selector Cards
 */
function renderToneCards() {
  elements.toneContainer.innerHTML = '';
  Object.entries(TONE_DEFINITIONS).forEach(([key, tone]) => {
    const card = document.createElement('div');
    card.className = `tone-card ${key === state.tone ? 'selected' : ''}`;
    card.dataset.tone = key;
    card.innerHTML = `
      <div class="tone-card-top">
        <span class="tone-card-title">${tone.label.split('&')[0].trim()}</span>
        <span style="font-size: 0.72rem; color: var(--text-dim);">${tone.formalityScore}% Formality</span>
      </div>
      <div class="tone-card-desc">${tone.description.split('.')[0]}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.tone-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.tone = key;
      elements.toneBadgeDisplay.textContent = tone.label;
      runGeneration();
    });

    elements.toneContainer.appendChild(card);
  });
}

/**
 * Populate controls with preset data
 */
function loadPreset(preset) {
  elements.inputRecipient.value = preset.recipient || '';
  elements.inputRecipientRole.value = preset.recipientRole || '';
  elements.inputSender.value = preset.sender || '';
  elements.inputSenderRole.value = preset.senderRole || '';
  elements.selectPurpose.value = preset.purpose || 'Meeting Request';
  elements.groupCustomPurpose.style.display = preset.purpose === 'Custom' ? 'block' : 'none';
  elements.inputCustomPurpose.value = preset.customPurpose || '';

  state.tone = preset.tone || 'polite';
  document.querySelectorAll('.tone-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.tone === state.tone);
  });
  const toneDef = TONE_DEFINITIONS[state.tone] || TONE_DEFINITIONS.polite;
  elements.toneBadgeDisplay.textContent = toneDef.label;

  state.detailLevel = preset.detailLevel || 'standard';
  elements.detailControl.querySelectorAll('.segmented-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.value === state.detailLevel);
  });
  updateDetailLabel(state.detailLevel);

  state.includeBullets = preset.includeBullets !== false;
  elements.toggleBullets.checked = state.includeBullets;

  elements.selectCta.value = preset.cta || 'schedule_call';
  elements.groupCustomCta.style.display = preset.cta === 'custom' ? 'block' : 'none';
  elements.inputTimeframe.value = preset.timeframe || '';

  renderKeyPoints(preset.keyPoints || []);
}

/**
 * Key Points Builder
 */
function renderKeyPoints(points) {
  elements.keyPointsList.innerHTML = '';
  points.forEach((pt, index) => {
    addKeyPointRow(pt);
  });
  if (points.length === 0) {
    addKeyPointRow('');
  }
}

function addKeyPointRow(value = '') {
  const row = document.createElement('div');
  row.className = 'key-point-item';
  row.innerHTML = `
    <span class="point-handle">⋮⋮</span>
    <input type="text" class="point-input" placeholder="Enter key agenda point or milestone..." value="${escapeQuotes(value)}" />
    <button type="button" class="point-delete-btn" title="Remove point">✕</button>
  `;

  row.querySelector('.point-delete-btn').addEventListener('click', () => {
    if (elements.keyPointsList.children.length > 1) {
      row.remove();
    } else {
      row.querySelector('.point-input').value = '';
    }
    syncLiveInputs();
  });

  row.querySelector('.point-input').addEventListener('input', () => {
    syncLiveInputs();
  });

  elements.keyPointsList.appendChild(row);
}

function getKeyPoints() {
  const inputs = elements.keyPointsList.querySelectorAll('.point-input');
  return Array.from(inputs)
    .map(i => i.value.trim())
    .filter(Boolean);
}

/**
 * Gather current form values
 */
function collectFormInputs() {
  return {
    recipient: elements.inputRecipient.value.trim(),
    recipientRole: elements.inputRecipientRole.value.trim(),
    sender: elements.inputSender.value.trim(),
    senderRole: elements.inputSenderRole.value.trim(),
    purpose: elements.selectPurpose.value,
    customPurpose: elements.inputCustomPurpose.value.trim(),
    tone: state.tone,
    urgency: 'medium',
    detailLevel: state.detailLevel,
    cta: elements.selectCta.value,
    customCta: elements.inputCustomCta.value.trim(),
    timeframe: elements.inputTimeframe.value.trim(),
    includeBullets: elements.toggleBullets.checked,
    keyPoints: getKeyPoints()
  };
}

/**
 * Main Email Generation Trigger
 */
async function runGeneration() {
  const inputs = collectFormInputs();

  // Indicate generating
  elements.btnGenerate.disabled = true;
  elements.btnGenerate.classList.add('generating-pulse');
  elements.viewClientContainer.classList.add('generating-pulse');

  try {
    let response;
    if (state.apiKey) {
      response = await generateWithAI(inputs, state.apiKey);
      if (response.errorNotice) {
        showToast(response.errorNotice, 'info');
      }
    } else {
      response = {
        source: 'built-in',
        result: generateEmail(inputs)
      };
    }

    state.currentGeneration = response.result;
    updatePreviewUI(response.result, inputs);
    saveToHistory(response.result, inputs);
  } catch (err) {
    console.error('Generation error:', err);
    showToast('Failed to generate email. Please check your inputs.', 'info');
  } finally {
    elements.btnGenerate.disabled = false;
    elements.btnGenerate.classList.remove('generating-pulse');
    elements.viewClientContainer.classList.remove('generating-pulse');
  }
}

/**
 * Update Preview UI across all 3 view modes
 */
function updatePreviewUI(gen, inputs) {
  // 1. Email Client Mode
  elements.previewSubjectHeading.textContent = gen.subject;

  // Alternative subjects
  elements.subjectOptionsContainer.innerHTML = '';
  (gen.subjectOptions || []).forEach(sub => {
    const chip = document.createElement('span');
    chip.className = 'subject-alt-chip';
    chip.textContent = sub;
    chip.title = 'Click to use this subject line';
    chip.addEventListener('click', () => {
      gen.subject = sub;
      elements.previewSubjectHeading.textContent = sub;
      elements.partSubject.textContent = sub;
      updateRawMarkdownView();
      showToast('Subject line updated!', 'success');
    });
    elements.subjectOptionsContainer.appendChild(chip);
  });

  // Avatar initials
  const senderName = inputs.sender || 'Alex Rivera';
  const initials = senderName
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  elements.previewSenderAvatar.textContent = initials || 'ME';
  elements.previewSenderName.textContent = senderName;
  elements.previewSenderRole.textContent = inputs.senderRole || 'Professional Sender';
  elements.previewRecipientPill.textContent = inputs.recipient || 'Recipient';

  // Body content assembly
  const bodyText = [
    gen.salutation,
    gen.opening,
    ...gen.bodyParagraphs,
    gen.callToAction,
    gen.signOff,
    gen.signature
  ].join('\n\n');

  elements.previewBodyContent.textContent = bodyText;

  // 2. Structured Sections Breakdown Mode
  elements.partSubject.textContent = gen.subject;
  elements.partSalutation.textContent = gen.salutation;
  elements.partOpening.textContent = gen.opening;
  elements.partBody.textContent = (gen.bodyParagraphs || []).join('\n\n');
  elements.partCta.textContent = gen.callToAction;
  elements.partSignoff.textContent = `${gen.signOff}\n${gen.signature}`;

  // 3. Raw Markdown View
  updateRawMarkdownView();

  // 4. Metrics & Telemetry
  updateMetrics(gen.metrics);
}

/**
 * Update Raw Markdown / Code View
 */
function updateRawMarkdownView() {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const inputs = collectFormInputs();

  const markdown = `**Subject:** ${gen.subject}
**To:** ${inputs.recipient || 'Recipient'} <${(inputs.recipient || 'recipient').toLowerCase().replace(/\s+/g, '.')}@example.com>
**From:** ${inputs.sender || 'Sender'} <${(inputs.sender || 'sender').toLowerCase().replace(/\s+/g, '.')}@example.com>
**Date:** ${new Date().toLocaleString()}

---

${gen.salutation}

${gen.opening}

${(gen.bodyParagraphs || []).join('\n\n')}

${gen.callToAction}

${gen.signOff}
${gen.signature}
`.trim();

  elements.rawMarkdownDisplay.textContent = markdown;
}

/**
 * Update Telemetry & Formality Metrics
 */
function updateMetrics(metrics) {
  if (!metrics) return;
  elements.metricWordCount.textContent = `${metrics.words} words`;
  elements.metricReadTime.textContent = `~${metrics.readingTimeSeconds} sec`;
  elements.metricToneName.textContent = metrics.toneLabel;
  elements.metricFormalityBar.style.width = `${metrics.formalityScore}%`;
  elements.metricFormalityPercent.textContent = `${metrics.formalityScore}%`;
}

/**
 * Live Sync inputs with preview without regenerating entire text
 */
function syncLiveInputs() {
  // Can trigger debounced generation if desired
}

/**
 * Rewrite Handler for Quick Polish buttons
 */
function handleQuickRewrite(action) {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const inputs = collectFormInputs();

  if (action === 'add_bullets') {
    gen.bodyParagraphs = gen.bodyParagraphs.map(p => rewriteSection('body', 'add_bullets', p, inputs));
  } else {
    gen.opening = rewriteSection('opening', action, gen.opening, inputs);
    gen.bodyParagraphs = gen.bodyParagraphs.map(p => rewriteSection('body', action, p, inputs));
    gen.callToAction = rewriteSection('cta', action, gen.callToAction, inputs);
  }

  // Re-assemble full text
  const bodyText = [
    gen.salutation,
    gen.opening,
    ...gen.bodyParagraphs,
    gen.callToAction,
    gen.signOff,
    gen.signature
  ].join('\n\n');

  elements.previewBodyContent.textContent = bodyText;
  elements.partOpening.textContent = gen.opening;
  elements.partBody.textContent = gen.bodyParagraphs.join('\n\n');
  elements.partCta.textContent = gen.callToAction;
  updateRawMarkdownView();

  // Recalculate metrics
  const words = bodyText.trim().split(/\s+/).filter(Boolean).length;
  gen.metrics.words = words;
  gen.metrics.readingTimeSeconds = Math.max(10, Math.round((words / 200) * 60));
  updateMetrics(gen.metrics);

  showToast(`Applied: ${action.replace('_', ' ').toUpperCase()}`, 'success');
}

/**
 * History & Saved Drafts Management
 */
function saveToHistory(gen, inputs) {
  const item = {
    id: Date.now().toString(),
    subject: gen.subject,
    recipient: inputs.recipient || 'Recipient',
    tone: inputs.tone,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    gen,
    inputs
  };

  state.history.unshift(item);
  if (state.history.length > 20) {
    state.history = state.history.slice(0, 20);
  }
  localStorage.setItem('mailcraft_history', JSON.stringify(state.history));
  updateHistoryCount();
}

function updateHistoryCount() {
  elements.historyBadgeCount.textContent = state.history.length;
}

function renderHistoryModal() {
  elements.historyListContainer.innerHTML = '';
  if (state.history.length === 0) {
    elements.historyListContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-dim);">
        <p>No saved drafts yet. Generate your first email!</p>
      </div>
    `;
    return;
  }

  state.history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item-card';
    card.innerHTML = `
      <div class="history-item-info">
        <span class="history-item-subject">${item.subject}</span>
        <span class="history-item-meta">To: ${item.recipient} • Tone: ${item.tone} • ${item.timestamp}</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button type="button" class="btn btn-secondary btn-restore" style="padding: 4px 10px; font-size: 0.75rem;">Restore</button>
        <button type="button" class="btn btn-ghost btn-delete" style="padding: 4px 8px; color: var(--accent-rose);">✕</button>
      </div>
    `;

    card.querySelector('.btn-restore').addEventListener('click', () => {
      state.currentGeneration = item.gen;
      updatePreviewUI(item.gen, item.inputs);
      elements.historyModal.classList.remove('open');
      showToast('Draft restored!', 'success');
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      state.history = state.history.filter(h => h.id !== item.id);
      localStorage.setItem('mailcraft_history', JSON.stringify(state.history));
      updateHistoryCount();
      renderHistoryModal();
    });

    elements.historyListContainer.appendChild(card);
  });
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/**
 * Copy & Confetti Handlers
 */
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage, 'success');
    triggerConfetti();
  } catch (err) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(successMessage, 'success');
    triggerConfetti();
  }
}

function triggerConfetti() {
  try {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366F1', '#8B5CF6', '#10B981', '#38BDF8']
    });
  } catch (e) {
    // Graceful fallback if canvas is unavailable
  }
}

/**
 * Export Utilities (EML, MD, TXT)
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`, 'success');
}

function exportAsEml() {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const inputs = collectFormInputs();
  const dateStr = new Date().toUTCString();

  const emlContent = `From: "${inputs.sender || 'Sender'}" <${(inputs.sender || 'sender').toLowerCase().replace(/\s+/g, '.')}@example.com>
To: "${inputs.recipient || 'Recipient'}" <${(inputs.recipient || 'recipient').toLowerCase().replace(/\s+/g, '.')}@example.com>
Date: ${dateStr}
Subject: ${gen.subject}
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

${elements.previewBodyContent.textContent || gen.fullText}
`;

  downloadFile(emlContent, `${sanitizeFilename(gen.subject)}.eml`, 'message/rfc822');
}

function exportAsMarkdown() {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const content = elements.rawMarkdownDisplay.textContent;
  downloadFile(content, `${sanitizeFilename(gen.subject)}.md`, 'text/markdown');
}

function exportAsText() {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const content = `SUBJECT: ${gen.subject}\n\n${elements.previewBodyContent.textContent || gen.fullText}`;
  downloadFile(content, `${sanitizeFilename(gen.subject)}.txt`, 'text/plain');
}

function openMailto() {
  if (!state.currentGeneration) return;
  const gen = state.currentGeneration;
  const inputs = collectFormInputs();
  const subject = encodeURIComponent(gen.subject);
  const body = encodeURIComponent(elements.previewBodyContent.textContent || gen.fullText);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Purpose select change
  elements.selectPurpose.addEventListener('change', e => {
    const val = e.target.value;
    elements.groupCustomPurpose.style.display = val === 'Custom' ? 'block' : 'none';
    runGeneration();
  });

  // CTA select change
  elements.selectCta.addEventListener('change', e => {
    const val = e.target.value;
    elements.groupCustomCta.style.display = val === 'custom' ? 'block' : 'none';
    runGeneration();
  });

  // Detail level segmented control
  elements.detailControl.querySelectorAll('.segmented-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      elements.detailControl.querySelectorAll('.segmented-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.detailLevel = pill.dataset.value;
      updateDetailLabel(state.detailLevel);
      runGeneration();
    });
  });

  // Bullets toggle
  elements.toggleBullets.addEventListener('change', e => {
    state.includeBullets = e.target.checked;
    runGeneration();
  });

  // Add Point button
  elements.btnAddPoint.addEventListener('click', () => {
    addKeyPointRow('');
    const allInputs = elements.keyPointsList.querySelectorAll('.point-input');
    allInputs[allInputs.length - 1]?.focus();
  });

  // Clear Points button
  elements.btnClearPoints.addEventListener('click', () => {
    elements.keyPointsList.innerHTML = '';
    addKeyPointRow('');
    runGeneration();
  });

  // Auto-Suggest points
  elements.btnQuickSuggest.addEventListener('click', () => {
    const category = elements.selectPurpose.value;
    const suggestions = PURPOSE_SUGGESTIONS[category] || PURPOSE_SUGGESTIONS['Meeting Request'];
    renderKeyPoints(suggestions);
    runGeneration();
    showToast('Suggested relevant agenda points!', 'info');
  });

  // Main Generate Button
  elements.btnGenerate.addEventListener('click', () => {
    runGeneration();
  });

  // Tab switching
  elements.tabClientView.addEventListener('click', () => switchTab('client'));
  elements.tabSectionsView.addEventListener('click', () => switchTab('sections'));
  elements.tabRawView.addEventListener('click', () => switchTab('raw'));

  // Quick Rewrites
  document.querySelectorAll('.rewrite-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleQuickRewrite(btn.dataset.action);
    });
  });

  // Copy Buttons
  elements.btnCopyFull.addEventListener('click', () => {
    const fullText = elements.previewBodyContent.textContent;
    copyToClipboard(fullText, '🎉 Full email copied to clipboard!');
  });

  elements.btnCopySubject.addEventListener('click', () => {
    const subject = elements.previewSubjectHeading.textContent.trim();
    copyToClipboard(subject, '📋 Subject line copied!');
  });

  // Copy individual section cards
  document.querySelectorAll('.btn-copy-part').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        copyToClipboard(targetEl.textContent.trim(), 'Copied section!');
      }
    });
  });

  // Send Mail — open send modal
  elements.btnOpenMailto.addEventListener('click', openSendModal);

  // Export dropdown
  elements.btnExportDropdown.addEventListener('click', e => {
    e.stopPropagation();
    const isVisible = elements.exportMenu.style.display === 'block';
    elements.exportMenu.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', () => {
    elements.exportMenu.style.display = 'none';
  });

  document.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (type === 'eml') exportAsEml();
      if (type === 'md') exportAsMarkdown();
      if (type === 'txt') exportAsText();
      elements.exportMenu.style.display = 'none';
    });
  });

  // Modals
  elements.historyToggleBtn.addEventListener('click', () => {
    renderHistoryModal();
    elements.historyModal.classList.add('open');
  });

  elements.closeHistoryBtn.addEventListener('click', () => {
    elements.historyModal.classList.remove('open');
  });

  elements.settingsToggleBtn.addEventListener('click', () => {
    elements.apiKeyInput.value = state.apiKey;
    elements.inputGmailUser.value = localStorage.getItem('mailcraft_gmail_user') || '';
    elements.inputGmailPass.value = '';
    elements.gmailStatusBox.style.display = 'none';
    if (elements.geminiStatusBox) {
      if (state.apiKey) {
        showGeminiStatus('A Gemini API key is currently saved.', 'success');
      } else {
        elements.geminiStatusBox.style.display = 'none';
      }
    }
    elements.settingsModal.classList.add('open');
  });

  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('open');
  });

  // Test Gemini Key
  if (elements.btnTestGeminiKey) {
    elements.btnTestGeminiKey.addEventListener('click', async () => {
      const key = elements.apiKeyInput.value.trim();
      if (!key) {
        showGeminiStatus('Please enter an API key first.', 'warning');
        return;
      }
      elements.btnTestGeminiKey.disabled = true;
      elements.btnTestGeminiKey.textContent = 'Testing...';
      showGeminiStatus('Validating with Google Gemini API...', 'warning');
      const testResult = await validateGeminiApiKey(key);
      showGeminiStatus(testResult.message, testResult.valid ? 'success' : 'error');
      elements.btnTestGeminiKey.disabled = false;
      elements.btnTestGeminiKey.textContent = 'Test Key';
    });
  }

  // Save Gemini Key
  elements.saveKeyBtn.addEventListener('click', async () => {
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
      state.apiKey = '';
      localStorage.removeItem('mailcraft_gemini_key');
      updateEngineIndicator();
      showGeminiStatus('Switched to built-in offline engine.', 'warning');
      showToast('Using built-in offline engine', 'info');
      return;
    }

    elements.saveKeyBtn.disabled = true;
    elements.saveKeyBtn.textContent = 'Validating...';
    const testResult = await validateGeminiApiKey(key);
    elements.saveKeyBtn.disabled = false;
    elements.saveKeyBtn.textContent = 'Save Gemini Key';

    if (testResult.valid) {
      state.apiKey = key;
      localStorage.setItem('mailcraft_gemini_key', state.apiKey);
      updateEngineIndicator();
      showGeminiStatus(testResult.message, 'success');
      showToast('Gemini API key saved & active!', 'success');
    } else {
      showGeminiStatus(testResult.message, 'error');
      showToast('API key check failed — see details in settings', 'info');
    }
  });

  elements.clearKeyBtn.addEventListener('click', () => {
    state.apiKey = '';
    elements.apiKeyInput.value = '';
    localStorage.removeItem('mailcraft_gemini_key');
    if (elements.geminiStatusBox) elements.geminiStatusBox.style.display = 'none';
    updateEngineIndicator();
    showToast('API key removed. Using built-in engine', 'info');
  });

  // Gmail SMTP — Save credentials
  elements.btnSaveGmail.addEventListener('click', async () => {
    const email = elements.inputGmailUser.value.trim();
    const pass = elements.inputGmailPass.value.trim();
    if (!email || !pass) {
      showGmailStatus('Please enter both Gmail address and App Password.', 'error');
      return;
    }
    try {
      elements.btnSaveGmail.disabled = true;
      elements.btnSaveGmail.textContent = 'Connecting...';
      const res = await callApi('/api/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, appPassword: pass })
      });
      const data = await res.json();
      if (res.ok) {
        state.gmailConfigured = true;
        localStorage.setItem('mailcraft_gmail_user', email);
        showGmailStatus(`✅ Connected! Sending as ${data.email}`, 'success');
        showToast('Gmail SMTP connected — you can now send real emails!', 'success');
      } else {
        showGmailStatus(`❌ ${data.error}`, 'error');
      }
    } catch (err) {
      showGmailStatus(`❌ Cannot reach backend server (${err.message})`, 'error');
    } finally {
      elements.btnSaveGmail.disabled = false;
      elements.btnSaveGmail.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Save & Connect Gmail`;
    }
  });

  // Gmail SMTP — Test connection
  elements.btnTestGmail.addEventListener('click', async () => {
    try {
      const res = await callApi('/api/health');
      const data = await res.json();
      if (data.configured) {
        state.gmailConfigured = true;
        showGmailStatus(`✅ Server running & configured for ${data.email}`, 'success');
      } else {
        showGmailStatus('⚠️ Server running but Gmail not configured yet. Enter credentials above.', 'warning');
      }
    } catch (err) {
      showGmailStatus(`❌ Backend server not reachable (${err.message})`, 'error');
    }
  });

  // Send Modal — Action buttons
  const btnSendGmailWeb = document.getElementById('btn-send-gmail-web');
  if (btnSendGmailWeb) btnSendGmailWeb.addEventListener('click', sendViaGmailWeb);

  const btnSendOutlookWeb = document.getElementById('btn-send-outlook-web');
  if (btnSendOutlookWeb) btnSendOutlookWeb.addEventListener('click', sendViaOutlookWeb);

  const btnSendMailto = document.getElementById('btn-send-mailto');
  if (btnSendMailto) btnSendMailto.addEventListener('click', sendViaMailto);

  // Send Modal — close
  elements.btnCloseSend.addEventListener('click', () => {
    elements.sendModal.classList.remove('open');
  });

  elements.btnConfirmSend.addEventListener('click', confirmSendEmail);
}

function switchTab(tab) {
  state.activeViewTab = tab;
  elements.tabClientView.classList.toggle('active', tab === 'client');
  elements.tabSectionsView.classList.toggle('active', tab === 'sections');
  elements.tabRawView.classList.toggle('active', tab === 'raw');

  elements.viewClientContainer.style.display = tab === 'client' ? 'flex' : 'none';
  elements.viewSectionsContainer.style.display = tab === 'sections' ? 'flex' : 'none';
  elements.viewRawContainer.style.display = tab === 'raw' ? 'block' : 'none';
}

function updateDetailLabel(level) {
  if (level === 'brief') {
    elements.labelDetailLevel.textContent = 'Crisp (1-2 paragraphs)';
  } else if (level === 'detailed') {
    elements.labelDetailLevel.textContent = 'Comprehensive (3-4 paragraphs)';
  } else {
    elements.labelDetailLevel.textContent = 'Balanced (2-3 paragraphs)';
  }
}

function escapeQuotes(str) {
  return (str || '').replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(str) {
  return (str || 'email')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 40);
}

/**
 * Check backend health on startup
 */
async function checkBackendHealth() {
  try {
    const res = await callApi('/api/health');
    const data = await res.json();
    if (data.configured) {
      state.gmailConfigured = true;
    }
  } catch {
    // Backend check failed
  }
}

/**
 * Show Gmail status message in settings modal
 */
function showGmailStatus(message, type) {
  const box = elements.gmailStatusBox;
  if (!box) return;
  box.style.display = 'block';
  box.textContent = message;
  if (type === 'success') {
    box.style.background = 'rgba(16, 185, 129, 0.1)';
    box.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    box.style.color = '#34D399';
  } else if (type === 'error') {
    box.style.background = 'rgba(244, 63, 94, 0.1)';
    box.style.border = '1px solid rgba(244, 63, 94, 0.3)';
    box.style.color = '#FB7185';
  } else {
    box.style.background = 'rgba(245, 158, 11, 0.1)';
    box.style.border = '1px solid rgba(245, 158, 11, 0.3)';
    box.style.color = '#FBBF24';
  }
}

/**
 * Show Gemini status message in settings modal
 */
function showGeminiStatus(message, type) {
  const box = elements.geminiStatusBox;
  if (!box) return;
  box.style.display = 'block';
  box.textContent = message;
  if (type === 'success') {
    box.style.background = 'rgba(16, 185, 129, 0.1)';
    box.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    box.style.color = '#34D399';
  } else if (type === 'error') {
    box.style.background = 'rgba(244, 63, 94, 0.1)';
    box.style.border = '1px solid rgba(244, 63, 94, 0.3)';
    box.style.color = '#FB7185';
  } else {
    box.style.background = 'rgba(245, 158, 11, 0.1)';
    box.style.border = '1px solid rgba(245, 158, 11, 0.3)';
    box.style.color = '#FBBF24';
  }
}

/**
 * Safely extract active subject and body from UI or state
 */
function getActiveEmailContent() {
  const gen = state.currentGeneration;
  const subjectEl = elements.previewSubjectHeading;
  const bodyEl = elements.previewBodyContent;

  const subject = (subjectEl ? subjectEl.textContent.trim() : '')
    || (gen ? gen.subject : '')
    || (elements.sendSubjectPreview ? elements.sendSubjectPreview.textContent.trim() : '')
    || 'Important Message';

  const body = (bodyEl ? bodyEl.textContent.trim() : '')
    || (gen ? gen.fullText : '')
    || '';

  return { subject, body };
}

/**
 * Open Send Email Modal
 */
function openSendModal() {
  const { subject, body } = getActiveEmailContent();
  if (!body) {
    showToast('Generate an email draft first before sending!', 'info');
    return;
  }

  const inputs = collectFormInputs();

  // Populate subject preview
  elements.sendSubjectPreview.textContent = subject;
  elements.sendBodyPreview.textContent = body;

  // Pre-fill To field hint
  if (!elements.inputSendTo.value.trim()) {
    elements.inputSendTo.placeholder = inputs.recipient
      ? `${inputs.recipient.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
      : 'recipient@gmail.com';
  }

  // Show correct SMTP status
  if (state.gmailConfigured) {
    elements.sendSmtpStatus.style.background = 'rgba(16, 185, 129, 0.1)';
    elements.sendSmtpStatus.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    elements.sendSmtpStatus.style.color = '#34D399';
    elements.sendSmtpStatus.innerHTML = '✅ <strong>Gmail Connected:</strong> Choose <strong>Open in Gmail</strong> (web compose) or <strong>Send Instantly</strong> (1-click).';
  } else {
    elements.sendSmtpStatus.style.background = 'rgba(234, 67, 53, 0.1)';
    elements.sendSmtpStatus.style.border = '1px solid rgba(234, 67, 53, 0.3)';
    elements.sendSmtpStatus.style.color = '#F87171';
    elements.sendSmtpStatus.innerHTML = '🔴 Click <strong>Open in Gmail</strong> below to open the compose box in your browser with zero setup!';
  }

  elements.sendResultBox.style.display = 'none';
  elements.sendModal.classList.add('open');
  setTimeout(() => elements.inputSendTo.focus(), 200);
}

/**
 * Open directly in Gmail Web Compose in the browser.
 * Opens mail.google.com with recipient, subject & body filled into the compose window!
 */
function sendViaGmailWeb() {
  const to = elements.inputSendTo.value.trim();
  if (!to) {
    showToast('Enter a recipient email address first!', 'info');
    elements.inputSendTo.focus();
    return;
  }

  const { subject, body } = getActiveEmailContent();

  // Gmail Web Compose URL
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailUrl, '_blank');

  elements.sendResultBox.style.display = 'block';
  elements.sendResultBox.style.background = 'rgba(234, 67, 53, 0.12)';
  elements.sendResultBox.style.border = '1px solid rgba(234, 67, 53, 0.35)';
  elements.sendResultBox.style.color = '#F87171';
  elements.sendResultBox.innerHTML = `
    ✅ <strong>Gmail Compose opened in a new tab!</strong><br/>
    The recipient (<code>${escapeHtml(to)}</code>), subject, and body are pre-filled in your Gmail window.<br/>
    👉 <strong>Important:</strong> In the newly opened Gmail tab, simply click <strong>"Send"</strong> to deliver it!
  `;

  showToast('📬 Opened in Gmail — click "Send" in the new tab!', 'success');
}

/**
 * Open directly in Outlook Web Compose
 */
function sendViaOutlookWeb() {
  const to = elements.inputSendTo.value.trim();
  if (!to) {
    showToast('Enter a recipient email address first!', 'info');
    elements.inputSendTo.focus();
    return;
  }

  const { subject, body } = getActiveEmailContent();

  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(outlookUrl, '_blank');

  elements.sendResultBox.style.display = 'block';
  elements.sendResultBox.style.background = 'rgba(0, 120, 212, 0.12)';
  elements.sendResultBox.style.border = '1px solid rgba(0, 120, 212, 0.35)';
  elements.sendResultBox.style.color = '#38BDF8';
  elements.sendResultBox.innerHTML = `
    ✅ <strong>Outlook Web opened in a new tab!</strong><br/>
    The draft is pre-filled. Click <strong>"Send"</strong> in Outlook to deliver!
  `;

  showToast('📬 Opened in Outlook Web!', 'success');
}

/**
 * Send via Desktop Email App (mailto: protocol without creating empty browser tabs)
 */
function sendViaMailto() {
  const to = elements.inputSendTo.value.trim();
  if (!to) {
    showToast('Enter a recipient email address first!', 'info');
    elements.inputSendTo.focus();
    return;
  }

  const { subject, body } = getActiveEmailContent();

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = mailtoUrl;
  document.body.appendChild(iframe);
  setTimeout(() => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }, 1500);

  elements.sendResultBox.style.display = 'block';
  elements.sendResultBox.style.background = 'rgba(99, 102, 241, 0.12)';
  elements.sendResultBox.style.border = '1px solid rgba(99, 102, 241, 0.35)';
  elements.sendResultBox.style.color = '#A5B4FC';
  elements.sendResultBox.innerHTML = `
    💻 <strong>Invoking your desktop mail client...</strong><br/>
    If you use Windows Mail or Outlook app, it will open now. If you prefer webmail, click the red <strong>Open in Gmail</strong> button above!
  `;

  showToast('📧 Invoking desktop email app...', 'info');
}

/**
 * Confirm & Send Email via Gmail SMTP backend
 */
async function confirmSendEmail() {
  const to = elements.inputSendTo.value.trim();
  if (!to) {
    showToast('Please enter a recipient email address!', 'info');
    elements.inputSendTo.focus();
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    showToast('Please enter a valid email address (e.g. name@gmail.com)!', 'info');
    elements.inputSendTo.focus();
    return;
  }

  const { subject, body } = getActiveEmailContent();
  const inputs = collectFormInputs();

  elements.btnConfirmSend.disabled = true;
  elements.btnConfirmSend.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
    Sending to ${escapeHtml(to)}...
  `;
  elements.sendResultBox.style.display = 'block';
  elements.sendResultBox.style.background = 'rgba(99, 102, 241, 0.1)';
  elements.sendResultBox.style.border = '1px solid rgba(99, 102, 241, 0.3)';
  elements.sendResultBox.style.color = '#A5B4FC';
  elements.sendResultBox.innerHTML = `⏳ <strong>Sending directly via Gmail SMTP...</strong><br/>Transmitting email to <code>${escapeHtml(to)}</code>. Please wait a moment...`;

  try {
    const res = await callApi('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        senderName: inputs.sender || 'MailCraft AI'
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      elements.sendResultBox.style.display = 'block';
      elements.sendResultBox.style.background = 'rgba(16, 185, 129, 0.15)';
      elements.sendResultBox.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      elements.sendResultBox.style.color = '#34D399';
      elements.sendResultBox.innerHTML = `
        🎉 <strong>Email Delivered Successfully!</strong><br/>
        Sent directly to <code>${escapeHtml(to)}</code>.<br/>
        <small style="opacity: 0.85;">Message ID: ${data.messageId || 'Delivered'}</small><br/>
        <small style="opacity: 0.75;">💡 Note for recipient: Please check your Primary inbox. If it's your first time receiving from this sender, also check Spam/Promotions.</small>
      `;
      showToast(`📧 Email delivered successfully to ${to}!`, 'success');
      triggerConfetti();
    } else {
      elements.sendResultBox.style.display = 'block';
      elements.sendResultBox.style.background = 'rgba(244, 63, 94, 0.12)';
      elements.sendResultBox.style.border = '1px solid rgba(244, 63, 94, 0.35)';
      elements.sendResultBox.style.color = '#FB7185';
      elements.sendResultBox.innerHTML = `
        ❌ <strong>${escapeHtml(data.error || 'Failed to send')}</strong>
        ${data.hint ? `<br/><small style="opacity:0.85">💡 ${escapeHtml(data.hint)}</small>` : ''}
        <div style="margin-top: 8px;">
          👉 <em>Alternative: Click the red <strong>Open in Gmail</strong> button above to send immediately via browser!</em>
        </div>
      `;
    }
  } catch (err) {
    console.error('Send error:', err);
    elements.sendResultBox.style.display = 'block';
    elements.sendResultBox.style.background = 'rgba(245, 158, 11, 0.12)';
    elements.sendResultBox.style.border = '1px solid rgba(245, 158, 11, 0.35)';
    elements.sendResultBox.style.color = '#FBBF24';
    elements.sendResultBox.innerHTML = `
      ⚠️ <strong>Could not reach server:</strong> ${escapeHtml(err.message)}<br/>
      Click the red <strong>Open in Gmail</strong> button above to send right now from your browser!
    `;
  } finally {
    elements.btnConfirmSend.disabled = false;
    elements.btnConfirmSend.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      <span>Send Instantly (1-Click Delivery)</span>
    `;
  }
}

/* ========================================================
   4-STEP GUIDED AI PROMPT WIZARD IMPLEMENTATION
   ======================================================== */
const wizardElements = {
  btnToggle: document.getElementById('btn-wizard-toggle'),
  modal: document.getElementById('wizard-modal'),
  btnClose: document.getElementById('btn-close-wizard'),
  steps: {
    1: document.getElementById('wizard-step-1'),
    2: document.getElementById('wizard-step-2'),
    3: document.getElementById('wizard-step-3'),
    4: document.getElementById('wizard-step-4')
  },
  nodes: document.querySelectorAll('.wizard-step-node'),
  connectors: document.querySelectorAll('.wizard-step-connector'),

  // Step 1: Receiver
  recipientName: document.getElementById('wizard-recipient-name'),
  recipientEmail: document.getElementById('wizard-recipient-email'),
  recipientRole: document.getElementById('wizard-recipient-role'),
  btnToStep2: document.getElementById('btn-wizard-to-step-2'),
  roleChips: document.querySelectorAll('.wizard-chip-role'),

  // Step 2: Sender
  senderName: document.getElementById('wizard-sender-name'),
  senderRole: document.getElementById('wizard-sender-role'),
  senderEmailText: document.getElementById('wizard-sender-email-text'),
  senderSmtpIndicator: document.getElementById('wizard-sender-smtp-indicator'),
  btnBackTo1: document.getElementById('btn-wizard-back-to-1'),
  btnToStep3: document.getElementById('btn-wizard-to-step-3'),

  // Step 3: Prompt
  promptInput: document.getElementById('wizard-prompt-input'),
  promptChips: document.querySelectorAll('.wizard-chip-prompt'),
  toneSelect: document.getElementById('wizard-tone-select'),
  geminiStatusText: document.getElementById('wizard-gemini-status-text'),
  btnToggleKeyInput: document.getElementById('btn-wizard-toggle-key-input'),
  inlineKeyBox: document.getElementById('wizard-inline-key-box'),
  geminiKeyInput: document.getElementById('wizard-gemini-key-input'),
  btnSaveKey: document.getElementById('btn-wizard-save-key'),
  btnBackTo2: document.getElementById('btn-wizard-back-to-2'),
  btnGenerate: document.getElementById('btn-wizard-generate-submit'),
  generateSpinner: document.getElementById('wizard-generate-spinner'),
  generateBtnText: document.getElementById('wizard-generate-btn-text'),

  // Step 4: Reconfirm
  reconfirmRecipient: document.getElementById('reconfirm-recipient-text'),
  reconfirmSender: document.getElementById('reconfirm-sender-text'),
  reconfirmEngine: document.getElementById('reconfirm-engine-tag'),
  outputSubject: document.getElementById('wizard-output-subject'),
  outputAltSubjects: document.getElementById('wizard-output-alt-subjects'),
  outputBody: document.getElementById('wizard-output-body'),
  outputMetrics: document.getElementById('wizard-output-metrics'),
  btnDirectSend: document.getElementById('btn-wizard-direct-send'),
  btnOpenGmail: document.getElementById('btn-wizard-open-gmail'),
  btnCopyEmail: document.getElementById('btn-wizard-copy-email'),
  btnApplyStudio: document.getElementById('btn-wizard-apply-studio'),
  btnBackTo3: document.getElementById('btn-wizard-back-to-3'),
  sendStatusAlert: document.getElementById('wizard-send-status-alert')
};

let currentWizardData = {
  step: 1,
  recipient: { name: '', email: '', role: '' },
  sender: { name: '', role: '' },
  prompt: '',
  tone: 'polite',
  generationResult: null
};

function setupPromptWizard() {
  if (!wizardElements.modal) return;

  // Toggle button in header
  if (wizardElements.btnToggle) {
    wizardElements.btnToggle.addEventListener('click', openPromptWizard);
  }

  // Close button & backdrop click
  if (wizardElements.btnClose) {
    wizardElements.btnClose.addEventListener('click', closePromptWizard);
  }
  wizardElements.modal.addEventListener('click', (e) => {
    if (e.target === wizardElements.modal) closePromptWizard();
  });

  // Step indicator nodes
  wizardElements.nodes.forEach(node => {
    node.addEventListener('click', () => {
      const targetStep = parseInt(node.dataset.step, 10);
      if (targetStep < currentWizardData.step || (currentWizardData.generationResult && targetStep <= 4)) {
        goToWizardStep(targetStep);
      }
    });
  });

  // Step 1: Quick Role chips
  wizardElements.roleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      wizardElements.recipientRole.value = chip.dataset.role;
      wizardElements.recipientRole.focus();
    });
  });

  // Step 1 -> Step 2
  wizardElements.btnToStep2.addEventListener('click', () => {
    const name = wizardElements.recipientName.value.trim();
    if (!name) {
      showToast('Please enter the receiver\'s name', 'info');
      wizardElements.recipientName.focus();
      return;
    }
    currentWizardData.recipient.name = name;
    currentWizardData.recipient.email = wizardElements.recipientEmail.value.trim();
    currentWizardData.recipient.role = wizardElements.recipientRole.value.trim();
    goToWizardStep(2);
  });

  // Step 2 -> Step 1
  wizardElements.btnBackTo1.addEventListener('click', () => goToWizardStep(1));

  // Step 2 -> Step 3
  wizardElements.btnToStep3.addEventListener('click', () => {
    const name = wizardElements.senderName.value.trim();
    if (!name) {
      showToast('Please enter your sender name', 'info');
      wizardElements.senderName.focus();
      return;
    }
    currentWizardData.sender.name = name;
    currentWizardData.sender.role = wizardElements.senderRole.value.trim();
    goToWizardStep(3);
  });

  // Step 3: Prompt chips
  wizardElements.promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      wizardElements.promptInput.value = chip.dataset.prompt;
      wizardElements.promptInput.focus();
    });
  });

  // Step 3: Toggle inline Gemini key box
  wizardElements.btnToggleKeyInput.addEventListener('click', () => {
    const isHidden = wizardElements.inlineKeyBox.style.display === 'none';
    wizardElements.inlineKeyBox.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      wizardElements.geminiKeyInput.value = state.apiKey;
      wizardElements.geminiKeyInput.focus();
    }
  });

  // Step 3: Save Gemini Key
  wizardElements.btnSaveKey.addEventListener('click', async () => {
    const key = wizardElements.geminiKeyInput.value.trim();
    if (!key) {
      state.apiKey = '';
      localStorage.removeItem('mailcraft_gemini_key');
      updateWizardGeminiStatus();
      updateEngineIndicator();
      showToast('Switched to built-in generator', 'info');
      return;
    }
    wizardElements.btnSaveKey.disabled = true;
    wizardElements.btnSaveKey.textContent = 'Verifying...';
    const testResult = await validateGeminiApiKey(key);
    wizardElements.btnSaveKey.disabled = false;
    wizardElements.btnSaveKey.textContent = 'Save Key';

    if (testResult.valid) {
      state.apiKey = key;
      localStorage.setItem('mailcraft_gemini_key', key);
      updateWizardGeminiStatus();
      updateEngineIndicator();
      wizardElements.inlineKeyBox.style.display = 'none';
      showToast('Google Gemini API key connected!', 'success');
    } else {
      showToast(testResult.message, 'info');
    }
  });

  // Step 3 -> Step 2
  wizardElements.btnBackTo2.addEventListener('click', () => goToWizardStep(2));

  // Step 3 -> Generate Email with Gemini
  wizardElements.btnGenerate.addEventListener('click', executeWizardGeneration);

  // Step 4: Back to edit prompt
  wizardElements.btnBackTo3.addEventListener('click', () => goToWizardStep(3));

  // Step 4: Copy Email
  wizardElements.btnCopyEmail.addEventListener('click', () => {
    const sub = wizardElements.outputSubject.value.trim();
    const body = wizardElements.outputBody.value.trim();
    copyToClipboard(`Subject: ${sub}\n\n${body}`, '🎉 Full email copied to clipboard!');
  });

  // Step 4: Apply to Main Studio
  wizardElements.btnApplyStudio.addEventListener('click', applyWizardToMainStudio);

  // Step 4: Open in Gmail Web Compose
  wizardElements.btnOpenGmail.addEventListener('click', () => {
    const to = currentWizardData.recipient.email || '';
    const subject = wizardElements.outputSubject.value.trim();
    const body = wizardElements.outputBody.value.trim();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    showToast('📬 Opened in Gmail Compose — click "Send" in the tab!', 'success');
  });

  // Step 4: Direct Send via SMTP
  wizardElements.btnDirectSend.addEventListener('click', executeWizardDirectSend);
}

function openPromptWizard() {
  // Pre-populate with current values from studio if available
  if (!wizardElements.recipientName.value.trim()) {
    wizardElements.recipientName.value = elements.inputRecipient.value || 'Dr. Sarah Jenkins';
  }
  if (!wizardElements.recipientRole.value.trim()) {
    wizardElements.recipientRole.value = elements.inputRecipientRole.value || 'VP of Product at CloudScale Systems';
  }
  if (!wizardElements.senderName.value.trim()) {
    wizardElements.senderName.value = elements.inputSender.value || 'Alex Rivera';
  }
  if (!wizardElements.senderRole.value.trim()) {
    wizardElements.senderRole.value = elements.inputSenderRole.value || 'Senior Solutions Architect, TechNova';
  }

  // Pre-fill sender account status
  const configuredEmail = localStorage.getItem('mailcraft_gmail_user') || 'divyanshchaureyiit@gmail.com';
  if (wizardElements.senderEmailText) {
    wizardElements.senderEmailText.textContent = configuredEmail;
  }

  updateWizardGeminiStatus();
  goToWizardStep(1);
  wizardElements.modal.classList.add('open');
}

function closePromptWizard() {
  wizardElements.modal.classList.remove('open');
}

function updateWizardGeminiStatus() {
  if (!wizardElements.geminiStatusText) return;
  if (state.apiKey) {
    wizardElements.geminiStatusText.innerHTML = '🟢 <strong>Gemini Cloud Connected</strong>';
  } else {
    wizardElements.geminiStatusText.innerHTML = '⚡ <strong>Instant AI Engine</strong> (Add Gemini key for live LLM)';
  }
}

function goToWizardStep(stepNum) {
  currentWizardData.step = stepNum;

  // Toggle step panels
  Object.keys(wizardElements.steps).forEach(k => {
    const panel = wizardElements.steps[k];
    if (panel) {
      panel.style.display = parseInt(k, 10) === stepNum ? 'block' : 'none';
    }
  });

  // Update Stepper nodes
  wizardElements.nodes.forEach(node => {
    const n = parseInt(node.dataset.step, 10);
    node.classList.remove('active', 'completed');
    if (n === stepNum) {
      node.classList.add('active');
    } else if (n < stepNum) {
      node.classList.add('completed');
    }
  });

  // Update connectors
  wizardElements.connectors.forEach((conn, idx) => {
    // idx 0 connects step 1-2, idx 1 connects step 2-3, idx 2 connects step 3-4
    if (idx < stepNum - 1) {
      conn.classList.add('completed');
    } else {
      conn.classList.remove('completed');
    }
  });

  // Focus appropriate inputs
  setTimeout(() => {
    if (stepNum === 1) wizardElements.recipientName.focus();
    if (stepNum === 2) wizardElements.senderName.focus();
    if (stepNum === 3) wizardElements.promptInput.focus();
    if (stepNum === 4) wizardElements.outputBody.focus();
  }, 100);
}

async function executeWizardGeneration() {
  const prompt = wizardElements.promptInput.value.trim();
  if (!prompt) {
    showToast('Please type what you would like to write about', 'info');
    wizardElements.promptInput.focus();
    return;
  }

  currentWizardData.prompt = prompt;
  currentWizardData.tone = wizardElements.toneSelect.value;

  // UI loading state
  wizardElements.btnGenerate.disabled = true;
  wizardElements.generateSpinner.style.display = 'inline-block';
  wizardElements.generateBtnText.textContent = state.apiKey ? 'Consulting Gemini Cloud...' : 'Synthesizing Email...';

  try {
    const inputs = {
      recipient: currentWizardData.recipient.name,
      recipientRole: currentWizardData.recipient.role,
      sender: currentWizardData.sender.name,
      senderRole: currentWizardData.senderRole || currentWizardData.sender.role,
      topic: prompt,
      tone: currentWizardData.tone,
      detailLevel: 'standard',
      cta: 'schedule_call',
      customCta: 'Next steps according to prompt',
      timeframe: 'as convenient',
      includeBullets: false,
      keyPoints: [prompt]
    };

    let response;
    if (state.apiKey) {
      response = await generateWithAI(inputs, state.apiKey);
    } else {
      response = {
        source: 'built-in',
        result: generateEmail(inputs)
      };
    }

    currentWizardData.generationResult = response.result;

    // Populate Step 4 Review
    wizardElements.reconfirmRecipient.textContent = currentWizardData.recipient.name + (currentWizardData.recipient.email ? ` <${currentWizardData.recipient.email}>` : '');
    wizardElements.reconfirmSender.textContent = currentWizardData.sender.name + (currentWizardData.sender.role ? ` (${currentWizardData.sender.role})` : '');
    wizardElements.reconfirmEngine.textContent = response.source.includes('gemini') ? 'Google Gemini AI' : 'Instant AI Synthesizer';

    // Primary Subject
    wizardElements.outputSubject.value = response.result.subject;

    // Alternative Subjects
    wizardElements.outputAltSubjects.innerHTML = '';
    (response.result.subjectOptions || []).forEach(sub => {
      const chip = document.createElement('span');
      chip.className = 'subject-alt-chip';
      chip.textContent = sub;
      chip.title = 'Click to use this subject line';
      chip.addEventListener('click', () => {
        wizardElements.outputSubject.value = sub;
        showToast('Subject updated!', 'success');
      });
      wizardElements.outputAltSubjects.appendChild(chip);
    });

    // Formatted Body
    wizardElements.outputBody.value = response.result.fullText || [
      response.result.salutation,
      response.result.opening,
      ...(response.result.bodyParagraphs || []),
      response.result.callToAction,
      response.result.signOff,
      response.result.signature
    ].filter(Boolean).join('\n\n');

    // Metrics
    const words = (wizardElements.outputBody.value.trim().split(/\s+/).filter(Boolean)).length;
    wizardElements.outputMetrics.textContent = `${words} words • ~${Math.max(1, Math.round(words / 200))} min read`;

    wizardElements.sendStatusAlert.style.display = 'none';

    goToWizardStep(4);
    showToast('✨ Email generated and ready for confirmation!', 'success');
    triggerConfetti();

  } catch (err) {
    console.error('Wizard generation error:', err);
    showToast('Generation failed: ' + err.message, 'info');
  } finally {
    wizardElements.btnGenerate.disabled = false;
    wizardElements.generateSpinner.style.display = 'none';
    wizardElements.generateBtnText.textContent = '✨ Generate Email with Gemini';
  }
}

async function executeWizardDirectSend() {
  let to = currentWizardData.recipient.email || '';
  if (!to) {
    const prompted = window.prompt('Please enter the recipient email address to deliver to:', '');
    if (!prompted || !prompted.trim()) {
      showToast('Recipient email required to send via SMTP', 'info');
      return;
    }
    to = prompted.trim();
    currentWizardData.recipient.email = to;
    wizardElements.recipientEmail.value = to;
    wizardElements.reconfirmRecipient.textContent = `${currentWizardData.recipient.name} <${to}>`;
  }

  const subject = wizardElements.outputSubject.value.trim();
  const body = wizardElements.outputBody.value.trim();

  wizardElements.btnDirectSend.disabled = true;
  wizardElements.btnDirectSend.innerHTML = `⏳ Sending to ${escapeHtml(to)}...`;

  wizardElements.sendStatusAlert.style.display = 'block';
  wizardElements.sendStatusAlert.style.background = 'rgba(99, 102, 241, 0.1)';
  wizardElements.sendStatusAlert.style.border = '1px solid rgba(99, 102, 241, 0.3)';
  wizardElements.sendStatusAlert.style.color = '#A5B4FC';
  wizardElements.sendStatusAlert.innerHTML = `Transmitting email to <code>${escapeHtml(to)}</code> via Gmail SMTP...`;

  try {
    const res = await callApi('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        senderName: currentWizardData.sender.name || 'MailCraft AI'
      })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      wizardElements.sendStatusAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      wizardElements.sendStatusAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      wizardElements.sendStatusAlert.style.color = '#34D399';
      wizardElements.sendStatusAlert.innerHTML = `🎉 <strong>Email Delivered Successfully!</strong><br/>Sent to <code>${escapeHtml(to)}</code> via Gmail SMTP (Message ID: ${data.messageId || 'Delivered'}).`;
      showToast(`Email delivered to ${to}!`, 'success');
      triggerConfetti();
    } else {
      wizardElements.sendStatusAlert.style.background = 'rgba(244, 63, 94, 0.12)';
      wizardElements.sendStatusAlert.style.border = '1px solid rgba(244, 63, 94, 0.35)';
      wizardElements.sendStatusAlert.style.color = '#FB7185';
      wizardElements.sendStatusAlert.innerHTML = `❌ <strong>${escapeHtml(data.error || 'Failed to send')}</strong><br/>${data.hint ? `<small>${escapeHtml(data.hint)}</small><br/>` : ''}👉 You can also click the red <strong>Open in Gmail Web</strong> button above to send immediately!`;
    }
  } catch (err) {
    wizardElements.sendStatusAlert.style.background = 'rgba(245, 158, 11, 0.12)';
    wizardElements.sendStatusAlert.style.border = '1px solid rgba(245, 158, 11, 0.35)';
    wizardElements.sendStatusAlert.style.color = '#FBBF24';
    wizardElements.sendStatusAlert.innerHTML = `⚠️ <strong>Server unreachable:</strong> ${escapeHtml(err.message)}<br/>Click the red <strong>Open in Gmail Web</strong> button to send right now in your browser.`;
  } finally {
    wizardElements.btnDirectSend.disabled = false;
    wizardElements.btnDirectSend.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      <span>Send via Gmail (1-Click)</span>
    `;
  }
}

function applyWizardToMainStudio() {
  if (!currentWizardData.generationResult) return;
  const gen = currentWizardData.generationResult;
  gen.subject = wizardElements.outputSubject.value.trim();
  gen.fullText = wizardElements.outputBody.value.trim();

  // Populate inputs in main controls
  elements.inputRecipient.value = currentWizardData.recipient.name;
  elements.inputRecipientRole.value = currentWizardData.recipient.role;
  elements.inputSender.value = currentWizardData.sender.name;
  elements.inputSenderRole.value = currentWizardData.sender.role;

  state.currentGeneration = gen;
  elements.previewSubjectHeading.textContent = gen.subject;
  elements.previewBodyContent.textContent = gen.fullText;
  elements.previewSenderName.textContent = currentWizardData.sender.name;
  elements.previewSenderRole.textContent = currentWizardData.sender.role;
  elements.previewRecipientPill.textContent = currentWizardData.recipient.name;

  updateRawMarkdownView();
  saveToHistory(gen, collectFormInputs());
  closePromptWizard();
  showToast('Email applied to studio & saved to Drafts!', 'success');
}

// Kick off
init();

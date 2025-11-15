import {
    pullLabels as fetchLabels,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } from './api.js';
  
  /* Element references (queried after DOM ready) */
  let els = {};
  
  document.addEventListener('DOMContentLoaded', () => {
    els = {
      form: document.getElementById('template-form'),
      id: document.getElementById('template-id'),
      name: document.getElementById('template-name'),
      label: document.getElementById('template-label'),
      content: document.getElementById('template-content'),
      list: document.getElementById('templates-list'),
      flash: document.getElementById('flash'),
      reset: document.getElementById('reset-btn'),
    };
  
    // defensive checks
    if (!els.form || !els.label || !els.list) {
      console.error('templates.js: required DOM nodes missing', {
        form: !!els.form, label: !!els.label, list: !!els.list
      });
      return;
    }
  
    init();
  });
  
  function init() {
    loadLabels();
    loadTemplates();
    els.form.addEventListener('submit', onSave);
    if (els.reset) els.reset.addEventListener('click', resetForm);
  }
  
  /* Populate label select with existing labels */
  async function loadLabels() {
    try {
      els.label.innerHTML = `<option value="">Loading labels...</option>`;
      els.label.disabled = true;
  
      const labels = await fetchLabels();
      if (!Array.isArray(labels) || labels.length === 0) {
        els.label.innerHTML = `<option value="">No labels available</option>`;
        els.label.disabled = true;
        return;
      }
  
      const options = ['<option value="">Select a label</option>']
        .concat(labels.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`))
        .join('');
      els.label.innerHTML = options;
      els.label.disabled = false;
    } catch (err) {
      console.error('loadLabels error', err);
      els.label.innerHTML = `<option value="">Could not load labels</option>`;
      els.label.disabled = true;
      showFlash('Could not load labels. Check auth/CORS.', 'error');
    }
  }
  
  /* Load templates and render list */
  async function loadTemplates() {
    try {
      els.list.innerHTML = `<li class="card">Loading templates...</li>`;
      const templates = await fetchTemplates();
      if (!Array.isArray(templates) || templates.length === 0) {
        els.list.innerHTML = `<li class="card">No templates yet</li>`;
        return;
      }
      els.list.innerHTML = templates.map(t => renderTemplateItem(t)).join('');
      bindItemEvents();
    } catch (err) {
      console.error('loadTemplates error', err);
      els.list.innerHTML = `<li class="card">Failed to load templates</li>`;
      showFlash('Could not load templates.', 'error');
    }
  }
  
  function renderTemplateItem(t) {
    const preview = (t.content || '').length > 80 ? (t.content || '').slice(0, 77) + '…' : (t.content || '');
    return `
      <li class="card" data-id="${t.id}">
        <div class="card-head">
          <strong class="card-title">${escapeHtml(t.name)}</strong>
          <span class="card-label">${escapeHtml(t.label_name || '')}</span>
        </div>
        <p class="card-preview">${escapeHtml(preview)}</p>
        <div class="card-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn danger">Delete</button>
        </div>
      </li>
    `;
  }
  
  function bindItemEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', onEdit));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', onDelete));
  }
  
  /* Create or update */
  async function onSave(e) {
    e.preventDefault();
    const payload = {
      name: (els.name.value || '').trim(),
      content: (els.content.value || '').trim(),
      label: parseInt(els.label.value || '', 10) || null,
    };
  
    if (!payload.name || !payload.content || !payload.label) {
      showFlash('Please fill in all fields.', 'error');
      return;
    }
  
    try {
      const id = els.id.value;
      if (id) {
        await updateTemplate(id, payload);
        showFlash('Template updated successfully.', 'success');
      } else {
        await createTemplate(payload);
        showFlash('Template saved successfully.', 'success');
      }
      await loadTemplates();
      resetForm();
    } catch (err) {
      console.error('onSave error', err);
      // try to surface server validation message
      try {
        const json = await err?.response?.json?.();
        if (json) showFlash(Object.values(json).flat().join(' '), 'error');
        else showFlash('Could not save template.', 'error');
      } catch {
        showFlash('Could not save template.', 'error');
      }
    }
  }
  
  /* Edit: load template into form */
  function onEdit(e) {
    const li = e.target.closest('li.card');
    if (!li) return;
    const id = li.dataset.id;
    fetchTemplate(id)
      .then(t => {
        els.id.value = t.id;
        els.name.value = t.name || '';
        els.label.value = t.label || '';
        els.content.value = t.content || '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        els.name.focus();
      })
      .catch(err => {
        console.error('onEdit fetchTemplate error', err);
        showFlash('Could not load template.', 'error');
      });
  }
  
  /* Delete */
  async function onDelete(e) {
    const li = e.target.closest('li.card');
    if (!li) return;
    const id = li.dataset.id;
    if (!confirm('Delete this template?')) return;
  
    try {
      await deleteTemplate(id);
      li.remove();
      showFlash('Template deleted successfully.', 'success');
    } catch (err) {
      console.error('onDelete error', err);
      showFlash('Could not delete template.', 'error');
    }
  }
  
  /* Helpers */
  function resetForm() {
    els.id.value = '';
    els.name.value = '';
    if (els.label) els.label.selectedIndex = 0;
    els.content.value = '';
  }
  
  function showFlash(msg, type = 'success') {
    if (!els.flash) return;
    els.flash.textContent = msg;
    els.flash.className = `flash ${type}`;
    els.flash.classList.remove('hidden');
    setTimeout(() => els.flash.classList.add('hidden'), 2500);
  }
  
  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  



// redirect to labels html
document.addEventListener("DOMContentLoaded", () => {
  const goHomeLink = document.getElementById("goHomeLink");
  if (goHomeLink) {
    goHomeLink.addEventListener("click", (e) => {
      e.preventDefault();

      // Ask background to open labels.html as a small popup window
      chrome.runtime.sendMessage({ action: "openLabels" }, (resp) => {
        if (chrome.runtime.lastError) {
          console.error("openLabels sendMessage error", chrome.runtime.lastError);
          // fallback: open in a new tab
          const url = chrome.runtime.getURL("labels.html");
          window.open(url, "_blank", "noopener");
          return;
        }
        if (!resp || !resp.success) {
          // fallback if background failed
          const url = chrome.runtime.getURL("labels.html");
          window.open(url, "_blank", "noopener");
        }
      });
    });
  }
});

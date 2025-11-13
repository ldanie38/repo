import {
    fetchLabels, fetchTemplates, fetchTemplate,
    createTemplate, updateTemplate, deleteTemplate
  } from './api.js';
  
  const els = {
    form: document.getElementById('template-form'),
    id: document.getElementById('template-id'),
    name: document.getElementById('template-name'),
    label: document.getElementById('template-label'),
    content: document.getElementById('template-content'),
    list: document.getElementById('templates-list'),
    flash: document.getElementById('flash'),
    reset: document.getElementById('reset-btn'),
  };
  
  init();
  
  function init() {
    loadLabels();
    loadTemplates();
    els.form.addEventListener('submit', onSave);
    els.reset.addEventListener('click', resetForm);
  }
  
  async function loadLabels() {
    try {
      const labels = await fetchLabels();
      els.label.innerHTML = labels.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
    } catch {
      showFlash('Could not load labels.', 'error');
    }
  }
  
  async function loadTemplates() {
    try {
      const templates = await fetchTemplates();
      els.list.innerHTML = templates.map(t => renderTemplateItem(t)).join('');
      bindItemEvents();
    } catch {
      showFlash('Could not load templates.', 'error');
    }
  }
  
  function renderTemplateItem(t) {
    const preview = t.content.length > 80 ? t.content.slice(0, 77) + '…' : t.content;
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
  
  async function onSave(e) {
    e.preventDefault();
    const payload = {
      name: els.name.value.trim(),
      content: els.content.value.trim(),
      label: parseInt(els.label.value, 10),
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
    } catch {
      showFlash('Could not save template.', 'error');
    }
  }
  
  function onEdit(e) {
    const li = e.target.closest('li.card');
    const id = li.dataset.id;
    fetchTemplate(id)
      .then(t => {
        els.id.value = t.id;
        els.name.value = t.name;
        els.label.value = t.label;
        els.content.value = t.content;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => showFlash('Could not load template.', 'error'));
  }
  
  async function onDelete(e) {
    const li = e.target.closest('li.card');
    const id = li.dataset.id;
    if (!confirm('Delete this template?')) return;
  
    try {
      await deleteTemplate(id);
      li.remove();
      showFlash('Template deleted successfully.', 'success');
    } catch {
      showFlash('Could not delete template.', 'error');
    }
  }
  
  function resetForm() {
    els.id.value = '';
    els.name.value = '';
    els.label.selectedIndex = 0;
    els.content.value = '';
  }
  
  function showFlash(msg, type = 'success') {
    els.flash.textContent = msg;
    els.flash.className = `flash ${type}`;
    els.flash.classList.remove('hidden');
    setTimeout(() => els.flash.classList.add('hidden'), 2500);
  }
  
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  
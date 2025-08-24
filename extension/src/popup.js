const resultEl = document.getElementById('apiResult');
const btn = document.getElementById('testApi');
const saveBtn = document.getElementById('saveFilters');
const loadBtn = document.getElementById('loadFilters');

const companies = document.getElementById('companies');
const tags = document.getElementById('tags');
const recent = document.getElementById('recent');

btn.addEventListener('click', async () => {
  resultEl.textContent = 'Calling backend...';
  try {
    const res = await fetch('http://localhost:8000/api/contacts');
    const data = await res.json();
    resultEl.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    resultEl.textContent = 'Error: ' + (e?.message || e);
  }
});

saveBtn.addEventListener('click', async () => {
  const payload = { company: companies.value, tags: tags.value, recent: recent.checked };
  await chrome.storage.local.set({ smartFilters: payload });
  alert('Filters saved.');
});

loadBtn.addEventListener('click', async () => {
  const { smartFilters } = await chrome.storage.local.get('smartFilters');
  if (smartFilters) {
    companies.value = smartFilters.company || '';
    tags.value = smartFilters.tags || '';
    recent.checked = !!smartFilters.recent;
    alert('Filters loaded.');
  } else {
    alert('No saved filters.');
  }
});

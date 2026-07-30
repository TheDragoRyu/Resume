const state = {
  csrfToken: '',
  repositories: [],
  projectConfig: null,
  documents: [],
  media: [],
  selectedDocument: null,
};

const byId = (id) => document.getElementById(id);

function notify(message, tone = 'success') {
  const notice = byId('notice');
  notice.textContent = message;
  notice.className =
    tone === 'error'
      ? 'mb-5 rounded-lg border border-rose-500/50 bg-rose-950/60 px-4 py-3 text-sm text-rose-100'
      : 'mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100';
}

async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  const mutation = options.method && options.method !== 'GET';
  if (mutation) {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-Token'] = state.csrfToken;
  }
  const response = await fetch(path, { ...options, headers, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function labeledInput(label, value, type = 'text') {
  const wrapper = element('label', 'grid gap-1 text-xs font-medium text-slate-300');
  wrapper.append(element('span', '', label));
  const input = element(
    type === 'textarea' ? 'textarea' : 'input',
    'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white'
  );
  if (type !== 'textarea') input.type = type;
  input.value = value || '';
  wrapper.append(input);
  return { wrapper, input };
}

function existingRepo(fullName) {
  return state.projectConfig.repos.find(
    (repo) => repo.repo.toLowerCase() === fullName.toLowerCase()
  );
}

function renderRepositories() {
  const list = byId('repo-list');
  const query = byId('repo-search').value.trim().toLowerCase();
  const repositories = state.repositories.filter((repo) =>
    `${repo.full_name} ${repo.description || ''}`.toLowerCase().includes(query)
  );
  list.replaceChildren();

  for (const [index, repo] of repositories.entries()) {
    const previous = existingRepo(repo.full_name);
    const card = element(
      'article',
      'repo-card rounded-xl border border-slate-800 bg-slate-900 p-4'
    );
    card.dataset.repo = repo.full_name;
    card.dataset.private = String(repo.private);

    const header = element('div', 'flex flex-wrap items-start justify-between gap-3');
    const identity = element('div');
    const titleRow = element('div', 'flex flex-wrap items-center gap-2');
    titleRow.append(element('h2', 'font-semibold text-white', repo.full_name));
    titleRow.append(
      element(
        'span',
        repo.private
          ? 'rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200'
          : 'rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200',
        repo.visibility
      )
    );
    if (repo.archived) {
      titleRow.append(element('span', 'text-xs text-amber-300', 'archived'));
    }
    identity.append(titleRow);
    identity.append(
      element('p', 'mt-1 max-w-3xl text-sm text-slate-400', repo.description || 'No description')
    );
    header.append(identity);

    const controls = element('div', 'flex flex-wrap items-center gap-4 text-sm');
    const selectedLabel = element('label', 'flex items-center gap-2');
    const selected = element('input');
    selected.type = 'checkbox';
    selected.className = 'size-4 accent-cyan-400';
    selected.checked = Boolean(previous) && !repo.private;
    selected.disabled = repo.private;
    selected.dataset.field = 'selected';
    selectedLabel.append(selected, document.createTextNode('Publish/sync'));

    const featuredLabel = element('label', 'flex items-center gap-2');
    const featured = element('input');
    featured.type = 'checkbox';
    featured.className = 'size-4 accent-fuchsia-400';
    featured.checked = Boolean(previous?.featured) && !repo.private;
    featured.disabled = repo.private || !selected.checked;
    featured.dataset.field = 'featured';
    featuredLabel.append(featured, document.createTextNode('Featured'));

    const order = element(
      'input',
      'w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5'
    );
    order.type = 'number';
    order.min = '1';
    order.value = String(previous?.order || index + 1);
    order.disabled = !selected.checked;
    order.dataset.field = 'order';

    selected.addEventListener('change', () => {
      featured.disabled = !selected.checked;
      order.disabled = !selected.checked;
      if (!selected.checked) featured.checked = false;
    });
    controls.append(selectedLabel, featuredLabel, order);
    header.append(controls);
    card.append(header);

    if (!repo.private) {
      const details = element('details', 'mt-4 border-t border-slate-800 pt-3');
      details.append(element('summary', 'cursor-pointer text-sm text-cyan-300', 'Overrides and generation options'));
      const grid = element('div', 'mt-3 grid gap-3 md:grid-cols-2');
      const fields = [
        ['title', 'Display title', previous?.overrides?.title],
        ['slug', 'Custom slug', previous?.overrides?.slug],
        ['categoryId', 'Category ID', previous?.categoryId],
        ['tags', 'Tags (comma separated)', previous?.overrides?.tags?.join(', ')],
        ['demo', 'Demo URL', previous?.overrides?.links?.demo],
        ['writeup', 'Write-up URL', previous?.overrides?.links?.writeup],
        ['description', 'Description override', previous?.overrides?.description, 'textarea'],
        ['context', 'Generation context', previous?.context, 'textarea'],
      ];
      for (const [field, label, value, type] of fields) {
        const control = labeledInput(label, value, type);
        control.input.dataset.field = field;
        grid.append(control.wrapper);
      }
      const lockLabel = element('label', 'flex items-center gap-2 text-sm');
      const lock = element('input');
      lock.type = 'checkbox';
      lock.checked = Boolean(previous?.lock);
      lock.dataset.field = 'lock';
      lockLabel.append(lock, document.createTextNode('Lock generated Markdown'));
      grid.append(lockLabel);
      details.append(grid);
      card.append(details);
    }
    list.append(card);
  }
}

function field(card, name) {
  return card.querySelector(`[data-field="${name}"]`);
}

async function saveProjects() {
  const cards = [...document.querySelectorAll('.repo-card')];
  const repos = cards
    .filter((card) => field(card, 'selected')?.checked && card.dataset.private !== 'true')
    .map((card) => {
      const value = (name) => field(card, name)?.value.trim() || undefined;
      return {
        repo: card.dataset.repo,
        order: Number(field(card, 'order').value),
        featured: field(card, 'featured').checked,
        lock: field(card, 'lock')?.checked || false,
        categoryId: value('categoryId'),
        context: value('context'),
        overrides: {
          title: value('title'),
          slug: value('slug'),
          description: value('description'),
          tags: value('tags')?.split(',').map((tag) => tag.trim()).filter(Boolean),
          links: { demo: value('demo'), writeup: value('writeup') },
        },
      };
    })
    .sort((left, right) => left.order - right.order)
    .map((repo, index) => ({ ...repo, order: index + 1 }));

  const payload = {
    defaults: {
      categoryId: byId('default-category').value.trim(),
      featured: false,
    },
    repos,
  };
  const result = await api('/api/projects', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  state.projectConfig = payload;
  notify(`Saved ${result.saved} repositories and updated ${result.updatedProjectFiles} project file(s).`);
  renderRepositories();
}

function renderCategoryOptions() {
  const options = byId('category-options');
  options.replaceChildren();
  for (const document of state.documents.filter((item) => item.frontmatter.type === 'category')) {
    const option = element('option');
    option.value = document.frontmatter.id;
    option.label = document.frontmatter.title;
    options.append(option);
  }
}

function renderContentList() {
  const list = byId('content-list');
  const query = byId('content-search').value.trim().toLowerCase();
  list.replaceChildren();
  for (const document of state.documents.filter((item) =>
    `${item.path} ${item.frontmatter.title || ''}`.toLowerCase().includes(query)
  )) {
    const button = element(
      'button',
      'rounded-md px-3 py-2 text-left text-sm hover:bg-slate-800',
      `${document.frontmatter.title || document.path} · ${document.frontmatter.type || 'unknown'}`
    );
    button.type = 'button';
    button.addEventListener('click', () => selectDocument(document.path));
    list.append(button);
  }
}

function selectDocument(path) {
  const document = state.documents.find((item) => item.path === path);
  if (!document) return;
  state.selectedDocument = document;
  byId('content-path').textContent = document.path;
  byId('frontmatter-editor').value = JSON.stringify(document.frontmatter, null, 2);
  byId('body-editor').value = document.body;
  byId('frontmatter-editor').disabled = false;
  byId('body-editor').disabled = false;
  byId('save-content').disabled = false;
  byId('delete-content').classList.toggle('hidden', !document.canDelete);
}

async function loadContent() {
  const payload = await api('/api/content');
  state.documents = payload.documents;
  state.media = payload.media;
  renderCategoryOptions();
  renderContentList();
  renderMedia();
}

async function saveContent(event) {
  event.preventDefault();
  if (!state.selectedDocument) return;
  let frontmatter;
  try {
    frontmatter = JSON.parse(byId('frontmatter-editor').value);
  } catch {
    throw new Error('Frontmatter JSON is invalid.');
  }
  await api('/api/content', {
    method: 'PUT',
    body: JSON.stringify({
      path: state.selectedDocument.path,
      frontmatter,
      body: byId('body-editor').value,
    }),
  });
  notify(`Validated and saved ${state.selectedDocument.path}.`);
  await loadContent();
  selectDocument(state.selectedDocument.path);
}

async function createProject() {
  const slug = prompt('New project slug (kebab-case):');
  if (!slug) return;
  const title = prompt('Project title:');
  if (!title) return;
  const categoryId = byId('default-category').value.trim() || 'cat-experience';
  const order =
    Math.max(
      0,
      ...state.documents
        .filter((item) => item.frontmatter.type === 'project')
        .map((item) => Number(item.frontmatter.order) || 0)
    ) + 1;
  const path = `src/data/projects/${slug}.md`;
  await api('/api/content/project', {
    method: 'POST',
    body: JSON.stringify({
      filename: `${slug}.md`,
      frontmatter: {
        id: `proj-${slug}`,
        slug,
        title,
        type: 'project',
        order,
        description: `${title} project case study.`,
        categoryId,
        featured: false,
        tags: [],
        links: {},
      },
      body: '## Problem\n\nDescribe the problem.\n\n## Solution\n\nDescribe the solution.\n\n## Highlights\n\n- Add a verifiable highlight.\n\n## Tech Stack\n\nAdd technologies.\n',
    }),
  });
  notify(`Created ${path}.`);
  await loadContent();
  selectDocument(path);
}

async function deleteContent() {
  if (!state.selectedDocument?.canDelete) return;
  if (!confirm(`Move ${state.selectedDocument.path} to the local recovery folder?`)) return;
  const path = state.selectedDocument.path;
  await api('/api/content', {
    method: 'DELETE',
    body: JSON.stringify({ path }),
  });
  state.selectedDocument = null;
  notify(`Deleted ${path}. It remains recoverable under .project-admin-trash.`);
  await loadContent();
  byId('content-path').textContent = 'Choose a document';
  byId('frontmatter-editor').value = '';
  byId('body-editor').value = '';
}

function renderMedia() {
  const list = byId('media-list');
  list.replaceChildren();
  for (const media of state.media) {
    const card = element('div', 'flex items-center gap-3 rounded-lg border border-slate-800 p-3');
    const image = element('img', 'size-16 rounded object-cover');
    image.src = media.path;
    image.alt = '';
    const details = element('div', 'min-w-0 flex-1');
    details.append(element('p', 'truncate text-sm font-medium', media.name));
    const button = element('button', 'mt-1 text-xs text-cyan-300', 'Copy content path');
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(media.path);
      notify(`Copied ${media.path}.`);
    });
    details.append(button);
    const deleteButton = element('button', 'ml-3 mt-1 text-xs text-rose-300', 'Delete');
    deleteButton.addEventListener('click', () => deleteMedia(media.path).catch(showError));
    details.append(deleteButton);
    card.append(image, details);
    list.append(card);
  }
}

async function deleteMedia(path) {
  if (!confirm(`Move ${path} to the local recovery folder?`)) return;
  await api('/api/media', {
    method: 'DELETE',
    body: JSON.stringify({ path }),
  });
  notify(`Deleted ${path}. It remains recoverable under .project-admin-trash.`);
  await loadContent();
}

async function uploadMedia() {
  const file = byId('media-input').files[0];
  if (!file) throw new Error('Choose an image first.');
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
  const base64 = String(dataUrl).split(',')[1];
  const result = await api('/api/media', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, base64 }),
  });
  notify(`Uploaded ${result.media.path}.`);
  await loadContent();
}

async function startJob(action) {
  const result = await api(`/api/jobs/${action}`, {
    method: 'POST',
    body: '{}',
  });
  notify(`Started ${result.job.action}.`);
  await loadJobs();
}

async function loadJobs() {
  const payload = await api('/api/jobs');
  const job = payload.jobs[0];
  byId('job-title').textContent = job ? `${job.action} · ${job.startedAt}` : 'No jobs yet';
  byId('job-status').textContent = job?.status || '';
  byId('job-output').textContent = job?.output || '';
  document.querySelectorAll('.job-button').forEach((button) => {
    button.disabled = payload.jobs.some((candidate) => candidate.status === 'running');
    button.classList.toggle('opacity-40', button.disabled);
  });
}

function setupTabs() {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
      byId(`tab-${button.dataset.tab}`).classList.remove('hidden');
      document.querySelectorAll('.tab-button').forEach((candidate) => {
        candidate.className =
          candidate === button
            ? 'tab-button rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950'
            : 'tab-button rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200';
      });
    });
  });
}

function bindEvents() {
  setupTabs();
  byId('repo-search').addEventListener('input', renderRepositories);
  byId('save-projects').addEventListener('click', () => saveProjects().catch(showError));
  byId('content-search').addEventListener('input', renderContentList);
  byId('content-form').addEventListener('submit', (event) => saveContent(event).catch(showError));
  byId('new-project').addEventListener('click', () => createProject().catch(showError));
  byId('delete-content').addEventListener('click', () => deleteContent().catch(showError));
  byId('upload-media').addEventListener('click', () => uploadMedia().catch(showError));
  document.querySelectorAll('.job-button').forEach((button) => {
    button.addEventListener('click', () => startJob(button.dataset.job).catch(showError));
  });
}

function showError(error) {
  notify(error.message || String(error), 'error');
}

async function init() {
  bindEvents();
  const session = await api('/api/session');
  state.csrfToken = session.csrfToken;
  byId('identity').textContent = `Signed in through Tailscale as ${session.identity}`;

  const [projectsResult, contentResult, jobsResult] = await Promise.allSettled([
    api('/api/projects'),
    loadContent(),
    loadJobs(),
  ]);
  if (projectsResult.status === 'fulfilled') {
    state.repositories = projectsResult.value.repositories;
    state.projectConfig = projectsResult.value.config;
    byId('default-category').value = state.projectConfig.defaults.categoryId;
    renderRepositories();
  } else {
    showError(projectsResult.reason);
  }
  if (contentResult.status === 'rejected') showError(contentResult.reason);
  if (jobsResult.status === 'rejected') showError(jobsResult.reason);
  setInterval(() => loadJobs().catch(() => {}), 2500);
}

init().catch(showError);

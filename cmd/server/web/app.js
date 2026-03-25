(function () {
  'use strict';

  const STORAGE_KEY = 'todoflow_user_id';

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateUserId() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  const userId = getOrCreateUserId();

  const el = {
    projectSelect: document.getElementById('project-select'),
    btnList: document.getElementById('btn-list'),
    btnBoard: document.getElementById('btn-board'),
    viewList: document.getElementById('view-list'),
    viewBoard: document.getElementById('view-board'),
    taskList: document.getElementById('task-list'),
    board: document.getElementById('board'),
    newTaskTitle: document.getElementById('new-task-title'),
    btnAddTask: document.getElementById('btn-add-task'),
    btnNewProject: document.getElementById('btn-new-project'),
    statusMsg: document.getElementById('status-msg'),
  };

  let projects = [];
  let tasks = [];
  let viewMode = 'list';
  let draggedTaskId = null;

  function setStatus(text) {
    el.statusMsg.textContent = text || '';
  }

  async function api(path, options) {
    const headers = Object.assign(
      { 'X-User-Id': userId, Accept: 'application/json' },
      options && options.headers ? options.headers : {}
    );
    if (options && options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!res.ok) {
      const msg =
        data && data.error && data.error.message
          ? data.error.message
          : res.statusText || 'Request failed';
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  function currentProjectId() {
    const v = el.projectSelect.value;
    return v || null;
  }

  function tasksForProject(projectId) {
    return tasks.filter(function (t) {
      return t.project_id === projectId;
    });
  }

  function tasksByStatus(projectId, status) {
    return tasksForProject(projectId)
      .filter(function (t) {
        return t.status === status;
      })
      .sort(function (a, b) {
        return a.position - b.position;
      });
  }

  function statusLabel(s) {
    if (s === 'todo') return 'Todo';
    if (s === 'in_progress') return 'In progress';
    if (s === 'done') return 'Done';
    return s;
  }

  function renderProjects() {
    el.projectSelect.innerHTML = '';
    if (projects.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No projects — create one';
      el.projectSelect.appendChild(opt);
      return;
    }
    projects.forEach(function (p) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      el.projectSelect.appendChild(opt);
    });
  }

  function renderList() {
    const pid = currentProjectId();
    el.taskList.innerHTML = '';
    if (!pid) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.textContent = 'Create a project to see tasks.';
      el.taskList.appendChild(li);
      return;
    }
    const list = tasksForProject(pid).slice().sort(function (a, b) {
      return a.position - b.position;
    });
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.textContent = 'No tasks yet. Add one above.';
      el.taskList.appendChild(li);
      return;
    }
    list.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'task-row';
      const title = document.createElement('span');
      title.className = 'task-row-title';
      title.textContent = t.title;
      const badge = document.createElement('span');
      badge.className = 'task-badge';
      badge.textContent = statusLabel(t.status);
      li.appendChild(title);
      li.appendChild(badge);
      el.taskList.appendChild(li);
    });
  }

  function makeCard(task) {
    const div = document.createElement('div');
    div.className = 'card';
    div.draggable = true;
    div.dataset.taskId = task.id;
    const title = document.createElement('span');
    title.textContent = task.title;
    div.appendChild(title);
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = task.priority || 'medium';
    div.appendChild(meta);
    div.addEventListener('dragstart', onCardDragStart);
    div.addEventListener('dragend', onCardDragEnd);
    div.addEventListener('dragover', onCardDragOver);
    div.addEventListener('drop', onCardDrop);
    return div;
  }

  function renderBoard() {
    const pid = currentProjectId();
    ['todo', 'in_progress', 'done'].forEach(function (status) {
      const zone = el.board.querySelector('[data-drop-zone="' + status + '"]');
      if (!zone) return;
      zone.innerHTML = '';
      if (!pid) {
        const p = document.createElement('p');
        p.className = 'empty-hint';
        p.textContent = 'Select a project.';
        zone.appendChild(p);
        return;
      }
      const colTasks = tasksByStatus(pid, status);
      if (colTasks.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-hint';
        p.textContent = 'Drop tasks here';
        zone.appendChild(p);
      } else {
        colTasks.forEach(function (t) {
          zone.appendChild(makeCard(t));
        });
      }
    });
  }

  function render() {
    if (viewMode === 'list') renderList();
    else renderBoard();
  }

  function setView(mode) {
    viewMode = mode;
    const isList = mode === 'list';
    el.btnList.classList.toggle('is-active', isList);
    el.btnBoard.classList.toggle('is-active', !isList);
    el.btnList.setAttribute('aria-selected', isList ? 'true' : 'false');
    el.btnBoard.setAttribute('aria-selected', !isList ? 'true' : 'false');
    el.viewList.classList.toggle('is-hidden', !isList);
    el.viewBoard.classList.toggle('is-hidden', isList);
    render();
  }

  function columnForZone(zoneEl) {
    return zoneEl && zoneEl.closest ? zoneEl.closest('.column') : null;
  }

  function onCardDragStart(e) {
    const id = e.currentTarget.dataset.taskId;
    draggedTaskId = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('is-dragging');
  }

  function onCardDragEnd(e) {
    e.currentTarget.classList.remove('is-dragging');
    draggedTaskId = null;
    el.board.querySelectorAll('.column').forEach(function (c) {
      c.classList.remove('is-drag-over');
    });
  }

  function onColumnDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = columnForZone(e.currentTarget);
    if (col) col.classList.add('is-drag-over');
  }

  function onColumnDragLeave(e) {
    const col = columnForZone(e.currentTarget);
    if (!col) return;
    const related = e.relatedTarget;
    if (related && col.contains(related)) return;
    col.classList.remove('is-drag-over');
  }

  function positionBetween(beforePos, afterPos) {
    if (beforePos == null && afterPos == null) return 1000;
    if (beforePos == null) return afterPos / 2;
    if (afterPos == null) return beforePos + 1000;
    const mid = (beforePos + afterPos) / 2;
    if (Math.abs(afterPos - beforePos) < 1e-9) return beforePos + 1;
    return mid;
  }

  function taskById(id) {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) return tasks[i];
    }
    return null;
  }

  async function persistPosition(taskId, position, statusOpt) {
    const body = { position: position };
    if (statusOpt != null) body.status = statusOpt;
    await api('/tasks/' + taskId + '/position', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async function applyDrop(targetStatus, insertBeforeId, zoneEl) {
    const pid = currentProjectId();
    if (!pid || !draggedTaskId) return;
    const task = taskById(draggedTaskId);
    if (!task || task.project_id !== pid) return;

    const others = tasksByStatus(pid, targetStatus)
      .filter(function (t) {
        return t.id !== draggedTaskId;
      })
      .sort(function (a, b) {
        return a.position - b.position;
      });

    let insertIndex = others.length;
    if (insertBeforeId) {
      const idx = others.findIndex(function (t) {
        return t.id === insertBeforeId;
      });
      if (idx >= 0) insertIndex = idx;
    }

    const before = insertIndex > 0 ? others[insertIndex - 1] : null;
    const after = insertIndex < others.length ? others[insertIndex] : null;
    const newPos = positionBetween(
      before ? before.position : null,
      after ? after.position : null
    );

    const statusChanged = task.status !== targetStatus;
    try {
      setStatus('Saving…');
      await persistPosition(
        task.id,
        newPos,
        statusChanged ? targetStatus : undefined
      );
      await refreshTasks();
      setStatus('');
    } catch (err) {
      setStatus(err.message || 'Could not update task');
    }
  }

  function onCardDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const zone = card.parentElement;
    if (!zone || !zone.dataset.dropZone) return;
  }

  function onCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const card = e.currentTarget;
    const zone = card.parentElement;
    if (!zone || !zone.dataset.dropZone) return;
    const targetStatus = zone.dataset.dropZone;
    const rect = card.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    let insertBeforeId = before ? card.dataset.taskId : null;
    if (!before) {
      const next = card.nextElementSibling;
      insertBeforeId = next && next.dataset ? next.dataset.taskId : null;
    }
    columnForZone(zone).classList.remove('is-drag-over');
    void applyDrop(targetStatus, insertBeforeId, zone);
  }

  function onZoneDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    const targetStatus = zone.dataset.dropZone;
    const col = columnForZone(zone);
    if (col) col.classList.remove('is-drag-over');
    if (e.target.closest && e.target.closest('.card')) return;
    void applyDrop(targetStatus, null, zone);
  }

  async function refreshProjects() {
    const data = await api('/projects', { method: 'GET' });
    projects = data || [];
    renderProjects();
    if (projects.length && !el.projectSelect.value) {
      el.projectSelect.value = projects[0].id;
    }
  }

  async function refreshTasks() {
    const pid = currentProjectId();
    if (!pid) {
      tasks = [];
      render();
      return;
    }
    const data = await api(
      '/tasks?project_id=' + encodeURIComponent(pid) + '&sort=position',
      { method: 'GET' }
    );
    tasks = (data && data.tasks) || [];
    render();
  }

  async function bootstrap() {
    try {
      setStatus('Loading…');
      await api('/users', { method: 'POST', body: '{}' });
      await refreshProjects();
      await refreshTasks();
      setStatus('');
    } catch (err) {
      setStatus(err.message || 'Failed to load');
    }
  }

  el.btnList.addEventListener('click', function () {
    setView('list');
  });
  el.btnBoard.addEventListener('click', function () {
    setView('board');
  });

  el.projectSelect.addEventListener('change', function () {
    void refreshTasks();
  });

  el.btnAddTask.addEventListener('click', function () {
    void addTask();
  });
  el.newTaskTitle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void addTask();
    }
  });

  async function addTask() {
    const pid = currentProjectId();
    const title = el.newTaskTitle.value.trim();
    if (!pid) {
      setStatus('Create or select a project first.');
      return;
    }
    if (!title) return;
    try {
      setStatus('');
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ project_id: pid, title: title }),
      });
      el.newTaskTitle.value = '';
      await refreshTasks();
    } catch (err) {
      setStatus(err.message || 'Could not create task');
    }
  }

  el.btnNewProject.addEventListener('click', async function () {
    const name = window.prompt('Project name');
    if (!name || !name.trim()) return;
    try {
      await api('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      await refreshProjects();
      el.projectSelect.value = projects[projects.length - 1].id;
      await refreshTasks();
    } catch (err) {
      setStatus(err.message || 'Could not create project');
    }
  });

  el.board.querySelectorAll('[data-drop-zone]').forEach(function (zone) {
    zone.addEventListener('dragover', onColumnDragOver);
    zone.addEventListener('dragleave', onColumnDragLeave);
    zone.addEventListener('drop', onZoneDrop);
  });

  void bootstrap();
})();

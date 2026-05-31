(() => {
  "use strict";

  const STORAGE_KEY = "todo.items.v1";

  /** @type {{id:string,text:string,done:boolean,createdAt:number}[]} */
  let todos = load();
  let filter = "all"; // "all" | "active" | "completed"

  // --- DOM refs ---
  const $list = document.getElementById("list");
  const $composer = document.getElementById("composer");
  const $input = document.getElementById("new-todo");
  const $filters = document.getElementById("filters");
  const $empty = document.getElementById("empty");
  const $footer = document.getElementById("footer");
  const $count = document.getElementById("count");
  const $clear = document.getElementById("clear-completed");
  const $today = document.getElementById("today");

  // --- Persistence ---
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* storage full or unavailable — ignore */
    }
  }

  // --- Helpers ---
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "completed") return todos.filter((t) => t.done);
    return todos;
  }

  // --- Actions ---
  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({ id: uid(), text: trimmed, done: false, createdAt: Date.now() });
    save();
    render();
  }

  function toggleTodo(id) {
    const t = todos.find((t) => t.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }

  function editTodo(id, text) {
    const t = todos.find((t) => t.id === id);
    if (!t) return;
    const trimmed = text.trim();
    if (trimmed) {
      t.text = trimmed;
    } else {
      todos = todos.filter((x) => x.id !== id); // empty edit deletes
    }
    save();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.done);
    save();
    render();
  }

  // --- Rendering ---
  function render() {
    const items = visibleTodos();
    $list.innerHTML = "";

    for (const todo of items) {
      $list.appendChild(renderItem(todo));
    }

    const hasAny = todos.length > 0;
    $empty.hidden = items.length > 0;
    if (items.length === 0) {
      $empty.textContent = hasAny
        ? "이 필터에 해당하는 할 일이 없습니다."
        : "할 일이 없습니다. 위에서 새로 추가해 보세요.";
    }

    $footer.hidden = !hasAny;
    const remaining = todos.filter((t) => !t.done).length;
    $count.textContent = `${remaining}개 남음 · 전체 ${todos.length}개`;
  }

  function renderItem(todo) {
    const li = document.createElement("li");
    li.className = "item" + (todo.done ? " is-done" : "");
    li.dataset.id = todo.id;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "item__check";
    check.checked = todo.done;
    check.setAttribute("aria-label", "완료 표시");
    check.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "item__text";
    text.textContent = todo.text;
    text.title = "더블클릭하여 수정";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const del = document.createElement("button");
    del.className = "item__delete";
    del.type = "button";
    del.innerHTML = "&times;";
    del.setAttribute("aria-label", "삭제");
    del.addEventListener("click", () => deleteTodo(todo.id));

    li.append(check, text, del);
    return li;
  }

  function startEdit(li, todo) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "item__edit";
    input.value = todo.text;
    input.maxLength = 200;

    const textEl = li.querySelector(".item__text");
    li.replaceChild(input, textEl);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      editTodo(todo.id, input.value);
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        committed = true;
        render(); // cancel
      }
    });
  }

  // --- Events ---
  $composer.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo($input.value);
    $input.value = "";
    $input.focus();
  });

  $filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filters__btn");
    if (!btn) return;
    filter = btn.dataset.filter;
    for (const b of $filters.children) {
      b.classList.toggle("is-active", b === btn);
    }
    render();
  });

  $clear.addEventListener("click", clearCompleted);

  // --- Init ---
  $today.textContent = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  render();
  $input.focus();
})();

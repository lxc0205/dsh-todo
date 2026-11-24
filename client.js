window.__ModuleLoader__.load({
  id: '@local/weekly-planner',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'local.weekly-planner';
    const PANEL_ID = 'weekly-planner-panel';
    const STORAGE_KEY = 'dsh.weekly-planner.tasks.v2';
    const SEED_TASKS = [];
    const TASKS_JSON_PATH = 'tasks.json'; // Set an absolute path locally to use the reveal button.

    const LIGHT = {
      page: '#ffffff',
      surface: '#f3f6fb',
      surfaceAlt: '#e8eef7',
      border: '#ccd6e4',
      borderStrong: '#9fb0c6',
      text: '#1f2937',
      muted: '#566273',
      success: '#15803d',
      warn: '#b45309',
      brand: '#2563eb',
      onBrand: '#ffffff',
      today: '#2563eb',
    };
    const DARK = {
      page: 'var(--dsw-alias-bg-base)',
      surface: 'var(--dsw-alias-bg-layer-1)',
      surfaceAlt: 'var(--dsw-alias-bg-layer-2)',
      border: 'var(--dsw-alias-border-l1)',
      borderStrong: 'var(--dsw-alias-border-l2)',
      text: 'var(--dsw-alias-label-primary)',
      muted: 'var(--dsw-alias-label-secondary)',
      success: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      brand: 'var(--dsw-alias-brand-primary)',
      onBrand: 'var(--dsw-alias-bg-base)',
      today: '#2563eb',
    };

    const dict = {
      zh: {
        panel: '工作日程',
        title: '工作日程',
        prev: '上一周',
        today: '本周',
        next: '下一周',
        total: '总量',
        done: '已完成',
        undone: '未完成',
        day0: '周一',
        day1: '周二',
        day2: '周三',
        day3: '周四',
        day4: '周五',
        day5: '周六',
        day6: '周日',
        noTasks: '暂无任务',
        addPlaceholder: '添加任务…',
        pastNoAdd: '已过日期不可新增，可删除已有任务',
        delete: '删除任务',
        edit: '修改任务',
        save: '保存',
        cancel: '取消',
        jsonButton: '打开json',
        jsonPathTitle: '任务 JSON 文件路径',
        jsonTip: '点击按钮在本地文件管理器中打开已迁移的任务 JSON 文件。',
        jsonOpenFailed: '无法自动打开文件管理器，请手动打开：',
      },
      en: {
        panel: 'Work Schedule',
        title: 'Work Schedule',
        prev: 'Previous week',
        today: 'This week',
        next: 'Next week',
        total: 'Total',
        done: 'Completed',
        undone: 'Open',
        day0: 'Monday',
        day1: 'Tuesday',
        day2: 'Wednesday',
        day3: 'Thursday',
        day4: 'Friday',
        day5: 'Saturday',
        day6: 'Sunday',
        noTasks: 'No tasks',
        addPlaceholder: 'Add a task…',
        pastNoAdd: 'Past days: adding disabled; existing tasks can be deleted',
        delete: 'Delete task',
        edit: 'Edit task',
        save: 'Save',
        cancel: 'Cancel',
        jsonButton: 'Open JSON',
        jsonPathTitle: 'Task JSON path',
        jsonTip: 'Click the button to open the migrated task JSON file in your local file manager.',
        jsonOpenFailed: 'Could not open the file manager automatically. Open it manually:',
      },
    };

    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function dateKey(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    }

    function addDays(d, n) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      x.setDate(x.getDate() + n);
      return x;
    }

    function startOfWeek(d) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const offset = (x.getDay() + 6) % 7;
      x.setDate(x.getDate() - offset);
      return x;
    }

    function normalizeTasks(data) {
      if (!Array.isArray(data)) return null;
      return data
        .filter(function (x) {
          return x && typeof x.id === 'string' && typeof x.title === 'string' && typeof x.date === 'string';
        })
        .map(function (x) {
          return {
            id: x.id,
            sourceId: typeof x.sourceId === 'string' ? x.sourceId : undefined,
            lastCopiedTo: typeof x.lastCopiedTo === 'string' ? x.lastCopiedTo : undefined,
            title: x.title,
            date: x.date,
            done: !!x.done,
            createdAt: typeof x.createdAt === 'number' ? x.createdAt : Date.now(),
          };
        });
    }

    function loadTasks() {
      const seeded = normalizeTasks(SEED_TASKS) || [];
      try {
        if (typeof window === 'undefined' || !window.localStorage) return seeded;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return seeded;
        const normalized = normalizeTasks(JSON.parse(raw));
        return normalized || seeded;
      } catch (_) {
        return seeded;
      }
    }

    function saveTasks(tasks) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (_) {
        /* Storage may be unavailable; the planner still works for this session. */
      }
    }

    return {
      inject: ['slots', 'locale', 'layout', 'remote', 'remote.session', 'theme'],
      apply(ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, dict);
        }, 'weekly-planner: dictionaries');
        const t = ctx.locale.bind(NS);

        function useLocaleTick() {
          const [, bump] = React.useReducer(function (n) { return n + 1; }, 0);
          React.useEffect(function () {
            if (typeof ctx.on !== 'function') return undefined;
            return ctx.on('locale/change', function () { bump(); });
          }, []);
        }

        function PlannerIcon(props) {
          const s = props.size || 20;
          return h('svg', {
            viewBox: '0 0 24 24', width: s, height: s, fill: 'none',
            stroke: 'currentColor', strokeWidth: 1.8,
            strokeLinecap: 'round', strokeLinejoin: 'round',
            'aria-hidden': true, style: { display: 'block' },
          },
            h('rect', { x: 3.5, y: 5, width: 17, height: 15, rx: 3 }),
            h('path', { d: 'M3.5 9.5h17M8 3v4M16 3v4' }),
            h('path', { d: 'm9 15 2 2 4-4' }),
          );
        }

        function PlannerPage() {
          useLocaleTick();
          const [tasks, setTasks] = React.useState(loadTasks);
          const [drafts, setDrafts] = React.useState({});
          const [editingId, setEditingId] = React.useState(null);
          const [editText, setEditText] = React.useState('');
          const [weekStart, setWeekStart] = React.useState(function () {
            return startOfWeek(new Date());
          });
          const scrollRef = React.useRef(null);
          const [isLight, setIsLight] = React.useState(function () {
            const theme = ctx.theme;
            const snap = theme && typeof theme.getTheme === 'function' ? theme.getTheme() : null;
            return !!(snap && snap.active && snap.active.colorScheme === 'light');
          });
          React.useEffect(function () {
            if (!ctx.theme || typeof ctx.theme.getTheme !== 'function') return undefined;
            function syncTheme(snap) {
              setIsLight(!!(snap && snap.active && snap.active.colorScheme === 'light'));
            }
            syncTheme(ctx.theme.getTheme());
            if (typeof ctx.on !== 'function') return undefined;
            return ctx.on('theme/change', syncTheme);
          }, []);

          React.useEffect(function () {
            function moveOverdueToToday() {
              const today = dateKey(new Date());
              setTasks(function (prev) {
                const normalized = prev.map(function (x) {
                  return x.sourceId ? x : Object.assign({}, x, { sourceId: x.id });
                });
                const todayBySource = {};
                normalized.forEach(function (x) {
                  if (x.date === today) todayBySource[x.sourceId || x.id] = true;
                });
                const overdue = normalized.filter(function (x) {
                  return !x.done && x.date < today;
                });
                if (!overdue.length) {
                  return normalized.some(function (x, i) { return x !== prev[i]; }) ? normalized : prev;
                }
                overdue.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
                const keep = {};
                overdue.forEach(function (x) {
                  keep[x.sourceId || x.id] = x;
                });
                const drop = {};
                overdue.forEach(function (x) {
                  const source = x.sourceId || x.id;
                  if (todayBySource[source] || keep[source] !== x) drop[x.id] = true;
                });
                const next = normalized.filter(function (x) { return !drop[x.id]; }).map(function (x) {
                  if (!drop[x.id] && overdue.indexOf(x) >= 0 && keep[x.sourceId || x.id] === x) {
                    return Object.assign({}, x, { date: today });
                  }
                  return x;
                });
                return next;
              });
            }
            moveOverdueToToday();
            const timer = window.setInterval(moveOverdueToToday, 60 * 1000);
            return function () { window.clearInterval(timer); };
          }, []);

          React.useEffect(function () {
            saveTasks(tasks);
          }, [tasks]);

          const weekDays = React.useMemo(function () {
            return Array.from({ length: 7 }, function (_, i) { return addDays(weekStart, i); });
          }, [weekStart]);
          const todayKey = dateKey(new Date());

          React.useEffect(function () {
            const el = scrollRef.current;
            if (!el || !el.firstChild) return;
            const cols = el.firstChild.children;
            let index = -1;
            for (let i = 0; i < weekDays.length; i += 1) {
              if (dateKey(weekDays[i]) === todayKey) { index = i; break; }
            }
            if (index < 0 || !cols[index]) return;
            const frame = window.requestAnimationFrame(function () {
              const col = cols[index];
              const box = el.getBoundingClientRect();
              const target = col.getBoundingClientRect();
              el.scrollLeft += (target.left + target.width / 2) - (box.left + box.width / 2);
            });
            return function () { window.cancelAnimationFrame(frame); };
          }, [weekStart, todayKey]);

          React.useEffect(function () {
            const el = scrollRef.current;
            if (!el) return undefined;
            function onWheel(e) {
              if (e.ctrlKey || e.shiftKey) return;
              const dx = e.deltaX || 0;
              const dy = e.deltaY || 0;
              if (Math.abs(dx) > Math.abs(dy) || !dy) return;
              let node = e.target && e.target.nodeType === 1 ? e.target : el;
              while (node && node !== el) {
                const overflowY = window.getComputedStyle(node).overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                  const max = node.scrollHeight - node.clientHeight;
                  if (max > 1) {
                    const canScroll = dy > 0 ? node.scrollTop < max - 1 : node.scrollTop > 1;
                    if (canScroll) return;
                  }
                }
                node = node.parentElement;
              }
              el.scrollLeft += dy;
              e.preventDefault();
            }
            el.addEventListener('wheel', onWheel, { passive: false });
            return function () { el.removeEventListener('wheel', onWheel); };
          }, []);

          const dayNames = [t('day0'), t('day1'), t('day2'), t('day3'), t('day4'), t('day5'), t('day6')];

          function tasksOf(key) {
            return tasks
              .filter(function (x) { return x.date === key; })
              .sort(function (a, b) { return a.createdAt - b.createdAt; });
          }

          function addTask(key) {
            if (key < todayKey) return;
            const title = (drafts[key] || '').trim();
            if (!title) return;
            setTasks(function (prev) {
              return prev.concat([{ id: uid(), title: title, date: key, done: false, createdAt: Date.now() }]);
            });
            setDrafts(function (prev) {
              const next = Object.assign({}, prev);
              next[key] = '';
              return next;
            });
          }

          function toggleTask(id) {
            setTasks(function (prev) {
              return prev.map(function (x) {
                return x.id === id ? Object.assign({}, x, { done: !x.done }) : x;
              });
            });
          }

          function removeTask(id) {
            setTasks(function (prev) {
              return prev.filter(function (x) { return x.id !== id; });
            });
          }

          function startEdit(task) {
            setEditingId(task.id);
            setEditText(task.title);
          }

          function saveEdit() {
            const title = editText.trim();
            if (!title) return;
            const id = editingId;
            setTasks(function (prev) {
              return prev.map(function (x) {
                return x.id === id ? Object.assign({}, x, { title: title }) : x;
              });
            });
            setEditingId(null);
            setEditText('');
          }

          function cancelEdit() {
            setEditingId(null);
            setEditText('');
          }

          async function revealJson() {
            const remote = ctx.remote;
            const session = remote && remote.session;
            if (!session || typeof session.openWorkspacePath !== 'function') return;
            try {
              await session.openWorkspacePath({ path: TASKS_JSON_PATH, action: 'reveal' });
            } catch (_) {
              // Opening the file manager is best-effort; no UI message is shown.
            }
          }

          const c = isLight ? LIGHT : DARK;
          const s = {
            root: {
              boxSizing: 'border-box', width: '100%', height: 'auto', minHeight: '100%', overflow: 'auto',
              display: 'flex', flexDirection: 'column', transform: 'translateY(-32px)',
              padding: '40px 36px 16px', background: c.page,
              color: c.text, fontFamily: 'inherit',
            },
            header: {
              flex: 'none', marginBottom: 20, minHeight: 120,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 20, flexWrap: 'wrap',
            },
            title: { margin: 0, fontSize: 24, fontWeight: 600 },
            nav: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
            btn: {
              cursor: 'pointer', padding: '7px 12px', borderRadius: 8, fontSize: 13,
              border: '1px solid ' + c.border,
              background: c.surfaceAlt,
              color: c.text,
            },
            jsonBtn: {
              cursor: 'pointer', padding: '10px 18px', borderRadius: 8, fontSize: 14,
              border: 'none',
              background: '#2563eb',
              color: '#ffffff', fontWeight: 600,
            },
            dayStat: { display: 'flex', gap: 3, fontSize: 12, fontWeight: 600 },
            legend: {
              marginBottom: 20, fontSize: 12, textAlign: 'right',
              color: c.muted,
            },
            grid: {
              display: 'grid', gridTemplateColumns: 'repeat(7, minmax(300px, 1fr))',
              gap: 14, alignItems: 'stretch',
            },
            col: {
              boxSizing: 'border-box', height: 360, minHeight: 360, maxHeight: 360,
              padding: 12, borderRadius: 12,
              border: '1px solid ' + c.border,
              borderTop: '3px solid ' + c.borderStrong,
              background: c.surface,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            },
            colToday: { borderTopColor: c.today },
            colHead: {
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 6, marginBottom: 10,
            },
            dayName: { fontSize: 12, color: c.muted },
            todayDot: {
              width: 6, height: 6, borderRadius: '50%', background: c.today,
              display: 'inline-block', flex: 'none',
            },
            dateNum: { fontSize: 16, fontWeight: 600, color: c.text },
            dayCount: { fontSize: 11, color: c.muted },
            list: {
              flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 8,
              minHeight: 0, maxHeight: 240, overflowY: 'auto', paddingRight: 2,
            },
            empty: { fontSize: 12, color: c.muted, padding: '12px 0' },
            task: {
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px',
              borderRadius: 8, border: '1px solid ' + c.border,
              background: c.surfaceAlt,
            },
            taskTitle: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' },
            taskTitleDone: { textDecoration: 'line-through', color: c.muted },
            badge: {
              display: 'inline-block', marginTop: 4, padding: '1px 6px', borderRadius: 6,
              fontSize: 10, border: '1px solid ' + c.borderStrong,
              background: c.surface,
              color: c.warn,
            },
            delBtn: {
              cursor: 'pointer', flex: 'none', width: 26, height: 24, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
              border: '1px solid ' + c.border,
              background: c.surface,
              color: c.muted,
            },
            editBtn: {
              cursor: 'pointer', flex: 'none', width: 26, height: 24, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
              border: '1px solid ' + c.border,
              background: c.surface,
              color: c.brand,
            },
            miniBtn: {
              cursor: 'pointer', flex: 'none', width: 26, height: 24, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
              border: '1px solid ' + c.border,
              background: c.surface,
              color: c.text,
            },
            editInput: {
              flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '4px 6px',
              borderRadius: 6, border: '1px solid ' + c.brand,
              background: c.surfaceAlt,
              color: c.text, fontSize: 12, outline: 'none',
            },
            addRow: { display: 'flex', gap: 6, marginTop: 10 },
            pastHint: {
              marginTop: 10, fontSize: 11, lineHeight: 1.4,
              color: c.muted,
            },
            input: {
              flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '7px 8px',
              borderRadius: 7, border: '1px solid ' + c.border,
              background: c.surfaceAlt,
              color: c.text, fontSize: 12, outline: 'none',
            },
            addBtn: {
              cursor: 'pointer', flex: 'none', padding: '0 10px', borderRadius: 7,
              border: 'none', fontSize: 14, fontWeight: 600,
              background: c.brand, color: c.onBrand,
            },
            footer: {
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: 12, marginTop: 20, flexWrap: 'wrap',
            },
            btnPrimary: {
              cursor: 'pointer', padding: '7px 14px', borderRadius: 8, fontSize: 13,
              border: 'none', background: c.brand,
              color: c.onBrand,
            },
          };

          function renderDay(day, i) {
            const key = dateKey(day);
            const list = tasksOf(key);
            const dayDone = list.filter(function (x) { return x.done; }).length;
            const isToday = key === todayKey;
            const isPast = key < todayKey;
            return h('div', {
              key: key,
              style: isToday ? Object.assign({}, s.col, s.colToday) : s.col,
            },
              h('div', { style: s.colHead },
                h('div', {},
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                    isToday ? h('span', { style: s.todayDot }) : null,
                    h('div', { style: s.dayName }, dayNames[i]),
                  ),
                  h('div', { style: s.dateNum }, (day.getMonth() + 1) + '/' + day.getDate()),
                ),
                h('div', {
                  style: s.dayStat,
                  title: t('done') + ' / ' + t('undone') + ' / ' + t('total'),
                },
                  h('span', { style: { color: c.success } }, String(dayDone)),
                  h('span', { style: { color: c.muted } }, '/'),
                  h('span', { style: { color: c.warn } }, String(list.length - dayDone)),
                  h('span', { style: { color: c.muted } }, '/'),
                  h('span', { style: { color: c.text } }, String(list.length)),
                ),
              ),
              h('div', { style: s.list },
                list.length === 0 ? h('div', { style: s.empty }, t('noTasks')) : null,
                list.map(function (task) {
                  const editing = editingId === task.id;
                  return h('div', { key: task.id, style: s.task },
                    h('input', {
                      type: 'checkbox', checked: task.done,
                      onChange: function () { toggleTask(task.id); },
                      style: {
                        margin: 0, marginTop: 2, cursor: 'pointer',
                        accentColor: c.brand,
                      },
                      'aria-label': t('done'),
                    }),
                    editing
                      ? h('input', {
                          type: 'text', value: editText, autoFocus: true,
                          style: s.editInput,
                          onChange: function (e) { setEditText(e.target.value); },
                          onKeyDown: function (e) {
                            if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                            else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                          },
                          'aria-label': t('edit'),
                        })
                      : h('div', { style: { flex: 1, minWidth: 0 } },
                          h('div', {
                            style: task.done ? Object.assign({}, s.taskTitle, s.taskTitleDone) : s.taskTitle,
                          }, task.title),
                        ),
                    editing
                      ? h('button', {
                          type: 'button', onClick: saveEdit,
                          style: s.miniBtn, title: t('save'), 'aria-label': t('save'),
                        },
                          h('svg', {
                            width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                            stroke: 'currentColor', strokeWidth: 2,
                            strokeLinecap: 'round', strokeLinejoin: 'round',
                            'aria-hidden': 'true',
                          }, h('path', { d: 'M20 6 9 17l-5-5' })),
                        )
                      : h('button', {
                          type: 'button', onClick: function () { startEdit(task); },
                          style: s.editBtn, title: t('edit'), 'aria-label': t('edit'),
                        },
                          h('svg', {
                            width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                            stroke: 'currentColor', strokeWidth: 2,
                            strokeLinecap: 'round', strokeLinejoin: 'round',
                            'aria-hidden': 'true',
                          },
                            h('path', { d: 'M12 20h9' }),
                            h('path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' }),
                          ),
                        ),
                    editing
                      ? h('button', {
                          type: 'button', onClick: cancelEdit,
                          style: s.miniBtn, title: t('cancel'), 'aria-label': t('cancel'),
                        },
                          h('svg', {
                            width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                            stroke: 'currentColor', strokeWidth: 2,
                            strokeLinecap: 'round', strokeLinejoin: 'round',
                            'aria-hidden': 'true',
                          }, h('path', { d: 'M18 6 6 18M6 6l12 12' })),
                        )
                      : null,
                    h('button', {
                      type: 'button', onClick: function () { removeTask(task.id); },
                      style: s.delBtn, title: t('delete'), 'aria-label': t('delete'),
                    },
                      h('svg', {
                        width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
                        stroke: 'currentColor', strokeWidth: 2,
                        strokeLinecap: 'round', strokeLinejoin: 'round',
                        'aria-hidden': 'true',
                      },
                        h('path', { d: 'M3 6h18' }),
                        h('path', { d: 'M8 6V4h8v2' }),
                        h('path', { d: 'M19 6l-1 14H6L5 6' }),
                        h('path', { d: 'M10 11v6M14 11v6' }),
                      ),
                    ),
                  );
                }),
              ),
              isPast
                ? h('div', { style: s.pastHint }, t('pastNoAdd'))
                : h('div', { style: s.addRow },
                    h('input', {
                      type: 'text', value: drafts[key] || '', placeholder: t('addPlaceholder'),
                      onChange: function (e) {
                        const value = e.target.value;
                        setDrafts(function (prev) {
                          const next = Object.assign({}, prev);
                          next[key] = value;
                          return next;
                        });
                      },
                      onKeyDown: function (e) {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTask(key);
                        }
                      },
                      style: s.input,
                    }),
                    h('button', {
                      type: 'button', onClick: function () { addTask(key); }, style: s.addBtn,
                    }, '+'),
                  ),
            );
          }

          return h('div', { className: 'wp-root', style: s.root },
            h('div', { style: s.header },
              h('h1', { style: s.title }, t('title')),
              h('div', { style: s.nav },
                h('button', {
                  type: 'button', style: s.btn,
                  onClick: function () { setWeekStart(addDays(weekStart, -7)); },
                }, t('prev')),
                h('button', {
                  type: 'button', style: s.btn,
                  onClick: function () { setWeekStart(startOfWeek(new Date())); },
                }, t('today')),
                h('button', {
                  type: 'button', style: s.btn,
                  onClick: function () { setWeekStart(addDays(weekStart, 7)); },
                }, t('next')),
              ),
            ),
            h('div', { ref: scrollRef, style: { overflowX: 'auto', paddingBottom: 4, marginBottom: 8 } },
              h('div', { style: s.grid }, weekDays.map(renderDay)),
            ),
            h('div', { style: s.legend },
              h('span', { style: { color: c.success } }, t('done')),
              ' · ',
              h('span', { style: { color: c.warn } }, t('undone')),
              ' · ',
              h('span', { style: { color: c.text } }, t('total')),
            ),
            h('div', { style: s.footer },
              h('button', {
                type: 'button', style: s.jsonBtn, onClick: revealJson,
              }, t('jsonButton')),
            ),
          );
        }

        ctx.effect(function () {
          let active;
          try {
            active = ctx.layout && ctx.layout.panelInfo && ctx.layout.panelInfo.getSnapshot
              ? ctx.layout.panelInfo.getSnapshot().activePanelId
              : undefined;
          } catch (_) {
            active = undefined;
          }
          const disposeMain = ctx.slots.inject('main', function () {
            return ctx.slots.register({
              name: 'main', key: PANEL_ID, locale: NS,
            }, PlannerPage);
          });
          const disposeEntry = ctx.slots.inject('sidebar.panellist', function () {
            return ctx.slots.register({
              name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS,
              label: function () { return t('panel'); },
            }, PlannerIcon);
          });
          return function () {
            disposeEntry();
            disposeMain();
            if (active === PANEL_ID && ctx.layout && typeof ctx.layout.selectPanel === 'function') {
              ctx.layout.selectPanel(null);
            }
          };
        }, 'weekly-planner: panel and sidebar entry');
      },
    };
  },
});

import { Bell, BookOpen, ChevronDown, ChevronRight, Columns3, FlaskConical, House, Layers3, List, Menu, Plus, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { personById } from './model/config'
import type { Flag, PersonId, Status, View } from './model/config'
import { initialState, loadState, storageKey } from './model/storage'
import type { UiState } from './model/storage'
import { addNote, createTask, emptyFilters, filterTasks, localDay, sortTasks, taskNumber, updateTask } from './model/workflow'
import type { Intake, TaskDetails } from './model/workflow'
import { Overview } from './ui/Overview'
import { ActivityView, Guide } from './ui/SupportViews'
import { NewTaskDialog, TaskDrawer } from './ui/TaskDialogs'
import { Board, PersonaPicker, TaskFilters, TaskList } from './ui/TaskViews'
import { Avatar, Modal, PageHeading } from './ui/shared'

const pages = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'list', label: 'Task List', icon: List },
  { id: 'mine', label: 'My Tasks', icon: UserRound },
  { id: 'activity', label: 'Activity & Reminders', icon: Bell },
  { id: 'guide', label: 'Demo Guide', icon: BookOpen },
] as const

const pageCopy = {
  board: ['Production board', 'Follow each task from intake to final review. Open a card to move it to another stage.'],
  list: ['Task List', 'Review ownership, priorities, and deadlines across the team.'],
  mine: ['My Tasks', 'Switch demo teammates to see the tasks each person is responsible for.'],
} as const

type Overlay = { kind: 'task'; id: string } | { kind: 'create' | 'reset' } | null

export function App() {
  const [state, setState] = useState(loadState)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [notice, setNotice] = useState('')
  const [today, setToday] = useState(() => localDay(new Date()))
  const { tasks, ui } = state
  const { view, filters, sort, persona } = ui
  const page = pages.find(item => item.id === view)!
  const selected = overlay?.kind === 'task' ? tasks.find(task => task.id === overlay.id) : undefined

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
  }, [state])

  useEffect(() => {
    const refresh = () => setToday(localDay(new Date()))
    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const updateUi = (patch: Partial<UiState>) => setState(current => ({ ...current, ui: { ...current.ui, ...patch } }))
  const choosePerson = (id: PersonId) => updateUi({ persona: id })
  const onOpen = (id: string) => setOverlay({ kind: 'task', id })
  const onCreate = () => setOverlay({ kind: 'create' })
  const close = () => setOverlay(null)

  function navigate(next: View, nextFilters = emptyFilters) {
    updateUi({ view: next, filters: nextFilters })
    setMobileNav(false)
    window.scrollTo(0, 0)
  }

  const showFlag = (flag: Flag) => navigate('list', { ...emptyFilters, flag })
  const showStage = (status: Status) => navigate('board', { ...emptyFilters, status })

  function create(intake: Intake) {
    const now = new Date().toISOString()
    setState(current => {
      const next = Math.max(100, ...current.tasks.map(task => Number(task.id.slice(3)))) + 1
      return {
        tasks: [createTask(taskNumber(next), intake, current.ui.persona, now), ...current.tasks],
        ui: { ...current.ui, view: 'board', filters: { ...emptyFilters } },
      }
    })
    close()
    window.scrollTo(0, 0)
    setNotice('Task added to the New column.')
  }

  function save(details: TaskDetails) {
    const id = selected?.id
    const now = new Date().toISOString()
    setState(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? updateTask(task, details, current.ui.persona, now) : task) }))
  }

  function note(text: string) {
    const id = selected?.id
    const now = new Date().toISOString()
    setState(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? addNote(task, text, current.ui.persona, now) : task) }))
  }

  function reset() {
    const now = new Date()
    setState(initialState(now))
    setToday(localDay(now))
    close()
    window.scrollTo(0, 0)
    setNotice('Demo restored to the original examples.')
  }

  function navItems(items: readonly typeof pages[number][]) {
    return items.map(({ id, label, icon: Icon }) =>
      <button key={id} aria-current={view === id ? 'page' : undefined} className="nav-item" onClick={() => {
        if (id === view) setMobileNav(false)
        else if ((id === 'board' || id === 'list') && (view === 'board' || view === 'list')) navigate(id, filters)
        else navigate(id)
      }}><Icon size={18} /><span>{label}</span>{view === id && <span className="nav-mark" />}</button>,
    )
  }

  const personal = view === 'mine'
  const taskPage = view === 'board' || view === 'list' || personal
  const found = taskPage ? filterTasks(personal ? tasks.filter(task => task.ownerId === persona) : tasks, filters, today) : []
  const currentPerson = personById[persona]

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <div className="sidebar-top">
        <button className="brand" onClick={() => navigate('overview')} aria-label="Production Flow overview">
          <span className="brand-icon"><Layers3 size={23} /></span><span><strong>Production Flow</strong><small>Team workspace</small></span>
        </button>
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(open => !open)} aria-label={mobileNav ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNav} aria-controls="sidebar-content">
          {mobileNav ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
      <div id="sidebar-content" className={'sidebar-content' + (mobileNav ? ' mobile-open' : '')}>
        <nav aria-label="Main navigation">
          <p className="nav-label">Workspace</p>{navItems(pages.slice(0, 4))}
          <p className="nav-label nav-label-secondary">Tools</p>{navItems(pages.slice(4))}
        </nav>
        <div className="profile">
          <Avatar id={persona} />
          <div className="profile-details"><div className="profile-select"><PersonaPicker persona={persona} onChange={choosePerson} id="sidebar-persona" /><ChevronDown size={14} /></div><small>{currentPerson.role} · Demo persona</small></div>
        </div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{page.label}</strong></div>
        <button className="button primary" onClick={onCreate}><Plus size={18} />New task</button>
      </header>
      <main id="main" className="content" tabIndex={-1}>
        <div className="demo-banner"><FlaskConical size={17} /><span>Interactive demo <b>•</b> Fictional data <b>•</b> No live integrations</span></div>
        {!storageAvailable && <p className="inline-alert alert-amber storage-alert" role="status">Browser storage is unavailable. Changes will last until this tab closes or reloads.</p>}
        {view === 'overview' && <Overview tasks={tasks} today={today} onOpen={onOpen} onFilter={showFlag} onStage={showStage} onBoard={() => navigate('board')} onList={() => navigate('list')} />}
        {taskPage && <>
          <PageHeading title={pageCopy[view][0]} description={pageCopy[view][1]}>
            {personal ? <div className="persona-control"><Avatar id={persona} size="small" /><PersonaPicker persona={persona} onChange={choosePerson} id="task-persona" /></div> :
              <div className="view-switch" role="group" aria-label="Task view">
                <button aria-pressed={view === 'board'} onClick={() => navigate('board', filters)}><Columns3 size={16} />Board</button>
                <button aria-pressed={view === 'list'} onClick={() => navigate('list', filters)}><List size={16} />List</button>
              </div>}
          </PageHeading>
          <TaskFilters filters={filters} count={found.length} onChange={value => updateUi({ filters: value })} personal={personal} />
          {view === 'board'
            ? <Board tasks={found} today={today} statusFilter={filters.status} onOpen={onOpen} />
            : <TaskList tasks={sortTasks(found, sort)} today={today} sort={sort} onSort={value => updateUi({ sort: value })} onOpen={onOpen} />}
        </>}
        {view === 'activity' && <ActivityView tasks={tasks} today={today} onOpen={onOpen}
          filter={ui.reminderFilter} onFilter={value => updateUi({ reminderFilter: value })} />}
        {view === 'guide' && <Guide onNavigate={navigate} onCreate={onCreate} onReset={() => setOverlay({ kind: 'reset' })} />}
      </main>
    </div>
    <div className={notice ? 'toast visible' : 'toast'} role="status">{notice}</div>
    {overlay?.kind === 'create' && <NewTaskDialog onClose={close} onCreate={create} />}
    {selected && <TaskDrawer key={selected.id} task={selected} onClose={close} onSave={save} onNote={note} />}
    {overlay?.kind === 'reset' && <Modal title="Reset demo?" onClose={close}>
      <div className="dialog-form">
        <p className="muted">This restores the original example tasks and clears your edits, notes, and filters in this browser.</p>
        <div className="dialog-actions"><button className="button secondary" onClick={close}>Cancel</button><button className="button primary" onClick={reset}>Reset demo</button></div>
      </div>
    </Modal>}
  </div>
}

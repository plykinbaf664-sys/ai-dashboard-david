import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, CircleAlert, Search, X } from 'lucide-react'
import { flagLabels, people, priorities, statuses } from '../model/config'
import type { PersonId } from '../model/config'
import { emptyFilters, needsInformation } from '../model/workflow'
import type { Filters, Sort, SortKey, Task } from '../model/workflow'
import { Avatar, DueDate, Empty, PriorityBadge, StatusBadge } from './shared'

export function PersonaPicker({ persona, onChange, id }: {
  persona: PersonId
  onChange: (id: PersonId) => void
  id: string
}) {
  return <select id={id} aria-label="Demo persona" value={persona} onChange={event => onChange(event.target.value as PersonId)}>
    {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
  </select>
}

export function TaskFilters({ filters, count, onChange, personal }: {
  filters: Filters
  count: number
  onChange: (filters: Filters) => void
  personal: boolean
}) {
  const changed = Object.values(filters).some(Boolean)
  return <div className="panel filter-panel">
    <div className="filter-controls">
      <label className="search"><Search size={17} /><input type="search" aria-label="Search tasks" placeholder="Search tasks…" value={filters.search}
        onChange={event => onChange({ ...filters, search: event.target.value })} /></label>
      {!personal && <select aria-label="Filter by owner" value={filters.owner} onChange={event => onChange({ ...filters, owner: event.target.value })}>
        <option value="">All owners</option><option value="unassigned">Unassigned</option>
        {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select>}
      <select aria-label="Filter by status" value={filters.status} onChange={event => onChange({ ...filters, status: event.target.value })}>
        <option value="">All statuses</option>{statuses.map(status => <option key={status.id} value={status.id}>{status.label}</option>)}
      </select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={event => onChange({ ...filters, priority: event.target.value })}>
        <option value="">All priorities</option>{priorities.map(priority => <option key={priority}>{priority}</option>)}
      </select>
    </div>
    <div className="filter-info">
      <span role="status">{count} {count === 1 ? 'task' : 'tasks'}</span>
      {filters.flag && <button className="badge tone-violet removable" onClick={() => onChange({ ...filters, flag: '' })} aria-label={'Remove ' + flagLabels[filters.flag] + ' filter'}>{flagLabels[filters.flag]}<X size={13} /></button>}
      {changed && <button className="text-button" onClick={() => onChange({ ...emptyFilters })}>Clear filters</button>}
    </div>
  </div>
}

export function Board({ tasks, today, statusFilter, onOpen }: {
  tasks: Task[]
  today: string
  statusFilter: string
  onOpen: (id: string) => void
}) {
  const columns = statuses.filter(status => !statusFilter || status.id === statusFilter)
  if (!tasks.length) return <div className="panel"><Empty title="No matching tasks.">Try changing the filters or search.</Empty></div>
  return <div className={'board-scroll' + (columns.length === 1 ? ' single-column' : '')} role="region" aria-label="Task board" tabIndex={0}>
    <div className="board-columns" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(var(--column-width), 1fr))` }}>
      {columns.map(status => {
        const columnTasks = tasks.filter(task => task.status === status.id)
        return <section className="board-column" key={status.id} aria-label={status.label}>
          <div className={'column-head tone-' + status.color}><span className="dot" /><h2>{status.label}</h2><span className="count">{columnTasks.length}</span></div>
          {columnTasks.map(task => <button className="task-card" onClick={() => onOpen(task.id)} key={task.id}>
            <span className="card-top"><span>{task.id}</span><PriorityBadge priority={task.priority} /></span>
            <strong>{task.title}</strong>
            {needsInformation(task) && <span className="card-signal"><CircleAlert size={13} />Missing details</span>}
            {task.status === 'done' && <span className="card-signal done-text"><CheckCircle2 size={13} />Completed</span>}
            <span className="card-footer"><Avatar id={task.ownerId} size="small" label /><DueDate task={task} today={today} showDate /></span>
          </button>)}
          {!columnTasks.length && <p className="column-empty">No tasks in this stage.</p>}
        </section>
      })}
    </div>
  </div>
}

const columnLabels: Record<SortKey, string> = { title: 'Task', status: 'Status', ownerId: 'Owner', priority: 'Priority', dueAt: 'Due date' }
const columns = Object.keys(columnLabels) as SortKey[]
export function TaskList({ tasks, today, sort, onSort, onOpen }: {
  tasks: Task[]
  today: string
  sort: Sort
  onSort: (sort: Sort) => void
  onOpen: (id: string) => void
}) {
  if (!tasks.length) return <div className="panel"><Empty title="No matching tasks.">Try changing the filters or search.</Empty></div>
  return <div className="panel table-scroll" role="region" aria-label="Task list" tabIndex={0}>
    <table>
      <thead><tr>{columns.map(key => {
        const active = sort.key === key
        const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
        return <th key={key} scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
          <button onClick={() => onSort({ key, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' })}>{columnLabels[key]}<Icon size={13} /></button>
        </th>
      })}</tr></thead>
      <tbody>{tasks.map(task => <tr key={task.id}>
        <td><button className="table-task" onClick={() => onOpen(task.id)}><strong>{task.title}</strong><span>{task.id}{needsInformation(task) && ' · Missing details'}</span></button></td>
        <td><StatusBadge status={task.status} /></td><td><Avatar id={task.ownerId} label size="small" /></td>
        <td><PriorityBadge priority={task.priority} /></td><td><DueDate task={task} today={today} showDate /></td>
      </tr>)}</tbody>
    </table>
  </div>
}

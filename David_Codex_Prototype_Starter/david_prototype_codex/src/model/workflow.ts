import { checklistKeys, personById, priorities, statusById, statuses } from './config.ts'
import type { ChecklistKey, Flag, PersonId, Priority, Source, Status } from './config.ts'

export type ActivityKind = 'created' | 'status' | 'handoff' | 'edit' | 'note'
export type Entry = { kind: ActivityKind; at: string; actorId: PersonId; text: string }
export type TaskDetails = {
  status: Status
  priority: Priority
  ownerId: PersonId | null
  dueAt: string
  productionBrief: string
  requiredInformation: Record<ChecklistKey, boolean>
}
export type Intake = Pick<TaskDetails, 'priority' | 'ownerId' | 'dueAt'> & {
  title: string
  description: string
  source: Source
}
export type Task = Intake & TaskDetails & { id: string; createdAt: string; updatedAt: string; history: Entry[] }
export type Filters = { search: string; owner: string; status: string; priority: string; flag: Flag | '' }
export type SortKey = 'title' | 'status' | 'ownerId' | 'priority' | 'dueAt'
export type Sort = { key: SortKey; direction: 'asc' | 'desc' }

export const emptyFilters: Filters = { search: '', owner: '', status: '', priority: '', flag: '' }
export const emptyChecklist = { scope: false, inputs: false, acceptance: false }
const dayMs = 86_400_000
export const ownerName = (id: PersonId | null) => id ? personById[id].name : 'Unassigned'
export const taskNumber = (number: number) => 'PF-' + String(number).padStart(3, '0')

export function dateKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index ? String(part).padStart(2, '0') : String(part))
    .join('-')
}

export function localDay(date: Date, days = 0) {
  return dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

export function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function daysUntil(due: string, today: string) {
  return (Date.parse(due) - Date.parse(today)) / dayMs
}

export function missingInformation(details: TaskDetails) {
  return !details.productionBrief.trim() || checklistKeys.some(key => !details.requiredInformation[key])
}

export function needsInformation(task: Task) {
  return task.status !== 'done' && missingInformation(task)
}

export function matchesFlag(task: Task, flag: Flag, today: string) {
  if (task.status === 'done') return false
  const days = daysUntil(task.dueAt, today)
  switch (flag) {
    case 'active': return true
    case 'soon': return days >= 0 && days <= 2
    case 'overdue': return days < 0
    case 'missing': return needsInformation(task)
  }
}

export function metrics(tasks: Task[], today: string) {
  return {
    active: tasks.filter(task => matchesFlag(task, 'active', today)).length,
    soon: tasks.filter(task => matchesFlag(task, 'soon', today)).length,
    overdue: tasks.filter(task => matchesFlag(task, 'overdue', today)).length,
    missing: tasks.filter(task => matchesFlag(task, 'missing', today)).length,
  }
}

export function filterTasks(tasks: Task[], filters: Filters, today: string) {
  const query = filters.search.trim().toLowerCase()
  return tasks.filter(task =>
    (!query || [task.id, task.title, task.description, task.productionBrief, ownerName(task.ownerId)]
      .some(value => value.toLowerCase().includes(query))) &&
    (!filters.owner || (task.ownerId ?? 'unassigned') === filters.owner) &&
    (!filters.status || task.status === filters.status) &&
    (!filters.priority || task.priority === filters.priority) &&
    (!filters.flag || matchesFlag(task, filters.flag, today)),
  )
}

export function sortTasks(tasks: Task[], sort: Sort) {
  const statusOrder = statuses.map(status => status.id)
  function value(task: Task) {
    if (sort.key === 'ownerId') return ownerName(task.ownerId)
    if (sort.key === 'priority') return priorities.indexOf(task.priority)
    if (sort.key === 'status') return statusOrder.indexOf(task.status)
    return task[sort.key]
  }
  return [...tasks].sort((a, b) => {
    const first = value(a)
    const second = value(b)
    const comparison = typeof first === 'number' && typeof second === 'number'
      ? first - second
      : String(first).localeCompare(String(second))
    return comparison * (sort.direction === 'asc' ? 1 : -1) || a.id.localeCompare(b.id)
  })
}

export function detailsOf(task: Task): TaskDetails {
  const { ownerId, priority, status, dueAt, productionBrief, requiredInformation } = task
  return { ownerId, priority, status, dueAt, productionBrief, requiredInformation }
}

export function validateDetails(details: TaskDetails) {
  if (!validDay(details.dueAt)) return 'Choose a valid due date.'
  const productionSteps = statuses.slice(statuses.findIndex(status => status.id === 'ready'))
  if (productionSteps.some(status => status.id === details.status) && missingInformation(details)) {
    return 'Add a production brief and check all required information before moving this task to production or beyond.'
  }
  return ''
}

export function createTask(id: string, intake: Intake, actorId: PersonId, at: string): Task {
  const { title, description, ...rest } = intake
  return {
    ...rest, id, title: title.trim(), description: description.trim(), status: 'new',
    productionBrief: '', requiredInformation: { ...emptyChecklist }, createdAt: at, updatedAt: at,
    history: [{ kind: 'created', at, actorId, text: 'Task created from ' + intake.source.toLowerCase() + ' intake.' }],
  }
}

export function updateTask(task: Task, details: TaskDetails, actorId: PersonId, at: string): Task {
  const clean = { ...details, productionBrief: details.productionBrief.trim() }
  const error = validateDetails(clean)
  if (error) throw new Error(error)
  const changes: Entry[] = []
  const log = (kind: ActivityKind, text: string) => changes.push({ kind, at, actorId, text })
  if (task.status !== clean.status) log('status', statusById[task.status].label + ' → ' + statusById[clean.status].label)
  if (task.ownerId !== clean.ownerId) log('handoff', ownerName(task.ownerId) + ' → ' + ownerName(clean.ownerId))
  if (task.priority !== clean.priority) log('edit', 'Priority changed to ' + clean.priority.toLowerCase() + '.')
  if (task.dueAt !== clean.dueAt) log('edit', 'Due date changed to ' + clean.dueAt + '.')
  if (task.productionBrief !== clean.productionBrief) log('edit', 'Production brief updated.')
  if (checklistKeys.some(key => task.requiredInformation[key] !== clean.requiredInformation[key])) log('edit', 'Required information checklist updated.')
  if (!changes.length) return task
  return { ...task, ...clean, updatedAt: at, history: [...changes, ...task.history] }
}

export function addNote(task: Task, note: string, actorId: PersonId, at: string): Task {
  const text = note.trim()
  if (!text) return task
  return { ...task, updatedAt: at, history: [{ kind: 'note', at, actorId, text }, ...task.history] }
}

export type ReminderKind = 'soon' | 'overdue' | 'missing' | 'handoff' | 'escalation'
export type Reminder = { id: string; task: Task; kind: ReminderKind; text: string }
export const reminderLabels: Record<ReminderKind, string> = {
  soon: 'Due soon', overdue: 'Overdue', missing: 'Missing brief details', handoff: 'Owner handoff', escalation: 'Missed deadline escalation',
}

export function reminders(tasks: Task[], today: string): Reminder[] {
  const inbox: Reminder[] = []
  for (const task of sortTasks(tasks, { key: 'dueAt', direction: 'asc' })) {
    const owner = ownerName(task.ownerId)
    const add = (kind: ReminderKind, text: string) => inbox.push({ id: task.id + '-' + kind, task, kind, text })
    if (matchesFlag(task, 'overdue', today)) {
      if (daysUntil(task.dueAt, today) <= -1) add('escalation', 'Would alert ' + personById.alex.name + ' (operations lead) to review the missed deadline.')
      add('overdue', task.ownerId ? 'Would remind ' + owner + ' to review the missed deadline.' : 'An owner needs to be assigned before a reminder can be routed.')
    }
    if (matchesFlag(task, 'soon', today)) add('soon', task.ownerId ? 'Would remind ' + owner + ' about the upcoming deadline.' : 'An owner needs to be assigned before a reminder can be routed.')
    if (needsInformation(task)) add('missing', task.ownerId ? 'Would ask ' + owner + ' to complete the brief or checklist.' : 'Assign an owner to complete the brief and checklist.')
    const handoff = task.history.find(entry => entry.kind === 'handoff')
    if (handoff && task.status !== 'done') add('handoff', handoff.text + (task.ownerId ? '. Would notify ' + owner + '.' : '. The task needs a new owner.'))
  }
  const order: ReminderKind[] = ['escalation', 'overdue', 'soon', 'missing', 'handoff']
  return inbox.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
}

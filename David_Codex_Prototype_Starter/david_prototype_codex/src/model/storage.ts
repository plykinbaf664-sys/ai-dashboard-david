import { checklistKeys, flags, people, priorities, sources, statuses, views } from './config.ts'
import type { PersonId, View } from './config.ts'
import { demoTasks } from './fixtures.ts'
import { emptyFilters, reminderLabels, validDay } from './workflow.ts'
import type { Entry, Filters, ReminderKind, Sort, Task } from './workflow.ts'

export const storageKey = 'production-flow.demo.v1'

export type UiState = { view: View; persona: PersonId; filters: Filters; sort: Sort; reminderFilter: ReminderKind | '' }
export type DemoState = { tasks: Task[]; ui: UiState }
const knownPeople = people.map(person => person.id)
const knownStatuses = statuses.map(status => status.id)
const activityKinds = ['created', 'status', 'handoff', 'edit', 'note'] as const
const sortKeys = ['title', 'status', 'ownerId', 'priority', 'dueAt'] as const
const reminderKinds = Object.keys(reminderLabels) as ReminderKind[]

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const oneOf = <T extends string>(value: unknown, values: readonly T[]): value is T => typeof value === 'string' && values.some(option => option === value)
const timestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))

function validEntry(value: unknown): value is Entry {
  return record(value) && oneOf(value.kind, activityKinds) && timestamp(value.at)
    && oneOf(value.actorId, knownPeople) && typeof value.text === 'string'
}

function validTask(value: unknown): value is Task {
  if (!record(value)) return false
  const checklist = value.requiredInformation
  return typeof value.id === 'string' && /^PF-\d{3,}$/.test(value.id)
    && typeof value.title === 'string' && !!value.title.trim()
    && typeof value.description === 'string' && typeof value.productionBrief === 'string'
    && oneOf(value.source, sources) && oneOf(value.priority, priorities) && oneOf(value.status, knownStatuses)
    && (value.ownerId === null || oneOf(value.ownerId, knownPeople))
    && validDay(value.dueAt) && timestamp(value.createdAt) && timestamp(value.updatedAt)
    && record(checklist) && checklistKeys.every(key => typeof checklist[key] === 'boolean')
    && Array.isArray(value.history) && value.history.every(validEntry)
}

function defaultUi(): UiState {
  return { view: 'overview', persona: 'alex', filters: { ...emptyFilters }, sort: { key: 'dueAt', direction: 'asc' }, reminderFilter: '' }
}

function restoreUi(value: unknown): UiState {
  const defaults = defaultUi()
  if (!record(value)) return defaults
  const filters = record(value.filters) ? value.filters : {}
  const sort = record(value.sort) ? value.sort : {}
  return {
    view: oneOf(value.view, views) ? value.view : defaults.view,
    persona: oneOf(value.persona, knownPeople) ? value.persona : defaults.persona,
    reminderFilter: oneOf(value.reminderFilter, reminderKinds) ? value.reminderFilter : '',
    filters: {
      search: typeof filters.search === 'string' ? filters.search : '',
      owner: oneOf(filters.owner, [...knownPeople, 'unassigned']) ? filters.owner : '',
      status: oneOf(filters.status, knownStatuses) ? filters.status : '',
      priority: oneOf(filters.priority, priorities) ? filters.priority : '',
      flag: oneOf(filters.flag, flags) ? filters.flag : '',
    },
    sort: {
      key: oneOf(sort.key, sortKeys) ? sort.key : defaults.sort.key,
      direction: sort.direction === 'desc' ? 'desc' : 'asc',
    },
  }
}

export function initialState(now = new Date()): DemoState {
  return { tasks: demoTasks(now), ui: defaultUi() }
}

export function restoreState(text: string | null, now = new Date()): DemoState {
  try {
    const value: unknown = text === null ? null : JSON.parse(text)
    if (record(value)) {
      const { tasks } = value
      if (Array.isArray(tasks) && tasks.length && tasks.every(validTask)
        && new Set(tasks.map(task => task.id)).size === tasks.length) {
        return { tasks, ui: restoreUi(value.ui) }
      }
    }
  } catch {
    // The sample workspace is also available when stored JSON is invalid.
  }
  return initialState(now)
}

export function loadState(): DemoState {
  try {
    return restoreState(localStorage.getItem(storageKey))
  } catch {
    return initialState()
  }
}

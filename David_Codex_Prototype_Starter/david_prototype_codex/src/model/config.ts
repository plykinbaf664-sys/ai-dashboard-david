export const statuses = [
  { id: 'new', label: 'New', color: 'slate' },
  { id: 'brief', label: 'Brief Needed', color: 'amber' },
  { id: 'ready', label: 'Ready for Production', color: 'violet' },
  { id: 'production', label: 'In Production', color: 'blue' },
  { id: 'review', label: 'Final Review', color: 'teal' },
  { id: 'done', label: 'Done', color: 'green' },
] as const

export const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const
export const sources = ['Chat', 'Call', 'Manual'] as const
export const requiredItems = {
  scope: 'Scope and expected outcome confirmed',
  inputs: 'Production inputs available',
  acceptance: 'Acceptance criteria agreed',
} as const
export const people = [
  { id: 'alex', name: 'Alex Morgan', initials: 'AM', role: 'Operations lead', color: 'violet' },
  { id: 'jordan', name: 'Jordan Lee', initials: 'JL', role: 'Task coordinator', color: 'blue' },
  { id: 'casey', name: 'Casey Patel', initials: 'CP', role: 'Brief owner', color: 'amber' },
  { id: 'riley', name: 'Riley Brooks', initials: 'RB', role: 'Production', color: 'teal' },
  { id: 'morgan', name: 'Morgan Chen', initials: 'MC', role: 'Production', color: 'green' },
  { id: 'taylor', name: 'Taylor Reed', initials: 'TR', role: 'Final review', color: 'rose' },
] as const

export const views = ['overview', 'board', 'list', 'mine', 'activity', 'guide'] as const
export const flags = ['active', 'soon', 'overdue', 'missing'] as const
export const flagLabels = { active: 'Active tasks', soon: 'Due soon', overdue: 'Overdue', missing: 'Missing details' } as const
export const statusById = Object.fromEntries(statuses.map(status => [status.id, status])) as Record<Status, typeof statuses[number]>
export const personById = Object.fromEntries(people.map(person => [person.id, person])) as Record<PersonId, typeof people[number]>
export const checklistKeys = Object.keys(requiredItems) as ChecklistKey[]
export type Status = typeof statuses[number]['id']
export type Priority = typeof priorities[number]
export type Source = typeof sources[number]
export type PersonId = typeof people[number]['id']
export type View = typeof views[number]
export type Flag = typeof flags[number]
export type ChecklistKey = keyof typeof requiredItems

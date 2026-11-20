import assert from 'node:assert/strict'
import test from 'node:test'
import { people } from '../src/model/config.ts'
import { demoTasks } from '../src/model/fixtures.ts'
import { initialState, restoreState } from '../src/model/storage.ts'
import {
  addNote, createTask, daysUntil, detailsOf, emptyFilters, filterTasks, localDay, metrics,
  reminders, sortTasks, updateTask, validDay, validateDetails,
} from '../src/model/workflow.ts'

const now = new Date(2026, 10, 20, 12)
const today = localDay(now)
const at = now.toISOString()
const examples = demoTasks(now)
const request = examples[0]

test('the demo seeds 30 unique fictional tasks, six teammates and useful risk examples', () => {
  assert.equal(examples.length, 30)
  assert.equal(new Set(examples.map(task => task.id)).size, 30)
  assert.equal(people.length, 6)
  assert.equal(new Set(examples.map(task => task.status)).size, 6)
  assert.ok(examples.some(task => task.ownerId === null))
  assert.ok(examples.every(task => !validateDetails(task)))
  const counts = metrics(examples, today)
  assert.equal(counts.active, examples.filter(task => task.status !== 'done').length)
  assert.ok(counts.soon > 0 && counts.overdue > 0 && counts.missing > 0)
})

test('calendar thresholds remain consistent across midnight and daylight saving dates', () => {
  assert.equal(daysUntil('2026-03-09', '2026-03-08'), 1)
  assert.equal(daysUntil('2026-11-20', '2026-11-21'), -1)
  assert.equal(validDay('2026-02-29'), false)
  assert.equal(validDay('2028-02-29'), true)
})

test('intake creates an independently editable, explicitly unassigned New task', () => {
  const task = createTask('PF-131', {
    title: '  New request  ', description: '  Confirm the outcome. ', source: 'Manual',
    priority: 'High', ownerId: null, dueAt: today,
  }, 'alex', at)
  assert.equal(task.title, 'New request')
  assert.equal(task.description, 'Confirm the outcome.')
  assert.equal(task.ownerId, null)
  assert.equal(task.status, 'new')
  assert.equal(task.history[0].kind, 'created')
  assert.deepEqual(metrics([task], today), { active: 1, soon: 1, overdue: 0, missing: 1 })
})

test('production and later statuses require both the brief and every checklist item', () => {
  const incomplete = { ...detailsOf(request), status: 'ready', productionBrief: 'Approved scope.' }
  assert.match(validateDetails(incomplete), /required information/)
  const checked = { scope: true, inputs: true, acceptance: true }
  assert.throws(() => updateTask(request, { ...incomplete, status: 'production' }, 'alex', at), /required information/)
  assert.match(validateDetails({ ...incomplete, productionBrief: ' ', requiredInformation: checked }), /production brief/)
  const completed = updateTask(request, { ...incomplete, requiredInformation: checked }, 'alex', at)
  assert.equal(completed.status, 'ready')
  assert.equal(updateTask(completed, { ...detailsOf(completed), status: 'brief', productionBrief: '' }, 'alex', at).status, 'brief')
})

test('editing the owner, date, status and priority records activity without mutating the original', () => {
  const edited = updateTask(request, {
    ...detailsOf(request), ownerId: 'riley', status: 'brief', priority: 'Urgent', dueAt: localDay(now, -1),
  }, 'alex', at)
  assert.deepEqual(edited.history.map(entry => entry.kind), ['status', 'handoff', 'edit', 'edit', 'created'])
  assert.match(edited.history[1].text, /Jordan Lee → Riley Brooks/)
  assert.equal(request.status, 'new')
  assert.deepEqual(metrics([edited], today), { active: 1, soon: 0, overdue: 1, missing: 1 })
  const noted = addNote(edited, ' Follow up tomorrow. ', 'riley', at)
  assert.equal(noted.history[0].text, 'Follow up tomorrow.')
  assert.equal(addNote(noted, '   ', 'alex', at), noted)
  assert.equal(updateTask(noted, detailsOf(noted), 'alex', at), noted)
})

test('combined search and filters identify tasks and sorting preserves the source order', () => {
  const result = filterTasks(examples, { ...emptyFilters, search: ' pf-101 ', owner: 'jordan', flag: 'soon' }, today)
  assert.deepEqual(result.map(task => task.id), ['PF-101'])
  assert.ok(filterTasks(examples, { ...emptyFilters, owner: 'unassigned' }, today).every(task => task.ownerId === null))
  const sorted = sortTasks(examples, { key: 'priority', direction: 'desc' })
  assert.equal(sorted[0].priority, 'Urgent')
  assert.equal(examples[0].id, 'PF-101')
})

test('reminder previews react to the task state and ignore completed work', () => {
  const initial = reminders(examples, today)
  assert.deepEqual(new Set(initial.map(event => event.kind)), new Set(['escalation', 'overdue', 'soon', 'missing', 'handoff']))
  assert.ok(initial.every(event => event.task.status !== 'done'))
  const late = updateTask(request, { ...detailsOf(request), dueAt: localDay(now, -1) }, 'alex', at)
  assert.match(reminders([late], today)[0].text, /Would alert Alex Morgan/)
  assert.ok(!reminders([{ ...late, dueAt: today }], today).some(event => event.kind === 'escalation'))
})

test('storage restores notes and UI preferences and safely recovers corrupt data', () => {
  const original = initialState(now)
  const tasks = [addNote(request, 'Saved note', 'alex', at), ...original.tasks.slice(1)]
  const ui = { ...original.ui, view: 'mine', persona: 'riley', reminderFilter: 'escalation', sort: { key: 'priority', direction: 'desc' } }
  assert.deepEqual(restoreState(JSON.stringify({ tasks, ui }), now), { tasks, ui })
  assert.deepEqual(restoreState('{broken', now), original)
  assert.deepEqual(restoreState(JSON.stringify({ tasks: [tasks[0], tasks[0]] }), now), original)
  assert.deepEqual(restoreState(JSON.stringify({ tasks: [{ ...request, dueAt: 'yesterday' }] }), now), original)
  assert.equal(restoreState(JSON.stringify({ tasks, ui: { view: 'bad' } }), now).ui.view, 'overview')
})

import { CalendarDays, Check, CircleAlert, History, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { checklistKeys, people, personById, priorities, requiredItems, sources, statuses } from '../model/config'
import type { PersonId, Priority, Source, Status } from '../model/config'
import { detailsOf, localDay, missingInformation, validDay, validateDetails } from '../model/workflow'
import type { Intake, Task, TaskDetails } from '../model/workflow'
import { Avatar, formatDay, formatEvent, Modal, StatusBadge } from './shared'

function OwnerSelect({ value, onChange }: { value: PersonId | null; onChange: (id: PersonId | null) => void }) {
  return <select value={value ?? ''} onChange={event => onChange((event.target.value || null) as PersonId | null)}>
    <option value="">Unassigned</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
  </select>
}

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (priority: Priority) => void }) {
  return <select value={value} onChange={event => onChange(event.target.value as Priority)}>
    {priorities.map(priority => <option key={priority}>{priority}</option>)}
  </select>
}

export function NewTaskDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (intake: Intake) => void }) {
  const [intake, setIntake] = useState<Intake>({
    title: '', description: '', source: 'Manual', priority: 'Medium', ownerId: null, dueAt: localDay(new Date(), 3),
  })
  const [error, setError] = useState('')
  const set = <K extends keyof Intake,>(key: K, value: Intake[K]) => setIntake(current => ({ ...current, [key]: value }))
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!intake.title.trim() || !intake.description.trim()) {
      setError('Enter a title and description.')
      return
    }
    if (!validDay(intake.dueAt)) {
      setError('Choose a valid due date.')
      return
    }
    onCreate(intake)
  }
  return <Modal title="New task" onClose={onClose}>
    <form className="dialog-form" onSubmit={submit}>
      <p className="muted">Capture a request so the next owner has a clear place to start.</p>
      <label className="field">Task title<input required maxLength={100} value={intake.title} onChange={event => set('title', event.target.value)} placeholder="e.g. Confirm the revised requirements" /></label>
      <label className="field">Description<textarea required maxLength={2000} rows={3} value={intake.description} onChange={event => set('description', event.target.value)} placeholder="What needs to happen?" /></label>
      <div className="form-grid">
        <label className="field">Source<select value={intake.source} onChange={event => set('source', event.target.value as Source)}>{sources.map(source => <option key={source}>{source}</option>)}</select></label>
        <label className="field">Owner<OwnerSelect value={intake.ownerId} onChange={id => set('ownerId', id)} /></label>
        <label className="field">Priority<PrioritySelect value={intake.priority} onChange={value => set('priority', value)} /></label>
        <label className="field">Due date<input required type="date" value={intake.dueAt} onChange={event => set('dueAt', event.target.value)} /></label>
      </div>
      {error && <p className="inline-alert alert-rose" role="alert"><CircleAlert size={17} />{error}</p>}
      <div className="dialog-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary">Create task</button></div>
    </form>
  </Modal>
}

export function TaskDrawer({ task, onClose, onSave, onNote }: {
  task: Task
  onClose: () => void
  onSave: (details: TaskDetails) => void
  onNote: (note: string) => void
}) {
  const [draft, setDraft] = useState(() => detailsOf(task))
  const [note, setNote] = useState('')
  const [showError, setShowError] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(detailsOf(task))
  const issue = validateDetails(draft)
  const remaining = checklistKeys.filter(key => !draft.requiredInformation[key]).length
  const set = <K extends keyof TaskDetails,>(key: K, value: TaskDetails[K]) => setDraft(current => ({ ...current, [key]: value }))

  function save(event: FormEvent) {
    event.preventDefault()
    if (issue) {
      setShowError(true)
      return
    }
    setShowError(false)
    set('productionBrief', draft.productionBrief.trim())
    onSave(draft)
  }

  function submitNote(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    onNote(note)
    setNote('')
  }

  return <Modal title={task.title} onClose={onClose} drawer>
    <div className="drawer-body">
      <div className="task-context"><span className="task-id">{task.id}</span><StatusBadge status={task.status} /><span className="context-date"><CalendarDays size={14} />Created {formatEvent(task.createdAt)}</span></div>
      <section className="detail-intake"><h3>Original request</h3><p className="task-description">{task.description}</p><p className="muted">Source: {task.source} · Updated {formatEvent(task.updatedAt)}</p></section>
      <form className="detail-form" onSubmit={save}>
        <div className="form-grid">
          <label className="field">Status<select value={draft.status} onChange={event => set('status', event.target.value as Status)}>
            {statuses.map(status => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select></label>
          <label className="field">Owner<OwnerSelect value={draft.ownerId} onChange={id => set('ownerId', id)} /></label>
          <label className="field">Priority<PrioritySelect value={draft.priority} onChange={value => set('priority', value)} /></label>
          <label className="field">Due date<input required type="date" value={draft.dueAt} onChange={event => set('dueAt', event.target.value)} /></label>
        </div>
        <label className="field">Production brief<textarea maxLength={3000} rows={4} value={draft.productionBrief} onChange={event => set('productionBrief', event.target.value)} placeholder="Describe the agreed work, inputs and expected outcome." /></label>
        <fieldset className="checklist">
          <legend>Required information</legend>
          {checklistKeys.map(key => <label key={key}>
            <input type="checkbox" checked={draft.requiredInformation[key]} onChange={event => set('requiredInformation', { ...draft.requiredInformation, [key]: event.target.checked })} />
            {requiredItems[key]}
          </label>)}
        </fieldset>
        {missingInformation(draft)
          ? <p className={'inline-alert ' + (issue ? 'alert-rose' : 'alert-amber')} role={showError && issue ? 'alert' : undefined}>
            <CircleAlert size={17} />{issue || `A brief and all checklist items are required for production. ${remaining} checklist item${remaining === 1 ? '' : 's'} left.`}
          </p>
          : <p className="inline-alert alert-green"><Check size={17} />Production brief and required information are complete.</p>}
        <div className="save-row">
          <span className="muted">{dirty ? 'Unsaved changes' : 'Due ' + formatDay(task.dueAt)}</span>
          <button className="button primary" disabled={!dirty}>Save changes</button>
        </div>
      </form>
      <section className="history">
        <h3><History size={18} /> Activity history</h3>
        <form className="note-form" onSubmit={submitNote}>
          <label className="field">Add a note<textarea rows={2} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} placeholder="Share an update with the team…" /></label>
          <button className="button secondary compact" disabled={!note.trim()}><MessageSquare size={15} />Post note</button>
        </form>
        <ol className="timeline">{task.history.map((entry, index) => <li key={entry.at + '-' + index}>
          <Avatar id={entry.actorId} size="small" />
          <div><div><strong>{personById[entry.actorId].name}</strong><time dateTime={entry.at}>{formatEvent(entry.at)}</time></div><p>{entry.text}</p></div>
        </li>)}</ol>
      </section>
    </div>
  </Modal>
}

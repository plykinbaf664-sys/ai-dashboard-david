import { ArrowRight, BellRing, CircleAlert, ClipboardList, Clock3, FlaskConical, Network, RotateCcw, Zap } from 'lucide-react'
import type { View } from '../model/config'
import { reminderLabels, reminders } from '../model/workflow'
import type { ReminderKind, Task } from '../model/workflow'
import { Empty, PageHeading } from './shared'

const notificationStyles = {
  escalation: { icon: Zap, tone: 'rose' },
  overdue: { icon: CircleAlert, tone: 'rose' },
  soon: { icon: Clock3, tone: 'blue' },
  missing: { icon: ClipboardList, tone: 'amber' },
  handoff: { icon: Network, tone: 'violet' },
} as const

export function ActivityView({ tasks, today, onOpen, filter, onFilter }: {
  tasks: Task[]
  today: string
  onOpen: (id: string) => void
  filter: ReminderKind | ''
  onFilter: (kind: ReminderKind | '') => void
}) {
  const events = reminders(tasks, today)
  const visible = filter ? events.filter(event => event.kind === filter) : events
  return <>
    <PageHeading title="Activity & Reminders" description="See who would be notified as work moves or deadlines pass." />
    <div className="inline-alert alert-violet simulation-banner"><FlaskConical size={19} /><div><strong>Simulation only</strong><p>All events are previews. No messages are sent. A task at least one calendar day overdue would escalate to the operations lead.</p></div></div>
    <section className="panel notifications">
      <div className="section-head"><div><h2>Notification inbox</h2><p>{visible.length} simulated {visible.length === 1 ? 'event' : 'events'}</p></div>
        <select aria-label="Filter reminders" value={filter} onChange={event => onFilter(event.target.value as ReminderKind | '')}>
          <option value="">All events</option>{Object.entries(reminderLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select>
      </div>
      {visible.length ? visible.map(event => {
        const { icon: Icon, tone } = notificationStyles[event.kind]
        return <div className="notification-row" key={event.id}>
          <span className={'icon-tile tone-' + tone}><Icon size={18} /></span>
          <div><div className="notification-title"><h3>{reminderLabels[event.kind]}</h3><span className="badge tone-slate">SIMULATION</span></div>
            <p>{event.text}</p><button className="text-button" onClick={() => onOpen(event.task.id)}>{event.task.id} · {event.task.title}<ArrowRight size={14} /></button>
          </div>
        </div>
      }) : <Empty title="No events for this filter." />}
    </section>
  </>
}

const steps: { title: string; description: string; action: string; view?: View }[] = [
  { title: 'Start with the overview', description: 'Check which tasks are overdue, due soon, or missing information. Open a task from the attention queue.', action: 'Open overview', view: 'overview' },
  { title: 'Capture a new request', description: 'Give a task a title, owner and due date. It will appear in the New column on the board.', action: 'Create a task' },
  { title: 'Prepare the handoff', description: 'Open a New task and try moving it to Ready for Production. Add a production brief, check all three items, then save the new status and owner.', action: 'Open board', view: 'board' },
  { title: 'See what each person owns', description: 'Switch between the demo teammates in My Tasks. Open one of their cards and post a note in its activity history.', action: 'Open My Tasks', view: 'mine' },
  { title: 'Review a missed deadline', description: 'Open an escalation in Activity & Reminders and see who would be alerted. Set an open task’s due date to yesterday to see a new example.', action: 'Open reminders', view: 'activity' },
]

export function Guide({ onNavigate, onCreate, onReset }: { onNavigate: (view: View) => void; onCreate: () => void; onReset: () => void }) {
  return <>
    <PageHeading title="Demo Guide" description="Try the workflow from the first request to a missed-deadline escalation." />
    <div className="guide-grid">
      <section className="panel guide-steps">
        <div className="section-head"><div><h2>Five-minute walkthrough</h2><p>Follow a task through the people and stages involved.</p></div><span className="icon-tile tone-violet"><ClipboardList size={20} /></span></div>
        <ol>{steps.map((step, index) => <li key={step.title}>
          <span className="step-number">{index + 1}</span>
          <div><h3>{step.title}</h3><p>{step.description}</p><button className="text-button" onClick={() => step.view ? onNavigate(step.view) : onCreate()}>{step.action}<ArrowRight size={15} /></button></div>
        </li>)}</ol>
      </section>
      <section className="panel reset-panel">
        <span className="icon-tile tone-violet"><RotateCcw size={20} /></span><h2>Start over</h2>
        <p>Restore the original fictional tasks and clear changes saved in this browser.</p>
        <button className="button primary" onClick={onReset}><RotateCcw size={16} />Reset demo</button>
        <div className="reset-note"><BellRing size={16} />All reminders in this demo are simulated.</div>
      </section>
    </div>
  </>
}

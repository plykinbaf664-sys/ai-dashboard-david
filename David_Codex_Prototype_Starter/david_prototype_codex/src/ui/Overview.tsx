import { ArrowDownRight, ArrowRight, CalendarDays, ChevronRight, ListFilter, Workflow } from 'lucide-react'
import { flags, statuses } from '../model/config'
import type { Flag, Status } from '../model/config'
import { metrics, matchesFlag, sortTasks } from '../model/workflow'
import type { Task } from '../model/workflow'
import { Avatar, DueDate, Empty, PageHeading, flagColors, flagIcons, flagLabels, formatDay } from './shared'

const descriptions = {
  active: 'Across all open stages',
  soon: 'Due within the next 2 days',
  overdue: 'Past their due date',
  missing: 'Brief or checklist incomplete',
}
const attentionFlags = ['overdue', 'soon', 'missing'] as const

export function Overview({ tasks, today, onFilter, onStage, onOpen, onBoard, onList }: {
  tasks: Task[]
  today: string
  onFilter: (flag: Flag) => void
  onStage: (status: Status) => void
  onOpen: (id: string) => void
  onBoard: () => void
  onList: () => void
}) {
  const counts = metrics(tasks, today)
  const byDue = sortTasks(tasks, { key: 'dueAt', direction: 'asc' })
  const queue = attentionFlags.flatMap((flag, index) =>
    byDue.filter(task => matchesFlag(task, flag, today)
      && attentionFlags.slice(0, index).every(earlier => !matchesFlag(task, earlier, today))).map(task => ({ task, flag })),
  )
  const stages = statuses.map(status => ({ ...status, count: tasks.filter(task => task.status === status.id).length }))
  const maxStage = Math.max(1, ...stages.map(stage => stage.count))
  return <>
    <PageHeading title="Overview" description="Keep track of what’s moving, what’s due, and what needs attention.">
      <span className="date-chip"><CalendarDays size={16} />{formatDay(today)}</span>
    </PageHeading>
    <section className="metric-grid" aria-label="Task metrics">
      {flags.map(flag => {
        const Icon = flagIcons[flag]
        return <button className="metric panel" key={flag} onClick={() => onFilter(flag)}>
          <span className="metric-top"><span className={'icon-tile tone-' + flagColors[flag]}><Icon size={20} /></span><ArrowDownRight size={16} className="metric-arrow" /></span>
          <span className="metric-value">{counts[flag]}</span>
          <strong>{flagLabels[flag]}</strong>
          <span className="metric-description">{descriptions[flag]}</span>
        </button>
      })}
    </section>
    <div className="overview-grid">
      <section className="panel attention">
        <div className="section-head">
          <div><h2>Needs attention</h2><p>Tasks to follow up on first.</p></div>
          <button className="button secondary compact" onClick={onList}><ListFilter size={15} />View tasks</button>
        </div>
        {queue.length ? <div className="attention-list">
          {queue.slice(0, 5).map(({ task, flag }) => <button key={task.id} className="attention-row" onClick={() => onOpen(task.id)}>
            <span className="attention-task"><strong>{task.title}</strong><span>{task.id} <span className="separator">·</span> {flagLabels[flag]}</span></span>
            <span className="attention-meta"><Avatar id={task.ownerId} size="small" /><DueDate task={task} today={today} /><ChevronRight className="row-arrow" size={16} /></span>
          </button>)}
        </div> : <Empty title="You’re all caught up." />}
      </section>
      <section className="panel pipeline">
        <div className="section-head">
          <div><h2>Pipeline</h2><p>Tasks by workflow stage.</p></div>
          <span className="icon-tile tone-violet"><Workflow size={19} /></span>
        </div>
        <div className="pipeline-stages">
          {stages.map(stage => <button className={'stage tone-' + stage.color} key={stage.id} onClick={() => onStage(stage.id)}>
            <span className="stage-top"><span><span className="dot" />{stage.label}</span><strong>{stage.count}</strong></span>
            <span className="stage-track"><span style={{ width: `${stage.count / maxStage * 100}%` }} /></span>
          </button>)}
        </div>
        <div className="pipeline-footer"><button className="text-button" onClick={onBoard}>Open board <ArrowRight size={15} /></button></div>
      </section>
    </div>
  </>
}

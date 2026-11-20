import { CalendarDays, Check, CircleAlert, ClipboardList, Clock3, Inbox, UserRound, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { flagLabels, personById, statusById } from '../model/config'
import type { PersonId, Priority, Status } from '../model/config'
import { daysUntil, ownerName } from '../model/workflow'
import type { Task } from '../model/workflow'

export const flagIcons = { active: ClipboardList, soon: Clock3, overdue: CircleAlert, missing: Inbox }
export const flagColors = { active: 'violet', soon: 'blue', overdue: 'rose', missing: 'amber' } as const
export { flagLabels }

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const eventDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
export const formatDay = (date: string) => shortDate.format(new Date(date))
export const formatEvent = (date: string) => eventDate.format(new Date(date))

export function Avatar({ id, size = '', label = false }: { id: PersonId | null; size?: string; label?: boolean }) {
  const person = id ? personById[id] : null
  return <span className="avatar-wrap" title={ownerName(id)}>
    <span className={'avatar tone-' + (person?.color ?? 'slate') + ' ' + size} aria-hidden="true">
      {person?.initials ?? <UserRound size={13} />}
    </span>
    <span className={label ? undefined : 'sr-only'}>{ownerName(id)}</span>
  </span>
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, color } = statusById[status]
  return <span className={'badge tone-' + color}><span className="dot" />{label}</span>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const color = { Low: 'slate', Medium: 'blue', High: 'amber', Urgent: 'rose' }[priority]
  return <span className={'badge tone-' + color}><span className="dot" />{priority}</span>
}

export function DueDate({ task, today, showDate = false }: { task: Task; today: string; showDate?: boolean }) {
  const days = daysUntil(task.dueAt, today)
  const date = formatDay(task.dueAt)
  const time = <time dateTime={task.dueAt}>{date}</time>
  if (task.status === 'done') return <span className="due" title="Completed"><Check size={14} />{time}</span>
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : days <= 2 ? `Due in ${days}d` : date
  const color = days < 0 ? 'overdue-text' : days <= 2 ? 'soon-text' : ''
  return <span className={'due ' + color} title={'Due ' + date}>
    <CalendarDays size={14} />
    {color ? <>{showDate && <>{time}<span aria-hidden="true">·</span></>}<span>{label}</span></> : time}
  </span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><span className="icon-tile tone-slate"><Inbox size={20} /></span><strong>{title}</strong>{children}</div>
}

export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading">
    <div><h1>{title}</h1><p>{description}</p></div>
    {children}
  </div>
}

export function Modal({ title, children, onClose, drawer = false }: {
  title: string
  children: ReactNode
  onClose: () => void
  drawer?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  return <dialog ref={ref} className={drawer ? 'dialog drawer' : 'dialog'} aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget && !drawer) onClose() }}>
    <div className="dialog-top">
      <h2 id="dialog-title">{title}</h2>
      <button className="button icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
    </div>
    {children}
  </dialog>
}

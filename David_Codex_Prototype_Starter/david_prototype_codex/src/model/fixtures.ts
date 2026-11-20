import { people, statusById } from './config.ts'
import type { PersonId, Priority, Status } from './config.ts'
import { createTask, localDay, taskNumber } from './workflow.ts'
import type { Task } from './workflow.ts'

type Example = [title: string, status: Status, days: number, priority: Priority, owner: PersonId | null, detail: string]

const examples: Example[] = [
  ['Confirm acceptance criteria', 'new', 0, 'High', 'jordan', 'Capture the agreed acceptance criteria and confirm who will approve the final output.'],
  ['Log follow-up from kickoff call', 'new', 3, 'Medium', 'alex', 'Turn the call follow-up into a trackable task with a clear outcome and target date.'],
  ['Capture updated request', 'new', 5, 'Medium', null, 'Record the requested change and check whether it affects any existing commitments.'],
  ['Record approval from team chat', 'new', 6, 'Low', 'casey', 'Summarize the approval and attach the agreed next action to the task.'],
  ['Clarify incoming handoff', 'new', 8, 'Medium', null, 'Confirm what is being handed off and who should own the next step.'],
  ['Gather missing reference files', 'brief', -1, 'Urgent', 'casey', 'Check which reference files are outstanding and confirm who can supply them.'],
  ['Confirm scope for change request', 'brief', 2, 'High', 'jordan', 'Write down the changes that are in scope and identify who will review them.'],
  ['Prepare brief for a revised request', 'brief', 4, 'Medium', 'casey', 'Reconcile the updated instructions and record what success looks like.'],
  ['Resolve conflicting instructions', 'brief', 6, 'High', 'alex', 'Confirm which instruction takes precedence before assigning the work.'],
  ['Check handoff dependencies', 'brief', 7, 'Low', null, 'Find out whether any approvals or inputs are still needed before work starts.'],
  ['Prepare approved update', 'ready', 1, 'High', 'riley', 'Apply the approved changes and flag any differences from the agreed scope.'],
  ['Apply agreed adjustments', 'production', 4, 'Medium', 'morgan', 'Make the adjustments listed in the brief and share a summary for final review.'],
  ['Assemble handoff materials', 'ready', 5, 'Medium', 'riley', 'Gather the approved inputs and instructions in one place for the next owner.'],
  ['Complete agreed revisions', 'ready', 7, 'Low', 'morgan', 'Complete the agreed revisions and keep a record of the items addressed.'],
  ['Review the updated inputs', 'ready', 9, 'Low', 'alex', 'Verify that the supplied inputs match the agreed brief before preparing the output.'],
  ['Complete the agreed work package', 'production', -3, 'Urgent', 'riley', 'Finish the outstanding work package and confirm the revised timing with the reviewer.'],
  ['Apply final round of updates', 'production', 0, 'High', 'morgan', 'Apply the remaining updates and share the result with the assigned reviewer.'],
  ['Prepare output for review', 'production', 2, 'Medium', 'riley', 'Finish the current iteration and provide enough context for a quick final check.'],
  ['Validate revised requirements', 'production', 4, 'Medium', 'morgan', 'Check the working output against the latest requirements and flag any gaps.'],
  ['Compile progress summary', 'production', 6, 'Low', 'jordan', 'Summarize work completed and record open questions before the next handoff.'],
  ['Verify requested changes', 'review', -2, 'High', 'taylor', 'Check the latest version against each approved change and record any blockers.'],
  ['Sign off on handoff package', 'review', 1, 'High', 'alex', 'Review the work package, confirm the acceptance criteria, and record sign-off.'],
  ['Run final quality check', 'review', 3, 'Medium', 'taylor', 'Check the finished output and document the result before closing the task.'],
  ['Review remaining feedback', 'production', 5, 'Medium', 'jordan', 'Address the remaining review comments and document what changed.'],
  ['Close out the delivery checklist', 'review', 8, 'Low', 'taylor', 'Confirm that the required steps are complete and note any follow-up work.'],
  ['Confirm original request details', 'done', -7, 'Low', 'jordan', 'Confirm the original request and record the details for downstream work.'],
  ['Update shared instructions', 'done', -6, 'Medium', 'casey', 'Record the final instructions and mark the superseded instructions as outdated.'],
  ['Complete the initial work package', 'done', -5, 'High', 'riley', 'Finish the agreed initial work and pass it to the reviewer for sign-off.'],
  ['Approve the revised output', 'done', -4, 'Medium', 'taylor', 'Review the revision against the brief and capture final approval in the task history.'],
  ['Record final walkthrough feedback', 'done', -3, 'Low', 'alex', 'Capture the feedback from the final walkthrough and close the completed items.'],
]

export function demoTasks(now = new Date()): Task[] {
  return examples.map(([title, status, days, priority, ownerId, description], index) => {
    const at = new Date(now.getTime() - (index + 2 + Math.max(0, -days) * 24) * 3_600_000).toISOString()
    const actor = people[index % people.length].id
    const task = createTask(taskNumber(index + 101), {
      title, description, source: (['Chat', 'Call', 'Manual'] as const)[index % 3],
      dueAt: localDay(now, days), priority, ownerId,
    }, actor, at)
    if (status === 'new' || status === 'brief') {
      return {
        ...task, status,
        requiredInformation: { scope: status === 'brief', inputs: false, acceptance: false },
        history: status === 'brief' ? [{ kind: 'status', text: statusById.new.label + ' → ' + statusById.brief.label, actorId: actor, at }, ...task.history] : task.history,
      }
    }
    return {
      ...task, status, productionBrief: description + ' Share the result and record any open questions for the next owner.',
      requiredInformation: { scope: true, inputs: true, acceptance: true },
      history: [
        ...(index === 10 ? [{ kind: 'handoff' as const, text: 'Casey Patel → Riley Brooks', actorId: 'casey' as const, at }] : []),
        ...task.history,
      ],
    }
  })
}

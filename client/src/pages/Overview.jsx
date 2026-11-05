//this is for the dashboard of ALL the user's projects: a summary and the tasks of each one, plus waiting invitations
import { useState, useEffect } from 'react'
import { getOverview, getMyInvites, joinProject, declineInvite, onChange } from '../db.js'
import { status_names } from '../labels.js'
import { groupTasks, summarizeProject, isOverdue } from '../engine/summary.js'

//this is for how many tasks one list shows before "Show all"
const CAP = 5

//this is for one list of tasks inside a project card (it hides itself when empty)
function TaskGroup({ title, tasks, userId, now, onOpen }) {
	const [all, setAll] = useState(false)
	if (tasks.length === 0) return null
	const shown = all ? tasks : tasks.slice(0, CAP)

	return (
		<div className="group">
			<h4>{title} ({tasks.length})</h4>
			{shown.map(t => (
				<div key={t.id} className="task-row">
					{/*this is for the task name, clicking it opens the task inside its project*/}
					<button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>
					<span className="who">{t.startDate} to {t.endDate}</span>
					<span className={'status status-' + t.status}>{status_names[t.status]}</span>
					{isOverdue(t, now) && <span className="status status-denied">Overdue</span>}
					{t.assignedTo === userId && <span className="who">Assigned to you</span>}
				</div>
			))}
			{tasks.length > CAP && (
				<button type="button" className="link small" onClick={() => setAll(!all)}>
					{all ? 'Show fewer' : 'Show all ' + tasks.length}
				</button>
			)}
		</div>
	)
}

//this is for soonest deadline first
function byEnd(a, b) {
	return a.endDate.localeCompare(b.endDate) || a.startDate.localeCompare(b.startDate)
}

//this is for one project: its name, summary numbers, progress bar and task lists
function ProjectCard({ project, tasks, loading, members, pending, userId, onOpenProject, onOpenTask }) {
	const now = new Date()
	const isAdmin = project.role === 'admin'
	const s = summarizeProject(tasks, userId, now)
	const g = groupTasks(tasks, now)
	const nothingActive = g.ready.length + g.underway.length + g.later.length + g.complete.length === 0

	return (
		<section className="project-card" aria-labelledby={'proj-' + project.id}>
			<div className="card-head">
				<h2 id={'proj-' + project.id}>{project.name}</h2>
				<span className="tag">{isAdmin ? 'Admin' : 'Member'}</span>
				<button type="button" onClick={() => onOpenProject(project.id)}>Open project</button>
			</div>

			{project.description && <p className="desc">{project.description}</p>}

			{/*this is for the summary: progress, then the small facts*/}
			<div className="progress-line">
				<div className="progress" role="progressbar" aria-label={project.name + ' progress'}
					aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.percent}>
					<span style={{ width: s.percent + '%' }} />
				</div>
				<span className="who">{s.done} of {s.total} {s.total === 1 ? 'task' : 'tasks'} complete ({s.percent}%)</span>
			</div>
			<ul className="stats">
				<li>{s.underway} underway</li>
				<li>{s.waiting} waiting</li>
				{s.overdue > 0 && <li className="warn">{s.overdue} overdue</li>}
				{s.mine > 0 && <li>{s.mine} for you</li>}
				<li>{members} {members === 1 ? 'person' : 'people'}</li>
				{s.finishDate && <li>Finishes {s.finishDate}</li>}
				{isAdmin && pending > 0 && <li className="warn">{pending} {pending === 1 ? 'request' : 'requests'} waiting</li>}
			</ul>

			{/*this is for the tasks of this project*/}
			{loading && <p className="empty">Loading tasks...</p>}
			{!loading && s.total === 0 && (
				<p className="empty">No tasks yet.{isAdmin ? ' Open the project to add the first one.' : ''}</p>
			)}
			{!loading && s.total > 0 && nothingActive && <p className="empty">Nothing active right now.</p>}
			<div className="groups">
				<TaskGroup title="Underway" tasks={[...g.underway].sort(byEnd)} userId={userId} now={now} onOpen={id => onOpenTask(project.id, id)} />
				<TaskGroup title="Ready to start" tasks={[...g.ready].sort(byEnd)} userId={userId} now={now} onOpen={id => onOpenTask(project.id, id)} />
				<TaskGroup title="Coming later" tasks={[...g.later].sort(byEnd)} userId={userId} now={now} onOpen={id => onOpenTask(project.id, id)} />
				<TaskGroup title="Completed this week" tasks={g.complete} userId={userId} now={now} onOpen={id => onOpenTask(project.id, id)} />
			</div>
		</section>
	)
}

export default function Overview({ projects, userId, onOpenProject, onOpenTask, onCreate, onJoin, onProjectsChanged }) {
	//this is for the data of all projects (null while loading) and the invitations
	const [data, setData] = useState(null)
	const [invites, setInvites] = useState([])
	const [error, setError] = useState('')
	//this is for a failed accept or decline (kept apart, so reloading the dashboard does not wipe it)
	const [inviteError, setInviteError] = useState('')
	//this is for the invite being accepted or declined right now
	const [busyCode, setBusyCode] = useState('')
	//this is for reloading when the list of projects changes (a new one, or an accepted invite)
	const projectKey = projects.map(p => p.id).join(',')
	const [tick, setTick] = useState(0)

	useEffect(() => {
		let cancelled = false
		setError('')
		Promise.all([getOverview(projects.map(p => p.id)), getMyInvites()])
			.then(([overview, inviteList]) => {
				if (cancelled) return
				setData(overview)
				setInvites(inviteList)
			})
			.catch(e => {
				if (!cancelled) setError(e.message)
			})
		return () => { cancelled = true }
	}, [projectKey, tick])

	//this is for reloading the dashboard when anything changes (live updates)
	useEffect(() => onChange(['tasks', 'requests', 'roles'], () => setTick(t => t + 1)), [])

	//this is for accepting an invitation: the project then shows up as a new card
	async function accept(code) {
		setInviteError('')
		setBusyCode(code)
		try {
			await joinProject(code)
			setInvites(list => list.filter(i => i.code !== code))
			await onProjectsChanged()
		} catch (e) {
			setInviteError(e.message)
			//this is for an invite that was used or removed in the meantime
			setTick(t => t + 1)
		}
		setBusyCode('')
	}

	async function decline(code) {
		setInviteError('')
		setBusyCode(code)
		try {
			await declineInvite(code)
			setInvites(list => list.filter(i => i.code !== code))
		} catch (e) {
			setInviteError(e.message)
			setTick(t => t + 1)
		}
		setBusyCode('')
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<nav aria-label="Dashboard actions">
				<button type="button" className="primary" onClick={onCreate}>New project</button>
				<button type="button" onClick={onJoin}>Join with a code</button>
			</nav>

			{error && <div className="error-box" role="alert">{error}</div>}
			{inviteError && <div className="error-box" role="alert">{inviteError}</div>}

			{/*this is for invitations sent to this person's email*/}
			{invites.length > 0 && (
				<section aria-labelledby="invites-title">
					<h2 id="invites-title">Invitations ({invites.length})</h2>
					{invites.map(i => (
						<div key={i.code} className="dash-task">
							<strong>{i.projectName}</strong>
							<span className="who">
								{i.invitedBy || 'Someone'} invited you as {i.role === 'admin' ? 'an admin' : 'a member'}
							</span>
							{i.description && <span>{i.description}</span>}
							<span className="form-footer">
								<button type="button" className="primary" disabled={busyCode === i.code} onClick={() => accept(i.code)}>Accept</button>
								<button type="button" disabled={busyCode === i.code} onClick={() => decline(i.code)}>Decline</button>
							</span>
						</div>
					))}
				</section>
			)}

			{!data && !error && <p>Loading...</p>}

			{data && projects.length === 0 && (
				<div className="empty-state">
					<h2>No projects yet</h2>
					<p>Start a project and invite your team, or join one with an invite code.</p>
				</div>
			)}

			{data && projects.map(p => (
				<ProjectCard
					key={p.id}
					project={p}
					tasks={data.tasks[p.id] || []}
					loading={data.tasks[p.id] === undefined}
					members={data.members[p.id] || 0}
					pending={data.pending[p.id] || 0}
					userId={userId}
					onOpenProject={onOpenProject}
					onOpenTask={onOpenTask}
				/>
			))}
		</div>
	)
}

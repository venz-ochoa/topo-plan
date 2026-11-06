//this is for the notifications page: sorted into categories, each one can be cleared
import { useState } from 'react'

//this is for the categories (the database has no category, so it is worked out from the words of the notification)
const categories = [
	{ id: 'requests', label: 'Requests', test: /request|approved|denied/i },
	{ id: 'schedule', label: 'Schedule changes', test: /moved|later|earlier|extend|extension|date|schedule|deadline|day/i },
	{ id: 'team', label: 'Team', test: /invite|joined|left|removed|member|role|admin|owner/i },
	{ id: 'tasks', label: 'Tasks', test: /task|assign|status|progress|done|complete/i },
]

//this is for finding the category of one notification
function categoryOf(n) {
	const found = categories.find(c => c.test.test(n.text))
	return found ? found.id : 'other'
}

export default function Notifications({ notes, projects, onMarkRead, onClear, onOpen }) {
	const [filter, setFilter] = useState('all')
	const [error, setError] = useState('')
	const unread = notes.filter(n => !n.read).length

	//this is for the list on show: everything, or one category
	const shown = filter === 'all' ? notes : notes.filter(n => categoryOf(n) === filter)
	const count = id => notes.filter(n => categoryOf(n) === id).length
	const tabs = [{ id: 'all', label: 'All', n: notes.length }, ...categories.map(c => ({ id: c.id, label: c.label, n: count(c.id) })), { id: 'other', label: 'Other', n: count('other') }].filter(t => t.id === 'all' || t.n > 0)

	//this is for clearing: only what is on show (all of them when the filter is All)
	async function clear(list) {
		setError('')
		try {
			await onClear(list.map(n => n.id))
		} catch (e) {
			setError('Could not clear. ' + (e.message || ''))
		}
	}

	return (
		<div className="narrow-page">
			<div className="page-bar">
				<h2>Notifications</h2>
				<div className="bar-actions">
					{unread > 0 && <button type="button" className="with-icon" onClick={onMarkRead}><img src="/icons/check.svg" alt="" width="18" height="18" /> Mark all as read ({unread})</button>}
					{shown.length > 0 && (
						<button type="button" onClick={() => { if (confirm('Clear ' + shown.length + (filter === 'all' ? ' notifications?' : ' ' + tabs.find(t => t.id === filter).label.toLowerCase() + ' notifications?'))) clear(shown) }}>
							Clear {filter === 'all' ? 'all' : 'these'}
						</button>
					)}
				</div>
			</div>

			{error && <div className="error-box" role="alert">{error}</div>}

			{/*this is for the category buttons*/}
			{notes.length > 0 && (
				<div className="filter-bar" role="group" aria-label="Notification categories">
					{tabs.map(t => (
						<button key={t.id} type="button" className={'pill' + (filter === t.id ? ' on' : '')} aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}>
							{t.label} <span className="count">{t.n}</span>
						</button>
					))}
				</div>
			)}

			{notes.length === 0 && (
				<div className="empty-box">
					<img src="/icons/inbox.svg" alt="" width="40" height="40" />
					<p className="empty">Nothing yet. New tasks, changes and invites show up here.</p>
				</div>
			)}

			{shown.map(n => (
				<div key={n.id} className={n.read ? 'dash-task row-card' : 'dash-task row-card unread'}>
					<img src="/icons/bell.svg" alt="" width="22" height="22" />
					<div className="grow">
						{n.read ? <span>{n.text}</span> : <strong>{n.text}</strong>}
						<span className="who when">{categories.find(c => c.id === categoryOf(n))?.label || 'Other'} · {new Date(n.created_at).toLocaleString()}</span>
					</div>
					{/*this is for the button that opens the project (only if you are still in it)*/}
					{n.project_id && projects.some(p => p.id === n.project_id) && (
						<button type="button" className="with-icon" onClick={() => onOpen(n.project_id)}>Open project <img src="/icons/open.svg" alt="" width="18" height="18" /></button>
					)}
					<button type="button" className="link small" aria-label="Clear this notification" onClick={() => clear([n])}>Clear</button>
				</div>
			))}
		</div>
	)
}
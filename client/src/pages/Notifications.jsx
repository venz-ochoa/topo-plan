//this is for the notifications page: new tasks, changes to your tasks, answers to your requests and invites
export default function Notifications({ notes, projects, onMarkRead, onOpen }) {
	const unread = notes.filter(n => !n.read).length

	return (
		<div className="narrow-page">
			<div className="page-bar">
				<h2>Notifications</h2>
				{unread > 0 && <button type="button" className="with-icon" onClick={onMarkRead}><img src="/icons/check.svg" alt="" width="18" height="18" /> Mark all as read ({unread})</button>}
			</div>

			{notes.length === 0 && (
				<div className="empty-box">
					<img src="/icons/inbox.svg" alt="" width="40" height="40" />
					<p className="empty">Nothing yet. New tasks, changes and invites show up here.</p>
				</div>
			)}

			{notes.map(n => (
				<div key={n.id} className={n.read ? 'dash-task row-card' : 'dash-task row-card unread'}>
					<img src="/icons/bell.svg" alt="" width="22" height="22" />
					<div className="grow">
						{n.read ? <span>{n.text}</span> : <strong>{n.text}</strong>}
						<span className="who when">{new Date(n.created_at).toLocaleString()}</span>
					</div>
					{/*this is for the button that opens the project (only if you are still in it)*/}
					{n.project_id && projects.some(p => p.id === n.project_id) && (
						<button type="button" className="with-icon" onClick={() => onOpen(n.project_id)}>Open project <img src="/icons/open.svg" alt="" width="18" height="18" /></button>
					)}
				</div>
			))}
		</div>
	)
}

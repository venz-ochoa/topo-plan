//this is for the notifications page: new tasks, changes to your tasks, answers to your requests and invites
export default function Notifications({ notes, projects, onMarkRead, onOpen }) {
	const unread = notes.filter(n => !n.read).length

	return (
		<div>
			<h2>Notifications</h2>
			{notes.length === 0 && <p className="empty">Nothing yet. New tasks, changes and invites show up here.</p>}
			{unread > 0 && <button type="button" onClick={onMarkRead}>Mark all as read</button>}

			{notes.map(n => (
				<div key={n.id} className="dash-task">
					{n.read ? <span>{n.text}</span> : <strong>{n.text}</strong>}
					<span className="who">{new Date(n.created_at).toLocaleString()}</span>
					{/*this is for the button that opens the project (only if you are still in it)*/}
					{n.project_id && projects.some(p => p.id === n.project_id) && (
						<button type="button" onClick={() => onOpen(n.project_id)}>Open project</button>
					)}
				</div>
			))}
		</div>
	)
}

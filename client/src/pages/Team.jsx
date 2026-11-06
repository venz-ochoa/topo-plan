//this is for the team tab: everyone in the project, their role and their tasks
import { status_names, roleName, roleIcon } from '../labels.js'

export default function Team({ users, tasks, userId, onOpen }) {
//this is for tasks nobody is assigned to
const unassigned = tasks.filter(t => !t.assignedTo)

return (
    <div>
    <h2 className="h-ico"><img src="/icons/users.svg" alt="" width="26" height="26" /> Team <span className="count">{users.length}</span></h2>

    <div className="team-grid">
    {users.map(u => {
        const mine = tasks.filter(t => t.assignedTo === u.id)
        const complete = mine.filter(t => t.status === 'done').length
        return (
        <section key={u.id} className="dash-task team-card">
            <div className="team-top">
            <span className="avatar">{(u.name || '?').charAt(0)}</span>
            <div>
                <strong>{u.name}{u.id === userId ? ' (you)' : ''}</strong>
                <span className={'role-tag ' + (u.isOwner ? 'owner' : u.role === 'admin' ? 'admin' : '')}>
                <img src={roleIcon(u.role, u.isOwner)} alt="" width="16" height="16" /> {roleName(u.role, u.isOwner)}
                </span>
            </div>
            </div>
            <span className="who">{mine.length} {mine.length === 1 ? 'task' : 'tasks'}, {complete} done</span>
            {mine.length === 0 && <span className="who">No tasks assigned.</span>}
            <ul className="plain-list">
            {mine.map(t => (
                <li key={t.id}>
                <button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>
                <span className={'status status-' + t.status}>{status_names[t.status]}</span>
                </li>
            ))}
            </ul>
        </section>
        )
    })}

    {unassigned.length > 0 && (
        <section className="dash-task team-card">
        <strong className="h-ico"><img src="/icons/inbox.svg" alt="" width="20" height="20" /> Not assigned ({unassigned.length})</strong>
        <ul className="plain-list">
            {unassigned.map(t => (
            <li key={t.id}>
                <button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>
            </li>
            ))}
        </ul>
        </section>
    )}
    </div>
    </div>
)
}
//this is for the team tab: everyone in the project, their role and their tasks
import { status_names } from '../labels.js'

export default function Team({ users, tasks, userId, onOpen }) {
//this is for tasks nobody is assigned to
const unassigned = tasks.filter(t => !t.assignedTo)

return (
    <div>
    <h2>Team ({users.length})</h2>

    {users.map(u => {
        const mine = tasks.filter(t => t.assignedTo === u.id)
        const complete = mine.filter(t => t.status === 'done').length
        return (
        <section key={u.id} className="dash-task">
            <strong>{u.name}{u.id === userId ? ' (you)' : ''}</strong>
            <span className="who">
            {u.role === 'admin' ? 'Admin' : 'Member'}, {mine.length} {mine.length === 1 ? 'task' : 'tasks'}, {complete} complete
            </span>
            {mine.length === 0 && <span className="who">No tasks assigned.</span>}
            <ul>
            {mine.map(t => (
                <li key={t.id}>
                <button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>{' '}
                <span className={'status status-' + t.status}>{status_names[t.status]}</span>
                </li>
            ))}
            </ul>
        </section>
        )
    })}

    {unassigned.length > 0 && (
        <section className="dash-task">
        <strong>Not assigned ({unassigned.length})</strong>
        <ul>
            {unassigned.map(t => (
            <li key={t.id}>
                <button type="button" className="link" onClick={() => onOpen(t.id)}>{t.name}</button>
            </li>
            ))}
        </ul>
        </section>
    )}
    </div>
)
}
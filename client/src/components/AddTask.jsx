//this is for the add task form
import { useState } from 'react'

export default function AddTask({ onAdd, tasks, users }) {
//this is for the values in the boxes (who is the typed name, it is turned into a person below)
const [name, setName] = useState('')
const [who, setWho] = useState('')
const [startDate, setStartDate] = useState('')
const [endDate, setEndDate] = useState('')
const [priority, setPriority] = useState('med')
//this is for the task that must finish first (one dependency, shown in the dropdown)
const [dep, setDep] = useState('')
const [desc, setDesc] = useState('')
//this is for the message when the typed name is not in the project
const [error, setError] = useState('')

//this is for saving the task when the button is clicked
function handleSubmit(e) {
    e.preventDefault()
    if (!name || !startDate || !endDate) return
    if (endDate < startDate) return

    //this is for making sure the assigned person is in the project
    //this is for the assignee being optional: empty is fine, a typed name must be someone in the project
    const person = who.trim() ? users.find(u => u.name.toLowerCase() === who.trim().toLowerCase()) : null
    if (who.trim() && !person) {
    setError('Pick a name from the list, or leave it empty.')
    return
    }
    setError('')

    //this is for handing the new task to the timeline page
    onAdd({
    id: crypto.randomUUID(),
    name: name,
    assignedTo: person ? person.id : null,
    startDate: startDate,
    endDate: endDate,
    priority: priority,
    description: desc,
    dependsOn: dep ? [dep] : [],
    })

    //this is for clearing the boxes
    setName('')
    setWho('')
    setStartDate('')
    setEndDate('')
    setPriority('med')
    setDep('')
    setDesc('')
}

return (
    <form className="add-task" onSubmit={handleSubmit}>
    <div className="field span-2">
        <label htmlFor="task-desc">Description (optional)</label>
        <input id="task-desc" maxLength={300} value={desc} onChange={e => setDesc(e.target.value)} />
    </div>

    <div className="field span-2">
        <label htmlFor="task-name">Task name</label>
        <input id="task-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Build the engine" />
    </div>

    {/*this is for the user list, typing searches the names*/}
    <div className="field">
        <label htmlFor="task-who">Assigned to (optional)</label>
        <input id="task-who" list="user-names" autoComplete="off" value={who}
        onChange={e => setWho(e.target.value)} placeholder="Leave empty for now" />
        <datalist id="user-names">
        {users.map(u => (
            <option key={u.id} value={u.name}>{u.role}</option>
        ))}
        </datalist>
        {error && <span className="who" role="alert">{error}</span>}
        {!who.trim() && <span className="who">Nobody assigned: its dates and status stay locked until someone is.</span>}
    </div>

    <div className="field">
        <label htmlFor="task-priority">Priority</label>
        <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="high">High</option>
        <option value="med">Medium</option>
        <option value="low">Low</option>
        </select>
    </div>

    <div className="field">
        <label htmlFor="task-start">Start date</label>
        <input id="task-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        {startDate && startDate < new Date().toISOString().slice(0, 10) && <span className="who">Past tasks are saved as Complete.</span>}
    </div>

    <div className="field">
        <label htmlFor="task-end">End date</label>
        <input id="task-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
    </div>

    {/*this is for picking which task must finish first, the dropdown keeps your choice shown*/}
    {tasks.length > 0 && (
        <div className="field span-2">
        <label htmlFor="task-deps">Depends on</label>
        <select id="task-deps" value={dep} onChange={e => setDep(e.target.value)}>
            <option value="">None</option>
            {tasks.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
            ))}
        </select>
        </div>
    )}

    <div className="form-footer">
        <button type="submit">Add task</button>
    </div>
    </form>
)
}
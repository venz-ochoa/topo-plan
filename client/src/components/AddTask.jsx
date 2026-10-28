//this is for the add task form
import { useState } from 'react'

export default function AddTask({ onAdd, tasks }) {
    //this is for the values in the boxes
    const [name, setName] = useState('')
    const [who, setWho] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [priority, setPriority] = useState('med')
    //this is for the task that must finish first (one dependency, shown in the dropdown)
    const [dep, setDep] = useState('')

    //this is for saving the task when the button is clicked
    function handleSubmit(e) {
        e.preventDefault()
        if (!name || !startDate || !endDate) return
        if (endDate < startDate) return

        //this is for handing the new task to the home page
        onAdd({
        id: 't' + Date.now(),
        name: name,
        who: who,
        startDate: startDate,
        endDate: endDate,
        priority: priority,
        dependsOn: dep ? [dep] : [],
        })

        //this is for clearing the boxes
        setName('')
        setWho('')
        setStartDate('')
        setEndDate('')
        setPriority('med')
        setDep('')
    }

    return (
        <form className="add-task" onSubmit={handleSubmit}>
        <div className="field span-2">
            <label htmlFor="task-name">Task name</label>
            <input id="task-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Build the engine" />
        </div>

        <div className="field">
            <label htmlFor="task-who">Assigned to</label>
            <input id="task-who" value={who} onChange={e => setWho(e.target.value)} placeholder="e.g. me" />
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
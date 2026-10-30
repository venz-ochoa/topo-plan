//this is for the task form that lives inside the popup window
//task is null when adding, or the task being edited
import { useState } from 'react'

export default function AddTask({ task, tasks, onSave, onClose }) {
    //this is for the values in the boxes (the task's old values, or empty ones)
    const [name, setName] = useState((task && task.name) || '')
    const [who, setWho] = useState((task && task.who) || '')
    const [startDate, setStartDate] = useState((task && task.startDate) || '')
    const [endDate, setEndDate] = useState((task && task.endDate) || '')
    const [priority, setPriority] = useState((task && task.priority) || 'med')
    //this is for the task that must finish first (one dependency, shown in the dropdown)
    const [dep, setDep] = useState((task && task.dependsOn[0]) || '')

    //this is for saving the task when the button is clicked
    function handleSubmit(e) {
        e.preventDefault()
        if (!name || !startDate || !endDate) return
        if (endDate < startDate) return

        //this is for handing the task to the home page (new id when adding, same id when editing)
        onSave({
        id: task ? task.id : 't' + Date.now(),
        name: name,
        who: who,
        startDate: startDate,
        endDate: endDate,
        priority: priority,
        dependsOn: dep ? [dep] : [],
        })
    }

    return (
        <div className="overlay">
        <div className="modal">
            {/*this is for the title, it changes for add and edit*/}
            <h3>{task ? 'Edit task' : 'Add task'}</h3>

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
                    {tasks.filter(t => !task || t.id !== task.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                </div>
            )}

            <div className="form-footer">
                {/*this is for closing the popup without saving*/}
                <button type="button" onClick={onClose}>Cancel</button>
                <button type="submit">{task ? 'Save' : 'Add task'}</button>
            </div>
            </form>
        </div>
        </div>
    )
}
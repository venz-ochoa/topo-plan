//this is for the add task form (name, assigned to, date)
import { useState } from 'react'

export default function AddTask({ onAdd }) {
  //this is for the values typed in the three boxes
    const [name, setName] = useState('')
    const [who, setWho] = useState('')
    const [date, setDate] = useState('')

  //this is for saving the task when the button is clicked
    function handleSubmit(e) {
        e.preventDefault()
        //this is for blocking empty tasks (a name and a date are required)
        if (!name || !date) return

        //this is for handing the new task up to the parent page
        onAdd({ name, who, date })

        //this is for clearing the boxes after adding
        setName('')
        setWho('')
        setDate('')
    }

    return (
        <form className="add-task" onSubmit={handleSubmit}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Task name" />
        <input value={who} onChange={e => setWho(e.target.value)} placeholder="Assigned to" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button type="submit">+ Add Task</button>
        </form>
    )
}
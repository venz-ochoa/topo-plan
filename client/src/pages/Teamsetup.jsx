//this is for the screen where a new user makes a project or joins one
import { useState } from 'react'
import { createProject, joinProject } from '../db.js'

export default function TeamSetup({ inviteCode, onDone }) {
    //this is for the values in the boxes (the code is filled in if it came from a link)
    const [name, setName] = useState('')
    const [code, setCode] = useState(inviteCode)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    //this is for making a new project
    async function handleCreate(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
        await createProject(name)
        onDone()
        } catch (err) {
        setError(err.message)
        }
        setBusy(false)
    }

    //this is for joining with an invite code
    async function handleJoin(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
        await joinProject(code.trim().toLowerCase())
        //this is for removing the code from the address bar
        window.history.replaceState(null, '', window.location.pathname)
        onDone()
        } catch (err) {
        setError(err.message)
        }
        setBusy(false)
    }

    return (
        <div>
        <h2>Join or start a project</h2>

        {error && <div className="error-box" role="alert">{error}</div>}

        <form className="add-task" onSubmit={handleJoin}>
            <h3>I have an invite code</h3>
            <div className="field span-2">
            <label htmlFor="join-code">Invite code</label>
            <input id="join-code" required value={code} onChange={e => setCode(e.target.value)} />
            </div>
            <div className="form-footer">
            <button type="submit" disabled={busy}>Join project</button>
            </div>
        </form>

        <form className="add-task" onSubmit={handleCreate}>
            <h3>Start a new project (you become the admin)</h3>
            <div className="field span-2">
            <label htmlFor="project-name">Project name</label>
            <input id="project-name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-footer">
            <button type="submit" disabled={busy}>Create project</button>
            </div>
        </form>
        </div>
    )
}
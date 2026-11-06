//this is for the screen where someone joins a project with an invite code (starting a project has its own screen)
import { useState } from 'react'
import { joinProject } from '../db.js'
import { friendly } from '../engine/errors.js'

export default function TeamSetup({ inviteCode, onDone, onCancel, onCreate }) {
//this is for the value in the box (the code is filled in if it came from a link)
const [code, setCode] = useState(inviteCode)
const [error, setError] = useState('')
const [busy, setBusy] = useState(false)

//this is for joining with an invite code
async function handleJoin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
    const id = await joinProject(code.trim().toLowerCase())
    //this is for removing the code from the address bar
    window.history.replaceState(null, '', window.location.pathname)
    onDone(id)
    } catch (err) {
    setError(friendly(err))
    }
    setBusy(false)
}

return (
    <div>
    <div className="page-bar">
        <h2>Join a project</h2>
        <button type="button" className="with-icon" onClick={onCancel}><img src="/icons/back.svg" alt="" width="18" height="18" /> Back</button>
    </div>
    <p className="lead">Someone on the team sent you an invite. Paste the code from it (or open the link they gave you) to get in.</p>

    {error && <div className="error-box" role="alert">{error}</div>}

    <div className="split">
    <form className="add-task" onSubmit={handleJoin}>
        <h3 className="h-ico"><img src="/icons/key.svg" alt="" width="22" height="22" /> I have an invite code</h3>
        <div className="field span-2">
        <label htmlFor="join-code"><img src="/icons/key.svg" alt="" width="18" height="18" /> Invite code</label>
        <input id="join-code" required value={code} onChange={e => setCode(e.target.value)} />
        </div>
        <div className="form-footer">
        <button type="submit" className="primary" disabled={busy}>Join project</button>
        </div>
    </form>

    <aside className="side-card" aria-label="Other options">
        <h3>No code yet?</h3>
        <ol className="steps">
        <li><img src="/icons/mail.svg" alt="" width="22" height="22" /><div><strong>Ask a team admin</strong><span>Admins can create an invite link for your email address.</span></div></li>
        <li><img src="/icons/plus.svg" alt="" width="22" height="22" /><div><strong>Or start your own</strong><span>Make a new project and invite your own team.</span></div></li>
        </ol>
        <div className="form-footer"><button type="button" className="with-icon" onClick={onCreate}><img src="/icons/plus.svg" alt="" width="18" height="18" /> New project</button></div>
    </aside>
    </div>
    </div>
    )
}
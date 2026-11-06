//this is for the profile page: your projects, your name, your password
import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { getMyName, saveMyName, getDeletePlan, deleteMyAccount } from '../db.js'
import { roleName, roleIcon } from '../labels.js'

export default function Profile({ projects, currentId, userId, email, onOpen, onCreate, onJoin, onDeleted }) {
//this is for the values in the boxes
const [name, setName] = useState('')
const [password, setPassword] = useState('')
const [again, setAgain] = useState('')
const [newEmail, setNewEmail] = useState('')

//this is for the messages under each form (bad = true shows it as an error)
const [nameMsg, setNameMsg] = useState({ text: '', bad: false })
const [passMsg, setPassMsg] = useState({ text: '', bad: false })
const [emailMsg, setEmailMsg] = useState({ text: '', bad: false })
const [busy, setBusy] = useState(false)

//this is for loading the current name when the page opens
useEffect(() => {
    getMyName(userId)
    .then(setName)
    .catch(e => setNameMsg({ text: e.message, bad: true }))
}, [userId])

//this is for saving the new name
async function handleName(e) {
    e.preventDefault()
    if (!name.trim()) {
    setNameMsg({ text: 'Name cannot be empty.', bad: true })
    return
    }
    setBusy(true)
    try {
    await saveMyName(userId, name.trim())
    setNameMsg({ text: 'Name saved.', bad: false })
    } catch (err) {
    setNameMsg({ text: err.message, bad: true })
    }
    setBusy(false)
}

//this is for changing the email (Supabase sends a confirmation link, the email changes after it is clicked)
async function handleEmail(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() })
    setBusy(false)
    if (error) {
    setEmailMsg({ text: error.message, bad: true })
    return
    }
    setNewEmail('')
    setEmailMsg({ text: 'Check your inbox. Click the link we sent to confirm the new email.', bad: false })
}

//this is for changing the password
async function handlePassword(e) {
    e.preventDefault()
    if (password.length < 8) {
    setPassMsg({ text: 'Password must be at least 8 characters.', bad: true })
    return
    }
    if (password !== again) {
    setPassMsg({ text: 'The two passwords do not match.', bad: true })
    return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
    setPassMsg({ text: error.message, bad: true })
    return
    }
    setPassword('')
    setAgain('')
    setPassMsg({ text: 'Password changed.', bad: false })
}

//this is for the delete account box: what will happen to each project, the word to type, and the busy state
const [plan, setPlan] = useState(null)
const [confirmText, setConfirmText] = useState('')
const [delMsg, setDelMsg] = useState('')
const [deleting, setDeleting] = useState(false)

//this is for working out what deleting would do to each project (it updates when the projects change)
useEffect(() => {
    let alive = true
    getDeletePlan(userId, projects).then(r => { if (alive) setPlan(r) }).catch(e => { if (alive) setDelMsg(e.message) })
    return () => { alive = false }
}, [userId, projects])
const blocked = plan ? plan.filter(x => x.kind === 'blocked') : []

//this is for deleting the account and all its data, then going back to the login screen
async function handleDelete(e) {
    e.preventDefault()
    setDelMsg('')
    if (blocked.length > 0 || confirmText !== 'DELETE') return
    if (!confirm('This deletes your account and your data for good. Continue?')) return
    setDeleting(true)
    try {
    await deleteMyAccount()
    onDeleted()
    } catch (err) {
    setDelMsg(err.message)
    setDeleting(false)
    }
}

return (
    <div>
    <div className="profile-head">
        <span className="avatar big">{(email || '?').charAt(0)}</span>
        <div>
        <h2>Your profile</h2>
        <p className="who with-ico"><img src="/icons/mail.svg" alt="" width="16" height="16" /> {email}</p>
        </div>
    </div>

    <div className="profile-grid">
    <section>

    {/*this is for the list of projects, with the role in each one*/}
    <h3 className="h-ico"><img src="/icons/folder.svg" alt="" width="22" height="22" /> Your projects ({projects.length})</h3>
    {projects.length === 0 && <p className="empty">You are not in any project yet.</p>}
    <ul className="project-list">
        {projects.map(p => (
        <li key={p.id} className="project-item">
            <img className="ico-img" src="/icons/folder.svg" alt="" width="24" height="24" />
            <span className="project-name">{p.name}</span>
            <span className={'role-tag ' + (p.isOwner ? 'owner' : p.role === 'admin' ? 'admin' : '')}>
            <img src={roleIcon(p.role, p.isOwner)} alt="" width="16" height="16" />
            {roleName(p.role, p.isOwner)}
            </span>
            <button className="with-icon" onClick={() => onOpen(p.id)}>Open <img src="/icons/open.svg" alt="" width="18" height="18" /></button>
        </li>
        ))}
    </ul>
    <div className="form-footer project-actions">
        <button className="with-icon" onClick={onCreate}><img src="/icons/plus.svg" alt="" width="18" height="18" /> New project</button>
        <button className="with-icon" onClick={onJoin}><img src="/icons/key.svg" alt="" width="18" height="18" /> Join with a code</button>
    </div>
    </section>

    <section className="profile-forms">
    <form className="add-task" onSubmit={handleName}>
        <h3 className="h-ico"><img src="/icons/user.svg" alt="" width="22" height="22" /> Change name</h3>
        <div className="field span-2">
        <label htmlFor="profile-name">Name (teammates see this)</label>
        <input id="profile-name" required maxLength={60} value={name} onChange={e => setName(e.target.value)} />
        </div>
        {nameMsg.text && (
        <div className={nameMsg.bad ? 'error-box' : ''} role={nameMsg.bad ? 'alert' : 'status'}>{nameMsg.text}</div>
        )}
        <div className="form-footer">
        <button type="submit" className="with-icon" disabled={busy}><img src="/icons/check.svg" alt="" width="18" height="18" /> Save name</button>
        </div>
    </form>

    <form className="add-task" onSubmit={handleEmail}>
        <h3 className="h-ico"><img src="/icons/mail.svg" alt="" width="22" height="22" /> Change email</h3>
        <div className="field span-2">
        <label htmlFor="profile-email">New email</label>
        <input id="profile-email" type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
        </div>
        {emailMsg.text && (
        <div className={emailMsg.bad ? 'error-box' : ''} role={emailMsg.bad ? 'alert' : 'status'}>{emailMsg.text}</div>
        )}
        <div className="form-footer">
        <button type="submit" className="with-icon" disabled={busy}><img src="/icons/check.svg" alt="" width="18" height="18" /> Change email</button>
        </div>
    </form>

    <form className="add-task" onSubmit={handlePassword}>
        <h3 className="h-ico"><img src="/icons/lock.svg" alt="" width="22" height="22" /> Change password</h3>
        <div className="field span-2">
        <label htmlFor="profile-password">New password (8+ characters)</label>
        <input id="profile-password" type="password" autoComplete="new-password" required
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="field span-2">
        <label htmlFor="profile-again">Type it again</label>
        <input id="profile-again" type="password" autoComplete="new-password" required
            value={again} onChange={e => setAgain(e.target.value)} />
        </div>
        {passMsg.text && (
        <div className={passMsg.bad ? 'error-box' : ''} role={passMsg.bad ? 'alert' : 'status'}>{passMsg.text}</div>
        )}
        <div className="form-footer">
        <button type="submit" className="with-icon" disabled={busy}><img src="/icons/lock.svg" alt="" width="18" height="18" /> Change password</button>
        </div>
    </form>

    <section className="add-task danger-zone" aria-labelledby="danger-title">
        <h3 id="danger-title" className="h-ico"><img src="/icons/alert.svg" alt="" width="22" height="22" /> Delete account and data</h3>
        <p>This removes your account, your name, your notifications and your requests for good. It cannot be undone.</p>

        {plan === null && <p className="who">Checking your projects...</p>}
        {plan && plan.length > 0 && (
        <ul className="plan-list">
            {plan.map(x => (
            <li key={x.id} className={'plan-' + x.kind}>
                <strong>{x.name}</strong>
                <span>
                {x.kind === 'delete' && 'Nobody else is in it, so the project and its tasks will be deleted.'}
                {x.kind === 'transfer' && 'You are the owner. Ownership will move to another admin, and everyone in it will be told.'}
                {x.kind === 'leave' && 'You will be removed, and the others will be told.'}
                {x.kind === 'blocked' && 'You are the only admin. Make another person an admin first (Invite tab of the project), then come back.'}
                </span>
            </li>
            ))}
        </ul>
        )}

        {blocked.length > 0 && (
        <div className="error-box" role="alert">You cannot delete your account yet: you are the only admin of {blocked.map(b => b.name).join(', ')}.</div>
        )}
        {delMsg && <div className="error-box" role="alert">{delMsg}</div>}

        <form onSubmit={handleDelete} className="delete-form">
        <div className="field span-2">
            <label htmlFor="delete-confirm">Type DELETE to confirm</label>
            <input id="delete-confirm" autoComplete="off" value={confirmText} onChange={e => setConfirmText(e.target.value)} disabled={blocked.length > 0} />
        </div>
        <div className="form-footer">
            <button type="submit" className="danger with-icon" disabled={deleting || blocked.length > 0 || confirmText !== 'DELETE'}>
            <img src="/icons/trash-light.svg" alt="" width="18" height="18" /> {deleting ? 'Deleting...' : 'Delete my account'}
            </button>
        </div>
        </form>
    </section>
    </section>
    </div>
    </div>
)
}
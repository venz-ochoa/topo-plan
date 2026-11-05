//this is for the screen where someone starts a new project: title, description and the people to invite by email
import { useState } from 'react'
import { createProject } from '../db.js'
import { parseEmails, MAX_INVITES } from '../emails.js'

//this is for the invite link of one code (the same kind of link the Invite tab makes)
function linkFor(code) {
	return window.location.origin + window.location.pathname + '#join=' + code
}

export default function CreateProject({ myEmail, onCreated, onDone, onCancel }) {
	//this is for the values in the boxes
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	//this is for the people to invite: the list so far, and the text being typed
	const [emails, setEmails] = useState([])
	const [draft, setDraft] = useState('')
	const [problems, setProblems] = useState([])
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)
	//this is for the screen after the project is made (null until then)
	const [result, setResult] = useState(null)
	//this is for the invite whose link was just copied
	const [copied, setCopied] = useState('')

	//this is for turning the typed text into people in the list
	function addDraft() {
		const { added, problems: bad } = parseEmails(draft, emails, myEmail)
		setProblems(bad)
		setEmails([...emails, ...added])
		//this is for keeping the text only when something in it was wrong, so it can be fixed
		if (bad.length === 0) setDraft('')
		return { added, bad }
	}

	function removeEmail(e) {
		setEmails(emails.filter(x => x !== e))
		setProblems([])
	}

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')

		//this is for not losing an address that was typed but not added yet
		const { added, problems: bad } = parseEmails(draft, emails, myEmail)
		if (bad.length > 0) {
			setProblems(bad)
			return
		}
		const list = [...emails, ...added]
		setEmails(list)
		setDraft('')
		setProblems([])

		setBusy(true)
		let created
		try {
			created = await createProject(title.trim(), description.trim(), list)
		} catch (err) {
			setError(err.message)
			setBusy(false)
			return
		}

		//this is for a project without invites: go straight to it
		if (created.invites.length === 0) {
			setBusy(false)
			onDone(created.id)
			return
		}

		//this is for showing the invite links to share
		onCreated()
		setResult({ id: created.id, title: title.trim(), invites: created.invites })
		setBusy(false)
	}

	async function copy(code) {
		try {
			await navigator.clipboard.writeText(linkFor(code))
			setCopied(code)
		} catch (err) {
			//this is for browsers that block copying: the link is also shown in the box
			setCopied('')
		}
	}

	//this is for the screen after the project was made
	if (result) {
		return (
			<div>
				<h2>Project created</h2>
				<p><strong>{result.title}</strong> is ready, and you are its admin.</p>

				<h3>Invites ({result.invites.length})</h3>
				<div>
					{result.invites.map(i => (
						<div key={i.code} className="dash-task">
							<strong>{i.email}</strong>
							<span className="invite-row">
								<input readOnly aria-label={'Invite link for ' + i.email} value={linkFor(i.code)} onFocus={e => e.target.select()} />
								<button type="button" onClick={() => copy(i.code)}>{copied === i.code ? 'Copied' : 'Copy link'}</button>
							</span>
						</div>
					))}
				</div>

				<p className="empty">
					Copy each link and send it to that person. Each link only works for the email it was made for, works once, and expires in 7 days.
					If they already have an account, the invite also shows on their dashboard.
				</p>

				<div className="form-footer">
					<button type="button" className="primary" onClick={() => onDone(result.id)}>Open project</button>
					<button type="button" onClick={onCancel}>Back to dashboard</button>
				</div>
			</div>
		)
	}

	return (
		<div>
			<h2>New project</h2>
			<form className="add-task" onSubmit={handleSubmit}>
				<div className="field span-2">
					<label htmlFor="new-title">Title</label>
					<input id="new-title" required maxLength={80} autoFocus
						value={title} onChange={e => setTitle(e.target.value)} />
				</div>

				<div className="field span-2">
					<label htmlFor="new-description">Description (optional)</label>
					<textarea id="new-description" rows={3} maxLength={500}
						value={description} onChange={e => setDescription(e.target.value)} />
					<span className="tag">{description.length}/500</span>
				</div>

				<div className="field span-2">
					<label htmlFor="new-emails">Invite members by email (optional)</label>
					<div className="invite-row">
						<input id="new-emails" type="text" inputMode="email" autoComplete="off"
							placeholder="name@example.com, other@example.com"
							aria-describedby="new-emails-help"
							value={draft}
							onChange={e => setDraft(e.target.value)}
							onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDraft() } }} />
						<button type="button" onClick={addDraft} disabled={draft.trim() === ''}>Add</button>
					</div>
					<span id="new-emails-help" className="tag">
						Press Enter or Add. You can paste several addresses at once. Up to {MAX_INVITES} people.
					</span>

					{problems.length > 0 && (
						<div className="error-box" role="alert">
							{problems.map(p => <div key={p}>{p}</div>)}
						</div>
					)}

					{emails.length > 0 && (
						<ul className="chips" aria-label="People to invite">
							{emails.map(em => (
								<li key={em} className="chip">
									{em}
									<button type="button" aria-label={'Remove ' + em} onClick={() => removeEmail(em)}>x</button>
								</li>
							))}
						</ul>
					)}
				</div>

				{error && <div className="error-box" role="alert">{error}</div>}

				<div className="form-footer">
					<button type="submit" className="primary" disabled={busy}>
						{busy ? 'Creating...' : emails.length > 0 || draft.trim() ? 'Create project and invite' : 'Create project'}
					</button>
					<button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
				</div>
			</form>
		</div>
	)
}

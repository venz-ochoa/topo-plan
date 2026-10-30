//this is for the sign up screen
import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function SignUp({ onSwitch }) {
  //this is for the values in the boxes
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [again, setAgain] = useState('')

	//this is for the error message, the waiting state, and the "check your email" state
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)
	const [sent, setSent] = useState(false)

	//this is for creating the account when the button is clicked
	async function handleSubmit(e) {
		e.preventDefault()
		setError('')

		//this is for checking the password before asking supabase
		if (password.length < 8) {
		setError('Password must be at least 8 characters.')
		return
		}
		if (password !== again) {
		setError('The two passwords do not match.')
		return
		}

		setBusy(true)
		//this is for sending the name along, so a profile can be made for it
		const { error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { name: name.trim() } },
		})
		setBusy(false)

		if (error) {
		setError(error.message)
		return
		}
		//this is for telling the user to confirm their email
		setSent(true)
	}

	//this is for the screen after sign up worked
	if (sent) {
		return (
		<div className="add-task">
			<h2>Check your email</h2>
			<p>We sent a link to {email}. Click it to confirm your account, then log in.</p>
			<button type="button" onClick={onSwitch}>Go to log in</button>
		</div>
		)
	}

	return (
		<form className="add-task" onSubmit={handleSubmit}>
		<h2>Sign up</h2>

		<div className="field span-2">
			<label htmlFor="signup-name">Your name (teammates will see this)</label>
			<input id="signup-name" autoComplete="name" required maxLength={60}
			value={name} onChange={e => setName(e.target.value)} />
		</div>

		<div className="field span-2">
			<label htmlFor="signup-email">Email</label>
			<input id="signup-email" type="email" autoComplete="email" required
			value={email} onChange={e => setEmail(e.target.value)} />
		</div>

		<div className="field span-2">
			<label htmlFor="signup-password">Password (8+ characters)</label>
			<input id="signup-password" type="password" autoComplete="new-password" required
			value={password} onChange={e => setPassword(e.target.value)} />
		</div>

		<div className="field span-2">
			<label htmlFor="signup-again">Type the password again</label>
			<input id="signup-again" type="password" autoComplete="new-password" required
			value={again} onChange={e => setAgain(e.target.value)} />
		</div>

		{/*this is for showing the error*/}
		{error && <div className="error-box" role="alert">{error}</div>}

		<div className="form-footer">
			<button type="submit" disabled={busy}>{busy ? 'Creating...' : 'Sign up'}</button>
		</div>

		<p>Already have an account? <button type="button" onClick={onSwitch}>Log in</button></p>
		</form>
	)
}
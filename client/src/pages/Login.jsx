//this is for the login screen
import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Login({ onSwitch }) {
  //this is for the values in the boxes
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  //this is for the error message and the button waiting state
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  //this is for logging in when the button is clicked
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setBusy(false)
    if (error) {
      //this is for a short message that doesn't say which part was wrong
      if (error.message.includes('not confirmed')) {
        setError('Please confirm your email first. Check your inbox.')
      } else {
        setError('Wrong email or password.')
      }
    }
    //this is for success: the app notices the login by itself and shows the home page
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <h2>Log in</h2>

      <div className="field span-2">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" autoComplete="email" required
          value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <div className="field span-2">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" required
          value={password} onChange={e => setPassword(e.target.value)} />
      </div>

      {/*this is for showing the error*/}
      {error && <div className="error-box" role="alert">{error}</div>}

      <div className="form-footer">
        <button type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </div>

      <p>No account yet? <button type="button" onClick={onSwitch}>Sign up</button></p>
    </form>
  )
}
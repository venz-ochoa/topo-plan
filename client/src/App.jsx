import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { getMyProject } from './db.js'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import TeamSetup from './pages/TeamSetup.jsx'
import Project from './pages/Project.jsx'

export default function App() {
  //this is for the logged in user (null means nobody)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  //this is for which screen shows when logged out
  const [screen, setScreen] = useState('login')
  //this is for the user's project (undefined = still loading, null = no project yet)
  const [project, setProject] = useState(undefined)
  const [error, setError] = useState('')
  //this is for the invite code from a link like https://site/#join=abc123
  const [inviteCode] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('join') || '')

  //this is for checking if someone is already logged in, and listening for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  //this is for loading the project once we know who the user is
  const userId = session ? session.user.id : null
  useEffect(() => {
    if (!userId) {
      setProject(undefined)
      return
    }
    getMyProject(userId).then(setProject).catch(e => setError(e.message))
  }, [userId])

  //this is for reloading the project after creating or joining one
  function reloadProject() {
    getMyProject(userId).then(setProject).catch(e => setError(e.message))
  }

  if (loading) return <p>Loading...</p>

  //this is for the login and sign up screens
  if (!session) {
    return screen === 'login'
      ? <Login onSwitch={() => setScreen('signup')} />
      : <SignUp onSwitch={() => setScreen('login')} />
  }

  return (
    <div>
      <button onClick={() => supabase.auth.signOut()}>Log out</button>
      {error && <div className="error-box" role="alert">{error}</div>}
      {project === undefined && !error && <p>Loading...</p>}
      {project === null && <TeamSetup inviteCode={inviteCode} onDone={reloadProject} />}
      {project && <Project key={project.id} project={project} userId={userId} />}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'

export default function App() {
  //this is for the logged in user (null means nobody)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  //this is for which screen shows when logged out
  const [screen, setScreen] = useState('login')

  //this is for checking if someone is already logged in, and listening for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return <p>Loading...</p>

  //this is for the home page, only when logged in
  if (session) {
    return (
      <div>
        <button onClick={() => supabase.auth.signOut()}>Log out</button>
        <Home />
      </div>
    )
  }

  //this is for the login and sign up screens
  return screen === 'login'
    ? <Login onSwitch={() => setScreen('signup')} />
    : <SignUp onSwitch={() => setScreen('login')} />
}
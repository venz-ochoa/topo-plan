import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { getMyProjects } from './db.js'
import Login from './pages/Login.jsx'
import SignUp from './pages/Signup.jsx'
import TeamSetup from './pages/Teamsetup.jsx'
import Project from './pages/Project.jsx'
import Profile from './pages/Profile.jsx'
import Overview from './pages/Overview.jsx'
import CreateProject from './pages/CreateProject.jsx'

export default function App() {
	//this is for the logged in user (null means nobody)
	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState(true)
	//this is for which screen shows when logged out
	const [screen, setScreen] = useState('login')
	//this is for the user's projects (undefined = still loading) and the one that is open
	const [projects, setProjects] = useState(undefined)
	const [currentId, setCurrentId] = useState(null)
	const [error, setError] = useState('')
	//this is for the invite code from a link like https://site/#join=abc123
	const [inviteCode, setInviteCode] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('join') || '')
	//this is for which page shows: 'dashboard' (all projects), 'project', 'profile', 'create' or 'join'
	const [view, setView] = useState(inviteCode ? 'join' : 'dashboard')
	//this is for a task to open straight away when the user clicks it on the dashboard
	const [openTaskId, setOpenTaskId] = useState(null)

	//this is for checking if someone is already logged in, and listening for changes
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session)
			setLoading(false)
		})
		const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
		return () => data.subscription.unsubscribe()
	}, [])

	//this is for loading the user's projects (and keeping the open one if it is still there)
	const userId = session ? session.user.id : null
	async function loadProjects() {
		try {
			const list = await getMyProjects(userId)
			setProjects(list)
			setCurrentId(prev => (list.some(p => p.id === prev) ? prev : list.length > 0 ? list[0].id : null))
		} catch (e) {
			setError(e.message)
		}
	}

	useEffect(() => {
		if (!userId) {
			setProjects(undefined)
			setCurrentId(null)
			return
		}
		loadProjects()
	}, [userId])

	//this is for after creating or joining a project: open it
	async function afterJoin(id) {
		await loadProjects()
		setCurrentId(id)
		setInviteCode('')
		setOpenTaskId(null)
		setView('project')
	}

	//this is for opening a project (and maybe one of its tasks) from the dashboard
	function openProject(id, taskId = null) {
		setCurrentId(id)
		setOpenTaskId(taskId)
		setView('project')
	}

	if (loading) return <p>Loading...</p>

	//this is for the login and sign up screens
	if (!session) {
		return screen === 'login'
			? <Login onSwitch={() => setScreen('signup')} />
			: <SignUp onSwitch={() => setScreen('login')} />
	}

	const hasProjects = projects && projects.length > 0
	const current = hasProjects ? projects.find(p => p.id === currentId) : null
	//this is for never showing an empty project page: fall back to the dashboard
	const shown = view === 'project' && !current ? 'dashboard' : view

	return (
		<div>
			<nav>
				<button onClick={() => setView('dashboard')} aria-current={shown === 'dashboard' ? 'page' : undefined}>Dashboard</button>
				{/*this is for switching between your projects*/}
				{hasProjects && (
					<select aria-label="Project" value={shown === 'project' ? currentId || '' : ''} onChange={e => openProject(e.target.value)}>
						<option value="" disabled>Open a project...</option>
						{projects.map(p => (
							<option key={p.id} value={p.id}>{p.name} ({p.role})</option>
						))}
					</select>
				)}
				<button onClick={() => setView('create')}>New project</button>
				<button onClick={() => setView('profile')}>Profile</button>
				<button onClick={() => supabase.auth.signOut()}>Log out</button>
			</nav>

			{error && <div className="error-box" role="alert">{error}</div>}
			{projects === undefined && !error && <p>Loading...</p>}

			{/*this is for the dashboard with every project*/}
			{projects && shown === 'dashboard' && (
				<Overview
					projects={projects}
					userId={userId}
					onOpenProject={id => openProject(id)}
					onOpenTask={(projectId, taskId) => openProject(projectId, taskId)}
					onCreate={() => setView('create')}
					onJoin={() => setView('join')}
					onProjectsChanged={loadProjects}
				/>
			)}

			{projects && shown === 'create' && (
				<CreateProject
					myEmail={session.user.email}
					onCreated={loadProjects}
					onDone={afterJoin}
					onCancel={() => setView('dashboard')}
				/>
			)}

			{projects && shown === 'join' && (
				<TeamSetup inviteCode={inviteCode} onDone={afterJoin} onCancel={() => { setInviteCode(''); setView('dashboard') }} onCreate={() => setView('create')} />
			)}

			{projects && shown === 'profile' && (
				<Profile
					projects={projects}
					currentId={currentId}
					userId={userId}
					email={session.user.email}
					onOpen={id => openProject(id)}
					onCreate={() => setView('create')}
					onJoin={() => setView('join')}
				/>
			)}

			{projects && shown === 'project' && current && (
				<Project key={current.id + ':' + (openTaskId || '')} project={current} userId={userId} initialTaskId={openTaskId} />
			)}
		</div>
	)
}
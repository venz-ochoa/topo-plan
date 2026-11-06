import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { getMyProjects, getNotifications, markAllRead, onChange } from './db.js'
import Login from './pages/Login.jsx'
import SignUp from './pages/Signup.jsx'
import TeamSetup from './pages/Teamsetup.jsx'
import Project from './pages/Project.jsx'
import Profile from './pages/Profile.jsx'
import Overview from './pages/Overview.jsx'
import CreateProject from './pages/CreateProject.jsx'
import Notifications from './pages/Notifications.jsx'
import { Contours, Logo, Icon, Trail, Loading } from './components/Contours.jsx'
import { roleName } from './labels.js'

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
	//this is for the user's notifications
	const [notes, setNotes] = useState([])
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

	//this is for logging out: it signs out on this device only (so it works even when the connection is bad), then always clears the screen back to the login page
	async function handleLogout() {
		try {
			await supabase.auth.signOut({ scope: 'local' })
		} catch (e) {
			//this is for ignoring a failed sign out, the screen is cleared below either way
		}
		setSession(null)
		setProjects(undefined)
		setCurrentId(null)
		setNotes([])
		setOpenTaskId(null)
		setInviteCode('')
		setError('')
		setScreen('login')
		setView('dashboard')
	}

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
		//this is for updating the list when someone joins, leaves or is removed (live updates)
		return onChange(['roles'], loadProjects)
	}, [userId])

	//this is for loading the notifications now and whenever a new one arrives (live updates)
	async function loadNotes() {
		try {
			setNotes(await getNotifications())
		} catch (e) {
			//this is for ignoring a failed load, the next change will try again
		}
	}

	useEffect(() => {
		if (!userId) return
		loadNotes()
		return onChange(['notifications'], loadNotes)
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

	if (loading) return <div className="page"><Loading /></div>

	//this is for the login and sign up screens: a dark panel with the contour lines next to the form
	if (!session) {
		return (
			<div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
				<aside className="relative hidden overflow-hidden bg-pine-deep p-12 text-paper lg:flex lg:flex-col lg:justify-between">
					<Contours className="absolute inset-0 h-full w-full text-moss opacity-30" />
					<div className="relative flex items-center gap-3 font-display text-2xl"><Logo className="size-9" /> TopoPlan</div>
					<div className="relative max-w-md">
						<Trail className="mb-6 w-72 max-w-full" />
						<h1 className="font-display text-5xl leading-tight">Find the path that decides the finish date.</h1>
						<p className="mt-4 text-lg text-moss">One shared timeline, one critical path, and a team that always knows what is holding everyone up.</p>
					</div>
				</aside>
				<main className="grid place-items-center p-6">
					<div className="w-full max-w-md">
						<div className="mb-2 flex items-center gap-2 font-display text-xl lg:hidden"><Logo className="size-7 text-pine" /> TopoPlan</div>
						{screen === 'login'
							? <Login onSwitch={() => setScreen('signup')} />
							: <SignUp onSwitch={() => setScreen('login')} />}
					</div>
				</main>
			</div>
		)
	}

	const unread = notes.filter(n => !n.read).length
	const hasProjects = projects && projects.length > 0
	const current = hasProjects ? projects.find(p => p.id === currentId) : null
	//this is for never showing an empty project page: fall back to the dashboard
	const shown = view === 'project' && !current ? 'dashboard' : view
	//this is for marking the open page in the side rail
	const here = page => (shown === page ? 'page' : undefined)

	return (
		<div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_1fr]">
			{/*this is for the side rail: pages, your projects and log out (on a phone it sits on top)*/}
			<aside className="rail relative overflow-hidden bg-pine-deep text-paper lg:sticky lg:top-0 lg:h-screen">
				<Contours className="pointer-events-none absolute inset-0 h-full w-full text-moss opacity-20" />
				<div className="relative flex flex-col gap-1 p-4 lg:h-full lg:py-6">
					<div className="mb-3 flex items-center gap-3 px-3 font-display text-2xl text-paper"><Logo className="size-8" /> TopoPlan</div>

					<nav aria-label="Pages" className="m-0 flex-col items-stretch gap-0.5 max-lg:flex-row max-lg:flex-wrap">
						<button onClick={() => setView('dashboard')} aria-current={here('dashboard')}><Icon name="dash" />Dashboard</button>
						<button onClick={() => setView('notifications')} aria-current={here('notifications')}>
							<Icon name="bell" />Notifications{unread > 0 && <span className="badge">{unread}</span>}
						</button>
						<button onClick={() => setView('create')} aria-current={here('create')}><Icon name="plus" />New project</button>
						<button onClick={() => setView('profile')} aria-current={here('profile')}><Icon name="user" />Profile</button>
					</nav>

					{/*this is for switching between your projects*/}
					{hasProjects && (
						<>
							<p className="eyebrow">Projects</p>
							<nav aria-label="Projects" className="m-0 flex-col items-stretch gap-0.5 lg:min-h-0 lg:flex-nowrap lg:overflow-y-auto">
								{projects.map(p => (
									<button key={p.id} className="project-link" onClick={() => openProject(p.id)}
										aria-current={shown === 'project' && p.id === currentId ? 'page' : undefined}>
										{p.name}
										<small>{roleName(p.role, p.isOwner)}</small>
									</button>
								))}
							</nav>
						</>
					)}

					<button className="mt-3 lg:mt-auto" onClick={handleLogout}><Icon name="out" />Log out</button>
				</div>
			</aside>

			<main key={shown} className="page w-full">
				{error && <div className="error-box" role="alert">{error}</div>}
				{projects === undefined && !error && <Loading />}

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

				{shown === 'notifications' && (
					<Notifications
						notes={notes}
						projects={projects || []}
						onMarkRead={async () => { await markAllRead(); loadNotes() }}
						onOpen={id => openProject(id)}
					/>
				)}

				{projects && shown === 'profile' && (
					<Profile
						onDeleted={handleLogout}
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
					<Project key={current.id + ':' + (openTaskId || '')} project={current} userId={userId} initialTaskId={openTaskId} onLeft={loadProjects} />
				)}
			</main>
		</div>
	)
}
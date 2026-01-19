// Main entry point for the application
import './assets/style.css'
import { login, register } from './services/auth.js'
import { initializePWA } from './services/pwa.js'
import { initDemoMode, getDemoUser } from './utils/demoMode.js'
import { initI18n, setLanguage } from './utils/i18n.js'

// Initialize i18n first
await initI18n()

// Setup language selector event
const langSelector = document.getElementById('languageSelector')
if (langSelector) {
  langSelector.addEventListener('change', (e) => {
    setLanguage(e.target.value)
  })
}

// Handle demo login - MUST BE DEFINED EARLY AND ASSIGNED TO WINDOW
async function handleDemoLogin(e) {
  if (e) e.preventDefault()
  console.log('🎮 Demo Login clicked')
  
  try {
    console.log('📝 Initializing demo data...')
    initDemoMode()
    console.log('✅ Demo data initialized')
    
    const demoUser = getDemoUser()
    console.log('👤 Demo user:', demoUser)
    
    if (demoUser && demoUser.id) {
      localStorage.setItem('user', JSON.stringify(demoUser))
      console.log('✅ User saved')
      
      await Swal.fire({
        icon: 'success',
        title: '🎮 Demo Mode Active',
        text: `Welcome ${demoUser.username}!`,
        timer: 1500
      })
      
      window.location.href = './src/pages/dashboard.html'
    } else {
      throw new Error('Demo user not found')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    })
  }
}

// CRITICAL: Make globally available for onclick
window.handleDemoLogin = handleDemoLogin

// Initialize PWA
initializePWA()

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('user'))

if (!currentUser) {
  initAuthForms()
} else {
  window.location.href = './src/pages/dashboard.html'
}

// Initialize auth forms
function initAuthForms() {
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin)
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister)
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault()
  
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value

  try {
    const user = await login(email, password)
    localStorage.setItem('user', JSON.stringify(user))
    window.location.href = './src/pages/dashboard.html'
  } catch (error) {
    console.error('Login failed:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Login Error',
      text: error.message
    })
  }
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault()
  
  const email = document.getElementById('registerEmail')?.value
  const password = document.getElementById('registerPassword')?.value
  const passwordConfirm = document.getElementById('registerPasswordConfirm')?.value
  const neighborhood = document.getElementById('registerNeighborhood')?.value

  if (!email || !password || !passwordConfirm || !neighborhood) {
    await Swal.fire({
      icon: 'error',
      title: 'Грешка',
      text: 'Все полета са задължителни!',
    })
    return
  }

  if (password !== passwordConfirm) {
    await Swal.fire({
      icon: 'error',
      title: 'Грешка',
      text: 'Паролите не съвпадат!',
    })
    return
  }

  if (password.length < 6) {
    await Swal.fire({
      icon: 'error',
      title: 'Слаба парола',
      text: 'Паролата трябва да има минимум 6 символа!',
    })
    return
  }

  try {
    const user = await register(email, password, { neighborhood })
    localStorage.setItem('user', JSON.stringify(user))
    window.location.href = './src/pages/dashboard.html'
  } catch (error) {
    console.error('Registration failed:', error)
    
    await Swal.fire({
      icon: 'error',
      title: 'Регистрацията неуспешна',
      text: error.message || 'Възникна грешка.',
    })
  }
}

// Navigation function
function loadPage(pageName) {
  const pages = {
    'index': './src/pages/index.html',
    'dashboard': './src/pages/dashboard.html',
    'create-campaign': './src/pages/create-campaign.html',
    'detail': './src/pages/campaign-detail.html',
    'profile': './src/pages/profile.html',
    'admin': './src/pages/admin.html',
    'rewards': './src/pages/rewards.html'
  }
  window.location.href = pages[pageName] || './'
}

window.navigateTo = loadPage

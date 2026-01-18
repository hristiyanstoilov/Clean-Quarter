// Main entry point for the application
import './assets/style.css'
import { login, register } from './services/auth.js'
import { initializePWA } from './services/pwa.js'

// Initialize PWA
initializePWA()

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('user'))

if (!currentUser) {
  // Initialize auth forms
  initAuthForms()
} else {
  // Redirect to dashboard
  window.location.href = '/src/pages/dashboard.html'
}

// Initialize auth forms on login/register page
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
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user))
    
    // Redirect to dashboard
    window.location.href = '/src/pages/dashboard.html'
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault()
  
  const email = document.getElementById('registerEmail').value
  const password = document.getElementById('registerPassword').value
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value
  const neighborhood = document.getElementById('registerNeighborhood').value

  // Validate passwords match
  if (password !== passwordConfirm) {
    await Swal.fire({
      icon: 'error',
      title: 'Грешка',
      text: 'Паролите не съвпадат!',
    })
    return
  }

  try {
    const user = await register(email, password, { neighborhood })
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user))
    
    // Redirect to dashboard
    window.location.href = '/src/pages/dashboard.html'
  } catch (error) {
    console.error('Registration failed:', error)
  }
}

// Navigation function
function loadPage(pageName) {
  const pages = {
    'index': '/src/pages/index.html',
    'dashboard': '/src/pages/dashboard.html',
    'create-campaign': '/src/pages/create-campaign.html',
    'detail': '/src/pages/campaign-detail.html',
    'profile': '/src/pages/profile.html',
    'admin': '/src/pages/admin.html',
    'rewards': '/src/pages/rewards.html'
  }
  
  window.location.href = pages[pageName] || '/'
}

// Global navigation function
window.navigateTo = loadPage

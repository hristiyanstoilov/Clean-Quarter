// Main entry point for the application
import './assets/style.css'

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('user'))

if (!currentUser) {
  // Redirect to login page
  loadPage('index')
} else {
  // Redirect to dashboard
  loadPage('dashboard')
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

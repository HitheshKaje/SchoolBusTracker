// Inject Sidebar and Topbar
document.addEventListener('DOMContentLoaded', () => {
  const sidebarHTML = `
    <aside id="layoutSidebar" class="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-30 transform -translate-x-full md:translate-x-0 transition duration-200 ease-in-out">
      <div class="p-6 border-b border-gray-100 flex items-center space-x-3">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        </div>
        <span class="text-xl font-bold text-gray-800 tracking-tight">RouteSense</span>
      </div>
      <div class="overflow-y-auto flex-grow p-4 space-y-1">
        <a href="/dashboard-driver.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span class="font-medium">Dashboard</span>
        </a>
        <a href="/driver/bus.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          <span class="font-medium">Assigned Bus</span>
        </a>
        <a href="/driver/route.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          <span class="font-medium">Assigned Route</span>
        </a>
        <a href="/driver/students.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <span class="font-medium">Assigned Students</span>
        </a>
        <a href="/driver/notifications.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span class="font-medium">Notifications</span>
        </a>
        <a href="/driver/profile.html" class="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span class="font-medium">Profile</span>
        </a>
      </div>
      <div class="p-4 border-t border-gray-100">
        <button id="layoutLogoutBtn" class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  `;

  const topbarHTML = `
    <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div class="flex-1 flex items-center">
        <button id="mobileMenuBtn" class="md:hidden mr-4 text-gray-500 hover:text-gray-700 focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h2 class="text-xl font-semibold text-gray-800" id="topbar-title">Driver Panel</h2>
      </div>
      <div class="flex items-center space-x-4">
        <button class="text-gray-400 hover:text-gray-600 transition-colors relative">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span class="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold" id="topbar-user-initial">
          D
        </div>
      </div>
    </header>
  `;

  // Insert sidebar and topbar
  const body = document.querySelector('body');
  if (body) {
    body.insertAdjacentHTML('afterbegin', sidebarHTML);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
    }
    
    // Check Authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'Driver') {
      window.location.href = '/login.html';
    } else {
      const topbarInitial = document.getElementById('topbar-user-initial');
      if (topbarInitial && user.name) {
        topbarInitial.textContent = user.name.charAt(0).toUpperCase();
      }
    }
  }

  // Handle Logout
  const logoutBtn = document.getElementById('layoutLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    });
  }

  // Highlight active link
  const currentPath = window.location.pathname;
  document.querySelectorAll('aside a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('bg-primary-50', 'text-primary-600');
      link.classList.remove('text-gray-600');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const layoutSidebar = document.getElementById('layoutSidebar');
  if (mobileMenuBtn && layoutSidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      layoutSidebar.classList.toggle('-translate-x-full');
    });
  }
});

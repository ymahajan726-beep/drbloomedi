import { queueToast } from '@/components/Toast';

export const performLogout = (message = 'Logged out successfully.') => {
  queueToast(message, 'success');
  const cookiesToClear = ['token', 'userRole', 'userEmail'];
  
  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;

    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
  });

  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    
    window.location.replace('/login');
  }
};
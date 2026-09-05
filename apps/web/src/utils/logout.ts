export const performLogout = () => {
  // 1. सभी पाथ्स के लिए कुकीज़ को 1970 की एक्सपायरी डेट देकर तुरंत नष्ट करें
  const cookiesToClear = ['token', 'userRole', 'userEmail'];
  
  cookiesToClear.forEach((cookieName) => {
    // Root path clear
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
    // Fallback without path
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
  });

  // 2. LocalStorage और SessionStorage दोनों को पूरी तरह खाली करें
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    
    // 3. window.location.replace से रीडायरेक्ट करें ताकि यूजर ब्राउज़र का 'Back' बटन दबाकर वापस न आ सके
    window.location.replace('/login');
  }
};
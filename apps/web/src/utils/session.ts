
export const getActiveToken = () => {
  if (typeof window === 'undefined') return null;

  return sessionStorage.getItem('token');
};

export const getAuthHeaders = () => {
  const token = getActiveToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
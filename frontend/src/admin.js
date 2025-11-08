// Gunakan env var di produksi atau fallback ke path relatif '/api' untuk satu domain
const API_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : '/api';

export const registerAdmin = async (userData) => { 
   try { 
     console.log('Sending registration data:', userData); 
     
     const response = await fetch(`${API_URL}/admin/register`, { 
       method: 'POST', 
       headers: { 
         'Content-Type': 'application/json', 
         'Accept': 'application/json', 
       }, 
       body: JSON.stringify({ 
         name: userData.username, 
         email: userData.email, 
         password: userData.password, 
         password_confirmation: userData.password_confirmation 
       }) 
     }); 
 
     console.log('Response status:', response.status); 
     
     const data = await response.json(); 
     console.log('Response data:', data); 
 
     if (!response.ok) { 
       throw new Error(data.error || `HTTP error! status: ${response.status}`); 
     } 
     
     return data; 
   } catch (error) { 
     console.error('Registration error:', error); 
     return { error: error.message }; 
   } 
 };
  
  export const loginAdmin = async (data) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  // api/admin.js


export const getDashboardData = async () => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

export const getSettings = async () => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

export const updateTerms = async (terms) => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/settings/terms`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ terms_conditions: terms })
  });
  return await response.json();
};

// Add similar functions for updateContact, updateProfile, getCategories, addCategory
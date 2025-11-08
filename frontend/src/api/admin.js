const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
export const API_URL = API_BASE ? `${API_BASE}/api` : '/api';
 
// Helper function untuk headers 
export const getAuthHeaders = () => { 
  const token = localStorage.getItem('adminToken'); 
  return { 
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }; 
}; 
 
// Auth functions 
export const loginAdmin = async (credentials) => {
  try {
    // Gunakan API_URL yang sudah didefinisikan
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    // Cek status response
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData?.error || errorData?.message || errorMsg;
      } catch (_) {}
      return { error: errorMsg };
    }
    
    const data = await response.json();
    
    // Jika tidak ada token tapi login berhasil, buat token dummy
    if (!data.token && !data.access_token && !data.error) {
      console.log('Login berhasil tapi tidak ada token, membuat token dummy');
      return { 
        token: 'dummy-token-for-testing',
        admin: { email: credentials.email },
        message: 'Login successful with dummy token'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Network error' };
  }
};
export const registerAdmin = async (userData) => { 
  try { 
    const payload = { 
      username: userData?.username ?? userData?.name ?? '', 
      email: userData?.email ?? '', 
      password: userData?.password ?? '', 
      password_confirmation: userData?.password_confirmation ?? userData?.password ?? '', 
      unique_code: userData?.unique_code ?? '',
    }; 

    const response = await fetch(`${API_URL}/admin/register`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
      }, 
      body: JSON.stringify(payload) 
    }); 

    const data = await response.json();
    if (!response.ok) {
      // Tangani 422 dari Laravel dengan mengekstrak pesan dari 'errors'
      let errorMsg = data?.error || data?.message || `HTTP error! status: ${response.status}`;
      if (response.status === 422 && data?.errors && typeof data.errors === 'object') {
        try {
          const msgs = Object.values(data.errors)
            .filter(Array.isArray)
            .flat()
            .filter(Boolean);
          if (msgs.length) {
            errorMsg = msgs.join(' ');
          }
        } catch (_) {}
      }
      return { error: errorMsg, errors: data?.errors };
    }

    return data; 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
};
export const resendAdminVerification = async (email) => {
  try {
    const response = await fetch(`${API_URL}/admin/email/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: data?.error || data?.message || `HTTP error! status: ${response.status}` };
    }
    return data; // { message: 'Verification email resent...' }
  } catch (error) {
    return { error: 'Network error' };
  }
};
 
// Dashboard functions 
export const getDashboardData = async () => { 
  try { 
    const response = await fetch(`${API_URL}/admin/dashboard`, { 
      headers: getAuthHeaders() 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
// Settings functions 
export const getSettings = async () => { 
  try { 
    const response = await fetch(`${API_URL}/admin/settings`, { 
      headers: getAuthHeaders() 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const updateTerms = async (terms) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/settings/terms`, { 
      method: 'PUT', 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ terms_conditions: terms }) 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const updateContact = async (contact) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/settings/contact`, { 
      method: 'PUT', 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ contact_help: JSON.stringify(contact) }) 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const updateProfile = async (profile) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/settings/profile`, { 
      method: 'PUT', 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ company_profile: profile }) 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 

// Upload contact hero image (multipart/form-data)
export const uploadContactImage = async (file) => {
  try {
    const token = localStorage.getItem('adminToken');
    const form = new FormData();
    form.append('hero_image', file);
    const response = await fetch(`${API_URL}/admin/settings/contact/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // NOTE: jangan set Content-Type di sini; biarkan browser menambahkan boundary
      },
      body: form
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      return { error: data?.error || data?.message || `HTTP error! status: ${response.status}` };
    }
    return data; // { url, path }
  } catch (error) {
    return { error: 'Network error' };
  }
};

// Upload company profile hero image (multipart/form-data)
export const uploadProfileImage = async (file) => {
  try {
    const token = localStorage.getItem('adminToken');
    const form = new FormData();
    form.append('hero_image', file);
    const response = await fetch(`${API_URL}/admin/settings/profile/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: form
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      return { error: data?.error || data?.message || `HTTP error! status: ${response.status}` };
    }
    return data; // { url, path }
  } catch (error) {
    return { error: 'Network error' };
  }
};
 
// Categories functions 
export const getCategories = async () => { 
  try { 
    const response = await fetch(`${API_URL}/admin/categories`, { 
      headers: getAuthHeaders() 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const addCategory = async (category) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/categories`, { 
      method: 'POST', 
      headers: getAuthHeaders(), 
      body: JSON.stringify(category) 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const updateCategory = async (id, category) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/categories/${id}`, { 
      method: 'PUT', 
      headers: getAuthHeaders(), 
      body: JSON.stringify(category) 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
}; 
 
export const deleteCategory = async (id) => { 
  try { 
    const response = await fetch(`${API_URL}/admin/categories/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders() 
    }); 
    return await response.json(); 
  } catch (error) { 
    return { error: 'Network error' }; 
  } 
};


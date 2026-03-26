const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(method, path, body = null) {
  const token = localStorage.getItem('token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // ATTACH JWT TO EVERY REQUEST SO THE BACKEND CAN VERIFY IDENTITY
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}/api${path}`, options);
  if (res.status === 204) return null;

  // TOKEN EXPIRED OR INVALID - CLEAR STORAGE AND FORCE RE-LOGIN
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.reload();
    return null;
  }

  return res.json();
}

export const authApi = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
};

export const individualsApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/individuals${qs ? '?' + qs : ''}`);
  },
  get:    (id)       => request('GET',    `/individuals/${id}`),
  create: (data)     => request('POST',   '/individuals', data),
  update: (id, data) => request('PUT',    `/individuals/${id}`, data),
  remove: (id)       => request('DELETE', `/individuals/${id}`),
};

export const teamsApi = {
  list:   ()         => request('GET',    '/teams'),
  get:    (id)       => request('GET',    `/teams/${id}`),
  create: (data)     => request('POST',   '/teams', data),
  update: (id, data) => request('PUT',    `/teams/${id}`, data),
  remove: (id)       => request('DELETE', `/teams/${id}`),
};

export const achievementsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request('GET', `/achievements${params ? '?' + params : ''}`);
  },
  get:    (id)       => request('GET',    `/achievements/${id}`),
  create: (data)     => request('POST',   '/achievements', data),
  update: (id, data) => request('PUT',    `/achievements/${id}`, data),
  remove: (id)       => request('DELETE', `/achievements/${id}`),
};

export const metadataApi = {
  list:   ()         => request('GET',    '/metadata'),
  get:    (id)       => request('GET',    `/metadata/${id}`),
  create: (data)     => request('POST',   '/metadata', data),
  update: (id, data) => request('PUT',    `/metadata/${id}`, data),
  remove: (id)       => request('DELETE', `/metadata/${id}`),
};

import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.vathra.xyz',
  withCredentials: true,
});

export default apiClient;
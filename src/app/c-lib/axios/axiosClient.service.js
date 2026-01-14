import axios from 'axios';
import AuthHelper from '../auth/auth.helper';

function createAxiosClient() {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // REQUEST
  instance.interceptors.request.use((config) => {
    const accessToken = AuthHelper.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  // RESPONSE
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );

  return instance;
}

export default createAxiosClient();

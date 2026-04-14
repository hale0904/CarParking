import axios from 'axios';
import AuthHelper from '../auth/auth.helper';

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  queue = [];
};

export const attachRefreshInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._isRefreshRequest) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({ resolve, reject });
          })
            .then((token) => {
              // Ensure we use the new token for the queued request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = AuthHelper.getRefreshToken();
          // Create pure axios instance to avoid interceptor loops
          const refreshAxios = axios.create({
            baseURL: import.meta.env.VITE_API_URL,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const res = await refreshAxios.post('/auth/refresh-token', { refreshToken }, {
            _isRefreshRequest: true
          });
          const newTokens = res.data;

          AuthHelper.setTokens(newTokens);
          processQueue(null, newTokens.accessToken);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return axiosInstance(originalRequest);
        } catch (err) {
          processQueue(err, null);
          AuthHelper.clearTokens();
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

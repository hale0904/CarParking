import axiosClient from './axiosClient.service';
import { refreshTokenService } from '../auth/auth.service';
import AuthHelper from '../helpers/auth.helper';

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = AuthHelper.getRefreshToken();
        const res = await refreshTokenService(refreshToken);

        AuthHelper.setTokens(res);

        originalRequest.headers.Authorization =
          `Bearer ${res.accessToken}`;

        return axiosClient(originalRequest);
      } catch (err) {
        AuthHelper.logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

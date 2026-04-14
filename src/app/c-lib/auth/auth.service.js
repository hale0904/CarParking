import axiosClient from '../axios/axiosClient.service';

export function refreshTokenService(refreshToken) {
  return axiosClient.post('/auth/refresh-token', { refreshToken }, {
    _isRefreshRequest: true
  });
}

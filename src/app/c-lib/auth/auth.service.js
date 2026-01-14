import { apiHelper } from '../helpers/api.helper';

export function refreshTokenService(refreshToken) {
  return apiHelper.post('/auth/refresh-token', {
    refreshToken,
  });
}

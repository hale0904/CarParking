import apiHelper from '../../../../c-lib/helpers/api.helper';
import { AUTH_API } from '../../../../c-lib/constants/auth-api.constant';

/**
 * @param {Account} accountDto
 */
export default function LoginService(accountDto) {
  return apiHelper.post(AUTH_API.LOGIN, accountDto);
}

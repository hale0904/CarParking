import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import { AUTH_API } from '../../../../c-lib/constants/auth-api.constant';

export default function LoginService(accountDto) {
  return axiosClient.post(AUTH_API.LOGIN, accountDto);
}

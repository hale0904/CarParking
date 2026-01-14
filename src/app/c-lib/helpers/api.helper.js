import axiosClient from '../axios/axiosClient.service';

const apiHelper = {
  get: (url, config = {}) => axiosClient.get(url, config),

  post: (url, data, config = {}) =>
    axiosClient.post(url, data, config),

  put: (url, data, config = {}) =>
    axiosClient.put(url, data, config),

  delete: (url, config = {}) =>
    axiosClient.delete(url, config),
};

export default apiHelper;

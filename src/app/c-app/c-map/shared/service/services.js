import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import { PARKING_API } from '../../../../c-lib/api/parking.api';

/**
 * @param {ParkingListParams} parkingListParams
 */

/**
 * Update parking status only
 * @param {Array<{code: string, status: number}>} items
 */

/**
 * Delete one or many parking maps
 * @param {Array<{code: string}>} items
 */

const ParkingService = {
  getList(params) {
    return axiosClient.post(PARKING_API.GET_LIST, {
      params, // axios sẽ tự convert thành query string
    });
  },

  getListFloorMap(params) {
    return axiosClient.post(PARKING_API.GET_LIST_FLOOR, {
      params,
    });
  },

  saveFloor(data) {
    return axiosClient.post(PARKING_API.UPDATE_FLOOR, data);
  },

  saveParking(data) {
    return axiosClient.post(PARKING_API.UPDATE, data);
  },

  updateParkingStatus(items) {
    return axiosClient.post(PARKING_API.UPDATE_STATUS, {
      items,
    });
  },

  deleteParking(items) {
    return axiosClient.delete(PARKING_API.DELETE_SLOT, {
      data: {
        items,
      },
    });
  },
};

export default ParkingService;

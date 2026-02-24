import apiHelper from '../../../../c-lib/helpers/api.helper';
import { PARKING_API } from '../../../../c-lib/constants/auth-api.constant';

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
    return apiHelper.post(PARKING_API.GET_LIST, {
      params, // axios sẽ tự convert thành query string
    });
  },

  getListFloorMap(params) {
    return apiHelper.post(PARKING_API.GET_LIST_FLOOR, {
      params,
    });
  },

  saveFloor(data) {
    return apiHelper.post(PARKING_API.UPDATE_FLOOR, data);
  },

  deleteFloor(parkingCode, items) {
    return apiHelper.post(PARKING_API.DELETE_FLOOR, {
      parkingCode,
      items,
    });
  },



  saveParking(data) {
    return apiHelper.post(PARKING_API.UPDATE, data);
  },

  updateParkingStatus(items) {
    return apiHelper.post(PARKING_API.UPDATE_STATUS, {
      items,
    });
  },

  deleteParking(items) {
    return apiHelper.delete(PARKING_API.DELETE, {
      data: {
        items,
      },
    });
  },
};

export default ParkingService;

export const AUTH_API = {
  LOGIN: '/api/ad/auth/login',
};

export const PARKING_API = {
  GET_LIST: '/api/ad/getListParkingMap',
  GET_LIST_FLOOR: '/api/ad/getListFloorMap', // New API
  UPDATE_FLOOR: '/api/ad/updateFloorMap', // New API for Add/Update Floor
  DELETE_FLOOR: '/api/ad/deleteFloorMap', // New API for Delete Floor
  CREATE: '/api/ad/createParkingMap',
  UPDATE: '/api/ad/updateParkingMap',
  UPDATE_STATUS: '/api/ad/updateParkingStatus',
  DELETE: '/api/ad/deleteParkingMap',
};

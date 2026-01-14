// Giả lập database
const FAKE_USERS = [
  {
    userName: 'admin',
    password: '123456',
    role: 'ADMIN',
  },
];

export function login(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = FAKE_USERS.find(
        (u) =>
          u.userName === payload.userName &&
          u.password === payload.password
      );

      if (!user) {
        reject({
          success: false,
          message: 'Sai tên đăng nhập hoặc mật khẩu',
        });
        return;
      }

      resolve({
        success: true,
        token: 'fake-jwt-token-' + Date.now(),
        user: {
          userName: user.userName,
          role: user.role,
        },
      });
    }, 1000); // giả lập delay BE
  });
}

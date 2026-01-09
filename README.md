# SMART PARKING – WEB (REACT JS)

Ứng dụng **Quản lý bãi đỗ xe thông minh (Smart Parking)** phía Frontend, xây dựng bằng **React JS + Vite**, phục vụ hệ thống IoT + Web. Hệ thống cho phép **Admin** theo dõi **Dashboard**, **thống kê – báo cáo**, **quản lý bản đồ bãi đỗ**, **quản lý người dùng**, và kết nối dữ liệu từ thiết bị IoT.

---

## 1. Mô tả tổng quan

- Hiển thị **Dashboard**: số lượng xe, tình trạng bãi đỗ theo thời gian thực, Cảnh báo các thiết bị IoT (cảm biến) bị lỗi hoặc mất kết nối
- Quản lý **danh sách xe**, lịch sử ra/vào,...
- Hiển thi **THống kê**: Thời gian đỗ, giò cao điểm,...
- Quản lý **map bãi đỗ xe** (sử dụng canvas / konva).
- Quản lý **tài khoản Admin / User**.
- Hỗ trợ **Realtime data** từ IoT thông qua Socket.IO.
- Phân quyền truy cập (Public / Private Route).

---

## 2. Công nghệ sử dụng

### Core
- **React 19** – Thư viện UI chính
- **Vite** – Build tool, dev server nhanh
- **React Router DOM v7** – Routing

### State & Data
- **Redux Toolkit** – Quản lý state tập trung
- **Axios** – Giao tiếp API
- **Socket.IO Client** – Realtime communication

### UI & Styling
- **Bootstrap 5 / React-Bootstrap** – Layout & UI components
- **SASS (SCSS)** – Quản lý style
- **FontAwesome** – Icon
- **Recharts** – Biểu đồ thống kê
- **Konva / React-Konva** – Vẽ map, canvas bãi đỗ

### Form & Validation
- **React Hook Form** – Quản lý form
- **Yup** – Validate dữ liệu

### Utils
- **Dayjs** – Xử lý ngày giờ
- **React Toastify** – Thông báo

### Code Quality
- **ESLint** – Lint code
- **Prettier** – Format code

---

## 3. Kiến trúc dự án

Dự án được tổ chức theo hướng **Module-based Architecture**, kết hợp với tư duy **Clean Architecture** cho Frontend:

- Mỗi module (dashboard, login, map, statistical, …) **độc lập**, có router riêng.
- Tách biệt rõ:
  - UI (pages / components)
  - Business logic (services)
  - Data model (dtos)
  - Routing

Ưu điểm:
- Dễ mở rộng, bảo trì
- Tránh code rối khi dự án lớn
- Team work tốt (mỗi người phụ trách 1 module)

---

## 4. Cấu trúc thư mục

```txt
src/
├─ app/
│  └─ c-app/
│     ├─ c-dashboard/
│     │  ├─ pages/
│     │  │  └─ dashboard001-car-list/
│     │  │     └─ dashboard001.component.jsx
│     │  ├─ shared/
│     │  │  ├─ components/
│     │  │  │  └─ car-list/
│     │  │  │     └─ car-list.component.jsx
│     │  │  ├─ dtos/
│     │  │  │  └─ DTOCar.jsx
│     │  │  └─ services/
│     │  │     └─ car-service.jsx
│     │  ├─ index.js
│     │  └─ router.js
│     │
│     ├─ c-login/
│     │  ├─ pages/
│     │  │  └─ login001-admin/
│     │  │     └─ login001-admin.component.jsx
│     │  ├─ shared/
│     │  │  ├─ components/
│     │  │  ├─ dtos/
│     │  │  └─ services/
│     │  ├─ index.js 
│     │  └─ router.js
│     │
│     ├─ c-map/
│     ├─ c-statistical/
│     └─ c-layout/
│
├─ c-lib/
│  ├─ hooks/
│  └─ utils/
│     └─ fontawesome.js
│
├─ assets/
│  └─ react.svg
│
├─ routers/
│  ├─ index.js
│  ├─ privateRoute.jsx
│  └─ routing.jsx
│
├─ App.jsx
├─ main.jsx
├─ App.css
└─ index.css
```

---

## 5. Giải thích kiến trúc chi tiết

### 5.1 Module (`c-dashboard`, `c-login`, ...)

Mỗi module bao gồm:

- **pages/**: Page-level components (gắn trực tiếp với route)
- **shared/**: Dùng nội bộ module
  - `components/`: Component con được sài cho module
  - `dtos/`: Định nghĩa cấu trúc dữ liệu (Data Transfer Object)
  - `services/`: Gọi API, xử lý dữ liệu
- **router.js**: Khai báo router cho module
- **index.js**: Export public của module

➡️ Giúp module **đóng gói (encapsulation)**, không phụ thuộc chéo.

---

### 5.2 Routing tổng

- `src/routers/routing.jsx`: Gom router từ các module
- `privateRoute.jsx`: Bảo vệ route cần đăng nhập
- `routers/index.js`: Export router chính

Luồng hoạt động:

```txt
App.jsx
 └─ RouterProvider
     └─ routing.jsx
         ├─ Public routes (Login)
         └─ Private routes (Dashboard, Map, ...)
```

---

### 5.3 Service & DTO

- **Service**: Chỉ làm việc với API (axios, socket)
- **DTO**: Chuẩn hóa dữ liệu trả về

➡️ Tránh việc component xử lý logic phức tạp

---

### 5.4 Utils & Lib

- `c-lib/hooks`: Custom hooks dùng chung cho dự án
- `c-lib/utils`: Helper, config (FontAwesome, constants, ...)

---

## 6. Scripts

```bash
npm run dev       # Chạy dev server
npm run build     # Build production
npm run preview   # Preview bản build
npm run lint      # Kiểm tra code
```

---

✍️ *Author: FE Smart Parking Team*


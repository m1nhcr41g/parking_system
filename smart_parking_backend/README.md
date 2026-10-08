# Module 1 - Authentication & Profile Management

## Giới thiệu

Module Authentication & Profile Management chịu trách nhiệm quản lý tài khoản người dùng trong hệ thống Smart Parking.

Module cung cấp các chức năng:

- Đăng ký tài khoản
- Đăng nhập
- Xác thực bằng JWT
- Xem thông tin cá nhân
- Cập nhật thông tin cá nhân
- Đổi mật khẩu
- Refresh Access Token
- Đăng xuất

---

# Công nghệ sử dụng

- Node.js
- Express.js
- SQL Server
- JWT (jsonwebtoken)
- bcrypt
- mssql

---

# Cấu trúc thư mục

src/

├── controllers/

│ └── auth.controller.js

│ └── profile.controller.js

├── services/

│ └── auth.service.js

│ └── profile.service.js

├── repositories/

│ └── user.repository.js

├── middlewares/

│ └── auth.middleware.js

├── routes/

│ └── auth.routes.js

│ └── profile.routes.js

├── utils/

│ └── jwt.js

│ └── password.js

---

# Chức năng đã hoàn thành

## 1. Register

API

POST /api/v1/auth/register

Chức năng

- Kiểm tra email tồn tại
- Kiểm tra số điện thoại
- Hash mật khẩu bằng bcrypt
- Lưu tài khoản vào SQL Server

---

## 2. Login

API

POST /api/v1/auth/login

Chức năng

- Kiểm tra email
- Kiểm tra mật khẩu
- Kiểm tra trạng thái tài khoản
- Sinh Access Token
- Sinh Refresh Token
- Lưu Refresh Token vào database

Response

---

## 3. JWT Authentication

Middleware

auth.middleware.js

Chức năng

- Đọc Authorization Header
- Verify Access Token
- Giải mã thông tin người dùng
- Gắn req.user
- Chặn request khi token hết hạn

---

## 4. Get Profile

API

GET /api/v1/profile/me

Yêu cầu

Authorization Bearer Token

Chức năng

- Lấy thông tin người dùng đang đăng nhập

---

## 5. Update Profile

API

PUT /api/v1/profile/me

Chức năng

- Cập nhật họ tên
- Cập nhật số điện thoại

---

## 6. Change Password

API

PUT /api/v1/profile/change-password

Chức năng

- Kiểm tra mật khẩu cũ
- Hash mật khẩu mới
- Cập nhật database

---

## 7. Refresh Token

API

POST /api/v1/auth/refresh-token

Chức năng

- Kiểm tra Refresh Token
- Verify JWT
- Kiểm tra trạng thái revoked
- Kiểm tra thời gian hết hạn
- Sinh Access Token mới

---

## 8. Logout

API

POST /api/v1/auth/logout

Chức năng

- Thu hồi Refresh Token
- Đánh dấu revoked = 1
- Không thể sử dụng Refresh Token này lần nữa

---

# Database

## users

Lưu thông tin tài khoản.

Các trường chính

- id
- full_name
- email
- phone
- password
- role
- status

---

## refresh_tokens

Lưu Refresh Token.

Các trường

- id
- user_id
- token
- expires_at
- created_at
- revoked

---

# JWT

## Access Token

Thời gian sống

15 phút

Dùng để

- Gọi API

---

## Refresh Token

Thời gian sống

7 ngày

Dùng để

- Sinh Access Token mới
- Đăng xuất

---

# Luồng hoạt động

Register

↓

Login

↓

Access Token

↓

Gọi API

↓

Access Token hết hạn

↓

Refresh Token

↓

Access Token mới

↓

Logout

↓

Refresh Token bị thu hồi

---

# Kiểm thử

Đã kiểm thử bằng Thunder Client.

Các API đã test thành công

- Register
- Login
- Get Profile
- Update Profile
- Change Password
- Refresh Token
- Logout

---

# Kết quả

Hoàn thành Module Authentication & Profile Management.

Các chức năng hoạt động đúng theo thiết kế.


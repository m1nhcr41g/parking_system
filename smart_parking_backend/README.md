# Module 1 - Authentication & Profile Management

### Giới thiệu

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

### Công nghệ sử dụng

- Node.js
- Express.js
- SQL Server
- JWT (jsonwebtoken)
- bcrypt
- mssql

---

### Cấu trúc thư mục

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

### Chức năng đã hoàn thành

### 1. Register

API

POST /api/v1/auth/register

Chức năng

- Kiểm tra email tồn tại
- Kiểm tra số điện thoại
- Hash mật khẩu bằng bcrypt
- Lưu tài khoản vào SQL Server

---

### 2. Login

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

### 3. JWT Authentication

Middleware

auth.middleware.js

Chức năng

- Đọc Authorization Header
- Verify Access Token
- Giải mã thông tin người dùng
- Gắn req.user
- Chặn request khi token hết hạn

---

### 4. Get Profile

API

GET /api/v1/profile/me

Yêu cầu

Authorization Bearer Token

Chức năng

- Lấy thông tin người dùng đang đăng nhập

---

### 5. Update Profile

API

PUT /api/v1/profile/me

Chức năng

- Cập nhật họ tên
- Cập nhật số điện thoại

---

### 6. Change Password

API

PUT /api/v1/profile/change-password

Chức năng

- Kiểm tra mật khẩu cũ
- Hash mật khẩu mới
- Cập nhật database

---

### 7. Refresh Token

API

POST /api/v1/auth/refresh-token

Chức năng

- Kiểm tra Refresh Token
- Verify JWT
- Kiểm tra trạng thái revoked
- Kiểm tra thời gian hết hạn
- Sinh Access Token mới

---

### 8. Logout

API

POST /api/v1/auth/logout

Chức năng

- Thu hồi Refresh Token
- Đánh dấu revoked = 1
- Không thể sử dụng Refresh Token này lần nữa

---

### Database

### users

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

### refresh_tokens

Lưu Refresh Token.

Các trường

- id
- user_id
- token
- expires_at
- created_at
- revoked

---

### JWT

### Access Token

Thời gian sống

15 phút

Dùng để

- Gọi API

---

### Refresh Token

Thời gian sống

7 ngày

Dùng để

- Sinh Access Token mới
- Đăng xuất

---

### Luồng hoạt động

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

### Kiểm thử

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

### Kết quả

Hoàn thành Module Authentication & Profile Management.

Các chức năng hoạt động đúng theo thiết kế.

---


# Module: Customer Incident Management

### Mục tiêu

Module **Customer Incident Management** cho phép khách hàng gửi yêu cầu hỗ trợ khi gặp sự cố trong quá trình sử dụng hệ thống bãi đỗ xe thông minh và theo dõi trạng thái xử lý của các yêu cầu đó.

Module này hỗ trợ:

- Báo mất hoặc lộ mã QR (SmartPass)
- Báo lỗi thanh toán
- Báo lỗi barie
- Báo các sự cố khác
- Xem danh sách các yêu cầu hỗ trợ đã gửi

Tất cả API đều yêu cầu **Access Token (JWT)** hợp lệ.

---

### Kiến trúc

```
Client
    │
    ▼
Incident Routes
    │
    ▼
Incident Controller
    │
    ▼
Incident Service
    │
    ▼
Incident Repository
    │
    ▼
SQL Server
```

---

### Database

Sử dụng bảng

```
incident_requests
```

Các trường chính

|Tên cột|Ý nghĩa|
|-------|-------|
|id|Mã sự cố|
|user_id|Khách hàng tạo sự cố|
|vehicle_id|Xe liên quan (có thể NULL)|
|credential_id|QR Code liên quan (có thể NULL)|
|type|Loại sự cố|
|status|Trạng thái xử lý|
|note|Nội dung khách hàng gửi|
|resolution_note|Ghi chú xử lý của nhân viên|
|created_at|Ngày tạo|
|updated_at|Ngày cập nhật|

---

### Các loại sự cố

Hiện tại hệ thống hỗ trợ

|Type|Ý nghĩa|
|----|--------|
|LOST_QR|Báo mất hoặc lộ QR Code|
|PAYMENT_ERROR|Lỗi thanh toán|
|GATE_ERROR|Lỗi barie|
|OTHER|Sự cố khác|

---

### API

### 1. Báo mất / lộ QR Code

### Endpoint

```
POST /customer/incidents/report-lost-qr
```

### Authorization

```
Bearer AccessToken
```

### Request

```json
{
    "vehicleId":"11111111-2222-3333-4444-555555555555",
    "credentialId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "note":"Tôi làm mất điện thoại có chứa QR Code."
}
```

### Response

```json
{
    "success": true,
    "message": "Gửi yêu cầu báo mất/lộ mã QR thành công",
    "data": {
        ...
    }
}
```

---

### 2. Báo cáo sự cố

### Endpoint

```
POST /customer/incidents
```

### Authorization

```
Bearer AccessToken
```

### Request

```json
{
    "type":"PAYMENT_ERROR",
    "vehicleId":"11111111-2222-3333-4444-555555555555",
    "note":"Thanh toán bị trừ tiền hai lần."
}
```

### Response

```json
{
    "success": true,
    "message": "Gửi báo cáo sự cố thành công",
    "data": {
        ...
    }
}
```

---

### 3. Xem danh sách sự cố

### Endpoint

```
GET /customer/incidents
```

### Authorization

```
Bearer AccessToken
```

### Response

```json
{
    "success": true,
    "message": "Lấy danh sách sự cố thành công",
    "data": [
        {
            "id":"...",
            "type":"PAYMENT_ERROR",
            "status":"PENDING",
            "note":"Thanh toán bị trừ tiền hai lần.",
            "resolution_note":null,
            "created_at":"2026-10-08T15:55:15"
        }
    ]
}
```

---

### Quy trình xử lý

### Báo mất QR

```
Customer
      │
      ▼
POST /customer/incidents/report-lost-qr
      │
      ▼
Service kiểm tra dữ liệu
      │
      ▼
Repository lưu vào Database
      │
      ▼
Status = PENDING
```

---

### Báo cáo sự cố

```
Customer
      │
      ▼
POST /customer/incidents
      │
      ▼
Kiểm tra loại sự cố
      │
      ▼
Lưu Database
      │
      ▼
Status = PENDING
```

---

### Xem danh sách sự cố

```
Customer
      │
      ▼
GET /customer/incidents
      │
      ▼
JWT Middleware
      │
      ▼
Lấy user_id từ Access Token
      │
      ▼
Repository
      │
      ▼
SELECT * FROM incident_requests
WHERE user_id = @userId
ORDER BY created_at DESC
```

---

### Trạng thái xử lý

|Status|Ý nghĩa|
|-------|-------|
|PENDING|Đang chờ nhân viên xử lý|
|IN_PROGRESS|Đang xử lý|
|RESOLVED|Đã giải quyết|
|REJECTED|Yêu cầu bị từ chối|

---

### Bảo mật

Module sử dụng JWT Authentication.

Các API đều yêu cầu

```
Authorization

Bearer <AccessToken>
```

JWT Middleware sẽ:

- Kiểm tra Access Token
- Xác thực người dùng
- Lấy thông tin user
- Chỉ cho phép khách hàng xem các sự cố do chính mình tạo

---

### Validation

### Báo mất QR

- note không được để trống

---

### Báo cáo sự cố

- type bắt buộc
- note bắt buộc
- type phải thuộc danh sách cho phép

```
LOST_QR
PAYMENT_ERROR
GATE_ERROR
OTHER
```

---

### Repository

Module sử dụng Repository Pattern.

Các hàm chính

```
createIncident()

getIncidentsByUserId()
```

---

### Service

Các nghiệp vụ

```
reportLostQr()

reportGeneralIncident()

getCustomerIncidents()
```

---

### Controller

Các API

```
POST /customer/incidents/report-lost-qr

POST /customer/incidents

GET /customer/incidents
```

---

### Kết quả đạt được

Hoàn thành các chức năng phía Customer:

- Gửi yêu cầu báo mất QR Code
- Gửi báo cáo sự cố
- Lưu dữ liệu vào SQL Server
- Kiểm tra dữ liệu đầu vào
- Xác thực bằng JWT
- Chỉ hiển thị sự cố của chính khách hàng
- Sắp xếp danh sách theo thời gian mới nhất
- Hiển thị trạng thái xử lý và phản hồi từ nhân viên




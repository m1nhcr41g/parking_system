const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // 1. Kiểm tra không để trống
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, email, số điện thoại và mật khẩu'
      });
    }

    // 2. Validate định dạng Email (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ (Ví dụ hợp lệ: example@gmail.com)'
      });
    }

    // 3. Validate định dạng Số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng đầu số hợp lệ tại VN)'
      });
    }

    // 4. Validate độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const newUser = await authService.register({ fullName, email, phone, password });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: newUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký'
    });
  }
};


// Hàm xử lý Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        "error": {
          "code": "INVALID_CREDENTIALS",
          "message": "Email hoặc mật khẩu không chính xác"
        }
        
      });
    }

    // 2. Validate định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ'
      });
    }

    // 3. Gọi service đăng nhập
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error:{

        code:error.code || "LOGIN_ERROR",

        message:error.message

    }
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Cấp mới accessToken thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi làm mới token'
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng xuất'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
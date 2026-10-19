const adminService = require('../services/admin.service');

class ReportController {
  async getAllPayments(req, res) {
    try {
      const { type, status } = req.query;
      const payments = await adminService.getAllPayments(type, status);
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async refundPayment(req, res) {
    try {
      const refunded = await adminService.refundPayment(req.params.id);
      return res.status(200).json({ success: true, message: 'Hoàn tiền thành công!', data: refunded });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDashboardMetrics(req, res) {
    try {
      const metrics = await adminService.getDashboardMetrics();
      return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ReportController();
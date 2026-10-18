const adminService = require('../services/admin.service');

class PricingController {
  async upsertPricingRule(req, res) {
    try {
      const rule = await adminService.upsertPricingRule(req.body);
      return res.status(200).json({ success: true, message: 'Cấu hình giá vé vãng lai thành công', data: rule });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createSubscriptionPlan(req, res) {
    try {
      const plan = await adminService.createSubscriptionPlan(req.body);
      return res.status(201).json({ success: true, message: 'Tạo gói thuê bao mới thành công', data: plan });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateSubscriptionPlan(req, res) {
    try {
      const plan = await adminService.updateSubscriptionPlan(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật gói thuê bao thành công', data: plan });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PricingController();
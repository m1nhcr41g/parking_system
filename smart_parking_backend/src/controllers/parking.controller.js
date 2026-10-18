const adminService = require('../services/admin.service');

class ParkingController {
  async createParkingLot(req, res) {
    try {
      const lot = await adminService.createParkingLot(req.body);
      return res.status(201).json({ success: true, message: 'Tạo bãi xe thành công!', data: lot });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllParkingLots(req, res) {
    try {
      const lots = await adminService.getAllParkingLots();
      return res.status(200).json({ success: true, data: lots });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateParkingLot(req, res) {
    try {
      const updatedLot = await adminService.updateParkingLot(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật thành công!', data: updatedLot });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createParkingArea(req, res) {
    try {
      const area = await adminService.createParkingArea(req.body);
      return res.status(201).json({ success: true, message: 'Tạo khu vực đỗ thành công!', data: area });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAreasByLotId(req, res) {
    try {
      const areas = await adminService.getAreasByLotId(req.params.lotId);
      return res.status(200).json({ success: true, data: areas });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createBatchSlots(req, res) {
    try {
      const { parkingAreaId, prefix, count } = req.body;
      const slots = await adminService.createBatchSlots(parkingAreaId, prefix, count);
      return res.status(201).json({ success: true, message: `Tạo ${count} ô đỗ thành công!`, data: slots });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateSlotStatus(req, res) {
    try {
      const slot = await adminService.updateSlotStatus(req.params.id, req.body.status);
      return res.status(200).json({ success: true, message: 'Đổi trạng thái ô đỗ thành công!', data: slot });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ParkingController();
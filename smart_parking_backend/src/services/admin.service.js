const parkingRepository = require('../repositories/parking.repository')
const pricingRepository = require('../repositories/pricing.repository');
const reportRepository = require('../repositories/report.repository');

class AdminService{
    async createParkingLot(data) {
    if (!data.name || !data.address || !data.openingHours) {
        throw new Error('Vui lòng điền đầy đủ tên, địa chỉ và giờ mở cửa!');
    }
    return await parkingRepository.createLot(data);
    }

    async getAllParkingLots() {
        return await parkingRepository.getAllParkingLots();
    }

    async updateParkingLot(id, data) {
        return await parkingRepository.updateLot(id, data);
    }

    async createParkingArea(data) {
        if (!data.parkingLotId || !data.name || !data.capacity || !data.vehicleType) {
            throw new Error('Thiếu thông tin tạo khu vực đỗ xe!');
    }
        return await parkingRepository.createArea(data);
    }

    async getAreasByLotId(lotId) {
        return await parkingRepository.getAreasByLotId(lotId);
    }

    async createBatchSlots(parkingAreaId, prefix, count){
        if(!parkingAreaId||!prefix||!count){
            throw new Error('Cần cung cấp khu vực, tiền tố mã ô và số lượng hợp lệ');
        }
        const createdSlot = [];
        for(let i=1; i<=count; i++){
            const code = `${prefix}-${i < 10 ? '0' + i : i}`;
            const slot = await parkingRepository.createParkingSlot({parkingAreaId,code});
            createdSlot.push(slot);
        }
        return createdSlot;
    }

    async updateSlotStatus(slotId, status) {
        return await parkingRepository.updateSlotStatus(slotId, status);
    }

    async upsertPricingRule(data) {
        return await pricingRepository.upsertPricingRule(data);
    }

    async createSubscriptionPlan(data) {
        return await pricingRepository.createSubscriptionPlan(data);
    }

    async updateSubscriptionPlan(id, data) {
        return await pricingRepository.updateSubscriptionPlan(id, data);
    }

    async getAllPayments(type, status) {
        return await reportRepository.getAllPayments(type, status);
    }

    async refundPayment(paymentId) {
        const refunded = await reportRepository.refundPayment(paymentId);
        if (!refunded) {
            throw new Error('Giao dịch không tồn tại hoặc chưa thanh toán thành công để hoàn tiền!');
        }
        return refunded;
    }

    async getDashboardMetrics() {
        return await reportRepository.getDashboardMetrics();
    }
}

module.exports = new AdminService();
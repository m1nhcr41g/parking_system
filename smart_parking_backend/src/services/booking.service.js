const bookingRepository = require('../repositories/booking.repository');

class BookingService{
    async getAvailableSlots(areaId, startTime, endTime){
        if(!areaId||!startTime||!endTime){
            throw new Error('vui long cung cap du id khu vuc, thoi gian bat dau va thoi gian ket thuc');
        }
        if(new Date(startTime)>=new Date(endTime)){
            throw new Error('thoi gian ket thuc phai muon hon thoi gian bat dau');
        }
        return await bookingRepository.findAvailableSlots(areaId,startTime,endTime);
    }

    async creatBooking(userId, bookingData){
        const { vehicleId, slotId, startTime, endTime } = bookingData;
        if(!vehicleId||!slotId||!startTime||!endTime){
            throw new Error('thieu thong tin dat cho');
        }
        return await bookingRepository.createBooking({userId,vehicleId,slotId,startTime,endTime});
    }

    async cancelBooking(userId, bookingId){
        const booking =- await bookingRepository.findBookingById(bookingId);
        if(!booking){
            throw new Error('ko tim thay don dat cho');
        }
        if(booking.user.id!==userId){
            throw new Error('ban ko co quyen huy don dat cho nay');
        }
        if(booking.status=='CANCELLED'){
            throw new Error('don da huy trc do');
        }
        return await bookingRepository.cancelBooking(bookingId,userId);
    }
    async getMyBookings(userId){
        return await bookingRepository.getBookingHistory(userId);
    }
}
module.exports = new BookingService();
const bookingService = require('../services/booking.service');

class BookingController{
    async getAvailableSlots(req, res){
        try {
            const{areaId, startTime,endTime} = req.query;
            const slots = await bookingService.getAvailableSlots(areaId,startTime,endTime);
            return res.status(200).json({success:true,data:slots});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message});
        }
    }

    async createBooking(req,res){
        try {
            const userId = req.user ? req.user.id : req.body.userId;
            const booking = await bookingService.creatBooking(userId, req.body);
            return res.status(200).json({success:true,message: 'dat cho thanh cong',data:booking});
        } catch (error) {
              return res.status(400).json({success:false, message:error.message});   
        }
    }

    async cancelBooking(req,res){
        try {
            const userId = req.user ? req.user.id : req.body.userId;
            const {id} = req.params;
            const cancelledBooking = await bookingService.cancelBooking(userId,id);
            return res.status(200).json({success:true,message: 'huy cho thanh cong',data:cancelledBooking});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message});  
        }
    }

    async getMyBooking(req,res){
        try {
            const userId = req.user ? req.user.id : req.body.userId;
            const history = await bookingService.getMyBookings(userId);
            return res.status(200).json({success:true,data:history});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message}); 
        }
    }
}  
module.exports = new BookingController();
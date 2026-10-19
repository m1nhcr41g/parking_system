const subscriptionService = require('../services/subscription.service');

class SubscriptionController{
    async getAllPlans(req, res){
        try {
            const plans = await subscriptionService.getAllPlans();
            return res.status(200).json({success:true,data:plans});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message});
        }
    }

    async subscribePlan(req, res){
        try {
            const userId = req.user ? req.user.id : req.body.userId;
            const subcription = await subscriptionService.subscribePlan(userId,req.body);
            return res.status(200).json({success:true, message:'dang ky theo bao thanh coong',data:subcription});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message});
        }
    }

    async getMySubscriptions(req, res){
         try {
            const userId = req.user ? req.user.id : req.body.userId;
            const subcriptions = await subscriptionService.getMySubscriptions(userId);
            return res.status(200).json({success:true,data:subcriptions});
         } catch (error) {
            return res.status(400).json({success:false, message:error.message});
         }
    }
}

module.exports = new SubscriptionController();
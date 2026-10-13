const subscriptionService = require('../services/subscription.service');

class SubscriptionController{
    async getAllPlans(res,req){
        try {
            const plans  = await subscriptionService();
            return res.status(200).json({success:true,data:slots});
        } catch (error) {
            return res.status(400).json({success:false, message:error.message});
        }
    }
}
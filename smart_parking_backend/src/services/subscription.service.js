const subscriptionRepository = require('../repositories/subcription.repository');

class SubscriptionService{
    async getAllPlans(){
        return await subscriptionRepository.getAllPlans();
    }

    async subcribePlan(userId, { vehicleId, planId }){
        if(!vehicleId||!planId){
            throw new Error('vui long chon xe va goi thue bao can dang ki');
        }
        const plan = await subscriptionRepository.findPlanById(planId)
        if(!plan){
            throw new Error("goi thue bao ton tai hoac da ngung cung cap");
        }

        const startDate = new Date();
        const endDate = new Data(startDate);
        switch(plan.duration){
            case 'WEEKLY':
                endDate.setDate(startDate.getDate() + 7);
                break;
            case 'MONTHLY':
                endDate.setMonth(startDate.getMonth() + 1);
                break;
            case 'HALF_YEAR':
                endDate.setMonth(startDate.getMonth() + 6);
                break;
            case 'YEARLY':
                endDate.setFullYear(startDate.getFullYear() + 1);
                break;
            default:
                endDate.setDate(startDate.getDate() + 30);
        }
        return await subscriptionRepository.createSubcription({
            userId,vehicleId,planId,startDate,endDate
        });
    }

    async getMySubscriptions(userId){
        return await subscriptionRepository.getUserSubscriptions(userId);
    }
}


module.exports  = new SubscriptionService();
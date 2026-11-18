const accountModel=require("../models/account.model");

async function createAccountController(req,res){

    const user=req.user;
    const account=await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}

async function getUserAccountController(req,res){
    const accounts=await accountModel.find({user:req.user._id})
    res.status(200).json({
        accounts
    })
}

async function getAccountBalance(req,res){
    const {accountId}=req.params;

    const account=await accountModel.findOne({
        _id:accountId,
        user:req.user._id //this is send to check esa toh nhi ki koi dusra banda kisi aur ka account ka balance dekhle
    })
    if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
    }
    const balance=await account.getBalance() //present in account model
    res.status(200).json({
        account:accountId,
        balance:balance
    })

}

module.exports={
    createAccountController,getUserAccountController,getAccountBalance
};
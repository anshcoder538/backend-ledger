const express=require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const createAccountController = require("../controllers/account.controller");
const router=express.Router()

//POST--->/api/acounts/
//create a new account
router.post("/",authMiddleware,createAccountController.createAccountController);

//get all accounts
router.get("/",authMiddleware,createAccountController.getUserAccountController);

//get balance
router.get("/balance/:accountId",authMiddleware,createAccountController.getAccountBalance);


module.exports=router;
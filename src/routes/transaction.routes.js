const express=require("express");
const transactionRoutes=express.Router();
const transactionController=require("../controllers/transaction.controller")
const { authMiddleware, authSystemMiddleware } = require("../middleware/auth.middleware");

/**
 * CREATE NEW TRANSACTION
 */

transactionRoutes.post("/",authMiddleware,transactionController.createTransaction)
transactionRoutes.post("/system/initial-funds",authSystemMiddleware,transactionController.createInitialFund);



module.exports=transactionRoutes;



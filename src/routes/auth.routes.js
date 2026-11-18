const express=require("express");
const authRouter=express.Router();
const authController=require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

authRouter.post("/register",authController.userRegisterController);//regisetr
authRouter.post("/login",authController.userLoginController)
authRouter.post("/logout",authMiddleware,authController.userLogoutController);


module.exports=authRouter;
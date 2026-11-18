const userModel=require("../models/user.model");
const validator=require("../utilis/validator");
const jwt=require("jsonwebtoken");
const emailService=require("../services/email.service");
const redisClient=require("../config/redis");

//api---->register
async function userRegisterController(req,res){

    const {email,password,name}=req.body;
    // validator(req.body);

    const isExist=await userModel.findOne({email:email});
    if(isExist){
        return res.status(422).json({
            message:"User already exists with email.",
            status:"Failed"
        })
    }
    const user=await userModel.create(req.body);

    const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"3d"});
    res.cookie("token",token);

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        }
    })
    await emailService.sendRegisterationEmail(user.email,user.name);
}


//api---->login
async function userLoginController(req,res){

    const {email,password}=req.body;
    const user=await userModel.findOne({email:email}).select("+password")
    if(!user){
        return res.status(401).json({
            message:"Email or Password is INVALID"
        })
    }

    const isValid=await user.comparePassword(password);
    if(!isValid){
        return res.status(401).json({
            message:"Email or Password is INVALID"
        })
    }
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"3d"});
    res.cookie("token",token);

    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        }
    })
}

async function userLogoutController(req, res) {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

        await redisClient.set(`token:${token}`, "Blocked");

        await redisClient.expireAt(`token:${token}`, payload.exp);

        res.clearCookie("token");

        return res.status(200).json({
            message: "Logout Successful"
        });
    }
    catch (err) {
        return res.status(401).json({
            message: "Logout failed",
            error: err.message
        });
    }
}


module.exports={userRegisterController,userLoginController,userLogoutController};
const userModel=require("../models/user.model");
const jwt=require("jsonwebtoken");
const redisClient=require("../config/redis");

async function authMiddleware(req,res,next){
    const token=req.cookies.token;
    if(!token){
        return res.status(401).json({
            message:"Unauthorized access,token is missing"
        })
    }

    
    try{

        const isBlocked = await redisClient.exists(`token:${token}`);

        if (isBlocked) {
            throw new Error("Invalid Token");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        console.log("Decoded ID:", decoded.id);

        const user = await userModel.findById(decoded.id);

        console.log("Fetched User:", user);

        req.user = user;
        return next();
    }
    catch(err){
            console.log(err);
            return res.status(401).json({
                message: err.message
        });
    }
}

async function authSystemMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }

    try {

        const isBlocked = await redisClient.exists(`token:${token}`);

        if (isBlocked) {
            throw new Error("Invalid Token");
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const user = await userModel.findById(decoded.id)
            .select("+systemUser");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Not a system user"
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.log(err);
        return res.status(401).json({
            message: "Authentication failed"
        });
    }
}

module.exports={
    authMiddleware,authSystemMiddleware
}
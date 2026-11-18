require("dotenv").config()
const app=require("./src/app");
const connectToDB=require("./src/config/db");
const redisClient=require("./src/config/redis");




// connectToDB()
// .then(()=>{
//     console.log("Connected to DB");
//     app.listen(3000,()=>{
//     console.log("Server started at 3000 port");
// })
// })
// .catch((err)=>console.log(err));


const initializeConnection=async()=>{
    try{
        await Promise.all([redisClient.connect(),connectToDB()]);
        console.log("DB CONNECTED");

        app.listen(3000,()=>{
            console.log("Server Started at port 3000");
        })
    }
    catch(err){
        console.log("Error="+err);
    }
}
initializeConnection();
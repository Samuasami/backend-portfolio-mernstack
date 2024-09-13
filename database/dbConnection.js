import mongoose from "mongoose";

const dbConnection=()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName:"PORTFOLIO",

    }).then(()=>{
        console.log("connected to DB");
    }).catch((error)=>{
        console.log(`some error occure while connecting database:${error}`)
    })
}

export default dbConnection
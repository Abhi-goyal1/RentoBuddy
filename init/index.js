const mongoose = require("mongoose");
const initData = require("./data.js");
const mongo_url = "mongodb://127.0.0.1:27017/RentoBuddy";

const listing = require("../models/listing.js");

main()
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch((err)=>{
    console.error(err);
})
async function main(){
    await mongoose.connect(mongo_url);
}

const initDB = async () =>{
   await listing.deleteMany({});

   initData.data = initData.data.map((obj)=>({
    ...obj, owner:"65389adc11c41688c16ddab1"
   }));
   await listing.insertMany(initData.data);
   console.log("data was initialized");
};

initDB();
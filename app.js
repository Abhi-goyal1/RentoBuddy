if(process.env.NODE_ENV !="production"){
  require("dotenv").config();
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const Review = require("./models/review.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/RentoBuddy";
const flash = require("connect-flash");
const session = require('express-session');

const multer = require("multer");
const {storage} = require('./cloudConfig.js') ;
const upload = multer({storage});


const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const cookieParser = require("cookie-parser");
// const {listingSchema, reviewSchema} = require("./schema.js");


const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(cookieParser());

app.use(session({secret: "mysupersecretstring"}));

const sessionOption = {
  secret:"mysupersecretcode",
  resave: false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now() + 7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  },
};



app.use(session(sessionOption)); 
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res, next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;

  next();
});

app.get("/signup",async (req,res)=>{

  res.render("users/signup.ejs");
  
});



app.post("/signup",async (req,res)=>{
  let{username, email, password} = req.body;
  const newUser = new User({email, username});
const registeredUser = await  User.register(newUser, password);

req.login(registeredUser, (err)=>{
  if(err){
    return next(err);
  }
  req.flash("success","Welcome to RentoBuddy")
res.redirect("/listings");
})

  
});



app.get("/login",async (req,res)=>{

  res.render("users/login.ejs");
  
});

app.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash:true, }),async(req,res)=>{

  req.flash("success", "wellcomeback to RentoBuddy")
  res.redirect("/listings");

  
});


app.get("/logout", (req,res ,next)=>{
  req.logOut((err)=>{
    if(err){
      return next(err)
    }
    req.flash("success","you are logged out!");
    res.redirect("/listings");
  })
});




// app.get("/",  (req, res) => {
//   res.send("Hi, I am root");
// });

//Index Route
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

//New Route
app.get("/listings/new", (req, res) => {
 if(!req.isAuthenticated()){

  req.flash("error","You must be logged in to create listings.");
  return res.redirect("/login");
}
 res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path: "reviews", populate:{
    path:"author",
  }}).populate("owner");

  if(!listing){
    req.flash("error","Listing you requested for does not found");
    res.redirect("/listings");

  }
console.log(listing );
  res.render("listings/show.ejs", { listing });
});

//Create Route
app.post("/listings", upload.single('listing[image]') , async  (req, res) => {

  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 2
  })
    .send();
    


  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image ={url , filename};
  newListing.geometry = response.body.features[0].geometry;

  let savedListing =  newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing   Created!");
  res.redirect("/listings");
  // res.send(req.file);

 

});

//Edit Route
app.get("/listings/:id/edit", async (req, res) => {
  if(!req.isAuthenticated()){
    req.flash("error","You must be logged in to create listings.");
    return res.redirect("/login");
  }
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

//Update Route
app.put("/listings/:id", upload.single('listing[image]') , async (req, res) => {
 

  if(!req.isAuthenticated()){
    req.flash("error","You must be logged in to create listings.");
    return res.redirect("/login");
  }
  let { id } = req.params;
 
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if(typeof  req.file != "undefine"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image ={url , filename};
  await listing.save();
  }
  res.redirect(`/listings/${id}`);
});

//Delete Route
app.delete("/listings/:id", async (req, res) => {
  if(!req.isAuthenticated()){
    req.flash("error","You must be logged in to create listings.");
    return res.redirect("/login");
  }
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
});


//Reviews
//Post Route
app.post("/listings/:id/reviews", async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
newReview.author = req.user._id;


  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "New review Created");

res.redirect(`/listings/${listing._id}`);

}); 


//DELETE ROUTE

app.delete("/listings/:id/reviews/:reviewId", async(req,res)=>{
  let {id, reviewId} = req.params;

  await Listing.findByIdAndUpdate(id , {$pull:{reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review Deleted");
  res.redirect(`/listings/${id}`);
 
})

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
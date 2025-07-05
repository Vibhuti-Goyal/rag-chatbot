const express=require("express");
const router=express.Router();
const authToken=require("../middleware/auth")
const UserLoginSignUp=require("../controller/user/userLoginandSignup")
const User=require("../controller/user/userFetch")

router.post("/userLogin",UserLoginSignUp.userLogin)
router.post("/userSignup",UserLoginSignUp.userSignup)
router.get("/fetchUser",authToken,UserLoginSignUp.fetchUser)

router.get("/fetchAllUser",authToken,User.fetchAllUser)
router.post("/updateUser",authToken,User.updateUser)

module.exports=router
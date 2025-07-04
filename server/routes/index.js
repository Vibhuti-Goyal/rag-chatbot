const express=require("express");
const router=express.Router();

const UserLoginSignUp=require("../controller/user/userLoginandSignup")

router.post("/userLogin",UserLoginSignUp.userLogin)
router.post("/userSignup",UserLoginSignUp.userSignup)

module.exports=router
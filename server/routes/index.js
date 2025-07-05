const express=require("express");
const router=express.Router();
const authToken=require("../middleware/auth")
const UserLoginSignUp=require("../controller/user/userLoginandSignup")
const User=require("../controller/user/userFetch")
const Document=require("../controller/Document/document")

router.post("/userLogin",UserLoginSignUp.userLogin)
router.post("/userSignup",UserLoginSignUp.userSignup)
router.get("/fetchUser",authToken,UserLoginSignUp.fetchUser)

router.get("/fetchAllUser",authToken,User.fetchAllUser)
router.post("/updateUser",authToken,User.updateUser)

router.post("/uploadUrls",authToken,Document.uploadUrls)
router.get("/fetchDocumentByRole",authToken,Document.fetchDocumentByRole)

module.exports=router
const express=require("express");
const router=express.Router();

const authToken=require("../middleware/auth")
const UserLoginSignUp=require("../controller/user/userLoginandSignup")
const User=require("../controller/user/userFetch")
const Document=require("../controller/Document/document")
const Chat=require("../controller/chat/chat")


router.post("/userLogin",UserLoginSignUp.userLogin)
router.post("/userSignup",UserLoginSignUp.userSignup)
router.get("/fetchUser",authToken,UserLoginSignUp.fetchUser)

router.get("/fetchAllUser",authToken,User.fetchAllUser)
router.post("/updateUser",authToken,User.updateUser)

router.post("/uploadUrls",authToken,Document.uploadUrls)
router.get("/fetchDocumentByRole",authToken,Document.fetchDocumentByRole)

// router.post("/createChat",authToken,Chat.createChat)
router.get("/fetchChat",authToken,Chat.fetchChat)
router.post("/queryReply",authToken,Chat.queryReply)
router.get("/fetchChat/:id",authToken,Chat.fetchParticularChat)
router.post("/createNewChat",authToken,Chat.createNewChat)

module.exports=router
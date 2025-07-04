const userModel=require('../../model/user')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const userLogin=async(req,res)=>{
    const {email,password}=req.body
    if(!email || !password){
        return res.status(400).json({error:"Please fill all the fields"})
    }
    try{
        const user=await userModel.findOne({email})
        if(!user){
            return res.status(400).json({error:"User not found"})
        }
        const isMatch=await bcrypt.compare(password,user.passwordHash)
        if(!isMatch){
            return res.status(400).json({error:"Invalid credentials"})
        }
        const tokenData = { _id: user._id, email: user.email };
        const token = jwt.sign({ data: tokenData }, process.env.TOKEN_SECRET_KEY, { expiresIn: '3h' });

        const tokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
        };

        res.cookie('token', token, tokenOptions).json({
            message: "Signin successful",
            data: token,
            error: false,
            success: true
        });
    }
    catch(err){
        console.log(err)
        res.status(500).json({error:"Internal server error"})
    }
}

const userSignup = async (req, res) => {
  const { name, email, password, department, role } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ error: "Please fill all the required fields" });
  }

  try {
    const findUser = await userModel.findOne({ email });
    if (findUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = new userModel({
      name,
      email,
      department,
      role: role || "user",
      passwordHash: hashPassword
    });

    await user.save();

    res.status(200).json({ message: "Signup successful" });
  } catch (err) {
    console.log("Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports={
    userLogin,
    userSignup
}
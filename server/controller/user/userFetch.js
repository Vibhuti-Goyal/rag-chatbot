const userModel = require("../../model/user");

const fetchAllUser = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const admin = await userModel.findById(adminId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "You are not an admin" });
    }

    const users = await userModel.find(); 

    res.status(200).json({
      message: "Users fetched",
      data: users,
      error: false,
      success: true,
    });
  } catch (err) {
    console.log("FetchAllUser error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      data: [],
      success: false,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    console.log(req.body);
    const adminId = req.user?._id;

    const admin = await userModel.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "You are not an admin" });
    }

    const { userId, role, department } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { role, department },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated", data: updatedUser });
  } catch (err) {
    console.log("UpdateUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports={
    fetchAllUser,
    updateUser
}
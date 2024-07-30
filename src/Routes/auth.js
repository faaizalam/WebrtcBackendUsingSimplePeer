const bcrypt = require("bcrypt");
const Auth = require("../models/Auth");

const router = require("express").Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  console.log(req.body);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Auth({
      name,
      email,
      password: hashedPassword,
    });

    const registered = await user.save();
    console.log(registered);
    if (registered) {
      res.send({ message: "Successfully Registered", user: registered });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);

  try {
    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // console.log("Retrieved user:", user);

    // console.log("Hashed password:", user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      res.send({ message: "Successfully logged In", user: user });
    } else {
      console.log("Incorrect password provided");
      res.status(401).send({ message: "Incorrect Password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;

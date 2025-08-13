var express = require("express");
var router = express.Router();
var ethers = require("ethers");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/verify-signature", (req, res) => {
  const { message, signature } = req.body;
  try {
    const signer = ethers.ethers.verifyMessage(message, signature);
    res.json({ isValid: true, signer, originalMessage: message });
  } catch (error) {
    res.json({ isValid: false, signer: null, originalMessage: message });
  }
});

module.exports = router;

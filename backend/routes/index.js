var express = require("express");
var router = express.Router();
var ethers = require("ethers");
var Joi = require("joi");

const signatureSchema = Joi.object({
  message: Joi.string().required().min(1).messages({
    "string.empty": "Message cannot be empty",
    "any.required": "Message is required",
  }),
  signature: Joi.string()
    .required()
    .pattern(/^0x[0-9a-fA-F]{130}$/)
    .messages({
      "string.empty": "Signature cannot be empty",
      "any.required": "Signature is required",
      "string.pattern.base":
        "Signature must be a valid Ethereum signature (0x + 130 hex characters)",
    }),
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/verify-signature", (req, res) => {
  const { error, value } = signatureSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const { message, signature } = value;

  try {
    const signer = ethers.ethers.verifyMessage(message, signature);
    res.json({ isValid: true, signer, originalMessage: message });
  } catch (error) {
    res.json({ isValid: false, signer: null, originalMessage: message });
  }
});

module.exports = router;

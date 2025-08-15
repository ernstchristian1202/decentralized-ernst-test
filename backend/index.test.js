var request = require("supertest");
var express = require("express");
var { ethers } = require("ethers");
var Joi = require("joi");

const app = express();
app.use(express.json());

const signatureSchema = Joi.object({
  message: Joi.string().required().min(1),
  signature: Joi.string()
    .required()
    .pattern(/^0x[0-9a-fA-F]{130}$/),
});

app.post("/verify-signature", async (req, res) => {
  const { error, value } = signatureSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { message, signature } = value;
  try {
    const signer = ethers.verifyMessage(message, signature);
    res.json({ isValid: true, signer, originalMessage: message });
  } catch (error) {
    res.status(400).json({
      isValid: false,
      signer: null,
      originalMessage: message,
      error: "Invalid signature",
    });
  }
});

describe("POST /verify-signature", () => {
  test("validates correct input", async () => {
    const message = "Hello Web3!";
    const wallet = ethers.Wallet.createRandom();
    const signature = await wallet.signMessage(message);
    const res = await request(app)
      .post("/verify-signature")
      .send({ message, signature });
    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.signer).toBe(wallet.address);
  });

  test("rejects empty message", async () => {
    const res = await request(app)
      .post("/verify-signature")
      .send({ message: "", signature: "0x123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"message" is not allowed to be empty');
  });

  test("rejects invalid signature", async () => {
    const res = await request(app)
      .post("/verify-signature")
      .send({ message: "Hello", signature: "invalid" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(
      '"signature" with value "invalid" fails to match the required pattern: /^0x[0-9a-fA-F]{130}$/'
    );
  });
});

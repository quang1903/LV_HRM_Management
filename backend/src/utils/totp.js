import crypto from "crypto"

const STEP = 30
const DIGITS = 6

function generateTOTP(secret, timeOffset = 0) {
  const counter = Math.floor(Date.now() / 1000 / STEP) + timeOffset
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(0, 0)
  buffer.writeUInt32BE(counter, 4)

  const hmac = crypto.createHmac("sha1", Buffer.from(secret)).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, DIGITS)

  return code.toString().padStart(DIGITS, "0")
}

export function generate(secret) {
  return generateTOTP(secret, 0)
}

export function verify(token, secret) {
  for (const offset of [-1, 0, 1]) {
    if (generateTOTP(secret, offset) === token) return true
  }
  return false
}

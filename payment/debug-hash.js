const crypto = require('crypto');

// Your values
const merchantId = '1234634';
const orderId = 'order_123';  // Example order ID from your screenshot
const amount = '1500.00';  // Amount in your screenshot
const currency = 'LKR';
const merchantSecretBase64 = 'MjM3NzQzMjQyMjE3NTExNDQ0MDIxMTE2MDAzNTg0MjU2MDY0Mzg5Mg==';

function md5Upper(value) {
    return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

console.log("\n=== PayHere Hash Debug ===\n");
console.log(`Merchant ID: ${merchantId}`);
console.log(`Order ID: ${orderId}`);
console.log(`Amount: ${amount}`);
console.log(`Currency: ${currency}`);
console.log(`Secret (base64): ${merchantSecretBase64}`);

// Try 1: Secret as-is (base64)
console.log("\n--- Option 1: Secret AS-IS (Base64) ---");
const secretHashBase64 = md5Upper(merchantSecretBase64);
const hashInput1 = `${merchantId}${orderId}${amount}${currency}${secretHashBase64}`;
const hash1 = md5Upper(hashInput1);
console.log(`MD5(merchant_secret): ${secretHashBase64}`);
console.log(`Hash input: ${hashInput1}`);
console.log(`Final hash: ${hash1}`);

// Try 2: Secret decoded (from base64)
console.log("\n--- Option 2: Secret DECODED (from Base64) ---");
const merchantSecretDecoded = Buffer.from(merchantSecretBase64, 'base64').toString('utf-8');
console.log(`Decoded secret: ${merchantSecretDecoded}`);
const secretHashDecoded = md5Upper(merchantSecretDecoded);
const hashInput2 = `${merchantId}${orderId}${amount}${currency}${secretHashDecoded}`;
const hash2 = md5Upper(hashInput2);
console.log(`MD5(merchant_secret): ${secretHashDecoded}`);
console.log(`Hash input: ${hashInput2}`);
console.log(`Final hash: ${hash2}`);

console.log("\n=== RECOMMENDATION ===");
console.log("Copy BOTH hashes above and test them in PayHere sandbox.");
console.log("The correct hash will allow payment to proceed.");
console.log("\nIf Option 2 (decoded) works:");
console.log("  → Update .env: PAYHERE_SECRET_KEY with the DECODED value");
console.log("\nIf Option 1 (as-is) works:");
console.log("  → Keep .env as current (base64 value)");

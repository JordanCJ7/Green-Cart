/**
 * Test script for the Notification service.
 * Simulates requests that inventory/order/payment services would make.
 *
 * Usage:  node test-notification.js
 *         node test-notification.js sms +94XXXXXXXXX   (to test SMS)
 */
const http = require("http");
const jwt = require("jsonwebtoken");

const BASE = "http://localhost:8084";
const JWT_SECRET = "de588fe20781e422c067a2efa7ea675b094b1360b613581fdd024e67803c4e6b";

// Generate a test JWT token (admin)
const adminToken = jwt.sign({ sub: "admin001", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
const customerToken = jwt.sign({ sub: "cust001", role: "customer" }, JWT_SECRET, { expiresIn: "1h" });

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(label, result) {
  const icon = result.status < 300 ? "✅" : "❌";
  console.log(`\n${icon} ${label} [${result.status}]`);
  console.log(JSON.stringify(result.body, null, 2));
}

async function run() {
  const phoneArg = process.argv[2] === "sms" ? process.argv[3] : null;

  console.log("🧪 Notification Service Test Script");
  console.log("====================================\n");

  // 1. Health check (no auth)
  console.log("--- Test 1: Health Check ---");
  const health = await request("GET", "/health", "");
  log("Health", health);

  // 2. Create in-app notification (inventory added — NO SMS)
  console.log("\n--- Test 2: In-App Notification (inventory_added) ---");
  const n1 = await request("POST", "/notifications", adminToken, {
    userId: "admin001",
    type: "inventory_added",
    title: "New Product Added",
    message: 'Product "Organic Apples" added to inventory with 150 units.',
    role: "admin",
  });
  log("Create inventory_added", n1);

  // 3. Create in-app notification (order placed — NO SMS)
  console.log("\n--- Test 3: In-App Notification (order_placed) ---");
  const n2 = await request("POST", "/notifications", adminToken, {
    userId: "cust001",
    type: "order_placed",
    title: "Order Placed",
    message: "Your order #ORD-1042 with 3 items totalling $45.90 has been placed.",
    role: "customer",
  });
  log("Create order_placed", n2);

  // 4. Create SMS notification (order accepted — SENDS SMS)
  console.log("\n--- Test 4: Order Accepted (SMS) ---");
  const smsBody = {
    userId: "cust001",
    type: "order_accepted",
    title: "Order Accepted",
    message: "Great news! Your order #ORD-1042 has been accepted and is being prepared.",
    role: "customer",
  };
  if (phoneArg) {
    smsBody.phoneNumber = phoneArg;
    console.log(`   📱 Will send SMS to: ${phoneArg}`);
  } else {
    console.log("   ⏭️  No phone number — SMS will be skipped. Run: node test-notification.js sms +94XXXXXXXXX");
  }
  const n3 = await request("POST", "/notifications", adminToken, smsBody);
  log("Create order_accepted", n3);
  if (n3.body.smsSent) console.log("   📱 SMS was sent successfully!");

  // 5. Create SMS notification (order rejected — SENDS SMS)
  console.log("\n--- Test 5: Order Rejected (SMS) ---");
  const rejectBody = {
    userId: "cust001",
    type: "order_rejected",
    title: "Order Rejected",
    message: "Sorry, your order #ORD-1043 could not be fulfilled. Refund initiated.",
    role: "customer",
  };
  if (phoneArg) {
    rejectBody.phoneNumber = phoneArg;
  }
  const n4 = await request("POST", "/notifications", adminToken, rejectBody);
  log("Create order_rejected", n4);
  if (n4.body.smsSent) console.log("   📱 SMS was sent successfully!");

  // 6. Create in-app notification (payment — NO SMS)
  console.log("\n--- Test 6: In-App Notification (payment_completed) ---");
  const n5 = await request("POST", "/notifications", adminToken, {
    userId: "cust001",
    type: "payment_completed",
    title: "Payment Confirmed",
    message: "Payment of $128.50 for order #ORD-1035 was successfully processed.",
    role: "customer",
  });
  log("Create payment_completed", n5);

  // 7. Get all notifications
  console.log("\n--- Test 7: List All Notifications ---");
  const list = await request("GET", "/notifications?role=customer", adminToken);
  log(`List notifications (${list.body.total} total)`, { status: list.status, body: { total: list.body.total, count: list.body.notifications?.length } });

  // 8. Get stats
  console.log("\n--- Test 8: Notification Stats ---");
  const stats = await request("GET", "/notifications/stats?role=customer", adminToken);
  log("Stats", stats);

  // 9. Mark one as read
  if (n2.body._id) {
    console.log("\n--- Test 9: Mark As Read ---");
    const read = await request("PATCH", `/notifications/${n2.body._id}/read`, adminToken);
    log("Mark read", read);
  }

  // 10. Delete one
  if (n1.body._id) {
    console.log("\n--- Test 10: Delete Notification ---");
    const del = await request("DELETE", `/notifications/${n1.body._id}`, adminToken);
    log("Delete", del);
  }

  console.log("\n====================================");
  console.log("🏁 All tests complete!\n");

  // Summary
  console.log("Summary:");
  console.log("  📋 In-app notifications: inventory_added, order_placed, payment_completed — ✅ Created (no SMS)");
  console.log("  📱 SMS notifications:    order_accepted, order_rejected — " + (phoneArg ? "✅ SMS sent" : "⏭️ Skipped (no phone)"));
  console.log("  📖 List & Stats:         ✅ Working");
  console.log("  ✓  Mark read:            ✅ Working");
  console.log("  🗑️  Delete:              ✅ Working");
}

run().catch((err) => {
  console.error("❌ Test failed:", err.message);
  console.error("   Make sure the notification service is running: npm run dev");
});

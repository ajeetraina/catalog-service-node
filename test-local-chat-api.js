// Test the local chat API with corrected Model Runner URL
require("dotenv").config();

const API_URL = "http://localhost:12434/engines/llama.cpp/v1/";
const API_KEY = "dockermodelrunner";
const MODEL = "ai/llama3.2:1B-Q8_0";

async function testChatAPI() {
  console.log("🧪 Testing local chat API...");
  console.log(`Using Model Runner at: ${API_URL}`);

  try {
    // Test your local application's chat endpoint
    const ports = [3001, 3002];

    for (const port of ports) {
      try {
        console.log(`\n📡 Testing http://localhost:${port}/api/chat`);

        const response = await fetch(`http://localhost:${port}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Hello! Can you tell me about your products?",
            conversation_id: "test123",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Chat API working on port ${port}!`);
          console.log("📄 Response:", JSON.stringify(data, null, 2));
          return true;
        } else {
          console.log(
            `❌ Failed on port ${port}: ${response.status} ${response.statusText}`,
          );
          const errorText = await response.text();
          console.log("Error details:", errorText);
        }
      } catch (err) {
        console.log(`❌ Error on port ${port}: ${err.message}`);
      }
    }

    return false;
  } catch (error) {
    console.error("❌ Error testing chat API:", error.message);
    return false;
  }
}

testChatAPI();

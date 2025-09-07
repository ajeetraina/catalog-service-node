// test-chat-api.js - Test the chat API connection
require("dotenv").config();

const API_URL =
  process.env.OPENAI_API_URL ||
  "http://host.docker.internal:12434/engines/llama.cpp/v1/";
const API_KEY = process.env.OPENAI_API_KEY || "dockermodelrunner";
const MODEL = process.env.OPENAI_MODEL || "ai/llama3.2:1B-Q8_0";

console.log("🤖 Testing Model Runner Connection...");
console.log("====================================");
console.log(`API URL: ${API_URL}`);
console.log(`Model: ${MODEL}`);
console.log(`API Key: ${API_KEY ? "Set" : "Not set"}`);
console.log("");

async function testModelRunner() {
  try {
    // Test 1: Check if Model Runner is accessible
    console.log("📡 Test 1: Checking Model Runner health...");

    // Try different endpoints
    const endpoints = [
      "http://localhost:12434/engines/llama.cpp/v1/models",
      "http://host.docker.internal:12434/engines/llama.cpp/v1/models",
      `${API_URL}/models`,
      `${API_URL}models`,
    ];

    let connected = false;
    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log(`   ✅ Connected to: ${endpoint}`);
          const data = await response.text();
          console.log(`   Response: ${data.substring(0, 200)}...`);
          connected = true;
          break;
        } else {
          console.log(
            `   ❌ Failed: ${response.status} ${response.statusText}`,
          );
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    if (!connected) {
      console.log("❌ Could not connect to Model Runner on any endpoint");
      console.log("");
      console.log("💡 Troubleshooting:");
      console.log("1. Check if Model Runner is running:");
      console.log("   docker ps | grep model");
      console.log("2. Start Model Runner:");
      console.log("   Docker Desktop > Extensions > Model Runner");
      console.log("3. Or via command line:");
      console.log(
        "   docker run -d -p 12434:12434 --name model-runner ghcr.io/docker/model-runner:latest",
      );
      return false;
    }

    // Test 2: Try a chat completion
    console.log("");
    console.log("💬 Test 2: Testing chat completion...");

    const chatEndpoint = API_URL.endsWith("/")
      ? `${API_URL}chat/completions`
      : `${API_URL}/chat/completions`;
    console.log(`   Using endpoint: ${chatEndpoint}`);

    const chatResponse = await fetch(chatEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content:
              'Hello! Can you respond with just "Connection successful"?',
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log("   ✅ Chat completion successful!");
      console.log("   Response:", JSON.stringify(chatData, null, 2));
      return true;
    } else {
      console.log(
        `   ❌ Chat completion failed: ${chatResponse.status} ${chatResponse.statusText}`,
      );
      const errorText = await chatResponse.text();
      console.log("   Error details:", errorText);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error during testing: ${error.message}`);
    console.log("Stack trace:", error.stack);
    return false;
  }
}

// Test the local chat API endpoint
async function testLocalChatAPI() {
  console.log("");
  console.log("🌐 Test 3: Testing local chat API...");

  const localEndpoints = [
    "http://localhost:3001/api/chat",
    "http://localhost:3002/api/chat",
  ];

  for (const endpoint of localEndpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Test message",
          conversation_id: "test123",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Local API working on: ${endpoint}`);
        console.log("   Response:", JSON.stringify(data, null, 2));
        return true;
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log("   Error:", errorText);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  return false;
}

// Run all tests
async function runAllTests() {
  const modelRunnerOk = await testModelRunner();
  const localApiOk = await testLocalChatAPI();

  console.log("");
  console.log("📊 Test Summary:");
  console.log("================");
  console.log(
    `Model Runner: ${modelRunnerOk ? "✅ Working" : "❌ Not working"}`,
  );
  console.log(
    `Local Chat API: ${localApiOk ? "✅ Working" : "❌ Not working"}`,
  );

  if (!modelRunnerOk) {
    console.log("");
    console.log("🔧 Next Steps:");
    console.log("1. Start Model Runner in Docker Desktop");
    console.log(
      "2. Or run: docker run -d -p 12434:12434 --name model-runner ghcr.io/docker/model-runner:latest",
    );
    console.log(
      "3. Pull the model: docker exec model-runner model pull ai/llama3.2:1B-Q8_0",
    );
    console.log("4. Restart your application");
  }
}

runAllTests().catch(console.error);

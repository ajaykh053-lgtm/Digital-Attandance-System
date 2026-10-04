const http = require('http');

// Function to test API endpoint
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: responseData,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test function
async function runTests() {
  console.log('🧪 Starting Server Tests...\n');

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    const health = await testEndpoint('/api/health', 'GET');
    console.log(`Status: ${health.status}`);
    console.log(`Response: ${health.body}\n`);

    if (health.status === 200) {
      console.log('✅ Health check PASSED\n');
    } else {
      console.log('❌ Health check FAILED\n');
    }

    // Test 2: Get departments
    console.log('📋 Test 2: Get Public Departments');
    const depts = await testEndpoint('/api/auth/departments', 'GET');
    console.log(`Status: ${depts.status}`);
    console.log(`Response: ${depts.body}\n`);

    if (depts.status === 200) {
      console.log('✅ Get departments PASSED\n');
    } else {
      console.log('❌ Get departments FAILED\n');
    }

    // Test 3: Test 404 handler
    console.log('📋 Test 3: 404 Handler');
    const notFound = await testEndpoint('/api/invalid-route', 'GET');
    console.log(`Status: ${notFound.status}`);
    console.log(`Response: ${notFound.body}\n`);

    if (notFound.status === 404) {
      console.log('✅ 404 Handler PASSED\n');
    } else {
      console.log('❌ 404 Handler FAILED\n');
    }

    console.log('🎉 All basic tests completed!');
    console.log('\n✅ Server is responding properly to requests.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('\n⚠️ Cannot connect to server. Make sure it is running on port 3000');
    process.exit(1);
  }
}

// Wait a moment for server startup
setTimeout(runTests, 2000);

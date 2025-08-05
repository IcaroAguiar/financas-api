// Simple health check test
const http = require('http');

function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    // Start the server in the background for testing
    const app = require('../../server');
    const server = app.listen(0, () => {
      const port = server.address().port;
      
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          server.close();
          
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.status === 'ok') {
              console.log('✅ Health check test passed');
              resolve();
            } else {
              console.error('❌ Health check returned wrong status:', response);
              reject(new Error('Health check failed'));
            }
          } else {
            console.error('❌ Health check returned status code:', res.statusCode);
            reject(new Error(`Health check failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        console.error('❌ Health check request failed:', err.message);
        reject(err);
      });

      req.setTimeout(5000, () => {
        server.close();
        console.error('❌ Health check request timed out');
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  });
}

// Run the test
testHealthEndpoint()
  .then(() => {
    console.log('All tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Tests failed:', err.message);
    process.exit(1);
  });
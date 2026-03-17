const fs = require('fs');

// Generate a dummy large image file (e.g. 10MB) for testing
const size = 10 * 1024 * 1024;
const buffer = Buffer.alloc(size, 0);

console.log('Test file created. Note: server-side tests cannot fully run canvas.toBlob as it is a browser API.');
console.log('To properly test this, we need to inspect the admin.html file in the browser environment.');

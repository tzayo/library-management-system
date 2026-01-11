/**
 * Node.js script to add Israeli children's books to the library system
 * Usage: node add_books_script.js <your-jwt-token>
 */

const https = require('http');
const fs = require('fs');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 5000;
const API_PATH = '/api/books';

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.error('Error: Please provide your JWT token as an argument');
  console.error('Usage: node add_books_script.js <your-jwt-token>');
  console.error('\nTo get your token:');
  console.error('1. Login to http://localhost:3001/login');
  console.error('2. Open browser DevTools > Application > Local Storage');
  console.error('3. Copy the "token" value');
  process.exit(1);
}

// Read the books data
const booksData = JSON.parse(fs.readFileSync('israeli_books_data.json', 'utf8'));

console.log(`📚 Found ${booksData.length} books to add\n`);

// Function to add a single book
function addBook(bookData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bookData);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log(`✅ Added: "${bookData.title}" by ${bookData.author}`);
          resolve(result);
        } else {
          console.error(`❌ Failed to add "${bookData.title}": ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error adding "${bookData.title}":`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Add all books sequentially with a small delay
async function addAllBooks() {
  console.log('🚀 Starting to add books...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < booksData.length; i++) {
    const book = booksData[i];
    console.log(`[${i + 1}/${booksData.length}] Adding: "${book.title}"`);

    try {
      await addBook(book);
      successCount++;
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Finished!`);
  console.log(`   Success: ${successCount} books`);
  console.log(`   Errors: ${errorCount} books`);
  console.log('='.repeat(50));
}

// Run the script
addAllBooks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

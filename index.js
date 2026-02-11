const mime = require('mime-types');

console.log('=== MIME Types Vulnerability Test Sample ===\n');

// 基本的な使用例
const testCases = [
  { file: 'test.html', description: 'HTML file' },
  { file: 'script.js', description: 'JavaScript file' },
  { file: 'style.css', description: 'CSS file' },
  { file: 'image.png', description: 'PNG image' },
  { file: 'document.pdf', description: 'PDF document' },
  { file: 'data.json', description: 'JSON data' },
];

console.log('MIME Type Lookup Examples:\n');
testCases.forEach(({ file, description }) => {
  const mimeType = mime.lookup(file);
  const charset = mime.charset(mimeType);
  const extension = mime.extension(mimeType);
  
  console.log(`File: ${file} (${description})`);
  console.log(`  MIME Type: ${mimeType || 'unknown'}`);
  console.log(`  Charset: ${charset || 'none'}`);
  console.log(`  Extension: ${extension || 'none'}`);
  console.log('');
});

// Content-Type の生成例
console.log('Content-Type Examples:\n');
['text/html', 'application/json', 'text/plain'].forEach(type => {
  const contentType = mime.contentType(type);
  console.log(`${type} -> ${contentType}`);
});

console.log('\n=== mime-types version:', require('mime-types/package.json').version, '===');

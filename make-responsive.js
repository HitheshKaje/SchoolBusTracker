const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'public', 'admin'),
  path.join(__dirname, 'public', 'driver'),
  path.join(__dirname, 'public', 'parent')
];

function processFile(filePath) {
  if (!filePath.endsWith('.html')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Update main tag
  content = content.replace(/<main id="main-content" class="ml-64 flex-1 min-h-screen flex flex-col">/g, '<main id="main-content" class="md:ml-64 flex-1 min-h-screen flex flex-col w-full md:w-auto overflow-x-hidden">');
  content = content.replace(/<main id="main-content" class="flex-1 ml-64 h-screen overflow-y-auto">/g, '<main id="main-content" class="flex-1 md:ml-64 h-screen overflow-y-auto w-full md:w-auto overflow-x-hidden">');

  // 2. Update p-8 container
  content = content.replace(/<div class="p-8 flex-1">/g, '<div class="p-4 sm:p-6 md:p-8 flex-1 w-full max-w-full">');
  content = content.replace(/<div class="p-8 max-w-7xl mx-auto space-y-8">/g, '<div class="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-8 w-full">');

  // 3. Update flex headers (h1 + button)
  content = content.replace(/<div class="flex justify-between items-center mb-6">/g, '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">');
  content = content.replace(/<div class="flex justify-between items-center mb-8">/g, '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">');
  content = content.replace(/<div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">/g, '<div class="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 space-y-4 sm:space-y-0">');

  // 4. Wrap tables in overflow-x-auto
  if (content.includes('<table') && !content.includes('<div class="overflow-x-auto w-full">')) {
      content = content.replace(/(<table[^>]*>[\s\S]*?<\/table>)/g, '<div class="overflow-x-auto w-full">\n          $1\n        </div>');
  }

  // 5. Modals - ensure they have margin on mobile
  content = content.replace(/<div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">/g, '<div class="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 sm:mx-auto p-6">');
  content = content.replace(/<div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">/g, '<div class="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 sm:mx-auto p-6">');
  content = content.replace(/<div class="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">/g, '<div class="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 sm:mx-auto p-6">');

  // 6. Modal Forms - make them grid-cols-1 on mobile
  content = content.replace(/<div class="grid grid-cols-2 gap-4">/g, '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

dirs.forEach(processDir);
console.log('Done');

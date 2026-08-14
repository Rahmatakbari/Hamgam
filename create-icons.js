const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // پس‌زمینه آبی
  ctx.fillStyle = '#007bff';
  ctx.fillRect(0, 0, size, size);
  
  // دایره سفید در وسط
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // حرف "ه" آبی در وسط دایره سفید
  ctx.fillStyle = '#007bff';
  ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ه', size / 2, size / 2);
  
  // ذخیره به فایل
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename} (${size}x${size})`);
}

// ساخت آیکون‌ها
createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');

console.log('Icons created successfully!');

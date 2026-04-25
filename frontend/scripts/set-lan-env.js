const fs = require('fs');
const os = require('os');
const path = require('path');

function getLanIPv4() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry && entry.family === 'IPv4' && !entry.internal) {
        const ip = String(entry.address || '');
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
          return ip;
        }
      }
    }
  }

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry && entry.family === 'IPv4' && !entry.internal) {
        return String(entry.address || '');
      }
    }
  }

  return '127.0.0.1';
}

function writeLanEnv() {
  const ip = getLanIPv4();
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = [
    'HOST=0.0.0.0',
    'PORT=3000',
    `REACT_APP_API_BASE_URL=http://${ip}:5000/api`,
    `REACT_APP_SOCKET_URL=http://${ip}:5000`,
    ''
  ].join('\n');

  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`LAN config updated in .env.local with IP: ${ip}`);
}

writeLanEnv();
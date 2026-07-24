const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    console.log(`Read ${lines.length} lines from ${envPath}`);
    
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
            console.log(`${idx + 1}: [EMPTY]`);
            return;
        }
        if (trimmed.startsWith('#')) {
            console.log(`${idx + 1}: [COMMENT] ${trimmed.substring(0, 40)}`);
            return;
        }
        const parts = trimmed.split('=');
        const key = parts[0];
        if (key === 'MAIL_PASSWORD') {
            console.log(`${idx + 1}: ${key}=[CONFIGURED]`);
        } else {
            console.log(`${idx + 1}: ${key}=${parts.slice(1).join('=')}`);
        }
    });
} catch (err) {
    console.error('Error reading env:', err);
}

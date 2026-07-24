require('dotenv').config();

const pass = process.env.MAIL_PASSWORD;
if (!pass) {
    console.log('Password is not loaded at all.');
    process.exit(1);
}

console.log(`Length of password string: ${pass.length}`);
console.log(`Contains spaces: ${pass.includes(' ')}`);
console.log(`Contains quotes at start/end: ${pass.startsWith('"') || pass.startsWith("'") || pass.endsWith('"') || pass.endsWith("'")}`);
console.log(`Contains carriage return/newline: ${pass.includes('\r') || pass.includes('\n')}`);
console.log(`First character code: ${pass.charCodeAt(0)}`);
console.log(`Last character code: ${pass.charCodeAt(pass.length - 1)}`);

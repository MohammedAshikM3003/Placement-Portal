// Initialize both Admin and Coordinator accounts
const axios = require('axios');

const API_URL = 'http://localhost:5000';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

async function initializeAccounts() {
    console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║   PLACEMENT PORTAL ACCOUNT INITIALIZATION  ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);
    
    let adminCreated = false;
    let coordinatorCreated = false;
    
    // Initialize Admin Account
    try {
        console.log(`${colors.bright}[1/2] Initializing Admin Account...${colors.reset}`);
        const adminResponse = await axios.post(`${API_URL}/api/init/admin`, {}, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (adminResponse.data.created) {
            console.log(`${colors.green}✅ Admin account created successfully!${colors.reset}`);
            adminCreated = true;
        } else if (adminResponse.data.existing) {
            console.log(`${colors.yellow}ℹ️  Admin account already exists${colors.reset}`);
        }
        
        console.log(`   ${colors.bright}Credentials:${colors.reset}`);
        console.log(`   Username: ${colors.cyan}admin1000${colors.reset}`);
        console.log(`   Password: ${colors.cyan}admin1000${colors.reset}`);
        console.log('');
        
    } catch (error) {
        console.error(`${colors.red}❌ Failed to initialize admin:${colors.reset}`, error.response?.data?.error || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log(`\n${colors.red}💡 Backend server is not running. Start it with:${colors.reset}`);
            console.log('   node server-mongodb.js\n');
            return;
        }
        console.log('');
    }
    
    // Initialize Coordinator Account
    try {
        console.log(`${colors.bright}[2/2] Initializing Coordinator Account...${colors.reset}`);
        const coordResponse = await axios.post(`${API_URL}/api/init/coordinator`, {}, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (coordResponse.data.created) {
            console.log(`${colors.green}✅ Coordinator account created successfully!${colors.reset}`);
            coordinatorCreated = true;
        } else if (coordResponse.data.existing) {
            console.log(`${colors.yellow}ℹ️  Coordinator account already exists${colors.reset}`);
        }
        
        console.log(`   ${colors.bright}Credentials:${colors.reset}`);
        console.log(`   Coordinator ID: ${colors.cyan}coord_cse${colors.reset}`);
        console.log(`   Username: ${colors.cyan}coord_cse${colors.reset}`);
        console.log(`   Password: ${colors.cyan}coord123${colors.reset}`);
        console.log(`   Department: ${colors.cyan}CSE${colors.reset}`);
        console.log('');
        
    } catch (error) {
        console.error(`${colors.red}❌ Failed to initialize coordinator:${colors.reset}`, error.response?.data?.error || error.message);
        console.log('');
    }
    
    // Summary
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}  Summary${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
    
    if (adminCreated || coordinatorCreated) {
        console.log(`${colors.green}${colors.bright}🎉 New accounts created!${colors.reset}`);
        if (adminCreated) {
            console.log(`   ${colors.green}✓${colors.reset} Admin account (admin1000/admin1000)`);
        }
        if (coordinatorCreated) {
            console.log(`   ${colors.green}✓${colors.reset} Coordinator account (coord_cse/coord123)`);
        }
    } else {
        console.log(`${colors.yellow}ℹ️  All accounts already exist${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log(`  1. Login as Admin: ${colors.cyan}admin1000${colors.reset} / ${colors.cyan}admin1000${colors.reset}`);
    console.log(`  2. Login as Coordinator: ${colors.cyan}coord_cse${colors.reset} / ${colors.cyan}coord123${colors.reset}`);
    console.log(`  3. Test performance: ${colors.cyan}node test-all-logins.js${colors.reset}\n`);
}

initializeAccounts();

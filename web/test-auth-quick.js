#!/usr/bin/env node

// Quick Authentication System Test
// This script performs basic validation of the authentication system

const fs = require('fs');
const path = require('path');

console.log('🔐 Quick Authentication System Validation');
console.log('=========================================\n');

let passed = 0;
let failed = 0;

function test(name, condition, message = '') {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}${message ? ` - ${message}` : ''}`);
        failed++;
    }
}

// Test 1: Check if required files exist
console.log('📁 Checking Authentication Files...');

const requiredFiles = [
    'src/lib/auth-config.ts',
    'src/lib/password-utils.ts',
    'src/lib/password-reset-utils.ts',
    'src/app/auth/signin/page.tsx',
    'src/app/auth/signup/page.tsx',
    'src/app/auth/forgot-password/page.tsx',
    'src/app/api/auth/signup/route.ts',
    'src/middleware/auth-security.ts',
    'prisma/schema.prisma'
];

requiredFiles.forEach(file => {
    test(
        `File exists: ${file}`,
        fs.existsSync(path.join(__dirname, file)),
        'File not found'
    );
});

// Test 2: Check environment file
console.log('\n🔧 Checking Environment Configuration...');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    test('NEXTAUTH_URL configured', envContent.includes('NEXTAUTH_URL='));
    test('NEXTAUTH_SECRET configured', envContent.includes('NEXTAUTH_SECRET='));
    test('DATABASE_URL configured', envContent.includes('DATABASE_URL='));
} else {
    test('Environment file exists', false, '.env.local not found');
}

// Test 3: Check package.json dependencies
console.log('\n📦 Checking Dependencies...');

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    test('next-auth installed', !!deps['next-auth']);
    test('bcryptjs installed', !!deps['bcryptjs']);
    test('prisma installed', !!deps['prisma']);
    test('zod installed', !!deps['zod']);
} else {
    test('package.json exists', false);
}

// Test 4: Check Prisma schema
console.log('\n🗄️  Checking Database Schema...');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    test('User model exists', schemaContent.includes('model User'));
    test('PasswordReset model exists', schemaContent.includes('model PasswordReset'));
    test('SecurityEvent model exists', schemaContent.includes('model SecurityEvent'));
    test('UserSession model exists', schemaContent.includes('model UserSession'));
} else {
    test('Prisma schema exists', false);
}

// Test 5: Check authentication components
console.log('\n🎨 Checking Authentication Components...');

const componentFiles = [
    'src/components/auth/reusable-sign-in-form.tsx',
    'src/components/auth/reusable-sign-up-form.tsx',
    'src/components/auth/password-strength-indicator.tsx',
    'src/components/auth/google-sign-in-button.tsx'
];

componentFiles.forEach(file => {
    test(
        `Component exists: ${path.basename(file)}`,
        fs.existsSync(path.join(__dirname, file))
    );
});

// Test 6: Check middleware
console.log('\n🛡️  Checking Security Middleware...');

const middlewarePath = path.join(__dirname, 'middleware.ts');
test('Root middleware exists', fs.existsSync(middlewarePath));

const authMiddlewarePath = path.join(__dirname, 'src/middleware/auth-security.ts');
test('Auth security middleware exists', fs.existsSync(authMiddlewarePath));

// Test 7: Check API routes
console.log('\n🔌 Checking API Routes...');

const apiRoutes = [
    'src/app/api/auth/signup/route.ts',
    'src/app/api/auth/forgot-password/route.ts',
    'src/app/api/auth/reset-password/route.ts',
    'src/app/api/security/sessions/route.ts',
    'src/app/api/account/profile/route.ts'
];

apiRoutes.forEach(route => {
    test(
        `API route exists: ${path.basename(path.dirname(route))}`,
        fs.existsSync(path.join(__dirname, route))
    );
});

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! Authentication system is properly set up.');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000/auth/signup');
    console.log('3. Create a test account');
    console.log('4. Test the authentication flow');
    console.log('\nFor detailed testing, see: AUTHENTICATION_TESTING_GUIDE.md');
} else {
    console.log('\n⚠️  Some tests failed. Please check the missing files/configurations.');
    console.log('Refer to the authentication setup documentation for help.');
}

process.exit(failed === 0 ? 0 : 1);
#!/usr/bin/env node

/**
 * Test script for AI Cold Caller
 * Verifies that all dependencies and configuration are properly set up
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🧪 AI Cold Caller - Setup Test\n');

// Test 1: Check if required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
    'package.json',
    'server.js',
    'leads.csv',
    'config/agentPrompt.txt'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// Test 2: Check environment variables
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'BASE_URL'
];

let allEnvVarsSet = true;
requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    const isSet = value && value !== `your_${envVar.toLowerCase()}_here`;
    console.log(`   ${isSet ? '✅' : '❌'} ${envVar}${isSet ? '' : ' (not configured)'}`);
    if (!isSet) allEnvVarsSet = false;
});

// Test 3: Check CSV format
console.log('\n📊 Checking CSV format...');
try {
    const csvContent = fs.readFileSync('leads.csv', 'utf8');
    const lines = csvContent.split('\n');
    const header = lines[0];
    const hasPhoneColumn = header.includes('phone');
    console.log(`   ${hasPhoneColumn ? '✅' : '❌'} CSV has 'phone' column`);
    
    const dataLines = lines.filter(line => line.trim() && !line.startsWith('phone'));
    console.log(`   ${dataLines.length > 0 ? '✅' : '❌'} CSV has ${dataLines.length} data rows`);
} catch (error) {
    console.log('   ❌ Error reading CSV file:', error.message);
}

// Test 4: Check agent prompt
console.log('\n🤖 Checking agent prompt...');
try {
    const promptContent = fs.readFileSync('config/agentPrompt.txt', 'utf8');
    const hasContent = promptContent.trim().length > 0;
    console.log(`   ${hasContent ? '✅' : '❌'} Agent prompt has content (${promptContent.length} characters)`);
} catch (error) {
    console.log('   ❌ Error reading agent prompt:', error.message);
}

// Summary
console.log('\n📋 Test Summary:');
console.log(`   Files: ${allFilesExist ? '✅ All required files present' : '❌ Missing files'}`);
console.log(`   Environment: ${allEnvVarsSet ? '✅ All variables configured' : '❌ Missing configuration'}`);

if (allFilesExist && allEnvVarsSet) {
    console.log('\n🎉 Setup test passed! You can now run:');
    console.log('   npm start');
    console.log('   curl -X POST http://localhost:3000/start');
} else {
    console.log('\n⚠️  Setup test failed. Please fix the issues above before running the application.');
    console.log('\n📝 Next steps:');
    if (!allFilesExist) {
        console.log('   - Ensure all required files are present');
    }
    if (!allEnvVarsSet) {
        console.log('   - Copy env.example to .env and configure your credentials');
    }
}

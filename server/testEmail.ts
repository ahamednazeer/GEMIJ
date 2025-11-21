#!/usr/bin/env node

/**
 * Quick Test Email Script
 * 
 * Usage:
 *   npm run test-email <recipient@email.com>
 *   npm run test-email <recipient@email.com> "Custom Subject" "Custom Message"
 */

import { sendTestEmail } from './src/utils/sendTestEmail';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📧 GEMIJ Test Email Utility');
    console.log('');
    console.log('Usage:');
    console.log('  npm run test-email <recipient-email>');
    console.log('  npm run test-email <recipient-email> "Subject" "Message"');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test-email user@example.com');
    console.log('  npm run test-email user@example.com "Hello" "This is a test"');
    console.log('');
    process.exit(1);
}

const [to, subject, message] = args;

console.log('📧 Sending test email...');
console.log(`   To: ${to}`);
console.log(`   From: mail@ahamednazeer.qzz.io`);
console.log('');

sendTestEmail({
    to,
    subject,
    text: message,
    html: message ? `<p>${message}</p>` : undefined
})
    .then(() => {
        console.log('');
        console.log('✨ Success! Email sent.');
        process.exit(0);
    })
    .catch((error) => {
        console.log('');
        console.error('💥 Failed:', error.message);
        process.exit(1);
    });

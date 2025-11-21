
import { EmailService } from './src/services/emailService';
import dotenv from 'dotenv';

dotenv.config();

async function testReviewThankYou() {
    try {
        console.log('Testing review_thank_you email template...');

        await EmailService.sendEmail({
            to: 'gemij@ahamednazeer.qzz.io', // Using the sender email as recipient for testing
            subject: 'Test: Thank You for Your Review',
            template: 'review_thank_you',
            variables: {
                reviewerName: 'Test Reviewer',
                submissionTitle: 'Test Submission Title',
                certificateUrl: 'http://localhost:3000/certificate/test',
                journalName: 'Test Journal'
            }
        });

        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Failed to send test email:', error);
        process.exit(1);
    }
}

testReviewThankYou();

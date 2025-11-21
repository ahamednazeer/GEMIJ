import sgMail from '@sendgrid/mail';

// SendGrid API Key
const SENDGRID_API_KEY = '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';
const FROM_EMAIL = 'gemij@ahamednazeer.qzz.io';

sgMail.setApiKey(SENDGRID_API_KEY);

interface TestEmailOptions {
    to: string;
    subject?: string;
    text?: string;
    html?: string;
}

export async function sendTestEmail(options: TestEmailOptions): Promise<void> {
    const {
        to,
        subject = 'Test Email from GEMIJ',
        text = 'This is a test email sent from GEMIJ Journal Management System.',
        html = '<strong>This is a test email sent from GEMIJ Journal Management System.</strong><p>If you received this, the email configuration is working correctly!</p>'
    } = options;

    const msg = {
        to,
        from: FROM_EMAIL,
        subject,
        text,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Test email sent successfully to ${to}`);
        console.log(`   From: ${FROM_EMAIL}`);
        console.log(`   Subject: ${subject}`);
    } catch (error: any) {
        console.error('❌ Error sending test email:', error);
        if (error.response) {
            console.error('   Response body:', error.response.body);
        }
        throw error;
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: ts-node sendTestEmail.ts <recipient-email> [subject] [message]');
        console.log('Example: ts-node sendTestEmail.ts user@example.com "Hello" "Test message"');
        process.exit(1);
    }

    const [to, subject, message] = args;

    sendTestEmail({
        to,
        subject,
        text: message,
        html: message ? `<p>${message}</p>` : undefined
    })
        .then(() => {
            console.log('\n✨ Email sent successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Failed to send email:', error.message);
            process.exit(1);
        });
}

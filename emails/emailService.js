const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, subject, htmlContent) => {
    const msg = {
        to: email,
        from: 'noreply@reportcycle.com',
        subject: subject,
        html: htmlContent,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully to ' + email);
    } catch (error) {
        console.error('Error sending email to ' + email, error);
        throw error; // Or handle it as per your application's error handling policy
    }
};

const sendVerificationEmail = async (username, userEmail, activationLink) => {
    // Read the template file
    const templatePath = path.join(__dirname, './verificationEmailTemplate.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
        '{{username}}': username,
        '{{companyLogoUrl}}': process.env.COMPANY_LOGO_URL,
        '{{companyName}}': process.env.COMPANY_NAME,
        '{{companyAddress}}': process.env.COMPANY_ADDRESS,
        '{{companyPhonenumber}}': process.env.COMPANY_PHONENUMBER,
        '{{currentYear}}': new Date().getFullYear(),
        '{{activationLink}}': activationLink
    };

    Object.keys(replacements).forEach(placeholder => {
        emailTemplate = emailTemplate.split(placeholder).join(replacements[placeholder]);
    });


    // Send the email
    try {
        await sendEmail(userEmail, 'Verify Your Email', emailTemplate);
        console.log('Verification email sent successfully for ' + username);
    } catch (error) {
        console.error('Error sending verification email', error);
        throw error;
    }
};

const sendResetPasswordEmail = async (userEmail, resetToken) => {
    // Read the template file
    const templatePath = path.join(__dirname, './resetPasswordEmailTemplate.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Generate the reset password link
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    // Replace the placeholder in the template
    emailTemplate = emailTemplate.replace('{{resetLink}}', resetLink);

    // Send the email
    try {
        await sendEmail(userEmail, 'Reset Your Password', emailTemplate);
        console.log('Reset password email sent successfully for ' + userEmail);
    } catch (error) {
        console.error('Error sending reset password email', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail
};
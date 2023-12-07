const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an email using SendGrid's email service.
 * 
 * @async
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject line of the email.
 * @param {string} htmlContent - The HTML content of the email.
 * @throws Will throw an error if the email fails to send.
 */
const sendEmail = async (email, subject, htmlContent) => {
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: subject,
        html: htmlContent,
    };

    try {
        await sgMail.send(msg);
        //console.log('Email sent successfully to ' + email);
    } catch (err) {
        console.error('Error sending email to ' + email, err);
        throw err; // Or handle it as per your application's error handling policy
    }
};

/**
 * Sends a verification email to a new user.
 * The email content is generated using a HTML template file.
 * 
 * @async
 * @param {string} username - The username of the user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} activationLink - The link the user needs to click to verify their email.
 * @throws Will throw an error if the email fails to send.
 */
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
        //console.log('Verification email sent successfully for ' + username);
    } catch (err) {
        console.error('Error sending verification email', err);
        throw err;
    }
};

/**
 * Sends a password reset email to a user.
 * The email content is generated using a HTML template file and includes a password reset link.
 * 
 * @async
 * @param {string} userEmail - The email address of the user.
 * @param {string} resetToken - The password reset token to be included in the reset link.
 * @throws Will throw an error if the email fails to send.
 */
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
        //console.log('Reset password email sent successfully for ' + userEmail);
    } catch (err) {
        console.error('Error sending reset password email', err);
        throw err;
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail
};
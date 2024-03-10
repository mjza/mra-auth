const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const { recordErrorLog } = require('../../routes/v1/auditLogMiddleware');

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
const sendEmail = async (req, email, subject, htmlContent) => {
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: subject,
        html: htmlContent,
    };

    try {
        if(email.endsWith('@example.com'))
            return;
        await sgMail.send(msg);
        recordErrorLog(req, { success: 'Email sent successfully to ' + email});
    } catch (err) {
        recordErrorLog(req, { error: 'Error sending email to ' + email});
        recordErrorLog(req, msg);
        recordErrorLog(req, err);
        throw err;
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
const sendVerificationEmail = async (req, username, userEmail, activationLink) => {
    // Read the template file
    const templatePath = path.join(__dirname, './verificationEmailTemplate.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
        '{{username}}': username,
        '{{companyLogoUrl}}': process.env.COMPANY_LOGO_URL,
        '{{companyName}}': process.env.COMPANY_NAME,
        '{{companyWebsite}}': process.env.COMPANY_WEBSITE,
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
        await sendEmail(req, userEmail, 'Verify Your Email', emailTemplate);
        recordErrorLog(req, { success: 'Verification email sent successfully for ' + username});
    } catch (err) {
        recordErrorLog(req, { error: 'Error sending verification email.'});
        recordErrorLog(req, err);
        throw err;
    }
};

/**
 * Sends List of usernames email to a user.
 * The email content is generated using a HTML template file.
 * 
 * @async
 * @param {array} users - The usernames associated to an email.
 * @param {string} userEmail - The email address of the user.
 * @throws Will throw an error if the email fails to send.
 */
const sendEmailWithUsernames = async (req, users, userEmail) => {
    // Read the template file
    const templatePath = path.join(__dirname, './usernamesEmailTemplate.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    let tableBody = '';

    for (let user of users) {
        tableBody += `<tr>
                        <td>${user.username}</td>
                        <td>${user.is_activated ? 'Yes' : 'No'}</td>
                        <td>${user.is_suspended ? 'Yes' : 'No'}</td>
                      </tr>`;
    }

    const replacements = {
        '{{email}}': userEmail,
        '{{tableBody}}': tableBody,
        '{{companyLogoUrl}}': process.env.COMPANY_LOGO_URL,
        '{{companyName}}': process.env.COMPANY_NAME,
        '{{companyWebsite}}': process.env.COMPANY_WEBSITE,
        '{{companyAddress}}': process.env.COMPANY_ADDRESS,
        '{{companyPhonenumber}}': process.env.COMPANY_PHONENUMBER,
        '{{currentYear}}': new Date().getFullYear()
    };

    Object.keys(replacements).forEach(placeholder => {
        emailTemplate = emailTemplate.split(placeholder).join(replacements[placeholder]);
    });


    // Send the email
    try {
        await sendEmail(req, userEmail, 'List of your accounts', emailTemplate);
        recordErrorLog(req, 'List of emails sent successfully for ' + userEmail);
    } catch (err) {
        recordErrorLog(req, { error: 'Error sending usernames email.'});
        recordErrorLog(req, err);
        throw err;
    }
};

/**
 * Sends a verification email to a new user.
 * The email content is generated using a HTML template file.
 * 
 * @async
 * @param {string} username - The username of the user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} resetPasswordLink - The link the user needs to click to verify their email.
 * @throws Will throw an error if the email fails to send.
 */
const sendResetPasswordEmail = async (req, username, userEmail, resetPasswordLink) => {
    // Read the template file
    const templatePath = path.join(__dirname, './resetPasswordEmailTemplate.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
        '{{username}}': username,
        '{{companyLogoUrl}}': process.env.COMPANY_LOGO_URL,
        '{{companyName}}': process.env.COMPANY_NAME,
        '{{companyWebsite}}': process.env.COMPANY_WEBSITE,
        '{{companyAddress}}': process.env.COMPANY_ADDRESS,
        '{{companyPhonenumber}}': process.env.COMPANY_PHONENUMBER,
        '{{currentYear}}': new Date().getFullYear(),
        '{{resetPasswordLink}}': resetPasswordLink
    };

    Object.keys(replacements).forEach(placeholder => {
        emailTemplate = emailTemplate.split(placeholder).join(replacements[placeholder]);
    });


    // Send the email
    try {
        await sendEmail(req, userEmail, 'Reset Your password', emailTemplate);
        recordErrorLog(req, { success: 'Reset password email sent successfully for ' + username});
    } catch (err) {
        recordErrorLog(req, { error: 'Error sending reset password email.'});
        recordErrorLog(req, err);
        throw err;
    }
};

module.exports = {
    sendVerificationEmail,
    sendEmailWithUsernames,
    sendResetPasswordEmail
};
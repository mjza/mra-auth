import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
import { join } from 'path';
import { updateEventLog } from '../../utils/logger.mjs';

/**
 * Sends an email using SendGrid's email service.
 * 
 * @async
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject line of the email.
 * @param {string} htmlContent - The HTML content of the email.
 * @throws Will throw an error if the email fails to send.
 */
const _sendEmail = async (req, email, subject, htmlContent) => {
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: subject,
        html: htmlContent,
    };

    try {
        if (email.endsWith('@example.com'))
            return;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send(msg);
        updateEventLog(req, { success: 'Email sent successfully to: ' + email });
    } catch (err) {
        updateEventLog(req, { error: 'Error sending email to: ' + email });
        updateEventLog(req, { info: 'The message was:', message: msg });
        updateEventLog(req, { error: 'Error in sending email.', details: err });
        throw err;
    }
};

/**
 * Sends a verification email to a new user.
 * The email content is generated using a HTML template file.
 * 
 * @async
 * @param {string} username - The username of the user.
 * @param {string} displayName - The displayName of the user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} activationLink - The link the user needs to click to verify their email.
 * @throws Will throw an error if the email fails to send.
 */
const sendVerificationEmail = async (req, username, displayName, userEmail, activationLink) => {
    // Read the template file
    const templatePath = join(process.cwd(), '/src/emails/v1/verificationEmailTemplate.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

    const replacements = {
        '{{displayName}}': displayName,
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
        await _sendEmail(req, userEmail, 'Verify Your Email', emailTemplate);
        updateEventLog(req, { success: 'Verification email sent successfully for the username: ' + username });
    } catch (err) {
        updateEventLog(req, { error: 'Error in sending verification email.', details: err });
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
    const templatePath = join(process.cwd(), '/src/emails/v1/usernamesEmailTemplate.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

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
        await _sendEmail(req, userEmail, 'List of your accounts', emailTemplate);
        updateEventLog(req, 'List of emails sent successfully for the email: ' + userEmail);
    } catch (err) {
        updateEventLog(req, { error: 'Error in sending email containing usernames.', details: err });
        throw err;
    }
};

/**
 * Sends a verification email to a new user.
 * The email content is generated using a HTML template file.
 * 
 * @async
 * @param {string} username - The username of the user.
 * @param {string} displayName - The displayName of the user.
 * @param {string} userEmail - The email address of the user.
 * @param {string} resetPasswordLink - The link the user needs to click to verify their email.
 * @throws Will throw an error if the email fails to send.
 */
const sendResetPasswordEmail = async (req, username, displayName, userEmail, resetPasswordLink) => {
    // Read the template file
    const templatePath = join(process.cwd(), '/src/emails/v1/resetPasswordEmailTemplate.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

    const replacements = {
        '{{displayName}}': displayName,
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
        await _sendEmail(req, userEmail, 'Reset Your password', emailTemplate);
        updateEventLog(req, { success: 'Reset password email sent successfully for: ' + username });
    } catch (err) {
        updateEventLog(req, { error: 'Error in sending reset password email.', details: err });
        throw err;
    }
};

export {
    sendEmailWithUsernames,
    sendResetPasswordEmail,
    sendVerificationEmail
};

import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'spiderpig60@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

export const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'spiderpig60@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    })
}

//exporting this way, allows the developer to export the entire object (which will contain the functions)
//or export single functions
export default { sendWelcomeEmail, sendGoodbyeEmail } 
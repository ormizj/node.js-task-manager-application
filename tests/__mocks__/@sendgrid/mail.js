//changing the @sendgrid/mail module to not send emails, when testing the application
export default {
    //"setApiKey" and "send()" will do nothing when testing as a result
    setApiKey() {

    }, send() {

    }
}
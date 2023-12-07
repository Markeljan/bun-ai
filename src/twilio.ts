import { Twilio } from "twilio";

const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
const twilioPhoneNumber = `${process.env.TWILIO_PHONE_NUMBER}`;
const testPhoneNumber = `${process.env.TEST_PHONE_NUMBER}`;

const client = new Twilio(accountSid, authToken);

export const sendSMS = (message: string) => {
  // DEV: does not work with async/await
  client.messages.create({
    body: message,
    // mediaUrl: ["https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg"],
    from: twilioPhoneNumber,
    to: testPhoneNumber,
  });

  return true;
};

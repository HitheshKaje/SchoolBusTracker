/**
 * Mock SMS Service for OTP delivery
 * In a real-world scenario, this would integrate with Twilio, AWS SNS, Msg91, etc.
 */
const sendSMS = async (mobile, message) => {
  console.log(`\n======================================`);
  console.log(`Mock SMS Service Invoked`);
  console.log(`To: ${mobile}`);
  console.log(`Message: ${message}`);
  console.log(`======================================\n`);
  return true; // Simulate success
};

module.exports = { sendSMS };

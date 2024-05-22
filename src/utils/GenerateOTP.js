import otpGenerator from 'otp-generator';

const GenerateOTP = async () => {
    const otp = await otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
   return otp;
}
export default GenerateOTP
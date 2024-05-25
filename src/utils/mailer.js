import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';




// https://ethereal.email/create
let nodeConfig = {
    service:"gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'taposhghosh2010@gmail.com',
        pass: 'tfen hfje vuti rdls'
    },
    connectionTimeout: 10000 // 10 seconds
}

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
    theme: "default",
    product : {
        name: "Mailgen",
        link: 'https://mailgen.js/'
    }
})


export const sendMail = async ({ userEmail, text, subject, otp }) => {
    // const { userEmail, text, subject ,otp } = req.body;

    // body of the email
    var email = {
        body : {
            name: "username",
            intro : text || 'Welcome to Daily Tuition! We\'re very excited to have you on board.',
            outro: `Your OTP is ${otp}`
        }
    }

    var emailBody = MailGenerator.generate(email);

    let message = {
        from : 	'taposhghosh2010@gmail.com',
        to: userEmail,
        subject : subject || "OTP sent Successful",
        html : emailBody
    }

    // send mail
    // transporter.sendMail(message, (err, res) => {
    //     if (err) {
    //         console.log("The error when sending email",err);
    //     } 
    //         console.log('Email sent:'+ res.messageId);
    //         console.log('Email Response is 57:',res);

    //         return res.messageId
        
    // });

    return new Promise((resolve, reject) => {
        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.error("Error sending email:", err);
                reject(err);
            } else {
                // console.log('Email sent:', info.messageId);
                // console.log('Email Response:', info);
                resolve(info);
            }
        });
    });


}
import * as nodemailer from "nodemailer";
import * as Mailgen from "mailgen";

class Email {
  private readonly emailId;
  private readonly userName;
  private readonly password;
  private readonly senderId;
  constructor(emailId, userName, password, senderId) {
    this.emailId = emailId;
    this.userName = userName;
    this.password = password;
    this.senderId = senderId;
  }

  public async sendMail(name, to, subject, body, cc, bcc, attachments) {
    let Response;
    try {
      const mailGenerator = new Mailgen({
        theme: "default",
        product: {
          name: "Team DC",
          link: "https://www.designcafe.com/",
          logo: "https://s3-ap-south-1.amazonaws.com/designcafe-dev/wp-content/uploads/2019/11/17060713/Logo.png",
        },
      });

      const email = {
        body: {
          greeting: "Dear",
          name,
          outro: body,
          signature: `Thank You!`,
        },
      };

      const transporter = nodemailer.createTransport({
        host: "email-smtp.ap-south-1.amazonaws.com",
        port: 465,
        secure: true,
        auth: {
          user: this.userName,
          pass: this.password,
        },
      });

      // setup email data with unicode symbols
      const mailOptions = {
        from: `"${this.senderId}" <${this.emailId}>`, // sender address
        to,
        cc,
        subject,
        text: mailGenerator.generatePlaintext(email),
        html: body,
        attachments: attachments,
      };

      await transporter.sendMail(mailOptions);
      Response = { code: 200, message: "success" };
    } catch (error) {
      console.error("Unable to send Email error", error);
    }
    return Response;
  }
}

export default Email;

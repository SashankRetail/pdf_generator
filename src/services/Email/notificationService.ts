import EmailService from "./email";

class NotificationService {
  public emailService;
  constructor() {
    this.emailService = new EmailService(
      process.env.adminEmailId,
      process.env.emailUserName,
      process.env.emailPassword,
      process.env.emailSenderId
    );
  }

  async sendEmail(name, email, title, body, cc, bcc, attachments) {
    try {
      return this.emailService.sendMail(
        name,
        email,
        title,
        body,
        cc,
        bcc,
        attachments
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default NotificationService;

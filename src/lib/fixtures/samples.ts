export type SampleRisk = "HIGH" | "MEDIUM" | "LOW";

export interface SampleMessage {
  id: string;
  title: string;
  text: string;
  expectedRisk: SampleRisk;
}

export const samples: SampleMessage[] = [
  {
    id: "high-bank-verification",
    title: "Fake bank verification",
    text: "URGENT: Your First National Bank account has been temporarily locked due to suspicious activity. Verify your identity within 24 hours at http://fnb-secure-verify.com/login or your account will be permanently closed. Enter your card number, PIN and OTP to restore access.",
    expectedRisk: "HIGH",
  },
  {
    id: "high-package-fee",
    title: "Package delivery fee",
    text: "USPS: Your parcel #US9384726150 is on hold. A customs fee of $2.99 is required before delivery. Pay now at https://usps-redelivery-fee.top/pay within 12 hours or the package will be returned to sender.",
    expectedRisk: "HIGH",
  },
  {
    id: "medium-lottery-win",
    title: "Lottery winner",
    text: "Congratulations! Your mobile number was randomly selected in the 2026 International Mobile Lottery and you have won $50,000 USD. To claim your prize, send your full name, address and a processing fee of $150 to our claims agent on WhatsApp at +44 7000 000000.",
    expectedRisk: "MEDIUM",
  },
  {
    id: "medium-account-update",
    title: "Vague account update",
    text: "Hi, this is IT support. We are migrating all staff mailboxes this week. Please reply with your current username and password so we can confirm your account before the migration window closes. Thanks.",
    expectedRisk: "MEDIUM",
  },
  {
    id: "low-campus-announcement",
    title: "Campus announcement",
    text: "Dear students, the library will extend its opening hours to 11 PM during the exam period (Nov 10 - Nov 24). Study rooms can be booked through the student portal. Good luck with your finals!",
    expectedRisk: "LOW",
  },
  {
    id: "low-group-chat",
    title: "Study group chat",
    text: "Hey everyone, we are ordering pizza for the study session at 7pm in the common room. Reply with your topping preference by 5pm. Vegetarian options are available. Bring your notes for the algorithms review!",
    expectedRisk: "LOW",
  },
  {
    id: "demo-local-phishing",
    title: "Browser demo: fake bank",
    text: "URGENT: Your Nusa Bank account has been locked. Verify your identity within 24 hours at /demo/phishing-bank or your account will be permanently closed. Enter your card number, PIN and OTP to restore access.",
    expectedRisk: "HIGH",
  },
  {
    id: "demo-local-legit",
    title: "Browser demo: safe page",
    text: "Dear students, the library will extend its opening hours to 11 PM during the exam period (Nov 10 - Nov 24). Details: /demo/legit-announcement. No account details are required for this announcement.",
    expectedRisk: "LOW",
  },
];

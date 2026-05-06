require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const DEFAULT_RULES = [
  { activity_type: 'form_fill', points: 15 },
  { activity_type: 'app_open', points: 5 },
  { activity_type: 'module_viewed', points: 8 },
  { activity_type: 'webinar_attended', points: 20 },
  { activity_type: 'payment_initiated', points: 25 },
  { activity_type: 'email_opened', points: 3 },
  { activity_type: 'whatsapp_replied', points: 10 },
];

async function seedDefaultScoreRules(institution_id) {
  for (const rule of DEFAULT_RULES) {
    await prisma.scoreRule.upsert({
      where: { institution_id_activity_type: { institution_id, activity_type: rule.activity_type } },
      update: {},
      create: { institution_id, activity_type: rule.activity_type, points: rule.points },
    });
  }
}

const NAMES = ['Arjun Sharma','Priya Nair','Rahul Gupta','Sneha Reddy','Vikram Patel','Ananya Singh','Karan Mehta','Divya Krishnan','Rohan Joshi','Meera Iyer','Aditya Kumar','Pooja Verma','Siddharth Roy','Kavya Rao','Nikhil Bose','Tanvi Shah','Akash Mishra','Ritu Pandey','Vivek Tiwari','Shreya Das','Amit Verma','Sunita Agarwal','Ravi Shankar','Lakshmi Menon','Suresh Babu','Deepika Pillai','Rajesh Kumar','Geeta Joshi','Pawan Singh','Swati Gupta'];
const PHONES = ['9810012345','9920123456','9830234567','9840345678','9850456789','9860567890','9870678901','9880789012','9890890123','9900901234','9911012345','9922123456','9933234567','9944345678','9955456789','9966567890','9977678901','9988789012','9999890123','9000901234','9811111111','9822222222','9833333333','9844444444','9855555555','9866666666','9877777777','9888888888','9899999999','9800000001'];
const COURSES = ['MBA','B.Tech','BBA','B.Sc Nursing','LLB','B.Com','MCA','M.Tech'];
const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad'];
const SOURCES = ['FACEBOOK','GOOGLE','WEBSITE','REFERRAL','WALK_IN','OTHER'];
const STATUSES_HOT = ['QUALIFIED','ENROLLED'];
const STATUSES_WARM = ['APPLIED','CONTACTED'];
const STATUSES_COLD = ['NEW','CONTACTED','LOST'];

async function main() {
  console.log('🌱 Seeding EduCRM database...');

  // Cleanup (FK-safe order)
  await prisma.document.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.applicantPortalUser.deleteMany();
  await prisma.paymentReminder?.deleteMany().catch(() => {});
  await prisma.payment.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.whatsappTemplate.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.scoreRule.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.usageMetric.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  // Plans
  const starter = await prisma.subscriptionPlan.create({ data: { name: 'STARTER', price_monthly: 2499, max_leads: 1000, max_users: 3, max_campaigns_per_month: 5, has_whatsapp: false, has_payments: false, has_white_label: false, has_applicant_portal: false } });
  const pro = await prisma.subscriptionPlan.create({ data: { name: 'PRO', price_monthly: 6999, max_leads: 10000, max_users: 15, max_campaigns_per_month: 50, has_whatsapp: true, has_payments: true, has_white_label: false, has_applicant_portal: false } });
  const enterprise = await prisma.subscriptionPlan.create({ data: { name: 'ENTERPRISE', price_monthly: 18999, max_leads: -1, max_users: -1, max_campaigns_per_month: -1, has_whatsapp: true, has_payments: true, has_white_label: true, has_applicant_portal: true } });
  console.log('✅ Plans: STARTER / PRO / ENTERPRISE');

  // Institution
  const inst = await prisma.institution.create({ data: { name: 'Demo University', subdomain: 'demo', plan_id: pro.id, api_key: 'demo-api-key-edu-2024', primary_color: '#1B2B4B' } });
  await prisma.subscription.create({ data: { institution_id: inst.id, plan_id: pro.id, status: 'ACTIVE', expires_at: new Date(Date.now() + 365 * 86400000) } });
  console.log('✅ Institution: Demo University (PRO plan)');

  // Users
  const hash = await bcrypt.hash('Demo@1234', 12);
  const admin = await prisma.user.create({ data: { institution_id: inst.id, name: 'Dr. Rajesh Kumar', email: 'admin@demo.com', password_hash: hash, role: 'ADMIN' } });
  const manager = await prisma.user.create({ data: { institution_id: inst.id, name: 'Sunita Agarwal', email: 'manager@demo.com', password_hash: hash, role: 'MANAGER' } });
  const c1 = await prisma.user.create({ data: { institution_id: inst.id, name: 'Amit Verma', email: 'counsellor@demo.com', password_hash: hash, role: 'COUNSELLOR' } });
  const c2 = await prisma.user.create({ data: { institution_id: inst.id, name: 'Neha Sharma', email: 'c2@demo.com', password_hash: hash, role: 'COUNSELLOR' } });
  console.log('✅ Users: admin / manager / counsellor / c2 (Demo@1234)');

  // Score rules
  await seedDefaultScoreRules(inst.id);
  console.log('✅ 7 score rules seeded');

  // Leads
  const leads = [];
  const now = new Date();
  const assignees = [c1.id, c2.id, null];

  for (let i = 0; i < 30; i++) {
    const isHot = i < 10;
    const isWarm = i >= 10 && i < 20;
    const score = isHot ? 85 + Math.floor(Math.random() * 30) : isWarm ? 40 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 38);
    const status = isHot ? STATUSES_HOT[i % 2] : isWarm ? STATUSES_WARM[i % 2] : STATUSES_COLD[i % 3];
    const label = score > 80 ? 'HOT' : score > 50 ? 'WARM' : 'COLD';
    const daysAgo = Math.floor(Math.random() * 30);
    const lastActivity = new Date(now.getTime() - daysAgo * 86400000);

    const lead = await prisma.lead.create({
      data: {
        institution_id: inst.id,
        assigned_to: assignees[i % 3],
        name: NAMES[i],
        email: `${NAMES[i].split(' ')[0].toLowerCase()}@test.com`,
        phone: PHONES[i],
        city: CITIES[i % CITIES.length],
        course_interested: COURSES[i % COURSES.length],
        source: SOURCES[i % SOURCES.length],
        status,
        activity_score: score,
        score_label: label,
        last_activity_at: lastActivity,
        created_at: new Date(now.getTime() - (30 - i) * 86400000),
      },
    });
    leads.push(lead);

    // Activity logs for hot leads
    if (isHot) {
      await prisma.activityLog.create({ data: { lead_id: lead.id, activity_type: 'webinar_attended', points_added: 20, description: 'Attended MBA info webinar (+20pts)' } });
      await prisma.activityLog.create({ data: { lead_id: lead.id, activity_type: 'form_fill', points_added: 15, description: 'Filled application form (+15pts)' } });
    }
  }
  console.log('✅ 30 leads (10 HOT, 10 WARM, 10 COLD)');

  // Email templates
  const emailTpl1 = await prisma.emailTemplate.create({ data: { institution_id: inst.id, name: 'Welcome Email', subject: 'Welcome to Demo University, {first_name}!', html_body: '<h2>Hi {first_name},</h2><p>Thank you for your interest in <strong>{course_name}</strong>.</p><p>Our counsellor will contact you within 24 hours.</p><br/><p>Demo University Admissions Team</p>' } });
  await prisma.emailTemplate.create({ data: { institution_id: inst.id, name: 'Follow-Up Email', subject: 'Still interested in {course_name}?', html_body: '<h2>Hi {first_name},</h2><p>We noticed you haven\'t completed your application for <strong>{course_name}</strong>.</p><p>Don\'t miss out — seats are filling fast!</p><br/><p>Reply to this email or call us to know more.</p>' } });
  console.log('✅ 2 email templates');

  // WhatsApp templates
  const waTpl1 = await prisma.whatsappTemplate.create({ data: { institution_id: inst.id, name: 'Inquiry Response', message_body: 'Hi {first_name}! 👋 Thank you for your interest in {course_name} at Demo University. Our counsellor will call you within 24 hours. Reply STOP to opt out.', variables: JSON.stringify(['first_name', 'course_name']) } });
  await prisma.whatsappTemplate.create({ data: { institution_id: inst.id, name: 'Payment Reminder', message_body: 'Hi {first_name}! 💳 Your {payment_type} payment of ₹{amount} is due on {due_date}. Pay now: {payment_link}. Reply HELP for assistance.', variables: JSON.stringify(['first_name', 'payment_type', 'amount', 'due_date', 'payment_link']) } });
  console.log('✅ 2 WhatsApp templates');

  // Workflow
  await prisma.workflow.create({ data: { institution_id: inst.id, name: 'New Lead Welcome', trigger_event: 'lead.created', trigger_conditions: JSON.stringify({}), steps: JSON.stringify([{ type: 'send_whatsapp', template_id: waTpl1.id, delay_minutes: 5 }]), is_active: true } });
  console.log('✅ 1 workflow');

  // Tasks (mix of overdue/today/upcoming)
  const taskDue = [
    new Date(now.getTime() - 2 * 86400000),  // overdue
    new Date(now.getTime() - 86400000),        // overdue
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0), // today
    new Date(now.getTime() + 86400000),        // upcoming
    new Date(now.getTime() + 3 * 86400000),    // upcoming
  ];
  for (let i = 0; i < 5; i++) {
    await prisma.task.create({ data: { lead_id: leads[i].id, assigned_to: c1.id, title: `Follow up with ${leads[i].name} about ${leads[i].course_interested}`, due_at: taskDue[i] } });
  }
  console.log('✅ 5 tasks (2 overdue, 1 today, 2 upcoming)');

  // Payments
  await prisma.payment.create({ data: { institution_id: inst.id, lead_id: leads[0].id, amount: 50000, payment_type: 'TUITION', status: 'PAID', payment_link: 'http://localhost:5001/pay/mock1', paid_at: new Date(now.getTime() - 5 * 86400000) } });
  await prisma.payment.create({ data: { institution_id: inst.id, lead_id: leads[1].id, amount: 15000, payment_type: 'REGISTRATION', status: 'PENDING', payment_link: 'http://localhost:5001/pay/mock2', due_date: new Date(now.getTime() + 7 * 86400000) } });
  await prisma.payment.create({ data: { institution_id: inst.id, lead_id: leads[2].id, amount: 25000, payment_type: 'INSTALMENT', status: 'PENDING', payment_link: 'http://localhost:5001/pay/mock3', due_date: new Date(now.getTime() - 3 * 86400000) } });
  console.log('✅ 3 payments (1 paid, 1 pending, 1 overdue)');

  // Usage metric
  const month = now.toISOString().slice(0, 7);
  await prisma.usageMetric.create({ data: { institution_id: inst.id, month, leads_created: 30, campaigns_sent: 2, users_active: 4 } });

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login credentials (password: Demo@1234 for all):');
  console.log('   Admin:      admin@demo.com');
  console.log('   Manager:    manager@demo.com');
  console.log('   Counsellor: counsellor@demo.com');
  console.log('   Counsellor: c2@demo.com');
  console.log('\n🔑 Webhook API key: demo-api-key-edu-2024');
  console.log('\n📱 Super Admin: superadmin@educrm.com / SuperAdmin@123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
module.exports = { seedDefaultScoreRules };

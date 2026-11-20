// AI Contract Analyzer (SRS §14) — demo data.
//
// The analyses below are pre-written in exactly the shape the real analyzer will
// return, so a Cloudflare Worker can replace `analyzeContract` in src/api/analyzer.ts
// without touching the UI. Contract texts are adapted from the earlier Replit build;
// all companies and people are fictional.
//
// Legal references are a best effort for a demo and must be checked by a Jordanian
// labour lawyer before any real use.

export interface L {
  en: string;
  ar: string;
}

export type Severity = 'critical' | 'high' | 'medium';
export type Risk = 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  severity: Severity;
  clause: string; // e.g. "1" — the clause number in the contract
  title: L;
  problem: L;
  law: L;
  right: L;
}

export interface Analysis {
  isContract?: boolean; // false when an uploaded document is not an employment contract
  risk: Risk;
  riskScore: number; // 0–100, higher = riskier for the worker
  summary: L;
  verdict: L;
  violations: Finding[];
  positives: { title: L; detail: L }[];
  questions: L[];
}

export interface SampleContract {
  id: string;
  employerId: string;
  employeeId?: string; // set when this is a specific worker's contract on file
  title: L;
  text: string;
  analysis: Analysis;
}

const PETRA = `EMPLOYMENT CONTRACT

Employer: Petra Steel Works, Commercial Registration No. 200145, Zarqa, Jordan.
Employee: Mahmoud Saeed, National ID 9861234501.
Position: Machine Operator, Production Department.
Contract Type: Full-time, fixed term from 1 March 2024 to 28 February 2027.

1. WORKING HOURS
The Employee shall work 9 hours per day, 6 days per week, totalling 54 hours per week, Saturday through Thursday. Hours beyond 48 per week are considered part of the standard role and carry no additional compensation.

2. REMUNERATION
The Employee shall receive a monthly gross salary of 320 JD, paid within the first 10 working days of the following month. The company may delay salary payment by up to 30 additional days in cases of financial hardship without prior notice.

3. SOCIAL SECURITY
The Employee is responsible for arranging their own social security enrolment. The Employer shall bear no obligation to initiate enrolment.

4. ANNUAL LEAVE
The Employee is entitled to 10 days of paid annual leave per year. Leave cannot be carried forward under any circumstances.

5. OVERTIME
Work beyond standard hours is paid at the regular hourly rate. Overtime is mandatory on request and refusal may result in disciplinary action.

6. HEALTH INSURANCE
The Employer may, at its sole discretion, provide health insurance. Coverage may be withdrawn at any time without notice.

7. TERMINATION
Either party may terminate this contract with 7 days written notice.

8. NON-COMPETE
The Employee shall not work for any steel or metal manufacturer in Jordan for 3 years after this contract ends.

9. CONFIDENTIALITY
Production methods and client information are confidential.

Signed for Petra Steel Works: _______________  Date: 1 March 2024
Employee: _______________  Date: 1 March 2024`;

const KARAK = `PART-TIME CONSULTANCY AGREEMENT

Employer: Al-Karak Medical Center, Commercial Registration No. 200856, Karak, Jordan.
Consultant: Noor Haddad, National ID 9910000131.
Role: IT Systems Consultant.
Contract Type: Part-time, fixed term — renewable annually. Start date: 15 July 2025.

1. SCOPE OF WORK
The Consultant shall provide IT support for 20 hours per week on a fixed weekly schedule set by the Employer, at the Employer's premises, under the supervision of the Administration Manager.

2. COMPENSATION
A monthly retainer of 400 JD, paid by the 5th of the following month. No benefits, insurance or allowances are included.

3. SOCIAL SECURITY AND TAXES
As a part-time consultant, the Consultant is not enrolled in social security by the Employer and bears full responsibility for any government contributions.

4. LEAVE
No paid leave applies under this agreement. Unpaid breaks may be taken by mutual agreement.

5. INTELLECTUAL PROPERTY
All software, scripts and documentation produced during the engagement belong to Al-Karak Medical Center.

6. TERMINATION
Either party may terminate this agreement with 14 days written notice.

7. CONFIDENTIALITY
Patient data and clinic systems must be kept strictly confidential.

Signed: Al-Karak Medical Center _______________  Date: 15 July 2025
Consultant: _______________  Date: 15 July 2025`;

const MADABA = `FIXED-TERM EMPLOYMENT CONTRACT

Employer: Madaba Builders Co., Commercial Registration No. 200902, Madaba, Jordan.
Employee: Kamal Hussein, Work Permit No. WP1100227.
Position: Site Labourer.
Duration: 12 months, from 1 February 2026 to 31 January 2027.

1. WORKING HOURS
The Employee shall work 10 hours per day, 6 days per week, starting at 6:30 AM. No overtime is paid because extended hours are part of construction work.

2. SALARY
Monthly gross salary of 380 JD, paid in cash on the last day of each month. The company may deduct any amount for equipment damage or safety violations.

3. SOCIAL SECURITY
The Employer will register the Employee with the Social Security Corporation within 60 days of the start date, subject to project budget.

4. SAFETY
The Employee must source their own personal protective equipment (PPE). The company reimburses up to 15 JD per month on presentation of receipts.

5. ACCOMMODATION
Site accommodation is available. 50 JD per month is deducted from salary for accommodation.

6. LEAVE
7 days of unpaid leave per contract year. No paid annual leave applies to fixed-term workers.

7. TERMINATION
The Employer may end this contract immediately and without notice if project requirements change or the Employee is considered unsatisfactory.

Signed: Madaba Builders Co. _______________  Date: 1 February 2026
Employee: _______________  Date: 1 February 2026`;

const DEADSEA = `EMPLOYMENT CONTRACT

Employer: Dead Sea Hospitality Group, Commercial Registration No. 200311, Balqa, Jordan.
Employee: Rula Odeh, National ID 9920000415.
Position: Front Desk Agent.
Contract Type: Full-time, indefinite. Start date: 1 June 2025. Probation: 3 months.

1. WORKING HOURS
8 hours per day, 6 days per week (48 hours), with a 1-hour paid break. One full rest day per week on a rotating schedule.

2. OVERTIME
Overtime only with the Employee's consent, paid at 125% of the hourly wage, and 150% on the weekly rest day and official holidays.

3. SALARY
Monthly gross salary of 450 JD, paid by bank transfer no later than the 5th of the following month. Payslips are issued monthly.

4. SOCIAL SECURITY
The Employer registers the Employee with the Social Security Corporation from the first day of work and pays the employer's contribution.

5. LEAVE
14 days of paid annual leave per year, rising to 21 days after 5 years of service. 14 days of paid sick leave per year with a medical report. Maternity leave as provided by law.

6. HEALTH INSURANCE
The Employee is covered by the company's group health insurance from the first day of work.

7. TERMINATION
After probation, either party may end this contract with one month's written notice. Dismissal without notice only in the cases listed in Article 28 of the Labour Law.

8. LANGUAGE
This contract is issued in Arabic and English; the Arabic text prevails. Each party receives a signed copy.

Signed: Dead Sea Hospitality Group _______________  Date: 1 June 2025
Employee: _______________  Date: 1 June 2025`;

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'ctr-petra',
    employerId: 'emp-1',
    employeeId: 'ee-demo',
    title: { en: 'Machine Operator — Petra Steel Works', ar: 'مشغّل آلات — مصانع البتراء للحديد' },
    text: PETRA,
    analysis: {
      risk: 'critical',
      riskScore: 86,
      summary: {
        en: 'A three-year fixed-term contract for a machine operator at 320 JD a month. Several clauses take away rights the law gives every worker, including paid overtime, social security and fair notice.',
        ar: 'عقد محدد المدة لثلاث سنوات لمشغّل آلات براتب 320 ديناراً شهرياً. عدة بنود تسلب حقوقاً يمنحها القانون لكل عامل، منها أجر العمل الإضافي والضمان الاجتماعي ومدة الإشعار العادلة.',
      },
      verdict: {
        en: 'This contract is dangerous for you: at least six clauses conflict with Jordanian law. Those clauses are not valid against you, even though you signed them.',
        ar: 'هذا العقد خطير عليك: ستة بنود على الأقل تخالف القانون الأردني. هذه البنود لا تسري بحقك حتى لو وقّعت عليها.',
      },
      violations: [
        {
          severity: 'critical', clause: '3',
          title: { en: 'You are made responsible for your own social security', ar: 'تحميلك مسؤولية تسجيل نفسك في الضمان' },
          problem: { en: 'The contract says you must arrange your own enrolment. The law puts this duty on the employer, from your first day of work.', ar: 'ينص العقد على أن تسجّل نفسك بنفسك. القانون يضع هذا الواجب على صاحب العمل منذ أول يوم عمل.' },
          law: { en: 'Social Security Law No. 1 of 2014 — mandatory enrolment by the employer', ar: 'قانون الضمان الاجتماعي رقم 1 لسنة 2014 — إلزامية التسجيل على صاحب العمل' },
          right: { en: 'Your employer must register you and pay its share of contributions. You can check your status in the SSC app.', ar: 'يجب على صاحب العمل تسجيلك ودفع حصته من الاشتراكات. يمكنك التحقق من وضعك عبر تطبيق الضمان.' },
        },
        {
          severity: 'critical', clause: '1',
          title: { en: '54-hour week with 6 unpaid hours', ar: '54 ساعة أسبوعياً منها 6 ساعات بلا أجر' },
          problem: { en: 'Normal hours are capped at 8 a day and 48 a week. The contract requires 54 and says the extra 6 are unpaid.', ar: 'الحد الأقصى لساعات العمل العادية 8 ساعات يومياً و48 أسبوعياً. العقد يفرض 54 ساعة ويعتبر الساعات الست الإضافية بلا أجر.' },
          law: { en: 'Labour Law No. 8 of 1996, Art. 56 (working hours)', ar: 'قانون العمل رقم 8 لسنة 1996، المادة 56 (ساعات العمل)' },
          right: { en: 'Every hour over 48 a week is overtime and must be paid at the overtime rate.', ar: 'كل ساعة تزيد على 48 ساعة أسبوعياً هي عمل إضافي ويجب أن تُدفع بأجر العمل الإضافي.' },
        },
        {
          severity: 'critical', clause: '5',
          title: { en: 'Overtime is forced and paid at the normal rate', ar: 'العمل الإضافي إجباري وبالأجر العادي' },
          problem: { en: 'Overtime needs your consent and must be paid at a premium. The contract makes it mandatory and pays only the regular rate.', ar: 'العمل الإضافي يحتاج موافقتك ويجب أن يُدفع بأجر أعلى. العقد يجعله إجبارياً ويدفع الأجر العادي فقط.' },
          law: { en: 'Labour Law, Art. 59 (overtime)', ar: 'قانون العمل، المادة 59 (العمل الإضافي)' },
          right: { en: 'At least 125% of your hourly wage for overtime, and 150% on your weekly rest day or official holidays.', ar: 'ما لا يقل عن 125% من أجرك بالساعة للعمل الإضافي، و150% في يوم العطلة الأسبوعية أو العطل الرسمية.' },
        },
        {
          severity: 'high', clause: '2',
          title: { en: 'Salary can be delayed by up to 40 days', ar: 'جواز تأخير الراتب حتى 40 يوماً' },
          problem: { en: 'Wages must be paid within 7 days of falling due. The contract allows 10 working days plus a further 30 days.', ar: 'يجب دفع الأجر خلال 7 أيام من استحقاقه. العقد يسمح بعشرة أيام عمل ثم 30 يوماً إضافية.' },
          law: { en: 'Labour Law, Art. 46 (payment of wages)', ar: 'قانون العمل، المادة 46 (دفع الأجور)' },
          right: { en: 'Your salary must reach you within 7 days of the end of the month. Late payment can be reported to the Ministry.', ar: 'يجب أن يصلك راتبك خلال 7 أيام من نهاية الشهر. يمكن إبلاغ الوزارة عن التأخير.' },
        },
        {
          severity: 'high', clause: '4',
          title: { en: 'Only 10 days of annual leave', ar: '10 أيام فقط للإجازة السنوية' },
          problem: { en: 'The legal minimum is 14 paid days a year, and 21 after 5 years with the same employer.', ar: 'الحد الأدنى القانوني 14 يوماً مدفوعة سنوياً، و21 يوماً بعد 5 سنوات لدى صاحب العمل نفسه.' },
          law: { en: 'Labour Law, Art. 61 (annual leave)', ar: 'قانون العمل، المادة 61 (الإجازة السنوية)' },
          right: { en: 'At least 14 days of paid annual leave every year.', ar: '14 يوماً على الأقل إجازة سنوية مدفوعة كل عام.' },
        },
        {
          severity: 'high', clause: '7',
          title: { en: '7 days notice instead of one month', ar: 'إشعار 7 أيام بدلاً من شهر' },
          problem: { en: 'Ending a contract early requires one month of written notice, or pay in place of notice.', ar: 'إنهاء العقد يتطلب إشعاراً خطياً مدته شهر، أو أجر شهر بدلاً منه.' },
          law: { en: 'Labour Law, Art. 23 (notice of termination)', ar: 'قانون العمل، المادة 23 (الإشعار بإنهاء العقد)' },
          right: { en: 'One month of notice or one month of pay, and compensation if a fixed-term contract is ended early without cause.', ar: 'إشعار شهر أو أجر شهر، وتعويض إذا أُنهي العقد محدد المدة قبل أوانه دون سبب.' },
        },
        {
          severity: 'medium', clause: '6',
          title: { en: 'Health insurance can be withdrawn at any time', ar: 'التأمين الصحي قابل للسحب في أي وقت' },
          problem: { en: 'The employer must provide medical care for workers. Coverage that can be removed without notice does not meet that duty.', ar: 'على صاحب العمل توفير الرعاية الطبية للعاملين. تغطية يمكن سحبها دون إشعار لا تفي بهذا الواجب.' },
          law: { en: 'Labour Law, Arts. 78–79 (health and safety)', ar: 'قانون العمل، المادتان 78–79 (الصحة والسلامة)' },
          right: { en: 'Ask for health insurance to be written into the contract with a named provider.', ar: 'اطلب أن يُنص على التأمين الصحي في العقد مع اسم شركة التأمين.' },
        },
        {
          severity: 'medium', clause: '8',
          title: { en: 'Three-year ban on working in your trade', ar: 'منعك من العمل في مهنتك ثلاث سنوات' },
          problem: { en: 'A restraint of trade must be limited and reasonable. A 3-year, nationwide ban for a machine operator is very likely unenforceable.', ar: 'شرط عدم المنافسة يجب أن يكون محدوداً ومعقولاً. منع مشغّل آلات لثلاث سنوات في كل الأردن على الأغلب غير قابل للتنفيذ.' },
          law: { en: 'Jordanian Civil Law, Art. 818 (non-competition)', ar: 'القانون المدني الأردني، المادة 818 (عدم المنافسة)' },
          right: { en: 'You can usually keep working in your trade. Ask a lawyer before refusing a job because of this clause.', ar: 'يمكنك عادةً مواصلة العمل في مهنتك. استشر محامياً قبل رفض أي عمل بسبب هذا البند.' },
        },
      ],
      positives: [
        { title: { en: 'Salary above minimum wage', ar: 'راتب أعلى من الحد الأدنى' }, detail: { en: '320 JD is above the national minimum wage.', ar: '320 ديناراً أعلى من الحد الأدنى الوطني للأجور.' } },
        { title: { en: 'Clear job title and dates', ar: 'مسمى وظيفي وتواريخ واضحة' }, detail: { en: 'Your role, department and contract period are stated clearly.', ar: 'وظيفتك وقسمك ومدة العقد مذكورة بوضوح.' } },
      ],
      questions: [
        { en: 'When did you register me with Social Security, and what is my SSC number?', ar: 'متى سجّلتموني في الضمان الاجتماعي، وما رقمي لدى الضمان؟' },
        { en: 'How will my overtime hours be recorded and paid?', ar: 'كيف ستُسجَّل ساعات عملي الإضافي وتُدفع؟' },
        { en: 'Can clause 4 be changed to 14 days of annual leave?', ar: 'هل يمكن تعديل البند 4 إلى 14 يوماً إجازة سنوية؟' },
        { en: 'Which insurer covers me, and can I have the policy number in writing?', ar: 'ما شركة التأمين التي تغطيني، وهل يمكنني الحصول على رقم الوثيقة كتابياً؟' },
      ],
    },
  },
  {
    id: 'ctr-karak',
    employerId: 'emp-7',
    title: { en: 'IT Consultant (part-time) — Al-Karak Medical Center', ar: 'مستشار تقنية معلومات (دوام جزئي) — مركز الكرك الطبي' },
    text: KARAK,
    analysis: {
      risk: 'high',
      riskScore: 64,
      summary: {
        en: 'A part-time "consultancy" agreement for 20 hours a week at 400 JD a month. The work is set, supervised and done on site, which makes it employment, but the contract removes social security and all paid leave.',
        ar: 'اتفاقية "استشارية" بدوام جزئي 20 ساعة أسبوعياً براتب 400 دينار شهرياً. العمل محدد ومُشرف عليه ويتم في مقر العمل، وهذا يجعله عقد عمل، لكن العقد يلغي الضمان الاجتماعي وكل الإجازات المدفوعة.',
      },
      verdict: {
        en: 'Risky: calling you a "consultant" does not remove your rights as a worker. Social security and leave are the main problems.',
        ar: 'محفوف بالمخاطر: تسميتك "مستشاراً" لا تلغي حقوقك كعامل. الضمان الاجتماعي والإجازات هما المشكلتان الرئيسيتان.',
      },
      violations: [
        {
          severity: 'critical', clause: '3',
          title: { en: 'No social security for a part-time worker', ar: 'لا ضمان اجتماعي للعامل بدوام جزئي' },
          problem: { en: 'Part-time workers must also be enrolled. Working fewer hours does not remove the employer’s duty.', ar: 'العاملون بدوام جزئي يجب تسجيلهم أيضاً. قلة الساعات لا تلغي واجب صاحب العمل.' },
          law: { en: 'Social Security Law No. 1 of 2014 — coverage of all workers', ar: 'قانون الضمان الاجتماعي رقم 1 لسنة 2014 — شمول جميع العاملين' },
          right: { en: 'Enrolment from your first day, with contributions based on your 400 JD wage.', ar: 'التسجيل من أول يوم عمل، مع اشتراكات محسوبة على أجرك البالغ 400 دينار.' },
        },
        {
          severity: 'high', clause: '1',
          title: { en: 'Employment described as consultancy', ar: 'عقد عمل موصوف كاستشارة' },
          problem: { en: 'Fixed hours set by the employer, work on its premises and a supervising manager are signs of an employment relationship, not independent consultancy.', ar: 'الساعات الثابتة التي يحددها صاحب العمل، والعمل في مقره، ووجود مدير مشرف هي علامات علاقة عمل، لا استشارة مستقلة.' },
          law: { en: 'Labour Law, Art. 2 (definition of worker and employment contract)', ar: 'قانون العمل، المادة 2 (تعريف العامل وعقد العمل)' },
          right: { en: 'You are protected by the Labour Law as an employee, whatever the contract is called.', ar: 'أنت محمي بقانون العمل كعامل، مهما كان اسم العقد.' },
        },
        {
          severity: 'high', clause: '4',
          title: { en: 'No paid leave at all', ar: 'لا إجازات مدفوعة إطلاقاً' },
          problem: { en: 'Part-time workers keep the right to paid annual and sick leave, in proportion to the hours they work.', ar: 'العاملون بدوام جزئي يحتفظون بحق الإجازة السنوية والمرضية المدفوعة، بما يتناسب مع ساعات عملهم.' },
          law: { en: 'Labour Law, Arts. 61 and 65 (annual and sick leave)', ar: 'قانون العمل، المادتان 61 و65 (الإجازة السنوية والمرضية)' },
          right: { en: 'Paid annual and sick leave in proportion to your 20-hour week.', ar: 'إجازة سنوية ومرضية مدفوعة بما يتناسب مع أسبوع عملك البالغ 20 ساعة.' },
        },
        {
          severity: 'medium', clause: '2',
          title: { en: 'Health insurance excluded', ar: 'استبعاد التأمين الصحي' },
          problem: { en: 'The contract excludes all insurance. Work in a medical setting carries health risks the employer must cover.', ar: 'العقد يستبعد أي تأمين. العمل في بيئة طبية ينطوي على مخاطر صحية يجب أن يغطيها صاحب العمل.' },
          law: { en: 'Labour Law, Arts. 78–79 (health and safety)', ar: 'قانون العمل، المادتان 78–79 (الصحة والسلامة)' },
          right: { en: 'Ask to be added to the center’s staff health insurance.', ar: 'اطلب إضافتك إلى التأمين الصحي لموظفي المركز.' },
        },
      ],
      positives: [
        { title: { en: 'Fair pay for the hours', ar: 'أجر عادل مقابل الساعات' }, detail: { en: '400 JD for 20 hours a week is well above the minimum wage per hour.', ar: '400 دينار مقابل 20 ساعة أسبوعياً أعلى بكثير من الحد الأدنى للأجر بالساعة.' } },
        { title: { en: 'Pay date stated', ar: 'موعد الدفع محدد' }, detail: { en: 'Payment by the 5th of the month is within the legal limit.', ar: 'الدفع حتى اليوم الخامس من الشهر ضمن الحد القانوني.' } },
        { title: { en: 'Reasonable confidentiality clause', ar: 'بند سرية معقول' }, detail: { en: 'Protecting patient data is a normal and lawful requirement.', ar: 'حماية بيانات المرضى شرط طبيعي ومشروع.' } },
      ],
      questions: [
        { en: 'Will you register me with Social Security for my part-time hours?', ar: 'هل ستسجلونني في الضمان الاجتماعي عن ساعات عملي الجزئي؟' },
        { en: 'How many days of paid leave do I get for a 20-hour week?', ar: 'كم يوماً من الإجازة المدفوعة أستحق عن أسبوع عمل 20 ساعة؟' },
        { en: 'Can the agreement be renamed a part-time employment contract?', ar: 'هل يمكن تسمية الاتفاقية عقد عمل بدوام جزئي؟' },
      ],
    },
  },
  {
    id: 'ctr-madaba',
    employerId: 'emp-8',
    title: { en: 'Site Labourer — Madaba Builders Co.', ar: 'عامل موقع — شركة مأدبا للإنشاءات' },
    text: MADABA,
    analysis: {
      risk: 'critical',
      riskScore: 93,
      summary: {
        en: 'A one-year contract for a migrant site labourer: 60 hours a week, cash pay, open-ended deductions, no paid leave, and the worker buys their own safety equipment.',
        ar: 'عقد لمدة سنة لعامل موقع وافد: 60 ساعة أسبوعياً، أجر نقدي، اقتطاعات مفتوحة، لا إجازات مدفوعة، والعامل يشتري معدات السلامة بنفسه.',
      },
      verdict: {
        en: 'Dangerous: this contract breaks safety, hours, pay and leave rules at the same time. It should be reported to a Ministry inspector.',
        ar: 'خطير: هذا العقد يخالف قواعد السلامة وساعات العمل والأجور والإجازات معاً. يجب إبلاغ مفتش الوزارة عنه.',
      },
      violations: [
        {
          severity: 'critical', clause: '4',
          title: { en: 'Worker pays for their own safety equipment', ar: 'العامل يدفع ثمن معدات السلامة' },
          problem: { en: 'The employer must provide protective equipment free of charge on a construction site.', ar: 'يجب على صاحب العمل توفير معدات الوقاية مجاناً في موقع البناء.' },
          law: { en: 'Labour Law, Art. 78 (occupational safety)', ar: 'قانون العمل، المادة 78 (السلامة المهنية)' },
          right: { en: 'Helmet, boots, gloves and harness supplied by the employer at no cost to you.', ar: 'خوذة وحذاء وقفازات وحزام أمان يوفرها صاحب العمل دون أي كلفة عليك.' },
        },
        {
          severity: 'critical', clause: '1',
          title: { en: '60-hour week with no overtime pay', ar: '60 ساعة أسبوعياً بلا أجر إضافي' },
          problem: { en: '10 hours a day for 6 days is 12 hours over the legal week, all unpaid.', ar: '10 ساعات يومياً لستة أيام تعني 12 ساعة فوق الأسبوع القانوني، كلها بلا أجر.' },
          law: { en: 'Labour Law, Arts. 56 and 59 (hours and overtime)', ar: 'قانون العمل، المادتان 56 و59 (الساعات والعمل الإضافي)' },
          right: { en: 'A 48-hour week, with any extra hours paid at 125% or more.', ar: 'أسبوع عمل 48 ساعة، وأي ساعات إضافية تُدفع بنسبة 125% أو أكثر.' },
        },
        {
          severity: 'critical', clause: '3',
          title: { en: 'Social security delayed and conditional', ar: 'ضمان اجتماعي مؤجل ومشروط' },
          problem: { en: 'Enrolment "within 60 days, subject to budget" is not allowed. It must start on day one, whatever the budget.', ar: 'التسجيل "خلال 60 يوماً حسب الميزانية" غير مسموح. يجب أن يبدأ من اليوم الأول بغض النظر عن الميزانية.' },
          law: { en: 'Social Security Law No. 1 of 2014 — mandatory enrolment', ar: 'قانون الضمان الاجتماعي رقم 1 لسنة 2014 — إلزامية التسجيل' },
          right: { en: 'Coverage from your first day, including work-injury insurance on a building site.', ar: 'تغطية من أول يوم، بما فيها تأمين إصابات العمل في موقع البناء.' },
        },
        {
          severity: 'high', clause: '2',
          title: { en: 'Unlimited deductions from salary', ar: 'اقتطاعات غير محدودة من الأجر' },
          problem: { en: 'Deductions for damage are limited by law and need a proper process. "Any amount" is not allowed.', ar: 'الاقتطاع بسبب الأضرار محدود قانوناً ويحتاج إجراءً سليماً. "أي مبلغ" غير مسموح.' },
          law: { en: 'Labour Law, Art. 47 (deductions from wages)', ar: 'قانون العمل، المادة 47 (الاقتطاع من الأجور)' },
          right: { en: 'Ask for a written record of any deduction. Large or repeated deductions can be challenged.', ar: 'اطلب سجلاً مكتوباً لأي اقتطاع. يمكن الطعن في الاقتطاعات الكبيرة أو المتكررة.' },
        },
        {
          severity: 'high', clause: '6',
          title: { en: 'No paid annual leave', ar: 'لا إجازة سنوية مدفوعة' },
          problem: { en: 'Fixed-term workers have the same right to paid annual leave as permanent workers.', ar: 'للعاملين بعقود محددة المدة الحق نفسه في الإجازة السنوية المدفوعة كالعاملين الدائمين.' },
          law: { en: 'Labour Law, Art. 61 (annual leave)', ar: 'قانون العمل، المادة 61 (الإجازة السنوية)' },
          right: { en: '14 days of paid annual leave for the year.', ar: '14 يوماً إجازة سنوية مدفوعة عن السنة.' },
        },
        {
          severity: 'high', clause: '7',
          title: { en: 'Dismissal at any time without notice', ar: 'الفصل في أي وقت دون إشعار' },
          problem: { en: 'Dismissal without notice is only allowed for specific serious reasons. "Project requirements" is not one of them.', ar: 'الفصل دون إشعار مسموح فقط لأسباب جسيمة محددة. "متطلبات المشروع" ليست منها.' },
          law: { en: 'Labour Law, Art. 28 (dismissal without notice)', ar: 'قانون العمل، المادة 28 (الفصل دون إشعار)' },
          right: { en: 'Notice or pay in lieu, and compensation if the contract is ended early without a lawful reason.', ar: 'إشعار أو أجر بدله، وتعويض إذا أُنهي العقد مبكراً دون سبب مشروع.' },
        },
        {
          severity: 'medium', clause: '2',
          title: { en: 'Paid in cash with no record', ar: 'الأجر نقداً دون سجل' },
          problem: { en: 'Cash payment leaves no proof of what you were paid, which makes underpayment hard to prove.', ar: 'الدفع النقدي لا يترك دليلاً على ما تقاضيته، ما يصعّب إثبات نقص الأجر.' },
          law: { en: 'Labour Law, Art. 46 (payment of wages); Ministry wage-protection instructions', ar: 'قانون العمل، المادة 46 (دفع الأجور)؛ تعليمات الوزارة لحماية الأجور' },
          right: { en: 'Ask for payment by bank transfer or e-wallet, with a monthly payslip.', ar: 'اطلب الدفع بتحويل بنكي أو محفظة إلكترونية، مع قسيمة راتب شهرية.' },
        },
      ],
      positives: [
        { title: { en: 'Salary above minimum wage', ar: 'راتب أعلى من الحد الأدنى' }, detail: { en: '380 JD is above the national minimum, before deductions.', ar: '380 ديناراً أعلى من الحد الأدنى الوطني، قبل الاقتطاعات.' } },
        { title: { en: 'Written contract with fixed dates', ar: 'عقد مكتوب بتواريخ محددة' }, detail: { en: 'Having the terms in writing makes it easier to enforce your rights.', ar: 'وجود الشروط مكتوبة يسهّل المطالبة بحقوقك.' } },
      ],
      questions: [
        { en: 'Who provides my helmet, boots and harness, and when?', ar: 'من يوفر الخوذة والحذاء وحزام الأمان، ومتى؟' },
        { en: 'What is my Social Security number, and from which date am I covered?', ar: 'ما رقمي في الضمان الاجتماعي، ومن أي تاريخ أنا مشمول؟' },
        { en: 'Can my salary be paid by bank transfer with a payslip?', ar: 'هل يمكن دفع راتبي بتحويل بنكي مع قسيمة راتب؟' },
        { en: 'How are my working hours recorded each day?', ar: 'كيف تُسجَّل ساعات عملي كل يوم؟' },
      ],
    },
  },
  {
    id: 'ctr-deadsea',
    employerId: 'emp-2',
    title: { en: 'Front Desk Agent — Dead Sea Hospitality Group', ar: 'موظفة استقبال — مجموعة البحر الميت للضيافة' },
    text: DEADSEA,
    analysis: {
      risk: 'low',
      riskScore: 8,
      summary: {
        en: 'An indefinite full-time contract for a front desk agent at 450 JD a month, with standard hours, paid overtime, social security from day one, full leave and health insurance.',
        ar: 'عقد غير محدد المدة بدوام كامل لموظفة استقبال براتب 450 ديناراً شهرياً، بساعات عمل نظامية وأجر عمل إضافي وضمان اجتماعي من اليوم الأول وإجازات كاملة وتأمين صحي.',
      },
      verdict: {
        en: 'Fair: no clauses conflict with Jordanian labour law. This is a good example of a compliant contract.',
        ar: 'عادل: لا توجد بنود تخالف قانون العمل الأردني. هذا مثال جيد على عقد ملتزم.',
      },
      violations: [],
      positives: [
        { title: { en: 'Legal working hours and weekly rest', ar: 'ساعات عمل قانونية وعطلة أسبوعية' }, detail: { en: '48 hours a week with a full rest day.', ar: '48 ساعة أسبوعياً مع يوم عطلة كامل.' } },
        { title: { en: 'Overtime by consent at legal rates', ar: 'عمل إضافي بالموافقة وبالأجر القانوني' }, detail: { en: '125%, and 150% on rest days and holidays (Art. 59).', ar: '125%، و150% في أيام العطل (المادة 59).' } },
        { title: { en: 'Social security from day one', ar: 'ضمان اجتماعي من اليوم الأول' }, detail: { en: 'The employer registers you and pays its share.', ar: 'صاحب العمل يسجلك ويدفع حصته.' } },
        { title: { en: 'Full leave entitlements', ar: 'استحقاقات إجازة كاملة' }, detail: { en: '14 days annual (21 after 5 years), 14 days sick leave, maternity leave.', ar: '14 يوماً سنوية (21 بعد 5 سنوات)، و14 يوماً مرضية، وإجازة أمومة.' } },
        { title: { en: 'Arabic text prevails', ar: 'النص العربي هو المعتمد' }, detail: { en: 'Each party gets a signed copy, as the law requires (Art. 15).', ar: 'كل طرف يحصل على نسخة موقعة كما يشترط القانون (المادة 15).' } },
      ],
      questions: [
        { en: 'Which insurer provides the group health insurance, and does it cover family members?', ar: 'ما شركة التأمين الصحي الجماعي، وهل يشمل أفراد العائلة؟' },
        { en: 'How is the rotating rest day scheduled each month?', ar: 'كيف يُجدول يوم العطلة المتناوب كل شهر؟' },
      ],
    },
  },
];

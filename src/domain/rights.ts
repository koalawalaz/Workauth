import type { L } from './contracts';
import { MIN_WAGE_JOD } from './scoring';

// Employee rights guide (FR-EEP-06, NFR-USE-02). Plain-language summaries of
// Jordanian Labour Law No. 8 of 1996 (as amended) and Social Security Law No. 1 of 2014.
// Article references must be confirmed by a Jordanian labour lawyer before real use.

export interface Right {
  title: L;
  detail: L;
  law: L;
}

export interface RightsCategory {
  id: string;
  icon: string;
  title: L;
  rights: Right[];
}

export const RIGHTS_GUIDE: RightsCategory[] = [
  {
    id: 'ssc',
    icon: '🛡️',
    title: { en: 'Social security', ar: 'الضمان الاجتماعي' },
    rights: [
      {
        title: { en: 'Enrolment from your first day', ar: 'التسجيل من أول يوم عمل' },
        detail: { en: 'Your employer must register you with the Social Security Corporation when you start work, whether you are full-time, part-time, Jordanian or not.', ar: 'يجب على صاحب العمل تسجيلك في المؤسسة العامة للضمان الاجتماعي عند بدء العمل، سواء كنت بدوام كامل أو جزئي، أردنياً أو غير أردني.' },
        law: { en: 'Social Security Law No. 1 of 2014', ar: 'قانون الضمان الاجتماعي رقم 1 لسنة 2014' },
      },
      {
        title: { en: 'Who pays', ar: 'من يدفع' },
        detail: { en: 'Your employer pays 14.25% of your wage. Your share of 7.5% is deducted from your salary. Your employer cannot make you pay its share.', ar: 'يدفع صاحب العمل 14.25% من أجرك، وتُقتطع حصتك البالغة 7.5% من راتبك. لا يجوز لصاحب العمل تحميلك حصته.' },
        law: { en: 'Social Security Law — contribution rates', ar: 'قانون الضمان الاجتماعي — نسب الاشتراك' },
      },
      {
        title: { en: 'What it covers', ar: 'ما الذي يغطيه' },
        detail: { en: 'Retirement pension, work injuries, disability and death, maternity, and unemployment insurance.', ar: 'راتب التقاعد، وإصابات العمل، والعجز والوفاة، والأمومة، والتأمين ضد التعطل عن العمل.' },
        law: { en: 'Social Security Law — insurance types', ar: 'قانون الضمان الاجتماعي — أنواع التأمينات' },
      },
    ],
  },
  {
    id: 'pay',
    icon: '💵',
    title: { en: 'Pay', ar: 'الأجر' },
    rights: [
      {
        title: { en: `Minimum wage: ${MIN_WAGE_JOD} JOD a month`, ar: `الحد الأدنى للأجور: ${MIN_WAGE_JOD} ديناراً شهرياً` },
        detail: { en: 'Applies to workers covered by the Labour Law from 1 January 2025. Some groups, such as non-Jordanian domestic workers, have separate rules.', ar: 'يسري على العاملين المشمولين بقانون العمل منذ 1 كانون الثاني 2025. لبعض الفئات، مثل عمال المنازل غير الأردنيين، قواعد منفصلة.' },
        law: { en: 'Tripartite Labour Affairs Committee decision, 2024', ar: 'قرار اللجنة الثلاثية لشؤون العمل، 2024' },
      },
      {
        title: { en: 'Paid on time', ar: 'الدفع في موعده' },
        detail: { en: 'Your wage must be paid within 7 days of falling due — usually the end of the month.', ar: 'يجب دفع أجرك خلال 7 أيام من استحقاقه، وعادةً ما يكون ذلك في نهاية الشهر.' },
        law: { en: 'Labour Law, Art. 46', ar: 'قانون العمل، المادة 46' },
      },
      {
        title: { en: 'Limited deductions', ar: 'اقتطاعات محدودة' },
        detail: { en: 'Your employer can only deduct from your wage in cases the law allows, and within set limits.', ar: 'لا يجوز لصاحب العمل الاقتطاع من أجرك إلا في الحالات التي يسمح بها القانون وضمن حدود معينة.' },
        law: { en: 'Labour Law, Art. 47', ar: 'قانون العمل، المادة 47' },
      },
      {
        title: { en: 'Equal pay', ar: 'المساواة في الأجر' },
        detail: { en: 'Women and men doing work of equal value must receive equal pay.', ar: 'يجب أن تتقاضى النساء والرجال أجراً متساوياً عن العمل ذي القيمة المتساوية.' },
        law: { en: 'Labour Law, Art. 2 and Art. 53 (2019 amendments)', ar: 'قانون العمل، المادتان 2 و53 (تعديلات 2019)' },
      },
    ],
  },
  {
    id: 'hours',
    icon: '⏱️',
    title: { en: 'Hours and overtime', ar: 'ساعات العمل والعمل الإضافي' },
    rights: [
      {
        title: { en: '8 hours a day, 48 a week', ar: '8 ساعات يومياً، 48 أسبوعياً' },
        detail: { en: 'These are the maximum normal working hours. Breaks are not counted as working time.', ar: 'هذا هو الحد الأقصى لساعات العمل العادية. لا تُحسب فترات الاستراحة من ساعات العمل.' },
        law: { en: 'Labour Law, Art. 56', ar: 'قانون العمل، المادة 56' },
      },
      {
        title: { en: 'Overtime is paid extra', ar: 'العمل الإضافي بأجر أعلى' },
        detail: { en: 'Overtime needs your agreement and is paid at least 125% of your normal hourly wage.', ar: 'العمل الإضافي يحتاج موافقتك ويُدفع بنسبة 125% على الأقل من أجرك العادي بالساعة.' },
        law: { en: 'Labour Law, Art. 59', ar: 'قانون العمل، المادة 59' },
      },
      {
        title: { en: 'Weekly rest day', ar: 'يوم عطلة أسبوعية' },
        detail: { en: 'You get one full paid day off every week. Work on that day or an official holiday is paid at least 150%.', ar: 'لك يوم عطلة كامل مدفوع كل أسبوع. العمل في ذلك اليوم أو في العطل الرسمية يُدفع بنسبة 150% على الأقل.' },
        law: { en: 'Labour Law, Arts. 59–60', ar: 'قانون العمل، المادتان 59–60' },
      },
    ],
  },
  {
    id: 'leave',
    icon: '🌿',
    title: { en: 'Leave', ar: 'الإجازات' },
    rights: [
      {
        title: { en: 'Annual leave', ar: 'الإجازة السنوية' },
        detail: { en: '14 paid days a year, rising to 21 days after 5 years with the same employer.', ar: '14 يوماً مدفوعة سنوياً، ترتفع إلى 21 يوماً بعد 5 سنوات لدى صاحب العمل نفسه.' },
        law: { en: 'Labour Law, Art. 61', ar: 'قانون العمل، المادة 61' },
      },
      {
        title: { en: 'Sick leave', ar: 'الإجازة المرضية' },
        detail: { en: '14 paid days a year with a medical report, which can be extended if you are in hospital.', ar: '14 يوماً مدفوعة سنوياً بتقرير طبي، ويمكن تمديدها إذا كنت في المستشفى.' },
        law: { en: 'Labour Law, Art. 65', ar: 'قانون العمل، المادة 65' },
      },
      {
        title: { en: 'Maternity and paternity leave', ar: 'إجازة الأمومة والأبوة' },
        detail: { en: '10 weeks of paid maternity leave. Fathers get 3 paid days when a child is born.', ar: '10 أسابيع إجازة أمومة مدفوعة. ويحصل الآباء على 3 أيام مدفوعة عند ولادة طفل.' },
        law: { en: 'Labour Law, Arts. 66 and 70', ar: 'قانون العمل، المادتان 66 و70' },
      },
    ],
  },
  {
    id: 'safety',
    icon: '⚠️',
    title: { en: 'Safety', ar: 'السلامة' },
    rights: [
      {
        title: { en: 'Free protective equipment', ar: 'معدات وقاية مجانية' },
        detail: { en: 'Your employer must provide safety equipment and training at no cost to you.', ar: 'يجب على صاحب العمل توفير معدات السلامة والتدريب عليها دون أي كلفة عليك.' },
        law: { en: 'Labour Law, Art. 78', ar: 'قانون العمل، المادة 78' },
      },
      {
        title: { en: 'Work injuries', ar: 'إصابات العمل' },
        detail: { en: 'If you are injured at work, your treatment and compensation are covered by social security work-injury insurance.', ar: 'إذا أُصبت أثناء العمل، فإن علاجك وتعويضك مغطّيان بتأمين إصابات العمل في الضمان الاجتماعي.' },
        law: { en: 'Social Security Law — work-injury insurance', ar: 'قانون الضمان الاجتماعي — تأمين إصابات العمل' },
      },
    ],
  },
  {
    id: 'contract',
    icon: '📄',
    title: { en: 'Contract and dismissal', ar: 'العقد وإنهاء الخدمة' },
    rights: [
      {
        title: { en: 'A written contract', ar: 'عقد مكتوب' },
        detail: { en: 'Your contract should be written in Arabic, and you should get a signed copy.', ar: 'يجب أن يُكتب عقدك باللغة العربية، وأن تحصل على نسخة موقعة منه.' },
        law: { en: 'Labour Law, Art. 15', ar: 'قانون العمل، المادة 15' },
      },
      {
        title: { en: 'One month of notice', ar: 'إشعار مدته شهر' },
        detail: { en: 'Ending an open-ended contract needs one month of written notice, or one month of pay instead.', ar: 'إنهاء العقد غير محدد المدة يحتاج إشعاراً خطياً مدته شهر، أو أجر شهر بدلاً منه.' },
        law: { en: 'Labour Law, Art. 23', ar: 'قانون العمل، المادة 23' },
      },
      {
        title: { en: 'Protection from unfair dismissal', ar: 'الحماية من الفصل التعسفي' },
        detail: { en: 'You can only be dismissed without notice for serious reasons listed in the law. Unfair dismissal can bring compensation of 3 to 6 months’ wages.', ar: 'لا يجوز فصلك دون إشعار إلا لأسباب جسيمة يحددها القانون. وقد يترتب على الفصل التعسفي تعويض يعادل أجر 3 إلى 6 أشهر.' },
        law: { en: 'Labour Law, Arts. 25 and 28', ar: 'قانون العمل، المادتان 25 و28' },
      },
      {
        title: { en: 'You can report safely', ar: 'يمكنك الإبلاغ بأمان' },
        detail: { en: 'You can report a problem through Work Auth, anonymously if you want. Your employer will not see your name.', ar: 'يمكنك الإبلاغ عن مشكلة عبر Work Auth، وبشكل مجهول إن أردت. لن يرى صاحب العمل اسمك.' },
        law: { en: 'Work Auth grievance anonymity (SRS §15)', ar: 'سرية البلاغات في Work Auth' },
      },
    ],
  },
];

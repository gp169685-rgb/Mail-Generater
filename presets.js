/**
 * MailCraft AI - Professional Email Presets
 * Pre-configured realistic workplace scenarios demonstrating varied tones, purposes, and structures.
 */

export const EMAIL_PRESETS = [
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    badge: 'Scheduling',
    icon: 'calendar',
    description: 'Request a strategic sync or intro call with an executive or client',
    recipient: 'Dr. Sarah Jenkins',
    recipientRole: 'VP of Product at CloudScale Systems',
    sender: 'Alex Rivera',
    senderRole: 'Senior Solutions Architect, TechNova',
    purpose: 'Meeting Request',
    customPurpose: '',
    tone: 'polite',
    urgency: 'medium',
    detailLevel: 'standard',
    cta: 'schedule_call',
    customCta: '',
    timeframe: 'next week',
    includeBullets: true,
    keyPoints: [
      'Briefly introduce tech integration synergies between our platforms',
      'Share key findings from our preliminary benchmark tests (40% latency reduction)',
      'Propose a brief 20-minute introductory Zoom call next Tuesday or Wednesday'
    ]
  },
  {
    id: 'project-update',
    name: 'Project Status Update',
    badge: 'Operations',
    icon: 'activity',
    description: 'Keep leadership and stakeholders aligned on milestones and blockers',
    recipient: 'David Kim',
    recipientRole: 'Head of Operations & Delivery',
    sender: 'Alex Rivera',
    senderRole: 'Lead Project Manager',
    purpose: 'Project Update',
    customPurpose: '',
    tone: 'concise',
    urgency: 'medium',
    detailLevel: 'standard',
    cta: 'review_doc',
    customCta: '',
    timeframe: 'before Friday EOD',
    includeBullets: true,
    keyPoints: [
      'Sprint 14 deliverables completed ahead of schedule (98% test coverage)',
      'Security audit sign-off received from third-party auditor with zero critical issues',
      'Minor delay on staging environment deployment due to cloud quota increase request',
      'Live production rollout scheduled for Monday at 6:00 AM UTC'
    ]
  },
  {
    id: 'follow-up',
    name: 'Follow-Up on Proposal',
    badge: 'Sales & BD',
    icon: 'send',
    description: 'Courteous follow-up after submitting a proposal or contract',
    recipient: 'Elena Rostova',
    recipientRole: 'Chief Procurement Officer',
    sender: 'Alex Rivera',
    senderRole: 'Enterprise Account Executive',
    purpose: 'Follow-Up',
    customPurpose: '',
    tone: 'persuasive',
    urgency: 'medium',
    detailLevel: 'standard',
    cta: 'schedule_call',
    customCta: '',
    timeframe: 'this week',
    includeBullets: true,
    keyPoints: [
      'Following up on the enterprise software proposal sent on September 28th',
      'Noting that the early-onboarding tier discount expires at the end of the month',
      'Offering to answer any technical or legal questions regarding the SLA guarantees'
    ]
  },
  {
    id: 'interview-thank-you',
    name: 'Post-Interview Thank You',
    badge: 'Career',
    icon: 'heart',
    description: 'Express gratitude and reiterate value after an interview',
    recipient: 'Marcus Vance',
    recipientRole: 'Director of Machine Learning Engineering',
    sender: 'Alex Rivera',
    senderRole: 'Senior AI Engineer Candidate',
    purpose: 'Thank You',
    customPurpose: '',
    tone: 'formal',
    urgency: 'low',
    detailLevel: 'standard',
    cta: 'confirm_receipt',
    customCta: '',
    timeframe: 'at your convenience',
    includeBullets: false,
    keyPoints: [
      'Thank Marcus and the team for their time during today\'s technical interview',
      'Enjoyed discussing high-throughput distributed model inference and edge optimization',
      'Reiterate strong enthusiasm for joining the team and contributing to the Q4 roadmap'
    ]
  },
  {
    id: 'issue-apology',
    name: 'Issue Escalation & Apology',
    badge: 'Customer Success',
    icon: 'alert-triangle',
    description: 'Professional apology, root cause explanation, and resolution steps',
    recipient: 'Claire Montgomery',
    recipientRole: 'Managing Director, Horizon Media',
    sender: 'Alex Rivera',
    senderRole: 'Director of Customer Experience',
    purpose: 'Issue Apology',
    customPurpose: '',
    tone: 'polite',
    urgency: 'high',
    detailLevel: 'detailed',
    cta: 'schedule_call',
    customCta: '',
    timeframe: 'today',
    includeBullets: true,
    keyPoints: [
      'Sincere apology for the unexpected 45-minute service downtime experienced earlier today',
      'Root cause identified: isolated database failover latency during maintenance',
      'Full service restored with 100% data integrity verified',
      'Implementing automated circuit breakers and crediting this month\'s SLA fee'
    ]
  },
  {
    id: 'cold-outreach',
    name: 'Cold Partnership Outreach',
    badge: 'Growth',
    icon: 'sparkles',
    description: 'High-impact value proposition to initiate strategic business relationships',
    recipient: 'Thomas Sterling',
    recipientRole: 'VP of Partnerships, Apex Global',
    sender: 'Alex Rivera',
    senderRole: 'Head of Strategic Alliances',
    purpose: 'Cold Outreach',
    customPurpose: '',
    tone: 'persuasive',
    urgency: 'low',
    detailLevel: 'brief',
    cta: 'schedule_call',
    customCta: '',
    timeframe: 'next week',
    includeBullets: false,
    keyPoints: [
      'Admire Apex Global\'s recent international expansion and customer retention record',
      'TechNova has built an automated workflow integration that could unlock $300k+ ARR for mutual users',
      'Would love 10 minutes to share a customized teardown showing how this works'
    ]
  }
];

export const TONE_DEFINITIONS = {
  formal: {
    label: 'Formal & Executive',
    description: 'Polished, traditional, respectful, and authoritative. Ideal for executives, legal, or official communications.',
    icon: 'briefcase',
    badgeClass: 'badge-formal',
    formalityScore: 95,
    salutations: ['Dear', 'Dear Mr./Ms./Dr.', 'To the Attention of'],
    signOffs: ['Sincerely,', 'Respectfully,', 'With best regards,', 'Yours faithfully,']
  },
  polite: {
    label: 'Polite & Warm',
    description: 'Courteous, appreciative, empathetic, and considerate. Builds trust and maintains rapport.',
    icon: 'smile',
    badgeClass: 'badge-polite',
    formalityScore: 80,
    salutations: ['Dear', 'Good morning / afternoon', 'Hello'],
    signOffs: ['Warm regards,', 'Best regards,', 'With warm appreciation,', 'Kind regards,']
  },
  concise: {
    label: 'Concise & Direct',
    description: 'High-efficiency, bulleted, minimal fluff, action-oriented. Perfect for busy managers and fast teams.',
    icon: 'zap',
    badgeClass: 'badge-concise',
    formalityScore: 70,
    salutations: ['Hi', 'Hello', 'Good day'],
    signOffs: ['Best,', 'Thanks,', 'Regards,', 'Best regards,']
  },
  persuasive: {
    label: 'Persuasive & Value-Driven',
    description: 'Compelling, benefit-led, engaging, with a clear incentive and high-converting call to action.',
    icon: 'trending-up',
    badgeClass: 'badge-persuasive',
    formalityScore: 75,
    salutations: ['Hello', 'Dear', 'Hi'],
    signOffs: ['Looking forward to connecting,', 'Best regards,', 'Warmly,', 'Best,']
  },
  urgent: {
    label: 'Urgent & Time-Sensitive',
    description: 'Direct, prioritized, clear deadlines, and unambiguous immediate action requested.',
    icon: 'clock',
    badgeClass: 'badge-urgent',
    formalityScore: 85,
    salutations: ['Important Notice:', 'Dear', 'Hi'],
    signOffs: ['Thank you for your prompt attention,', 'Urgent regards,', 'Best regards,']
  },
  casual: {
    label: 'Casual & Friendly',
    description: 'Warm, collaborative, relaxed, and approachable. Ideal for peers, teammates, and familiar contacts.',
    icon: 'coffee',
    badgeClass: 'badge-casual',
    formalityScore: 40,
    salutations: ['Hi', 'Hey', 'Hello'],
    signOffs: ['Cheers,', 'Talk soon,', 'Thanks,', 'Best,']
  }
};

export const PURPOSE_SUGGESTIONS = {
  'Meeting Request': [
    'Propose specific meeting agenda and objectives',
    'Offer 2-3 specific time windows for convenience',
    'Include meeting format (virtual Zoom link or in-person)'
  ],
  'Project Update': [
    'Current milestone completion status',
    'Key achievements and positive outcomes',
    'Any blockers, risks, or resource requirements',
    'Next target milestone and timeline'
  ],
  'Follow-Up': [
    'Reference date and topic of previous communication',
    'Reiterate key value proposition or decision needed',
    'Inquire if additional information or clarification is needed'
  ],
  'Thank You': [
    'Express genuine gratitude for specific help or discussion',
    'Mention a specific takeaway that resonated',
    'Confirm eagerness for subsequent engagement'
  ],
  'Issue Apology': [
    'Clear and unambiguous statement of accountability',
    'Concise explanation of root cause without making excuses',
    'Actionable steps taken to fix the issue and prevent recurrence'
  ],
  'Cold Outreach': [
    'Hook referencing the recipient\'s company or achievements',
    'Clear, quantifiable value proposition or problem solved',
    'Low-friction, specific call to action'
  ],
  'Job Application': [
    'Mention specific role and reference source',
    'Highlight top 2 relevant skills or career accomplishments',
    'Express enthusiasm for team mission and express interest in interviewing'
  ],
  'Resignation Notice': [
    'Formal declaration of resignation and effective last date',
    'Expression of gratitude for opportunities and mentorship',
    'Commitment to thorough knowledge transfer and smooth handover'
  ]
};

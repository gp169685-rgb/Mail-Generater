/**
 * MailCraft AI - Intelligent Email Generation Engine
 * Synthesizes professional emails with section-level structure, multi-tone calibration,
 * dynamic subject line generation, and contextual rewriting capabilities.
 */

import { TONE_DEFINITIONS } from './presets.js';

/**
 * Format recipient name into a tailored salutation based on tone and titles
 */
export function formatSalutation(recipient, recipientRole, tone) {
  const trimmed = (recipient || '').trim();
  if (!trimmed) {
    if (tone === 'formal') return 'Dear Esteemed Colleague,';
    if (tone === 'casual') return 'Hi there,';
    return 'Dear Colleague,';
  }

  // Check if recipient has a title like Dr., Prof., etc.
  const hasHonorific = /^(dr\.|prof\.|mr\.|ms\.|mrs\.|judge|senator|director)\s+/i.test(trimmed);

  if (tone === 'formal') {
    if (hasHonorific) {
      return `Dear ${trimmed},`;
    }
    // Extract last name if multiple names
    const parts = trimmed.split(' ');
    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      return `Dear Mr./Ms. ${lastName},`;
    }
    return `Dear ${trimmed},`;
  }

  if (tone === 'polite') {
    if (hasHonorific) return `Dear ${trimmed},`;
    return `Dear ${trimmed},`;
  }

  if (tone === 'concise' || tone === 'urgent') {
    return `Hi ${trimmed},`;
  }

  if (tone === 'casual') {
    // Just first name
    const firstName = trimmed.split(' ')[0];
    return `Hey ${firstName},`;
  }

  // Persuasive / Default
  return `Hello ${trimmed},`;
}

/**
 * Format sign-off and signature block
 */
export function formatSignOff(sender, senderRole, tone) {
  const def = TONE_DEFINITIONS[tone] || TONE_DEFINITIONS.polite;
  const signOff = def.signOffs[0];
  const senderName = (sender || 'Professional Sender').trim();
  const role = (senderRole || '').trim();

  let signature = senderName;
  if (role) {
    signature += `\n${role}`;
  }

  return { signOff, signature };
}

/**
 * Generate 3 diverse subject line options
 */
export function generateSubjectOptions(purpose, customPurpose, topic, tone, urgency, timeframe) {
  const mainTopic = (topic || customPurpose || purpose || 'Strategic Update').trim();
  const isUrgent = urgency === 'high' || tone === 'urgent';
  const prefix = isUrgent ? '[Action Required] ' : '';
  const timeStr = timeframe ? ` - ${timeframe}` : '';

  let primary = '';
  let altDirect = '';
  let altEngaging = '';

  switch (purpose) {
    case 'Meeting Request':
      primary = `${prefix}Request for Brief Sync: ${mainTopic}`;
      altDirect = `Meeting Request: ${mainTopic}${timeStr}`;
      altEngaging = `Exploring Synergies: ${mainTopic} (Quick Chat)`;
      break;

    case 'Project Update':
      primary = `${prefix}Status Update: ${mainTopic}`;
      altDirect = `Project Brief & Milestone Report: ${mainTopic}`;
      altEngaging = `Progress & Next Milestones for ${mainTopic}`;
      break;

    case 'Follow-Up':
      primary = `${prefix}Following Up: ${mainTopic}`;
      altDirect = `Touchpoint regarding ${mainTopic}`;
      altEngaging = `Checking In: Next Steps for ${mainTopic}`;
      break;

    case 'Thank You':
      primary = `Thank You - ${mainTopic}`;
      altDirect = `Appreciation & Follow-Up: ${mainTopic}`;
      altEngaging = `Great connecting regarding ${mainTopic}`;
      break;

    case 'Issue Apology':
      primary = `${prefix}Important Update & Resolution: ${mainTopic}`;
      altDirect = `Notice Regarding ${mainTopic}: Root Cause & Action Plan`;
      altEngaging = `Transparency Update: Addressing ${mainTopic}`;
      break;

    case 'Cold Outreach':
      primary = `Partnership Opportunity: ${mainTopic}`;
      altDirect = `Quick idea for ${mainTopic}`;
      altEngaging = `Scaling efficiency for ${mainTopic} - Intro`;
      break;

    case 'Job Application':
      primary = `Application for ${mainTopic}`;
      altDirect = `Candidate Inquiry: ${mainTopic}`;
      altEngaging = `Enthusiastic Application for ${mainTopic}`;
      break;

    case 'Resignation Notice':
      primary = `Notice of Resignation - ${mainTopic}`;
      altDirect = `Formal Transition Notice: ${mainTopic}`;
      altEngaging = `Transition Plan & Resignation: ${mainTopic}`;
      break;

    default:
      primary = `${prefix}${mainTopic}`;
      altDirect = `Overview: ${mainTopic}${timeStr}`;
      altEngaging = `Key Points & Next Steps on ${mainTopic}`;
      break;
  }

  return {
    primary,
    options: [primary, altDirect, altEngaging]
  };
}

/**
 * Generate contextual opening paragraph
 */
export function generateOpening(recipient, recipientRole, purpose, tone, urgency) {
  const name = recipient ? recipient.split(' ')[0] : 'there';
  const roleContext = recipientRole ? ` in your capacity as ${recipientRole}` : '';

  if (tone === 'formal') {
    switch (purpose) {
      case 'Meeting Request':
        return `I am writing to formally request a brief discussion with you${roleContext} regarding our ongoing strategic priorities and upcoming collaboration opportunities.`;
      case 'Project Update':
        return `Please accept this formal status memorandum outlining our latest project milestones, operational performance metrics, and upcoming deployment schedule.`;
      case 'Follow-Up':
        return `I am writing to respectfully follow up on our previous correspondence and provide additional contextual materials for your review.`;
      case 'Thank You':
        return `I would like to convey my sincere appreciation for the generous time and valuable perspectives shared during our recent discussion.`;
      case 'Issue Apology':
        return `I am writing to directly address the recent service interruption, offer our unreserved apologies, and provide full transparency regarding the corrective measures taken.`;
      case 'Cold Outreach':
        return `I am reaching out to introduce our organization and explore mutually beneficial avenues of strategic collaboration with your esteemed team.`;
      case 'Job Application':
        return `I am submitting this communication to formally declare my candidacy and express my profound interest in joining your distinguished team.`;
      case 'Resignation Notice':
        return `Please accept this communication as formal notification that I will be stepping down from my current role, effective following the completion of my required notice period.`;
      default:
        return `I am writing to bring an important matter to your attention and provide structured details for your consideration.`;
    }
  }

  if (tone === 'polite') {
    switch (purpose) {
      case 'Meeting Request':
        return `I hope this email finds you well and that your week is going smoothly. I am reaching out to see if you might have a brief window in your schedule for an introductory conversation.`;
      case 'Project Update':
        return `I hope you are having a productive week. I wanted to share a quick, transparent update on our team's recent progress and highlights.`;
      case 'Follow-Up':
        return `I hope you are having a wonderful week. I am following up on our recent conversation to see if you had any preliminary thoughts or questions.`;
      case 'Thank You':
        return `Thank you so much for taking the time to speak with me earlier. I truly enjoyed our conversation and found your insights invaluable.`;
      case 'Issue Apology':
        return `I want to extend our sincerest apologies for the recent inconvenience experienced. We deeply value your partnership and take our commitments to you with the utmost seriousness.`;
      case 'Cold Outreach':
        return `I hope this message finds you well. I have been following your impressive work at your organization and wanted to share an idea that may add meaningful value to your current initiatives.`;
      case 'Job Application':
        return `I hope you are having a great week! I am writing to express my enthusiasm for the open role and share how my background directly aligns with your team's mission.`;
      case 'Resignation Notice':
        return `It is with mixed emotions that I am writing to inform you of my upcoming transition and resignation from my current position.`;
      default:
        return `I hope this message finds you well. I wanted to connect with you regarding a few important updates and share our proposed path forward.`;
    }
  }

  if (tone === 'concise') {
    switch (purpose) {
      case 'Meeting Request':
        return `Reaching out to schedule a brief sync regarding our upcoming deliverables. Key details outlined below:`;
      case 'Project Update':
        return `Here is a high-level executive summary of current project status, key milestones, and next steps:`;
      case 'Follow-Up':
        return `Quick check-in regarding our recent discussion. Summary of items requiring attention:`;
      case 'Thank You':
        return `Thank you for your time today. Quick recap of our discussion and immediate action items:`;
      case 'Issue Apology':
        return `Providing an immediate status update on today's incident, root cause analysis, and resolution steps:`;
      case 'Cold Outreach':
        return `Quick introduction regarding potential operational synergies between our teams:`;
      case 'Job Application':
        return `Expressing interest in the open position. Key qualifications and background summarized below:`;
      case 'Resignation Notice':
        return `Please consider this note as formal notice of my resignation, effective two weeks from today.`;
      default:
        return `Sharing a concise overview of key points and next steps for your review:`;
    }
  }

  if (tone === 'urgent') {
    switch (purpose) {
      case 'Meeting Request':
        return `We have a time-sensitive matter that requires immediate alignment. I would appreciate setting up a priority sync as soon as possible today.`;
      case 'Project Update':
        return `Please review this urgent project status report, which requires immediate stakeholder review to avoid schedule impact.`;
      case 'Follow-Up':
        return `Following up with urgency on our pending item to ensure we meet our impending deadline.`;
      case 'Issue Apology':
        return `Urgent incident report: We have identified and contained an operational issue, and request your immediate review of the mitigation steps below.`;
      default:
        return `This is a priority matter requiring prompt review and alignment on the following critical items:`;
    }
  }

  if (tone === 'persuasive') {
    switch (purpose) {
      case 'Meeting Request':
        return `Given your recent focus on accelerating growth and operational efficiency, I believe a quick 15-minute conversation could yield immediate, tangible value for your team.`;
      case 'Project Update':
        return `Our team has reached an exciting turning point, with strong momentum across key milestones that position us for an exceptional launch.`;
      case 'Follow-Up':
        return `Reconnecting to highlight how moving forward on our proposed solution will eliminate existing bottlenecks and drive immediate ROI.`;
      case 'Cold Outreach':
        return `Organizations in your space are frequently challenged by scaling efficiency. We have engineered a proven methodology that consistently drives measurable impact.`;
      case 'Job Application':
        return `I am excited to present my background and demonstrate how my track record of delivering measurable outcomes will drive immediate impact for your team.`;
      default:
        return `I am excited to share a strategic opportunity that directly supports your team's overarching objectives and long-term success.`;
    }
  }

  // Casual
  switch (purpose) {
    case 'Meeting Request':
      return `Hope you're having a great week! Wanted to see if you have a few minutes for a quick catch-up sometime soon.`;
    case 'Project Update':
      return `Hey! Just dropping in with a quick status check on where things stand with the project.`;
    case 'Follow-Up':
      return `Just circling back to see where things landed on this. Hope you've been doing well!`;
    case 'Thank You':
      return `Thanks so much for chatting with me earlier! Loved exchanging ideas and bouncing thoughts off each other.`;
    default:
      return `Hope you're doing great! Wanted to quickly touch base with you on a few things.`;
  }
}

/**
 * Generate cohesive body paragraphs weaving user key points
 */
export function generateBody(keyPoints, includeBullets, tone, detailLevel, purpose) {
  const points = (keyPoints || []).filter(p => typeof p === 'string' && p.trim().length > 0);

  if (points.length === 0) {
    return [
      `We have compiled comprehensive data regarding our ongoing initiatives and would welcome the opportunity to review these findings together at your earliest convenience.`
    ];
  }

  // If user explicitly requests bullet formatting or tone is concise
  if (includeBullets || tone === 'concise') {
    const introSentence = getBulletIntroSentence(tone, purpose);
    const formattedBullets = points.map(pt => `• ${capitalizeFirstLetter(pt.trim())}`);
    const summarySentence = getBulletSummarySentence(tone, detailLevel);

    if (summarySentence) {
      return [introSentence, formattedBullets.join('\n'), summarySentence];
    }
    return [introSentence, formattedBullets.join('\n')];
  }

  // Continuous prose narrative based on detail level
  if (detailLevel === 'brief') {
    const combined = points.map(p => cleanPointForProse(p)).join('; furthermore, ');
    return [
      `To summarize the core elements, ${combined}. Each of these items has been carefully structured to align with our shared objectives.`
    ];
  }

  if (detailLevel === 'detailed') {
    const paragraphs = [];
    // Break into pairs or individual paragraphs
    const firstHalf = points.slice(0, Math.ceil(points.length / 2));
    const secondHalf = points.slice(Math.ceil(points.length / 2));

    paragraphs.push(
      `First and foremost, ${firstHalf.map(p => cleanPointForProse(p)).join('. In addition, ')}. This establishes the necessary operational foundation for our forward trajectory.`
    );

    if (secondHalf.length > 0) {
      paragraphs.push(
        `Building upon this progress, ${secondHalf.map(p => cleanPointForProse(p)).join('. Moreover, ')}. Our team is actively monitoring each variable to maintain momentum and ensure rigorous quality standards.`
      );
    }

    return paragraphs;
  }

  // Standard prose (balanced)
  const paragraphs = [];
  const proseItems = points.map(p => cleanPointForProse(p));

  if (proseItems.length === 1) {
    paragraphs.push(`Specifically, ${proseItems[0]}. We are fully prepared to support this initiative through every phase of execution.`);
  } else if (proseItems.length === 2) {
    paragraphs.push(
      `Specifically, ${proseItems[0]}. Alongside this milestone, ${proseItems[1]}. Both items represent significant steps forward in our joint planning.`
    );
  } else {
    const lead = proseItems[0];
    const middle = proseItems.slice(1, -1).join(', as well as ');
    const end = proseItems[proseItems.length - 1];

    paragraphs.push(
      `To provide context on our current posture, ${lead}. Furthermore, we have focused on ${middle}.`
    );
    paragraphs.push(
      `Finally, ${end}. We have addressed potential dependencies to ensure smooth execution without operational bottlenecks.`
    );
  }

  return paragraphs;
}

/**
 * Generate clear Call To Action tailored to user requirements
 */
export function generateCallToAction(cta, customCta, timeframe, tone, urgency) {
  const time = timeframe ? ` ${timeframe}` : ' at your earliest convenience';

  if (cta === 'custom' && customCta) {
    return customCta.trim();
  }

  if (tone === 'formal') {
    switch (cta) {
      case 'schedule_call':
        return `Please inform me of your availability${time} so that we may schedule a dedicated conference call. I will gladly accommodate your calendar.`;
      case 'review_doc':
        return `I would be grateful if you could review the relevant documentation and provide your formal concurrence or feedback${time}.`;
      case 'confirm_receipt':
        return `I kindly ask that you acknowledge receipt of this memorandum and confirm your endorsement${time}.`;
      case 'fyi_only':
        return `This information is submitted strictly for your records. No immediate reciprocal action is required on your part.`;
      default:
        return `I welcome your guidance and look forward to receiving your response${time}.`;
    }
  }

  if (tone === 'polite') {
    switch (cta) {
      case 'schedule_call':
        return `Could you let me know if you might have 15 to 20 minutes available${time}? I would be delighted to find a time that fits effortlessly into your schedule.`;
      case 'review_doc':
        return `Whenever you have a moment, I would deeply appreciate your thoughts and review${time}. Please let me know if you would like me to clarify any details.`;
      case 'confirm_receipt':
        return `Please let me know once you have had an opportunity to review this, and do not hesitate to reach out if you have any questions!`;
      case 'fyi_only':
        return `No action is needed on your end—just wanted to make sure you were in the loop!`;
      default:
        return `I look forward to hearing your thoughts${time}. Thank you again for your continued support and collaboration.`;
    }
  }

  if (tone === 'concise' || tone === 'urgent') {
    const prefix = urgency === 'high' || tone === 'urgent' ? 'ACTION REQUIRED: ' : 'Next steps: ';
    switch (cta) {
      case 'schedule_call':
        return `${prefix}Please send over 2-3 preferred times for a 15-min sync${time}.`;
      case 'review_doc':
        return `${prefix}Kindly review and reply with your sign-off or feedback${time}.`;
      case 'confirm_receipt':
        return `${prefix}Please confirm receipt${time}.`;
      case 'fyi_only':
        return `No reply needed (FYI only).`;
      default:
        return `${prefix}Please confirm next steps${time}.`;
    }
  }

  if (tone === 'persuasive') {
    switch (cta) {
      case 'schedule_call':
        return `Are you open to a brief 15-minute chat${time}? I would love to demonstrate the direct value and ROI this approach offers your organization.`;
      case 'review_doc':
        return `I invite you to review the enclosed highlights${time}. I am confident you will find the strategic benefits immediate and compelling.`;
      default:
        return `Let us connect${time} to explore how we can turn these opportunities into measurable results for your team.`;
    }
  }

  // Casual
  switch (cta) {
    case 'schedule_call':
      return `Let me know if you're free for a quick coffee or Zoom chat${time}!`;
    case 'review_doc':
      return `Take a look whenever you get a second${time} and let me know what you think!`;
    case 'fyi_only':
      return `Just wanted to keep you in the loop—no need to reply!`;
    default:
      return `Catch you soon, and let me know your thoughts whenever you get a chance!`;
  }
}

/**
 * Main email generator orchestrator
 */
export function generateEmail(inputs) {
  const {
    recipient = '',
    recipientRole = '',
    sender = '',
    senderRole = '',
    purpose = 'Meeting Request',
    customPurpose = '',
    tone = 'polite',
    urgency = 'medium',
    detailLevel = 'standard',
    cta = 'schedule_call',
    customCta = '',
    timeframe = 'next week',
    includeBullets = true,
    keyPoints = []
  } = inputs;

  // 1. Salutation
  const salutation = formatSalutation(recipient, recipientRole, tone);

  // 2. Subject Line & Options
  const { primary: subject, options: subjectOptions } = generateSubjectOptions(
    purpose,
    customPurpose,
    inputs.topic || customPurpose || purpose,
    tone,
    urgency,
    timeframe
  );

  // 3. Opening
  const opening = generateOpening(recipient, recipientRole, purpose, tone, urgency);

  // 4. Body Paragraphs
  const bodyParagraphs = generateBody(keyPoints, includeBullets, tone, detailLevel, purpose);

  // 5. Call To Action
  const callToAction = generateCallToAction(cta, customCta, timeframe, tone, urgency);

  // 6. Sign-Off & Signature
  const { signOff, signature } = formatSignOff(sender, senderRole, tone);

  // 7. Assemble Full Text
  const bodyText = [opening, ...bodyParagraphs, callToAction].join('\n\n');
  const fullText = `${salutation}\n\n${bodyText}\n\n${signOff}\n${signature}`;

  // 8. Assemble Full HTML
  const bodyHtml = [
    `<p>${escapeHtml(opening)}</p>`,
    ...bodyParagraphs.map(p => {
      if (p.includes('•')) {
        const items = p.split('\n').filter(Boolean);
        return `<ul style="margin: 12px 0; padding-left: 20px;">${items
          .map(item => `<li>${escapeHtml(item.replace(/^•\s*/, ''))}</li>`)
          .join('')}</ul>`;
      }
      return `<p>${escapeHtml(p)}</p>`;
    }),
    `<p><strong>${escapeHtml(callToAction)}</strong></p>`
  ].join('');

  const fullHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 24px;">
  <p style="margin-bottom: 16px;">${escapeHtml(salutation)}</p>
  ${bodyHtml}
  <p style="margin-top: 24px; margin-bottom: 4px;">${escapeHtml(signOff)}</p>
  <p style="margin: 0; font-weight: 600; color: #0f172a;">${escapeHtml(signature).replace(/\n/g, '<br/>')}</p>
</div>`.trim();

  // 9. Metrics Calculation
  const words = fullText.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeSeconds = Math.max(10, Math.round((words / 200) * 60));
  const toneDef = TONE_DEFINITIONS[tone] || TONE_DEFINITIONS.polite;

  return {
    subject,
    subjectOptions,
    salutation,
    opening,
    bodyParagraphs,
    callToAction,
    signOff,
    signature,
    fullText,
    fullHtml,
    metrics: {
      words,
      readingTimeSeconds,
      formalityScore: toneDef.formalityScore,
      toneLabel: toneDef.label
    }
  };
}

/**
 * Section-level rewrite helper for interactive editing
 */
export function rewriteSection(sectionKey, modifier, currentContent, inputs) {
  const text = (currentContent || '').trim();
  if (!text) return text;

  switch (modifier) {
    case 'more_concise':
      return makeMoreConcise(text);
    case 'more_formal':
      return makeMoreFormal(text);
    case 'more_polite':
      return makeMorePolite(text);
    case 'add_bullets':
      return convertToBullets(text);
    case 'expand':
      return expandContent(text);
    default:
      return text;
  }
}

// Linguistic helpers for rewrites
function makeMoreConcise(text) {
  let res = text
    .replace(/I am writing to formally request/gi, 'Requesting')
    .replace(/I would like to take this opportunity to/gi, '')
    .replace(/at your earliest convenience/gi, 'ASAP')
    .replace(/in order to/gi, 'to')
    .replace(/due to the fact that/gi, 'because')
    .replace(/it is important to note that/gi, 'notably,')
    .replace(/please do not hesitate to/gi, 'please')
    .replace(/for the purpose of/gi, 'for')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If multi-sentence, keep core essence
  const sentences = res.split(/(?<=[.?!])\s+/);
  if (sentences.length > 2) {
    return sentences.slice(0, 2).join(' ');
  }
  return res;
}

function makeMoreFormal(text) {
  return text
    .replace(/\bhey\b/gi, 'Dear')
    .replace(/\bhi\b/gi, 'Greetings')
    .replace(/\bthanks\b/gi, 'Thank you kindly')
    .replace(/\bquick chat\b/gi, 'brief consultation')
    .replace(/\bcopied you on\b/gi, 'apprised you of')
    .replace(/\blook forward to\b/gi, 'await your esteemed feedback regarding')
    .replace(/\bgreat\b/gi, 'exceptional')
    .replace(/\bhelp\b/gi, 'assistance');
}

function makeMorePolite(text) {
  if (/^please/i.test(text)) {
    return `If your schedule permits, ${text.toLowerCase()}`;
  }
  return `I would be sincerely grateful if you could ${text.replace(/^[A-Z]/, c => c.toLowerCase())}`;
}

function convertToBullets(text) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return `• ${text}`;
  }
  return sentences.map(s => `• ${s}`).join('\n');
}

function expandContent(text) {
  return `${text} We have thoroughly validated each underlying factor to ensure seamless operational continuity and alignment with our shared strategic goals.`;
}

function cleanPointForProse(p) {
  return p
    .trim()
    .replace(/^•\s*/, '')
    .replace(/^[-*]\s*/, '')
    .replace(/\.$/, '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getBulletIntroSentence(tone, purpose) {
  if (tone === 'formal') return 'Please note the salient points detailed below:';
  if (tone === 'concise') return 'Key overview:';
  if (tone === 'persuasive') return 'Here are the core high-impact value items:';
  if (tone === 'casual') return 'Here is the quick breakdown:';
  return 'Here are the key points to highlight:';
}

function getBulletSummarySentence(tone, detailLevel) {
  if (detailLevel === 'brief') return '';
  if (tone === 'formal') return 'All preceding items have been structured to ensure compliance and strategic synchronization.';
  if (tone === 'concise') return '';
  return 'Each of these areas is fully prepared for your input and review.';
}

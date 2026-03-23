const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || ''; // #office-only

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      firstName, lastName, email, phone, address, city, zip,
      sqft, lotSize, propertyType, plan, pests, addons,
      preferredDate, preferredTime, billing, partial,
      rodentInspection, customQuote, specialties, followups,
      confirmPreference, paymentPreference,
      callbackRequested, callbackDay, callbackTime
    } = req.body;

    const TOKEN = (process.env.GHL_API_TOKEN || '').trim();
    const LOCATION_ID = (process.env.GHL_LOCATION_ID || '').trim();
    const PIPELINE_ID = (process.env.GHL_PIPELINE_ID || '').trim();
    const STAGE_BOOKED = '2cbb6069-92e9-4b16-9278-424ab97e6681';    // Online Quote Booked
    const STAGE_ABANDONED = '17386d9a-84ac-434f-90bc-cfc777b37e09'; // Online Quote Abandoned
    const STAGE_CALLBACK = '1ff58d07-5f3d-43a5-9e61-1091d48e512c'; // Online Quote Callback

    if (!TOKEN || !LOCATION_ID) {
      console.error('Missing env vars');
      return res.status(200).json({ success: false, error: 'Server config error' });
    }

    // ==========================================
    // DETERMINE SCENARIO
    // ==========================================
    let scenario = 'in-progress'; // partial default — GHL automation waits 15 min then flips to abandoned
    if (!partial) {
      if (rodentInspection) scenario = 'rodent-inspection';
      else if (customQuote) scenario = 'custom-quote';
      else scenario = 'completed';
    }

    // ==========================================
    // BUILD TAGS (clean, automation-friendly)
    // ==========================================
    const tags = [`quote-${scenario}`];
    if (plan) tags.push(`plan:${plan}`);
    if (billing) tags.push(`billing:${billing}`);
    if (pests && pests.length) pests.forEach(p => tags.push(`pest:${p}`));
    if (addons && addons.length) addons.forEach(a => tags.push(`addon:${a}`));
    if (specialties && specialties.length) specialties.forEach(s => tags.push(`specialty:${s}`));
    if (confirmPreference) tags.push(`confirm-via:${confirmPreference}`);
    if (paymentPreference) tags.push(`payment:${paymentPreference}`);
    if (callbackRequested) tags.push('callback-requested');

    // ==========================================
    // BUILD AUDIT NOTE
    // ==========================================
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
    const noteLines = [`📋 ONLINE QUOTE — ${now}`];
    noteLines.push(`Scenario: ${scenario.toUpperCase()}`);
    noteLines.push('');
    noteLines.push('— CUSTOMER INFO —');
    noteLines.push(`Name: ${firstName || ''} ${lastName || ''}`);
    noteLines.push(`Email: ${email || 'not provided'}`);
    noteLines.push(`Phone: ${phone || 'not provided'}`);
    noteLines.push(`Address: ${address || ''}, ${city || ''}, TX ${zip || ''}`);
    noteLines.push('');
    noteLines.push('— PROPERTY —');
    noteLines.push(`Type: ${propertyType || 'Unknown'}`);
    noteLines.push(`Sq Ft: ${sqft ? sqft.toLocaleString() : 'not provided'}`);
    noteLines.push(`Lot Size: ${lotSize ? lotSize + ' acres' : 'not provided'}`);
    noteLines.push('');
    noteLines.push('— PEST SELECTIONS —');
    noteLines.push(`Pests: ${pests && pests.length ? pests.join(', ') : 'none selected'}`);
    if (followups && Object.keys(followups).length) {
      noteLines.push('Follow-up answers:');
      Object.entries(followups).forEach(([k, v]) => noteLines.push(`  ${k}: ${v}`));
    }
    if (addons && addons.length) noteLines.push(`Add-ons: ${addons.join(', ')}`);
    if (specialties && specialties.length) noteLines.push(`Specialties: ${specialties.join(', ')}`);

    if (!partial) {
      noteLines.push('');
      noteLines.push('— PLAN SELECTED —');
      noteLines.push(`Plan: ${plan || 'none'}`);
      noteLines.push(`Billing: ${billing || 'not selected'}`);
      if (preferredDate) noteLines.push(`Preferred Date: ${preferredDate}`);
      if (preferredTime) noteLines.push(`Preferred Time: ${preferredTime}`);
      if (rodentInspection) noteLines.push('⚠️ RODENT INSPECTION REQUESTED (interior rodent issue)');
      if (customQuote) noteLines.push('⚠️ CUSTOM QUOTE NEEDED (oversized property)');
      if (callbackRequested) {
        noteLines.push('');
        noteLines.push('📞 CALLBACK REQUESTED');
        noteLines.push(`Preferred day: ${callbackDay || 'not specified'}`);
        noteLines.push(`Preferred time: ${callbackTime || 'not specified'}`);
      }
      if (confirmPreference) noteLines.push(`Confirm via: ${confirmPreference}`);
      if (paymentPreference) noteLines.push(`Payment: ${paymentPreference === 'onsite' ? 'Card to technician on-site' : 'Call to set up payment'}`);
      noteLines.push('');
      noteLines.push('✅ AGREED TO TERMS OF SERVICE');
    } else {
      noteLines.push('');
      noteLines.push('⚠️ QUOTE ABANDONED — customer did not complete');
    }

    const noteBody = noteLines.join('\n');

    // ==========================================
    // CREATE OR UPDATE CONTACT
    // ==========================================
    // Build pest description for GHL field
    const pestDesc = pests && pests.length ? pests.join(', ') : '';
    // Map plan to exact GHL agreement_type dropdown values
    const AGREEMENT_MAP = {
      basic: 'Basic Pest Prevention',
      standard: 'Standard Pest Prevention',
      premium: 'Premium Pest Prevention',
      sentricon: 'Termite Control (Sentricon)',
      mosquito: 'Mosquito Control'
    };
    let planLabel = plan ? (AGREEMENT_MAP[plan] || plan.charAt(0).toUpperCase() + plan.slice(1)) : '';
    if (rodentInspection || customQuote) planLabel = 'Inspection';

    const contactBody = {
      locationId: LOCATION_ID,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone ? (phone.startsWith('+') ? phone : '+1' + phone.replace(/\D/g, '')) : '',
      address1: address || '',
      city: city || '',
      state: 'TX',
      postalCode: zip || '',
      tags: tags,
      source: 'Online Pricing Tool',
      customFields: [
        { key: 'agreement_type', field_value: planLabel },
        { key: 'please_describe_your_pest_concern', field_value: pestDesc }
      ]
    };

    const contactResp = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactBody)
    });

    const contactData = await contactResp.json();
    let contactId = contactData.contact?.id;

    if (!contactResp.ok) {
      if (contactData.meta?.contactId) {
        contactId = contactData.meta.contactId;
        // Update existing contact with new tags (merge, don't overwrite)
        const existingResp = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          headers: { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28' }
        });
        const existing = await existingResp.json();
        const existingTags = existing.contact?.tags || [];
        const mergedTags = [...new Set([...existingTags, ...tags])];

        // On final submission, remove in-progress tag
        const finalTags = !partial
          ? mergedTags.filter(t => t !== 'quote-in-progress')
          : mergedTags;

        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            tags: finalTags,
            customFields: [
              { key: 'agreement_type', field_value: planLabel },
              { key: 'please_describe_your_pest_concern', field_value: pestDesc }
            ]
          })
        });
      } else {
        console.error('GHL contact error:', contactResp.status, JSON.stringify(contactData));
        return res.status(200).json({ success: false, error: 'Failed to create contact' });
      }
    }

    if (!contactId) {
      return res.status(200).json({ success: false, error: 'No contact ID' });
    }

    // ==========================================
    // ADD NOTE (audit trail)
    // ==========================================
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ body: noteBody })
    });

    // ==========================================
    // CREATE OPPORTUNITY (completed bookings + callbacks)
    // ==========================================
    if (!partial && (scenario === 'completed' || scenario === 'rodent-inspection' || scenario === 'custom-quote' || callbackRequested)) {
      const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Custom';
      const oppName = callbackRequested
        ? `${firstName || ''} ${lastName || ''} - Callback Request`.trim()
        : scenario === 'rodent-inspection'
          ? `${firstName || ''} ${lastName || ''} - Rodent Inspection`.trim()
          : scenario === 'custom-quote'
            ? `${firstName || ''} ${lastName || ''} - Custom Quote`.trim()
            : `${firstName || ''} ${lastName || ''} - ${planLabel} Plan`.trim();

      const oppStage = callbackRequested ? STAGE_CALLBACK : STAGE_BOOKED;

      const oppBody = {
        pipelineId: PIPELINE_ID,
        locationId: LOCATION_ID,
        name: oppName,
        stageId: oppStage,
        status: 'open',
        contactId: contactId,
        monetaryValue: 0
      };

      const oppResp = await fetch('https://services.leadconnectorhq.com/opportunities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(oppBody)
      });

      if (!oppResp.ok) {
        const oppErr = await oppResp.json();
        console.error('GHL opportunity error:', oppResp.status, JSON.stringify(oppErr));
      }
    }

    // ==========================================
    // SLACK NOTIFICATION (completed bookings)
    // ==========================================
    if (!partial && SLACK_WEBHOOK) {
      let slackMsg = '';
      if (scenario === 'completed') {
        const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Unknown';
        slackMsg = `🎯 *New Online Booking*\n*${firstName} ${lastName}* — ${planLabel} Plan\n📍 ${address}, ${city} ${zip}\n🐛 ${pests?.join(', ') || 'general'} | 📐 ${sqft ? sqft.toLocaleString() : '?'} sqft\n📅 ${preferredDate || 'TBD'} ${preferredTime || ''}\n\n_Action: Set up in FieldRoutes, send contract, confirm appointment_`;
      } else if (scenario === 'custom-quote') {
        slackMsg = `🏠 *Custom Quote Needed*\n*${firstName} ${lastName}* — Oversized property\n📍 ${address}, ${city} ${zip}\n📐 ${sqft ? sqft.toLocaleString() : '?'} sqft | ${lotSize || '?'} acres\n🐛 ${pests?.join(', ') || 'general'}\n\n_Action: Schedule inspection, provide custom quote_`;
      } else if (scenario === 'rodent-inspection') {
        slackMsg = `🐀 *Rodent Inspection Requested*\n*${firstName} ${lastName}*\n📍 ${address}, ${city} ${zip}\n📅 ${preferredDate || 'TBD'} ${preferredTime || ''}\n\n_Action: Schedule free rodent inspection_`;
      }

      if (callbackRequested) {
        const dayLabel = callbackDay === 'today' ? 'Today' : callbackDay === 'tomorrow' ? 'Tomorrow' : 'This week';
        const timeLabel = callbackTime === 'morning' ? 'Morning (8am–12pm)' : callbackTime === 'afternoon' ? 'Afternoon (12pm–5pm)' : 'Anytime';
        slackMsg = `📞 *Callback Requested*\n*${firstName} ${lastName}*\n📱 ${phone || 'no phone'} | ✉️ ${email || 'no email'}\n📍 ${address}, ${city} ${zip}\n🐛 ${pests?.join(', ') || 'unknown pest'}\n🗓️ ${dayLabel} — ${timeLabel}\n\n_Action: CSR call to discuss pest issue and recommend plan_`;
      }

      if (slackMsg) {
        await fetch(SLACK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMsg })
        }).catch(err => console.error('Slack error:', err));
      }
    }

    return res.status(200).json({ success: true, contactId, scenario });
  } catch (err) {
    console.error('GHL lead error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      firstName, lastName, email, phone, address, city, zip,
      sqft, lotSize, propertyType, plan, pests, addons,
      preferredDate, preferredTime, billing, partial,
      rodentInspection, customQuote, specialties, followups
    } = req.body;

    const TOKEN = (process.env.GHL_API_TOKEN || '').trim();
    const LOCATION_ID = (process.env.GHL_LOCATION_ID || '').trim();
    const PIPELINE_ID = (process.env.GHL_PIPELINE_ID || '').trim();

    if (!TOKEN || !LOCATION_ID) {
      console.error('Missing env vars');
      return res.status(200).json({ success: false, error: 'Server config error' });
    }

    // ==========================================
    // DETERMINE SCENARIO
    // ==========================================
    let scenario = 'abandoned'; // default
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
    } else {
      noteLines.push('');
      noteLines.push('⚠️ QUOTE ABANDONED — customer did not complete');
    }

    const noteBody = noteLines.join('\n');

    // ==========================================
    // CREATE OR UPDATE CONTACT
    // ==========================================
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
      source: 'Online Pricing Tool'
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

        // On final submission, remove the abandoned tag
        const finalTags = !partial
          ? mergedTags.filter(t => t !== 'quote-abandoned')
          : mergedTags;

        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({ tags: finalTags })
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
    // CREATE OPPORTUNITY (completed bookings only)
    // ==========================================
    if (!partial && (scenario === 'completed' || scenario === 'rodent-inspection' || scenario === 'custom-quote')) {
      const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Custom';
      const oppName = scenario === 'rodent-inspection'
        ? `${firstName || ''} ${lastName || ''} - Rodent Inspection`.trim()
        : scenario === 'custom-quote'
          ? `${firstName || ''} ${lastName || ''} - Custom Quote`.trim()
          : `${firstName || ''} ${lastName || ''} - ${planLabel} Plan`.trim();

      const oppBody = {
        pipelineId: PIPELINE_ID,
        locationId: LOCATION_ID,
        name: oppName,
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

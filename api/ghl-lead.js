export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      firstName, lastName, email, phone, address, city, zip,
      sqft, lotSize, propertyType, plan, pests, addons,
      preferredDate, preferredTime, billing, partial,
      rodentInspection, customQuote, specialties
    } = req.body;

    const TOKEN = process.env.GHL_API_TOKEN;
    const LOCATION_ID = process.env.GHL_LOCATION_ID;
    const PIPELINE_ID = process.env.GHL_PIPELINE_ID;

    // Build tags
    const tags = ['source:website-quote'];
    if (plan) tags.push(`plan:${plan}`);
    if (billing) tags.push(`billing:${billing}`);
    if (partial) tags.push('quote-started-not-completed');
    if (rodentInspection) tags.push('rodent-inspection');
    if (customQuote) tags.push('custom-quote-needed');
    if (pests && pests.length) pests.forEach(p => tags.push(`pest:${p}`));
    if (addons && addons.length) addons.forEach(a => tags.push(`addon:${a}`));
    if (specialties && specialties.length) specialties.forEach(s => tags.push(`specialty:${s}`));

    // Create contact
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
      source: 'website-quote'
    };

    // Add notes with property info
    const notes = [];
    if (sqft) notes.push(`Sqft: ${sqft}`);
    if (lotSize) notes.push(`Lot: ${lotSize} acres`);
    if (propertyType) notes.push(`Type: ${propertyType}`);
    if (plan) notes.push(`Plan: ${plan}`);
    if (billing) notes.push(`Billing: ${billing}`);
    if (pests && pests.length) notes.push(`Pests: ${pests.join(', ')}`);
    if (addons && addons.length) notes.push(`Addons: ${addons.join(', ')}`);
    if (preferredDate) notes.push(`Preferred date: ${preferredDate}`);
    if (preferredTime) notes.push(`Preferred time: ${preferredTime}`);
    if (notes.length) contactBody.companyName = notes.join(' | ');

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
    
    if (!contactResp.ok) {
      console.error('GHL contact error:', contactResp.status, JSON.stringify(contactData));
      return res.status(200).json({ success: false, error: 'Failed to create contact' });
    }

    const contactId = contactData.contact?.id;

    // Create opportunity (only for non-partial submissions)
    if (contactId && !partial) {
      const oppBody = {
        pipelineId: PIPELINE_ID,
        locationId: LOCATION_ID,
        name: `${firstName || ''} ${lastName || ''} - Online Quote`.trim(),
        status: 'open',
        contactId: contactId,
        monetaryValue: 0
      };

      // Set stage based on completion
      if (preferredDate) {
        oppBody.pipelineStageId = undefined; // Use default first stage
      }

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
        // Don't fail the whole request if opportunity creation fails
      }
    }

    return res.status(200).json({ success: true, contactId });
  } catch (err) {
    console.error('GHL lead error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { address, city, state, zip } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });

    const params = new URLSearchParams({
      address: address,
      city: city || '',
      state: state || 'TX',
      zipCode: zip || ''
    });

    const resp = await fetch(`https://api.rentcast.io/v1/properties?${params}`, {
      headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY, 'Accept': 'application/json' }
    });

    if (!resp.ok) {
      console.error('Rentcast error:', resp.status, await resp.text());
      return res.status(200).json({ success: false, fallback: true, message: 'Could not look up property' });
    }

    const data = await resp.json();
    
    // Rentcast returns an array; take first result
    const prop = Array.isArray(data) ? data[0] : data;
    if (!prop) return res.status(200).json({ success: false, fallback: true, message: 'No property found' });

    return res.status(200).json({
      success: true,
      sqft: prop.squareFootage || prop.buildingSize || null,
      lotSize: prop.lotSize || null, // in sqft from Rentcast
      propertyType: prop.propertyType || null,
      yearBuilt: prop.yearBuilt || null,
      bedrooms: prop.bedrooms || null,
      bathrooms: prop.bathrooms || null
    });
  } catch (err) {
    console.error('Rentcast proxy error:', err);
    return res.status(200).json({ success: false, fallback: true, message: 'API error' });
  }
}

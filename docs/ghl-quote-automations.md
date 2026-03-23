# Forterra Pest Control — GHL Quote Tool Automations

**Company:** Forterra Pest Control  
**Phone:** (817) 665-6527  
**Quote Tool:** quote.forterrapestcontrol.com/forterra-pricing-lemonade  
**Pipeline:** Inbound Sales (ID: QRJpl20GSKW7F1vppJ6T)  
**Business Hours:** Mon-Fri 8am-5pm CST, Sat 8am-12pm  

### What the API Already Handles (no GHL automation needed):
- Creates/updates contact with all tags and custom fields
- Populates `agreement_type` (mapped to exact dropdown values: Basic Pest Prevention, Standard Pest Prevention, Premium Pest Prevention, Termite Control (Sentricon), Mosquito Control, Inspection)
- Populates `please_describe_your_pest_concern` with pest list
- Creates opportunity in Inbound Sales pipeline
- Adds detailed audit note (pests, follow-ups, plan, sqft, preferred date/time, payment preference, ToS agreement)
- Sends Slack notification to #call-review
- Handles all tag logic (`quote-completed`, `quote-in-progress`, `quote-rodent-inspection`, `quote-custom-quote`, `callback-requested`, `confirm-via:X`, `payment:X`, `plan:X`, `billing:X`, `pest:X`)

### What GHL Automations Handle:
- Sending customer-facing texts and emails (shows in GHL conversation view for CSRs)
- Creating CSR tasks (shows in GHL task queue)
- Abandoned quote nurture drip (multi-day sequences with wait steps)
- Pipeline stage moves

### Pipeline Stage to Add:
- **"Online Quote Booked"** — add early in Inbound Sales pipeline (before Quoted). This is where completed online quotes land.

### GHL Merge Fields Used:
| Merge Field | What It Contains | Example |
|---|---|---|
| `{{contact.first_name}}` | First name | Jane |
| `{{contact.last_name}}` | Last name | Smith |
| `{{contact.phone}}` | Phone number | +18175551234 |
| `{{contact.email}}` | Email | jane@example.com |
| `{{contact.address1}}` | Street address | 123 Main St |
| `{{contact.agreement_type}}` | Plan name (dropdown) | Standard Pest Prevention |
| `{{contact.please_describe_your_pest_concern}}` | Pest list | ants, cockroaches, spiders |

---

## 1. QUOTE COMPLETED — Booking Confirmation

**Workflow Name:** Quote Tool — Booking Confirmation  
**Trigger:** Tag Added → `quote-completed`

### Step 1: IF/ELSE — Confirmation Method
- **Branch A:** Contact has tag `confirm-via:email` → go to Step 2B
- **Branch B:** Contact has tag `confirm-via:call` → go to Step 2C
- **Default (includes `confirm-via:text`):** → go to Step 2A

### Step 2A: Send SMS (text confirmation)
```
Hi {{contact.first_name}}! Your {{contact.agreement_type}} service is confirmed.

We'll call within 24hrs to schedule your first visit and get you set up.

Questions? Call (817) 665-6527

- Forterra Pest Control
```

### Step 2B: Send Email (email confirmation)
- **From:** Forterra Pest Control <info@forterrapestcontrol.com>
- **Subject:** You're all set, {{contact.first_name}} — service confirmed!
- **Body:**

```
Hi {{contact.first_name}},

Your pest control service is confirmed! Here are your details:

Plan: {{contact.agreement_type}}
Pests: {{contact.please_describe_your_pest_concern}}
Property: {{contact.address1}}

WHAT HAPPENS NEXT:
A member of our team will call you within 24 hours to:
  - Schedule your first treatment
  - Collect payment information
  - Answer any questions

WHY FORTERRA:
  • 5.0 stars — 2,600+ Google reviews
  • Money-back guarantee
  • Free re-services if pests return between visits
  • Local DFW family business

Questions before we call? Reply to this email or call (817) 665-6527.

Thanks for choosing Forterra!
The Forterra Team
```

### Step 2C: Create Task (call confirmation)
- **Assign to:** Round Robin (Rachelle, Lyra, Aira, Angela, Hassan)
- **Title:** Call to confirm — {{contact.first_name}} {{contact.last_name}}
- **Due:** Today + 2 hours
- **Description:**
```
Customer requested a confirmation call.

Phone: {{contact.phone}}
Plan: {{contact.agreement_type}}
Pests: {{contact.please_describe_your_pest_concern}}
Address: {{contact.address1}}

TO DO:
1. Call to confirm service details
2. Schedule first treatment
3. Collect payment info
4. Check notes for full quote details
```
- **ALSO send this SMS** (so they know we got it):
```
Hi {{contact.first_name}}! We got your booking. One of our team members will call you shortly to confirm everything.

- Forterra Pest Control
(817) 665-6527
```

### Step 3: IF/ELSE — Payment Collection
- **Condition:** Contact has tag `payment:call-setup`
- **If YES →** Create Task:
  - **Assign to:** Round Robin
  - **Title:** Collect payment — {{contact.first_name}} {{contact.last_name}}
  - **Due:** Today + 4 hours
  - **Description:**
```
Customer chose "call to set up payment" on quote tool.
CC or ACH must be on file before first service.

Phone: {{contact.phone}}
Plan: {{contact.agreement_type}}
```
- **If NO →** Continue (customer will pay tech on-site)

### Step 4: Update Pipeline Stage
- **Action:** Move opportunity to **"Online Quote Booked"** stage

### Step 5: Add/Remove Tags
- **Add:** `booking-confirmed`
- **Remove:** `quote-in-progress`

---

## 2. CALLBACK REQUESTED — CSR Routing

**Workflow Name:** Quote Tool — Callback Request  
**Trigger:** Tag Added → `callback-requested`

> **Note:** Callback day/time preferences are in the GHL contact note (not a custom field). CSR should read the note for details.

### Step 1: Send SMS (immediate customer confirmation)
```
Hi {{contact.first_name}}! We got your request — a Forterra team member will call you soon to discuss your pest situation.

If urgent, call us now: (817) 665-6527

- Forterra Pest Control
```

### Step 2: Create Task
- **Assign to:** Round Robin (Rachelle, Lyra, Aira, Angela, Hassan)
- **Title:** 🚨 Callback — {{contact.first_name}} {{contact.last_name}}
- **Priority:** High
- **Due:** Today + 30 minutes
- **Description:**
```
Customer used quote tool but wasn't sure about their pest issue.
Requested a callback instead of booking online.

Phone: {{contact.phone}}
Pests: {{contact.please_describe_your_pest_concern}}
Address: {{contact.address1}}

CHECK THE CONTACT NOTES for:
- Preferred callback day (today / tomorrow / this week)
- Preferred callback time (morning / afternoon / anytime)

TO DO:
1. Call to discuss pest issue
2. Recommend the right plan
3. Book service if interested
```

### Step 3: Wait 1 hour

### Step 4: IF/ELSE — Task completed?
- **If YES →** End workflow
- **If NO →** Continue

### Step 5: Create Escalation Task
- **Assign to:** Rachelle
- **Title:** ⚠️ Missed callback — {{contact.first_name}} {{contact.last_name}}
- **Priority:** Urgent
- **Due:** Today + 30 minutes
- **Description:**
```
Callback requested 1+ hour ago, no CSR response.
Phone: {{contact.phone}}
```

---

## 3. QUOTE ABANDONED — Nurture Sequence

**Workflow Name:** Quote Tool — Abandoned Quote Nurture  
**Trigger:** Tag Added → `quote-in-progress`

> **Important:** Every touch checks for `quote-completed` first. If the customer finished their quote or called in, the sequence stops.

### Step 1: Wait 15 minutes

### Step 2: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 3: Add tag `quote-abandoned`, remove tag `quote-in-progress`

### Step 4: Touch 1 — SMS (immediate after 15 min)
```
Hi {{contact.first_name}}, looks like you didn't finish your pest control quote. No worries!

Pick up where you left off: quote.forterrapestcontrol.com/forterra-pricing-lemonade

Or call us: (817) 665-6527

Reply STOP to opt out.
- Forterra Pest Control
```

### Step 5: Wait 1 day

### Step 6: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 7: Touch 2 — Email (Day 1)
- **Subject:** Your pest control quote is waiting, {{contact.first_name}}
- **Body:**
```
Hi {{contact.first_name}},

You started a quote for {{contact.please_describe_your_pest_concern}} service at {{contact.address1}} but didn't get a chance to finish.

It only takes 2 minutes:
→ quote.forterrapestcontrol.com/forterra-pricing-lemonade

Or call us and we'll walk you through it: (817) 665-6527

Why Forterra?
  • 5.0 stars — 2,600+ Google reviews
  • Money-back guarantee
  • Free re-services if pests come back
  • Locally owned, serving DFW since 2021

Talk soon,
The Forterra Team
```

### Step 8: Wait 2 days

### Step 9: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 10: Touch 3 — SMS (Day 3)
```
{{contact.first_name}}, still seeing {{contact.please_describe_your_pest_concern}} around the house? DFW pest problems get worse in warm weather.

2-min quote: quote.forterrapestcontrol.com/forterra-pricing-lemonade
Or call: (817) 665-6527

Reply STOP to opt out.
- Forterra
```

### Step 11: Wait 2 days

### Step 12: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 13: Touch 4 — Email (Day 5)
- **Subject:** What other DFW homeowners say about {{contact.please_describe_your_pest_concern}} control
- **Body:**
```
Hi {{contact.first_name}},

Here's what DFW homeowners are saying about Forterra:

"I recently switched from a big company to Forterra and it was a great decision. Superior customer service and our technician Ean is thorough and communicative."
— Dustin H., Google Review ⭐⭐⭐⭐⭐

"Drake was an absolute rock star. He took the extra step to send a text, asked questions to understand our concerns, and kept us informed on every step."
— Stacy P., Google Review ⭐⭐⭐⭐⭐

Ready to take care of those {{contact.please_describe_your_pest_concern}}?
→ quote.forterrapestcontrol.com/forterra-pricing-lemonade

Or call: (817) 665-6527

The Forterra Team
```

### Step 14: Wait 2 days

### Step 15: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 16: Touch 5 — Final SMS (Day 7)
```
{{contact.first_name}}, last note from us about pest control for {{contact.address1}}.

If you change your mind, we're here: (817) 665-6527

5.0 stars, money-back guarantee, free re-services.

Reply STOP to opt out.
- Forterra Pest Control
```

### Step 17: Add tag `nurture-completed`, remove tag `quote-abandoned`

---

## 4. RODENT INSPECTION + CUSTOM QUOTE — Inspection Routing

**Workflow Name:** Quote Tool — Inspection Request  
**Trigger:** Tag Added → `quote-rodent-inspection` OR `quote-custom-quote`

### Step 1: IF/ELSE — Inspection type
- **Branch A:** Has tag `quote-rodent-inspection` → Step 2A
- **Branch B:** Has tag `quote-custom-quote` → Step 2B

### Step 2A: SMS — Rodent inspection
```
Hi {{contact.first_name}}! We'll schedule a FREE rodent inspection at {{contact.address1}}.

A team member will call within 24hrs to find a time that works.

Questions? (817) 665-6527
- Forterra Pest Control
```

### Step 2B: SMS — Custom quote
```
Hi {{contact.first_name}}! Your property needs a custom quote — we want to make sure we get it right.

A team member will call within 24hrs to discuss details and pricing.

Questions? (817) 665-6527
- Forterra Pest Control
```

### Step 3: Create Task
- **Assign to:** Round Robin (Rachelle, Lyra, Aira, Angela, Hassan)
- **Title:** Schedule inspection — {{contact.first_name}} {{contact.last_name}}
- **Due:** Today + 4 hours
- **Description:**
```
INSPECTION NEEDED

Phone: {{contact.phone}}
Address: {{contact.address1}}
Pests: {{contact.please_describe_your_pest_concern}}
Type: Check tags — rodent inspection or custom quote (oversized property)

CHECK CONTACT NOTES for full quote details (sqft, lot size, etc.)

TO DO:
1. Call to schedule inspection
2. Coordinate with tech availability
3. Confirm appointment
```

### Step 4: Wait 24 hours

### Step 5: IF/ELSE — Task completed?
- **If YES →** End workflow
- **If NO →** Continue

### Step 6: Escalation Task
- **Assign to:** Rachelle
- **Title:** ⚠️ Inspection not scheduled — {{contact.first_name}} {{contact.last_name}}
- **Priority:** High
- **Due:** Today + 2 hours
- **Description:**
```
Inspection requested 24+ hours ago, not yet scheduled.
Phone: {{contact.phone}}
Address: {{contact.address1}}
```

### Step 7: Add tag `inspection-requested`

---

## Testing Checklist

- [ ] Submit a test quote (use your own phone/email) → verify `quote-completed` fires Automation 1
- [ ] Check that `agreement_type` and `please_describe_your_pest_concern` populate on the contact
- [ ] Verify SMS arrives and reads correctly
- [ ] Verify email arrives and renders correctly
- [ ] Check that CSR task appears (for call confirmation and payment collection)
- [ ] Test abandoned flow: start a quote, enter email/phone, close browser → verify `quote-in-progress` fires Automation 3, and first text arrives after 15 min
- [ ] Test callback: select "Other" pest → "Schedule a callback" → verify Automation 2 fires
- [ ] Test rodent inspection: select "Rodents" → "Inside my home" → verify Automation 4 fires
- [ ] Confirm pipeline stage moves to "Online Quote Booked"
- [ ] Verify that completing a quote AFTER starting one removes `quote-in-progress` and stops nurture

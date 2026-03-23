# Forterra Pest Control — GHL Quote Tool Automations

**Company:** Forterra Pest Control  
**Phone:** (817) 665-6527  
**Quote Tool:** quote.forterrapestcontrol.com  
**Pipeline:** Inbound Sales (ID: QRJpl20GSKW7F1vppJ6T)  
**Business Hours:** Mon-Fri 8am-5pm CST, Sat 8am-12pm  

### What the API Already Handles (no GHL automation needed):
- Creates/updates contact with all tags and custom fields
- Populates `agreement_type` (mapped to exact dropdown values: Basic Pest Prevention, Standard Pest Prevention, Premium Pest Prevention, Termite Control (Sentricon), Mosquito Control, Inspection)
- Populates `please_describe_your_pest_concern` with pest list
- Creates opportunity in Inbound Sales pipeline → **Online Quote Booked** (completed bookings) or **Online Quote Callback** (callback requests). Abandoned quotes get their opportunity from the GHL automation.
- Adds detailed audit note (pests, follow-ups, plan, sqft, preferred date/time, payment preference, ToS agreement)
- Sends Slack notification to #call-review
- Handles all tag logic (`quote-completed`, `quote-in-progress`, `quote-rodent-inspection`, `quote-termite-inspection`, `quote-custom-quote`, `callback-requested`, `confirm-via:X`, `payment:X`, `plan:X`, `billing:X`, `pest:X`)

### What GHL Automations Handle:
- Sending customer-facing texts and emails (shows in GHL conversation view for CSRs)
- Creating CSR tasks (shows in GHL task queue)
- Abandoned quote nurture drip (multi-day sequences with wait steps)
- Pipeline stage moves

### Pipeline Stages (already created):
- **"Online Quote Booked"** (ID: `2cbb6069-92e9-4b16-9278-424ab97e6681`) — where completed online quotes land. API places opportunities here directly.
- **"Online Quote Callback"** (ID: `1ff58d07-5f3d-43a5-9e61-1091d48e512c`) — callback requests, waiting for CSR follow-up. API places opportunities here directly.
- **"Online Quote Abandoned"** (ID: `17386d9a-84ac-434f-90bc-cfc777b37e09`) — where abandoned quote opportunities land. Created by GHL automation after 15-min wait confirms abandonment.

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
| `{{contact.initial_service}}` | Initial service fee (before discounts) | 99 |
| `{{contact.after_discount}}` | Initial fee after discounts | 69 |
| `{{contact.monthly_charge}}` | Monthly recurring charge | 59 |
| `{{contact.mosquito-monthly}}` | Mosquito add-on monthly charge | 52 |

---

## 1. QUOTE COMPLETED — Booking Confirmation

**Workflow Name:** Quote Tool — Booking Confirmation  
**Trigger:** Tag Added → `quote-completed`

### Step 1: IF/ELSE — Confirmation Method
- **Branch A:** Contact has tag `confirm-via:email` → go to Step 2B
- **Branch B:** Contact has tag `confirm-via:call` → go to Step 2C
- **Default (includes `confirm-via:text`):** → go to Step 2A

### Step 2A: Send SMS (text confirmation)

**IF/ELSE:** Contact has tag `addon:mosquito`

**If YES (pest + mosquito):**
```
Hi {{contact.first_name}}! Your {{contact.agreement_type}} + Mosquito Protection is confirmed.

Initial service: ${{contact.after_discount}}
Monthly: ${{contact.monthly_charge}}/mo + ${{contact.mosquito-monthly}}/mo mosquito

We'll call within 24hrs to schedule your first visit.

Questions? (817) 665-6527
- Forterra Pest Control
```

**If NO (pest only):**
```
Hi {{contact.first_name}}! Your {{contact.agreement_type}} is confirmed.

Initial service: ${{contact.after_discount}}
Monthly: ${{contact.monthly_charge}}/mo

We'll call within 24hrs to schedule your first visit.

Questions? (817) 665-6527
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
Initial Service Fee: ${{contact.after_discount}}
Monthly Recurring: ${{contact.monthly_charge}}/mo

Note: For the email, add an IF/ELSE block — if contact has tag `addon:mosquito`, insert this line after Monthly Recurring:
Mosquito Add-on: +${{contact.mosquito-monthly}}/mo

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

### Step 4: Pipeline Stage (no action needed)
- The API already places the opportunity directly into **"Online Quote Booked"** stage at creation. No GHL move required.

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

> **Note:** The API already sends a Slack notification to #call-review with full details (phone, pests, address, preferred callback day/time). No GHL task needed — whoever sees the Slack message handles it. This avoids duplicate outreach from multiple reps.

---

## 3. QUOTE ABANDONED — Nurture Sequence (7-Touch, 9-Day)

**Workflow Name:** Quote Tool — Abandoned Quote Nurture  
**Trigger:** Tag Added → `quote-in-progress`

> **Important:** Every touch checks for `quote-completed` first. If the customer finished their quote or called in, the sequence stops.

### Step 1: Wait 15 minutes

### Step 2: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 3: Add tag `quote-abandoned`, remove tag `quote-in-progress`

### Step 4: Create Opportunity
- **Pipeline:** Inbound Sales (`QRJpl20GSKW7F1vppJ6T`)
- **Stage:** Online Quote Abandoned (`17386d9a-84ac-434f-90bc-cfc777b37e09`)
- **Name:** `{{contact.first_name}} {{contact.last_name}} - Abandoned Quote`
- **Status:** Open
- **Monetary Value:** 0

> **Why here and not in the API?** The API fires at the partial-submit moment (when the customer enters email/phone). They might still finish 30 seconds later. The 15-min wait in Step 1 confirms they actually abandoned. Only then do we create the opportunity so it doesn't pollute the pipeline with false abandonments.

### Step 5: Touch 1 — SMS (15 min after abandonment)
```
Hi {{contact.first_name}}, looks like you didn't finish your Forterra quote. No worries — pick up where you left off: quote.forterrapestcontrol.com

Or call us: (817) 665-6527
Reply STOP to opt out.
```

### Step 6: Wait 2 hours (total ~2.5 hours after abandonment)

### Step 7: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 8: IF/ELSE — Is it business hours? (Mon-Fri 8am-5pm, Sat 8am-12pm CST)
- **If YES →** Step 9A
- **If NO →** Skip to Step 10 (next day email)

### Step 9A: Touch 2 — CSR Phone Call
- **Create Task:**
  - **Assign to:** Round Robin (Rachelle, Lyra, Aira, Angela, Hassan)
  - **Title:** Call abandoned quote — {{contact.first_name}} {{contact.last_name}}
  - **Priority:** High
  - **Due:** Now (immediate)
  - **Description:**
```
Abandoned online quote ~2 hours ago.

Phone: {{contact.phone}}
Pests: {{contact.please_describe_your_pest_concern}}
Address: {{contact.address1}}

SCRIPT:
"Hi {{contact.first_name}}, this is [your name] from Forterra Pest Control. I saw you started a quote on our website — wanted to see if you had any questions I could help with."

If no answer → leave voicemail, then send this text:
"Hi {{contact.first_name}}, just tried to reach you about your pest control quote. Happy to help with any questions — call us back at (817) 665-6527 or finish online: quote.forterrapestcontrol.com"

CHECK CONTACT NOTES for full quote details.
```

### Step 9B: If no answer, send follow-up SMS:
```
Hi {{contact.first_name}}, just tried reaching you about your pest control quote. Happy to help — call us at (817) 665-6527 or finish online: quote.forterrapestcontrol.com
```

### Step 10: Wait until Day 1 (24 hours after abandonment)

### Step 11: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 12: Touch 3 — Email (Day 1)
- **Subject:** {{contact.first_name}}, your quote is waiting
- **Body:**
```
Hi {{contact.first_name}},

You started a quote for {{contact.please_describe_your_pest_concern}} service at {{contact.address1}} but didn't get a chance to finish.

It only takes 2 minutes:
→ quote.forterrapestcontrol.com

Or call us and we'll walk you through it: (817) 665-6527

WHY FORTERRA:
  • 5.0 stars — 2,600+ Google reviews
  • Money-back guarantee on every service
  • Free re-services if pests return between visits
  • Locally owned, serving DFW since 2021

Talk soon,
The Forterra Team
```

### Step 13: Wait 2 days (Day 3)

### Step 14: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 15: Touch 4 — SMS (Day 3)
```
{{contact.first_name}}, still seeing {{contact.please_describe_your_pest_concern}} around the house? DFW pest season is ramping up — problems only get worse in warm weather.

2-min quote: quote.forterrapestcontrol.com
Or call: (817) 665-6527
Reply STOP to opt out.
```

### Step 16: Wait 2 days (Day 5)

### Step 17: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 18: Touch 5 — Email (Day 5)
- **Subject:** What DFW homeowners say about {{contact.please_describe_your_pest_concern}} control
- **Body:**
```
Hi {{contact.first_name}},

Here's what your neighbors are saying about Forterra:

"I recently switched from a big company to Forterra and it was a great decision. Superior customer service and our technician Ean is thorough and communicative."
— Dustin H., Google Review ⭐⭐⭐⭐⭐

"Drake was an absolute rock star. He took the extra step to send a text, asked questions to understand our concerns, and kept us informed on every step."
— Stacy P., Google Review ⭐⭐⭐⭐⭐

Ready to take care of those {{contact.please_describe_your_pest_concern}}?
→ quote.forterrapestcontrol.com

Or call: (817) 665-6527

The Forterra Team
```

### Step 19: Wait 2 days (Day 7)

### Step 20: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 21: Touch 6 — SMS (Day 7) — Value-add incentive
```
{{contact.first_name}}, still thinking about pest control? We'll include a FREE mosquito treatment with your first service — but this offer expires in 48 hours.

Finish your quote: quote.forterrapestcontrol.com
Or call: (817) 665-6527
Reply STOP to opt out.
```

### Step 22: Wait 2 days (Day 9)

### Step 23: IF/ELSE — Has tag `quote-completed`?
- **If YES →** End workflow
- **If NO →** Continue

### Step 24: Touch 7 — SMS (Day 9) — Breakup message
```
{{contact.first_name}}, this is our last note about your pest control quote for {{contact.address1}}.

If you change your mind, we're here: (817) 665-6527

5.0 stars, money-back guarantee, free re-services. 🙂
Reply STOP to opt out.
```

### Step 25: Add tag `nurture-completed`, remove tag `quote-abandoned`

---

## 4. RODENT INSPECTION + CUSTOM QUOTE — Inspection Routing

**Workflow Name:** Quote Tool — Inspection Request  
**Trigger:** Tag Added → `quote-rodent-inspection` OR `quote-termite-inspection` OR `quote-custom-quote`

### Step 1: IF/ELSE — Inspection type
- **Branch A:** Has tag `quote-rodent-inspection` → Step 2A
- **Branch B:** Has tag `quote-termite-inspection` → Step 2B
- **Branch C:** Has tag `quote-custom-quote` → Step 2C

### Step 2A: SMS — Rodent inspection
```
Hi {{contact.first_name}}! We'll schedule a FREE rodent inspection at {{contact.address1}}.

A team member will call within 24hrs to find a time that works.

Questions? (817) 665-6527
- Forterra Pest Control
```

### Step 2B: SMS — Termite inspection
```
Hi {{contact.first_name}}! We'll schedule a FREE termite inspection at {{contact.address1}}.

A specialist will check for termite activity and recommend the right protection plan.

A team member will call within 24hrs to find a time that works.

Questions? (817) 665-6527
- Forterra Pest Control
```

### Step 2C: SMS — Custom quote
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
Type: Check tags — rodent inspection, termite inspection, or custom quote (oversized property)

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

**Automation 1 — Booking Confirmation:**
- [ ] Submit a test quote (use your own phone/email) → verify `quote-completed` fires Automation 1
- [ ] Check that `agreement_type` and `please_describe_your_pest_concern` populate on the contact
- [ ] Verify SMS/email arrives and reads correctly (test each confirm-via option)
- [ ] Check that CSR task appears (for `confirm-via:call` and `payment:call-setup`)
- [ ] Verify opportunity lands in **Online Quote Booked** stage (not Lead)

**Automation 2 — Callback:**
- [ ] Select "Other" pest → "Schedule a callback" → verify SMS arrives
- [ ] Verify opportunity lands in **Online Quote Callback** stage
- [ ] Verify Slack notification appears in #call-review with callback day/time

**Automation 3 — Abandoned Quote (7-Touch Nurture):**
- [ ] TCPA consent disclosure visible above submit button
- [ ] Consent timestamp logged in contact note
- [ ] Start a quote, enter email/phone, close browser → verify `quote-in-progress` tag applied
- [ ] Wait 15 min → verify tag flips to `quote-abandoned` and opportunity created in **Online Quote Abandoned** stage
- [ ] Verify first SMS arrives after 15 min
- [ ] CSR phone call task created at ~2.5 hours (business hours only)
- [ ] Touch 6 free mosquito treatment offer appears at Day 7
- [ ] Full 7-touch sequence completes over 9 days
- [ ] Sequence stops at any point if `quote-completed` tag is added
- [ ] Complete a quote AFTER starting one → verify `quote-in-progress` removed and nurture stops (no abandoned opportunity created)

**Automation 4 — Inspection:**
- [ ] Select "Rodents" → "Inside my home" → verify SMS + CSR task
- [ ] Test oversized property (7K+ sqft) → verify custom quote SMS + CSR task
- [ ] Verify escalation task fires after 24 hours if original task not completed

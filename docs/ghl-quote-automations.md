# Forterra Pest Control - GHL Quote Tool Automations

**Company:** Forterra Pest Control  
**Phone:** (817) 665-6527  
**Quote Tool:** quote.forterrapestcontrol.com/forterra-pricing-lemonade  
**Pipeline:** Inbound Sales (ID: QRJpl20GSKW7F1vppJ6T)  
**Business Hours:** Mon-Fri 8am-5pm CST, Sat 8am-12pm  
**Slack Webhook:** Available for #office-only notifications

---

## 1. QUOTE COMPLETED — Booking Confirmation

**Trigger:** Contact receives tag `quote-completed`

### Workflow Steps:

#### Step 1: Branch on Confirmation Method
- **Action:** IF/ELSE Branch
- **Condition 1:** Contact has tag `confirm-via:text`
- **Condition 2:** Contact has tag `confirm-via:email`  
- **Condition 3:** Contact has tag `confirm-via:call`
- **Default:** Fall through to text confirmation

#### Step 2A: Text Confirmation (confirm-via:text)
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
Hi {{contact.first_name}}! 🎉 Your pest control service is confirmed! 

✅ Plan: {{contact.agreement_type}}
✅ Coverage: {{contact.please_describe_your_pest_concern}}
✅ Home: {{contact.address1}}
✅ Preferred Start: your requested date

We'll call within 24hrs to schedule your first visit. Questions? Reply STOP to opt out or call (817) 665-6527.

- Forterra Pest Control
5.0⭐ (2,600+ reviews)
```

#### Step 2B: Email Confirmation (confirm-via:email)
- **Action:** Send Email
- **From:** Forterra Pest Control <info@forterrapestcontrol.com>
- **Subject:** Your {{contact.please_describe_your_pest_concern}} service is confirmed, {{contact.first_name}}!
- **Body:**
```html
<p>Hi {{contact.first_name}},</p>

<p>🎉 <strong>Great news! Your pest control service is officially confirmed!</strong></p>

<div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #28a745;">
<p><strong>Your Service Details:</strong></p>
<ul>
<li><strong>Plan:</strong> {{contact.agreement_type}}</li>
<li><strong>Coverage:</strong> {{contact.please_describe_your_pest_concern}}</li>
<li><strong>Property:</strong> {{contact.address1}}</li>
<li><strong>Preferred Start Date:</strong> your requested date</li>
</ul>
</div>

<p><strong>What happens next?</strong><br>
One of our CSR team members will call you within 24 hours to schedule your first service visit and collect payment information.</p>

<p><strong>Why Forterra Pest Control?</strong></p>
<ul>
<li>⭐ 5.0 stars with 2,600+ Google reviews</li>
<li>💯 Money-back guarantee</li>
<li>🔄 Free re-services if pests return</li>
<li>📞 Local DFW team: (817) 665-6527</li>
</ul>

<p>Questions before we call? Just reply to this email!</p>

<p>Thanks for choosing Forterra,<br>
<strong>The Forterra Team</strong></p>

<hr>
<p><small>You're receiving this because you requested a quote at quote.forterrapestcontrol.com. <a href="{{unsubscribe_link}}">Unsubscribe</a> | Forterra Pest Control | DFW Area</small></p>
```

#### Step 2C: Call Confirmation (confirm-via:call)
- **Action:** Create Task
- **Assign to:** CSR Team (Round Robin: Rachelle, Lyra, Aira, Angela, Hassan)
- **Task Title:** URGENT: Call {{contact.first_name}} {{contact.last_name}} - Quote Confirmation
- **Due Date:** Today + 2 hours
- **Description:**
```
QUOTE COMPLETED - CALL CONFIRMATION REQUESTED

Contact: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Plan: {{contact.agreement_type}}
Pests: {{contact.please_describe_your_pest_concern}}
Address: {{contact.address1}}
Preferred Date: your requested date

ACTION NEEDED:
1. Call to confirm service details
2. Schedule first treatment
3. Collect payment info (if payment:call-setup tag exists)
4. Mark task complete when done
```

#### Step 3: Check Payment Collection Method
- **Action:** IF/ELSE Branch
- **Condition:** Contact has tag `payment:call-setup`
- **If YES:** Create additional payment collection task
- **If NO:** Continue to Step 4

#### Step 3A: Payment Collection Task (if payment:call-setup)
- **Action:** Create Task
- **Assign to:** CSR Team (Round Robin)
- **Task Title:** Collect Payment Info - {{contact.first_name}} {{contact.last_name}}
- **Due Date:** Today + 4 hours
- **Description:**
```
PAYMENT COLLECTION REQUIRED

Contact: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Plan: {{contact.agreement_type}}
Address: {{contact.address1}}

COLLECT:
- Credit card OR ACH info
- Verify billing address
- Process first payment
- Update opportunity with payment status

NOTE: Service cannot begin until payment is on file (company policy).
```

#### Step 4: Slack Notification
- **Action:** Send Webhook
- **URL:** [Slack webhook URL]
- **Payload:**
```json
{
  "text": "📋 NEW QUOTE COMPLETED",
  "attachments": [
    {
      "color": "good",
      "fields": [
        {"title": "Customer", "value": "{{contact.first_name}} {{contact.last_name}}", "short": true},
        {"title": "Phone", "value": "{{contact.phone}}", "short": true},
        {"title": "Plan", "value": "{{contact.agreement_type}}", "short": true},
        {"title": "Pests", "value": "{{contact.please_describe_your_pest_concern}}", "short": true},
        {"title": "Address", "value": "{{contact.address1}}", "short": false},
        {"title": "Confirmation Method", "value": "{{custom_values.confirm_method}}", "short": true}
      ]
    }
  ]
}
```

#### Step 5: Update Pipeline Stage
- **Action:** Change Pipeline Stage
- **Pipeline:** Inbound Sales (QRJpl20GSKW7F1vppJ6T)
- **New Stage:** Confirmed - Awaiting Schedule

#### Step 6: Add Tags
- **Action:** Add Tags
- **Tags to Add:** `booking-confirmed`, `awaiting-schedule`
- **Tags to Remove:** `quote-in-progress`

---

## 2. CALLBACK REQUESTED — CSR Routing

**Trigger:** Contact receives tag `callback-requested`

### Workflow Steps:

#### Step 1: Create Urgent CSR Task
- **Action:** Create Task
- **Assign to:** CSR Team (Round Robin: Rachelle, Lyra, Aira, Angela, Hassan)
- **Task Title:** 🚨 CALLBACK REQUESTED - {{contact.first_name}} {{contact.last_name}}
- **Priority:** High
- **Due Date:** Today + 1 hour
- **Description:**
```
CALLBACK REQUESTED FROM QUOTE TOOL

Contact: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Email: {{contact.email}}
Address: {{contact.address1}}

CALLBACK PREFERENCES (from notes):
- Day: {{notes.callback_day_preference}}
- Time: {{notes.callback_time_preference}}

QUOTE DETAILS:
- Pests: {{contact.please_describe_your_pest_concern}}
- Home Size: {{custom_values.square_footage}} sqft
- Current Issue Level: {{custom_values.pest_severity}}

ACTION REQUIRED:
1. Call within 30 minutes if during business hours
2. Confirm callback preferences
3. Provide quote and schedule if interested
4. Update task with outcome
```

#### Step 2: Slack Notification
- **Action:** Send Webhook  
- **URL:** [Slack webhook URL]
- **Payload:**
```json
{
  "text": "📞 CALLBACK REQUESTED - URGENT",
  "attachments": [
    {
      "color": "warning",
      "fields": [
        {"title": "Customer", "value": "{{contact.first_name}} {{contact.last_name}}", "short": true},
        {"title": "Phone", "value": "{{contact.phone}}", "short": true},
        {"title": "Callback Day", "value": "{{notes.callback_day_preference}}", "short": true},
        {"title": "Callback Time", "value": "{{notes.callback_time_preference}}", "short": true},
        {"title": "Pest Issue", "value": "{{contact.please_describe_your_pest_concern}}", "short": false}
      ]
    }
  ]
}
```

#### Step 3: Send Customer Confirmation Text
- **Action:** Send SMS
- **From:** Forterra Pest Control  
- **Message:**
```
Hi {{contact.first_name}}! We got your callback request. We'll call you {{notes.callback_day_preference}} {{notes.callback_time_preference}} about your {{contact.please_describe_your_pest_concern}} issue.

Any urgent concerns? Call us now: (817) 665-6527

Reply STOP to opt out.
- Forterra Pest Control
```

#### Step 4: Wait for Business Hours Check
- **Action:** Wait
- **Wait Type:** Until business hours (Mon-Fri 8am-5pm, Sat 8am-12pm CST)
- **Max Wait:** 30 minutes

#### Step 5: Check if CSR Responded
- **Action:** IF/ELSE Branch
- **Condition:** Task from Step 1 is marked "Completed"
- **If NO:** Continue to escalation (Step 6)
- **If YES:** End workflow

#### Step 6: Escalation - Additional Notification
- **Action:** Send Webhook
- **URL:** [Slack webhook URL]  
- **Payload:**
```json
{
  "text": "⚠️ CALLBACK ESCALATION - 30 MIN NO RESPONSE",
  "attachments": [
    {
      "color": "danger",
      "text": "{{contact.first_name}} {{contact.last_name}} ({{contact.phone}}) requested callback 30+ minutes ago. No CSR response yet. Please prioritize!"
    }
  ]
}
```

#### Step 7: Create Escalated Task
- **Action:** Create Task
- **Assign to:** Rachelle (CSR Lead)
- **Task Title:** ⚠️ ESCALATED CALLBACK - {{contact.first_name}} {{contact.last_name}}
- **Priority:** Urgent
- **Due Date:** Today + 15 minutes
- **Description:**
```
ESCALATED: No CSR response to callback request in 30+ minutes

Original request time: {{workflow.start_time}}
Customer: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Callback preferences: {{notes.callback_day_preference}} {{notes.callback_time_preference}}

IMMEDIATE ACTION REQUIRED - Call now or delegate to available CSR.
```

#### Step 8: Add Tags
- **Action:** Add Tags
- **Tags to Add:** `callback-pending`, `csr-notified`

---

## 3. QUOTE ABANDONED — Nurture Sequence

**Trigger:** Contact receives tag `quote-in-progress`

### Workflow Steps:

#### Step 1: Wait Period
- **Action:** Wait
- **Wait Time:** 15 minutes

#### Step 2: Check if Quote Completed
- **Action:** IF/ELSE Branch
- **Condition:** Contact has tag `quote-completed`
- **If YES:** End workflow (customer completed quote)
- **If NO:** Continue to nurture sequence

#### Step 3: Add Abandoned Tag
- **Action:** Add Tags
- **Tags to Add:** `quote-abandoned`
- **Tags to Remove:** `quote-in-progress`

#### Step 4: Nurture Touch #1 (Text) - Immediate
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
Hi {{contact.first_name}}! Saw you were getting a quote for {{contact.please_describe_your_pest_concern}} at {{contact.address1}}. Need help finishing up? 

We're here: (817) 665-6527 
5.0⭐ 2,600+ reviews

Reply STOP to opt out.
- Forterra Pest Control
```

#### Step 5: Wait Period
- **Action:** Wait  
- **Wait Time:** 1 day

#### Step 6: Check if Quote Completed
- **Action:** IF/ELSE Branch
- **Condition:** Contact has tag `quote-completed` OR contact has tag `customer-called-in`
- **If YES:** End workflow
- **If NO:** Continue to Touch #2

#### Step 7: Nurture Touch #2 (Email) - Day 1
- **Action:** Send Email
- **From:** Forterra Pest Control <info@forterrapestcontrol.com>
- **Subject:** Still dealing with {{contact.please_describe_your_pest_concern}} at {{contact.address1}}?
- **Body:**
```html
<p>Hi {{contact.first_name}},</p>

<p>I noticed you started a quote for {{contact.please_describe_your_pest_concern}} service at your {{contact.address1}} property, but didn't get a chance to finish.</p>

<p><strong>No worries!</strong> Happens to the best of us. 😊</p>

<p>Here's what makes Forterra different in DFW:</p>
<ul>
<li>⭐ <strong>5.0 stars</strong> with over 2,600 Google reviews</li>
<li>💯 <strong>Money-back guarantee</strong> if you're not satisfied</li>
<li>🔄 <strong>Free re-services</strong> if pests return between visits</li>
<li>👨‍👩‍👧‍👦 <strong>Local family business</strong> since 2016</li>
</ul>

<p><strong>Ready to finish your quote?</strong><br>
<a href="quote.forterrapestcontrol.com/forterra-pricing-lemonade" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Quote</a></p>

<p>Or just call us: <strong>(817) 665-6527</strong></p>

<p>Questions? Just reply to this email!</p>

<p>Best,<br>
<strong>The Forterra Team</strong></p>

<hr>
<p><small><a href="{{unsubscribe_link}}">Unsubscribe</a> | Forterra Pest Control | Serving DFW</small></p>
```

#### Step 8: Wait Period
- **Action:** Wait
- **Wait Time:** 2 days

#### Step 9: Check if Quote Completed  
- **Action:** IF/ELSE Branch
- **Condition:** Contact has tag `quote-completed` OR contact has tag `customer-called-in`
- **If YES:** End workflow
- **If NO:** Continue to Touch #3

#### Step 10: Nurture Touch #3 (Text) - Day 3
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
{{contact.first_name}}, quick question about the {{contact.please_describe_your_pest_concern}} at your place - are they getting worse? 

DFW pest issues don't fix themselves! 😬 

Get your quote: quote.forterrapestcontrol.com/forterra-pricing-lemonade
Or call: (817) 665-6527

Reply STOP to opt out.
```

#### Step 11: Wait Period
- **Action:** Wait
- **Wait Time:** 2 days

#### Step 12: Check if Quote Completed
- **Action:** IF/ELSE Branch  
- **Condition:** Contact has tag `quote-completed` OR contact has tag `customer-called-in`
- **If YES:** End workflow
- **If NO:** Continue to Touch #4

#### Step 13: Nurture Touch #4 (Email) - Day 5
- **Action:** Send Email
- **From:** Forterra Pest Control <info@forterrapestcontrol.com>
- **Subject:** {{contact.first_name}}, here's what our {{contact.please_describe_your_pest_concern}} customers say...
- **Body:**
```html
<p>Hi {{contact.first_name}},</p>

<p>Since you were interested in {{contact.please_describe_your_pest_concern}} control for your {{contact.address1}} property, I thought you'd like to see what other DFW homeowners are saying:</p>

<div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
<p><em>"Finally found a pest control company that actually works! No more ants in my kitchen. Highly recommend Forterra!"</em></p>
<p><strong>- Sarah M., Southlake</strong> ⭐⭐⭐⭐⭐</p>
</div>

<div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
<p><em>"Professional, reliable, and actually care about solving the problem. Been using them for 2 years now."</em></p>
<p><strong>- Mike R., Flower Mound</strong> ⭐⭐⭐⭐⭐</p>
</div>

<p><strong>Why wait any longer?</strong> Those {{contact.please_describe_your_pest_concern}} aren't going anywhere on their own.</p>

<p><a href="quote.forterrapestcontrol.com/forterra-pricing-lemonade" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Your Quote Now</a></p>

<p>Questions? Call us: <strong>(817) 665-6527</strong></p>

<p>Thanks,<br>
<strong>The Forterra Team</strong></p>

<hr>
<p><small><a href="{{unsubscribe_link}}">Unsubscribe</a> | Forterra Pest Control</small></p>
```

#### Step 14: Wait Period
- **Action:** Wait
- **Wait Time:** 2 days

#### Step 15: Check if Quote Completed
- **Action:** IF/ELSE Branch
- **Condition:** Contact has tag `quote-completed` OR contact has tag `customer-called-in`  
- **If YES:** End workflow
- **If NO:** Continue to final touch

#### Step 16: Nurture Touch #5 (Final Text) - Day 7  
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
{{contact.first_name}}, this is our final reminder about {{contact.please_describe_your_pest_concern}} service for {{contact.address1}}.

2,600+ DFW homeowners chose Forterra. Join them?

Quote: quote.forterrapestcontrol.com/forterra-pricing-lemonade
Call: (817) 665-6527

Reply STOP to opt out.
- Forterra Team
```

#### Step 17: Final Tags Update
- **Action:** Add Tags
- **Tags to Add:** `nurture-completed`
- **Tags to Remove:** `quote-abandoned`

---

## 4. RODENT INSPECTION + CUSTOM QUOTE — Inspection Routing

**Triggers:** 
- Contact receives tag `quote-rodent-inspection` OR
- Contact receives tag `quote-custom-quote`

### Workflow Steps:

#### Step 1: Branch on Quote Type
- **Action:** IF/ELSE Branch
- **Condition 1:** Contact has tag `quote-rodent-inspection`
- **Condition 2:** Contact has tag `quote-custom-quote`
- **Default:** End workflow (error state)

#### Step 2A: Rodent Inspection Confirmation Text
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
Hi {{contact.first_name}}! We'll need to inspect for rodents at {{contact.address1}} before providing an accurate quote.

A CSR will call within 24hrs to schedule your FREE inspection.

Questions? (817) 665-6527
Reply STOP to opt out.
- Forterra Pest Control
```

#### Step 2B: Custom Quote Confirmation Text  
- **Action:** Send SMS
- **From:** Forterra Pest Control
- **Message:**
```
Hi {{contact.first_name}}! We'll create a custom quote for your {{contact.please_describe_your_pest_concern}} situation at {{contact.address1}}.

A CSR will call within 24hrs to discuss details and pricing.

Questions? (817) 665-6527
Reply STOP to opt out.
- Forterra Pest Control
```

#### Step 3: Create CSR Task
- **Action:** Create Task
- **Assign to:** CSR Team (Round Robin: Rachelle, Lyra, Aira, Angela, Hassan)
- **Task Title:** Schedule Inspection - {{contact.first_name}} {{contact.last_name}}
- **Due Date:** Today + 4 hours
- **Description:**
```
INSPECTION REQUIRED

Contact: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Email: {{contact.email}}
Address: {{contact.address1}}
Type: {{#if quote-rodent-inspection}}Rodent Inspection{{else}}Custom Quote Inspection{{/if}}

ISSUE DETAILS:
- Pest Type: {{contact.please_describe_your_pest_concern}}
- Home Size: {{custom_values.square_footage}} sqft
- Severity: {{custom_values.pest_severity}}
- Notes: {{notes}}

ACTION REQUIRED:
1. Call customer to schedule inspection
2. Coordinate with technician availability  
3. Confirm inspection appointment
4. Update opportunity with scheduled date/time
```

#### Step 4: Slack Notification
- **Action:** Send Webhook
- **URL:** [Slack webhook URL]
- **Payload:**
```json
{
  "text": "🔍 INSPECTION REQUIRED",
  "attachments": [
    {
      "color": "#ff9800",
      "fields": [
        {"title": "Customer", "value": "{{contact.first_name}} {{contact.last_name}}", "short": true},
        {"title": "Phone", "value": "{{contact.phone}}", "short": true},
        {"title": "Type", "value": "{{#if quote-rodent-inspection}}Rodent Inspection{{else}}Custom Quote{{/if}}", "short": true},
        {"title": "Pest Issue", "value": "{{contact.please_describe_your_pest_concern}}", "short": true},
        {"title": "Address", "value": "{{contact.address1}}", "short": false}
      ]
    }
  ]
}
```

#### Step 5: Wait for CSR Response
- **Action:** Wait
- **Wait Time:** 24 hours

#### Step 6: Check if CSR Responded
- **Action:** IF/ELSE Branch
- **Condition:** Task from Step 3 is marked "Completed"
- **If YES:** End workflow
- **If NO:** Continue to follow-up

#### Step 7: 24hr Follow-up Notification
- **Action:** Send Webhook
- **URL:** [Slack webhook URL]
- **Payload:**
```json
{
  "text": "⏰ INSPECTION FOLLOW-UP NEEDED",
  "attachments": [
    {
      "color": "danger", 
      "text": "{{contact.first_name}} {{contact.last_name}} ({{contact.phone}}) needs inspection scheduling. No CSR contact in 24hrs. Please follow up!"
    }
  ]
}
```

#### Step 8: Create Follow-up Task
- **Action:** Create Task
- **Assign to:** Rachelle (CSR Lead)
- **Task Title:** FOLLOW-UP: Inspection Needed - {{contact.first_name}} {{contact.last_name}}
- **Priority:** High
- **Due Date:** Today + 2 hours
- **Description:**
```
24-HOUR FOLLOW-UP REQUIRED

Original inspection request: {{workflow.start_time}}
Customer: {{contact.first_name}} {{contact.last_name}}
Phone: {{contact.phone}}
Type: {{#if quote-rodent-inspection}}Rodent Inspection{{else}}Custom Quote{{/if}}

No CSR contact in 24 hours. Customer is waiting.
Priority follow-up required.
```

#### Step 9: Add Tags
- **Action:** Add Tags
- **Tags to Add:** `inspection-requested`, `awaiting-csr-contact`
- **Tags to Remove:** `quote-in-progress`

---

## Implementation Notes for David

### GHL Workflow Builder Setup Tips:

1. **Triggers:** Use "Tag Added" trigger for each workflow
2. **Merge Fields:** Ensure these custom fields exist in GHL:
   - `custom_values.selected_plan`
   - `custom_values.pest_types` 
   - `custom_values.preferred_date`
   - `custom_values.square_footage`
   - `custom_values.pest_severity`
   - `notes.callback_day_preference`
   - `notes.callback_time_preference`

3. **Business Hours:** Set up GHL business hours (Mon-Fri 8am-5pm, Sat 8am-12pm CST)

4. **Task Assignment:** Configure CSR team round-robin rotation

5. **Pipeline Stages:** Ensure "Confirmed - Awaiting Schedule" stage exists

6. **Slack Webhook:** Replace `[Slack webhook URL]` with actual webhook URL

7. **Stop Conditions:** Each nurture workflow should check for `quote-completed` or `customer-called-in` tags to stop sequence

8. **Unsubscribe Links:** GHL will automatically populate `{{unsubscribe_link}}` merge field

### Testing Checklist:

- [ ] Test each trigger condition
- [ ] Verify SMS character limits (160 max)
- [ ] Test email rendering on mobile/desktop  
- [ ] Confirm Slack notifications work
- [ ] Validate task assignments
- [ ] Test pipeline stage changes
- [ ] Verify tag additions/removals
- [ ] Test stop conditions in nurture sequences
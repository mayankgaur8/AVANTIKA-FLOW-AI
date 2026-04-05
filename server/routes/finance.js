/**
 * /api/finance/* — Finance & Accounting Workflow Builders
 *
 * Four AI-powered finance workflow builders:
 *   financeType 'invoice'  → /finance/invoice-processing
 *   financeType 'expense'  → /finance/expense-approvals
 *   financeType 'audit'    → /finance/audit-docs
 *   financeType 'training' → /finance/tool-training
 *
 * All guides are stored via the same Guide+Step data model.
 * guide.source is set to the financeType for filtering.
 */

const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  createGuideRecord,
  upsertGuideSteps,
  addGuideActivity,
} = require('../db/store');

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user = usersById.get(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

// ─── Step banks — Invoice Processing ─────────────────────────────────────────

const INVOICE_STEPS = {
  ap: [
    { title: 'Receive and log incoming invoice', description: 'Record invoice in the AP system with vendor name, invoice number, amount, due date, and PO reference. Confirm receipt with vendor if needed.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Extract and validate key data fields', description: 'Verify vendor ID matches master file, confirm invoice number format, validate amount is numeric, and check GL coding requirements.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Match invoice to vendor master', description: 'Confirm vendor is active, not on payment hold, and tax ID (W-9/W-8) is on file. Verify payment terms match the vendor contract.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Three-way match: Invoice × PO × Goods Receipt', description: 'Verify invoice amount matches PO amount and goods receipt quantity within tolerance (±5%). Flag any discrepancies for buyer resolution before proceeding.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Route to approver per spend threshold', description: 'Under $1K: auto-approve. $1K–$10K: department manager approval. Over $10K: VP or CFO sign-off required. Log routing decision with timestamp.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Code to GL account and cost center', description: 'Apply correct general ledger account, department cost center, and budget code. Confirm with budget owner if coding is ambiguous.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Schedule payment per vendor net terms', description: 'Queue payment for net-30/60/90 date in the payment run. Apply early-pay discount (2/10 net 30) where available and beneficial.', action_type: 'action', approval_level: 'auto' },
    { title: 'Confirm payment and update AP records', description: 'After payment clears, mark invoice as paid with payment date, amount, and method. Send remittance advice to vendor.', action_type: 'confirmation', approval_level: 'auto' },
    { title: 'Archive invoice and log audit trail', description: 'Store original invoice image and all approval documentation in the document management system with 7-year retention policy applied.', action_type: 'documentation', approval_level: 'auto' },
  ],
  vendor: [
    { title: 'Collect vendor onboarding documentation', description: 'Request W-9 (US) or W-8BEN (foreign), banking details, business license, and primary contact. Use secure document portal, not email.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Set up vendor in ERP master data', description: 'Create vendor record: legal name, tax ID, payment terms, remittance address, preferred payment method (ACH/check/wire). Assign vendor category.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Validate vendor against compliance lists', description: 'Screen against OFAC SDN list, debarment lists, and company vendor blacklist. Document screening results. Escalate any matches to compliance team.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Finance director approval for new vendor', description: 'New vendors over $5K annual spend require finance director sign-off. Attach compliance screening results and business justification to approval request.', action_type: 'approval', approval_level: 'finance' },
    { title: 'Receive and validate first invoice', description: 'Apply enhanced validation to the first invoice: confirm invoice matches contract terms, services delivered, and approved statement of work.', action_type: 'verification', approval_level: 'manager' },
    { title: 'Process first payment with added verification', description: 'Finance controller verifies banking details against vendor-provided documentation before releasing first payment. Confirm ACH routing manually.', action_type: 'approval', approval_level: 'finance' },
    { title: 'Activate vendor for standard AP processing', description: 'After successful first payment, activate vendor for standard AP flow. Set payment run frequency, credit limit, and auto-approval threshold.', action_type: 'action', approval_level: 'auto' },
    { title: 'Document and archive vendor setup', description: 'Save all onboarding documentation to vendor file in DMS. Record activation date and approving authority. Schedule annual vendor review.', action_type: 'documentation', approval_level: 'auto' },
  ],
  recurring: [
    { title: 'Identify and document recurring payment obligation', description: 'Capture the vendor, contract amount, frequency, and business justification. Attach signed contract or subscription agreement.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Finance manager approval to set up recurring payment', description: 'Recurring payments require explicit finance manager approval. Confirm amount, frequency, and GL coding before automation is enabled.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Configure recurring invoice template in AP system', description: 'Set up the recurring template: vendor ID, amount, frequency (monthly/quarterly/annual), start date, end date, and auto-approval threshold.', action_type: 'setup', approval_level: 'auto' },
    { title: 'Monthly validation: confirm amount matches contract', description: 'Before each auto-payment run, confirm the invoice amount matches the contracted rate. Flag variances above 1% for manual review.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Process automated payment on schedule', description: 'Execute payment on the configured schedule. Log payment date, amount, method, and reference number in the AP system.', action_type: 'action', approval_level: 'auto' },
    { title: 'Reconcile against GL and bank statement', description: 'Match each automated payment to the corresponding GL entry and bank transaction within 5 business days of payment.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Annual review of recurring vendor contracts', description: 'Every 12 months, review all recurring payments. Confirm service is still needed, pricing is competitive, and contract is current. Re-approve or cancel.', action_type: 'review', approval_level: 'manager' },
  ],
  po: [
    { title: 'Receive vendor invoice and link to open PO', description: 'Log invoice in AP system. Search for matching purchase order by vendor ID or PO number. Link invoice to PO before proceeding.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Validate invoice line items against PO', description: 'Compare each invoice line item to the corresponding PO line: description, quantity, unit price, and extended amount. Flag any line-level discrepancies.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Confirm goods receipt is recorded', description: 'Verify that a goods receipt (GR) document exists for the invoiced items. Ensure GR quantity matches invoiced quantity. Contact receiving team if GR is missing.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Execute three-way match', description: 'System performs three-way match: PO quantity = GR quantity = Invoice quantity. Price tolerance check: invoice price within ±2% of PO price. Auto-approve if match passes.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Resolve discrepancies with buyer', description: 'Send discrepancy report to the PO owner (buyer). They must either request a PO amendment or instruct the vendor to issue a credit memo. SLA: 3 business days.', action_type: 'communication', approval_level: 'auto' },
    { title: 'Route for approval after match confirmation', description: 'After match: auto-approve invoices under $5K. Over $5K, route to department head for final sign-off. Log approver, timestamp, and comments.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Code and post to GL', description: 'Inherit GL account and cost center from the original PO. Verify budget availability before posting. Post to AP subledger and GL simultaneously.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Process payment per PO payment terms', description: 'Execute payment on the PO-defined payment terms. For multi-GR POs, partial payments are allowed equal to received quantities only.', action_type: 'action', approval_level: 'auto' },
    { title: 'Close PO when fully invoiced and paid', description: 'After final invoice is paid, close the PO in the system. Archive all three-way match documentation and payment records for 7 years.', action_type: 'documentation', approval_level: 'auto' },
  ],
};

// ─── Step banks — Expense Approvals ──────────────────────────────────────────

const EXPENSE_STEPS = {
  travel: [
    { title: 'Submit expense report in system', description: 'Log in to Concur/Expensify. Create a new expense report with trip name, travel dates, business purpose, and cost center.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Upload receipts for all items over $25', description: 'Attach digital receipts to each line item. Receipt must show date, vendor name, and amount. Credit card statements are not acceptable substitutes.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Validate against travel policy limits', description: 'System checks: flights (economy unless >6 hours), hotel ($250/night cap), meals ($75/day per diem), ride-share (no black car unless >$150 flight saved).', action_type: 'verification', approval_level: 'auto' },
    { title: 'Check for duplicate submissions', description: 'System scans for duplicate amounts within the same 30-day period and same vendor. Flagged duplicates are held for manual review before routing.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Manager review and approval', description: 'Direct manager receives approval request. SLA: 3 business days. Manager confirms business purpose, receipts are present, and amounts are within policy.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Finance review for amounts over $2,500', description: 'Finance team reviews high-value or exception reports. They verify GL coding, policy compliance, and confirm no duplicate or prior submission exists.', action_type: 'approval', approval_level: 'finance' },
    { title: 'Process reimbursement', description: 'Approved reports are included in the next biweekly payroll ACH run or processed as direct deposit within 5 business days of final approval.', action_type: 'action', approval_level: 'auto' },
    { title: 'Code to cost center and trip ID', description: 'Finance team applies GL account (travel & entertainment, 6200) and cost center. Link to the project or customer if client-billable.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Archive for audit (7-year retention)', description: 'Store expense report, receipts, and approval documentation in the expense management system. Apply 7-year IRS retention policy.', action_type: 'documentation', approval_level: 'auto' },
  ],
  software: [
    { title: 'Submit software or subscription request', description: 'Enter tool name, vendor, annual cost, number of seats, and business justification. Include a link to the vendor security questionnaire if available.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'IT review: check for existing license or approved alternative', description: 'IT team checks the software asset register. If an existing license covers the need, reject the request and reassign a seat. SLA: 2 business days.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Security review for tools accessing company data', description: 'Any tool that accesses or stores company data must pass a security review: SOC 2 report, data residency, encryption standards, and vendor risk tier.', action_type: 'security', approval_level: 'auto' },
    { title: 'Budget availability check', description: 'Finance confirms budget availability in the department software/SaaS budget line. Over-budget requests require department head approval before proceeding.', action_type: 'verification', approval_level: 'finance' },
    { title: 'Manager approval (under $500/yr) or finance approval (over $500/yr)', description: 'Managers approve small tools under $500/yr. Finance director approval required for anything over $500/yr or any tool with multi-year commitment.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Procurement activates subscription or places order', description: 'Procurement uses the approved vendor portal to activate the subscription or issue a PO. Obtain a vendor invoice and confirmation email.', action_type: 'action', approval_level: 'auto' },
    { title: 'Add to software asset register and renewal calendar', description: 'Log the tool in the software asset register with: seats, annual cost, renewal date, business owner, and security tier. Set renewal reminder 90 days in advance.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Code to IT/software cost center', description: 'Finance codes the invoice to GL account 6400 (Software and Subscriptions) and the requesting department cost center. Apply capitalization rules if multi-year.', action_type: 'accounting', approval_level: 'auto' },
  ],
  equipment: [
    { title: 'Submit equipment request with vendor quote', description: 'Provide vendor quote, item description, technical specifications, and business justification. Attach manager pre-approval email if over $1,000.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'IT review: verify specs and check available stock', description: 'IT confirms the requested specs meet company standards. Check the equipment pool for available refurbished or previously assigned units before approving new purchase.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Asset management: available from existing stock?', description: 'Asset management team confirms whether a comparable device is available in inventory. If yes, assign existing asset and close the request.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Budget availability check (capex vs. opex)', description: 'Finance determines whether the purchase is capitalized (>$2,500, >1 year useful life) or expensed. Confirms budget availability in the appropriate budget line.', action_type: 'verification', approval_level: 'finance' },
    { title: 'Approval routing by amount', description: 'Under $2,000: manager approval. $2,000–$10,000: director + finance approval. Over $10,000: VP + CFO sign-off. All approvals logged with timestamp.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Issue purchase order to approved vendor', description: 'Procurement issues a formal PO referencing the approved vendor quote. PO includes delivery address, requested delivery date, and receiving instructions.', action_type: 'action', approval_level: 'auto' },
    { title: 'Receive, inspect, and tag equipment on delivery', description: 'Receiving team inspects for damage and verifies against PO. IT affixes asset tag. Serial number and asset tag are logged in the asset management system.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Add to fixed asset register with depreciation schedule', description: 'Finance records the asset with purchase date, cost, useful life, and depreciation method (straight-line, 3 years for laptops). Apply capitalization policy.', action_type: 'accounting', approval_level: 'auto' },
  ],
  general: [
    { title: 'Submit expense with category and business purpose', description: 'Complete expense entry: amount, vendor, date, category, and a clear business purpose. All fields are required — generic descriptions ("meeting", "lunch") are rejected.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Attach supporting documentation', description: 'Upload receipt, invoice, or approved quote. For items over $100, the documentation must show itemized breakdown. Credit card statements alone are insufficient.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'AI policy validation: check limits and category', description: 'System validates: amount is within the category limit, category is approved for this employee role, and GL coding is consistent with historical usage. Flags exceptions.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Duplicate submission check', description: 'System compares against all submissions in the trailing 60 days. Matches on vendor + amount ± 5% + date ± 7 days are flagged for review.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Manager approval within 5 business days', description: 'Manager receives notification and must approve, reject, or return for more information within 5 business days. Unanswered requests escalate to department head.', action_type: 'approval', approval_level: 'manager' },
    { title: 'Finance review for exceptions and high-value items', description: 'Finance reviews any flagged policy exception, amount over $1,000, or unusual category. Finance can approve with noted exception or reject with required corrections.', action_type: 'approval', approval_level: 'finance' },
    { title: 'Code to GL account and cost center', description: 'Assign correct GL account per expense category. Apply cost center of the submitting employee. Flag for project coding if billable.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Archive with audit trail', description: 'Store original submission, receipts, approval chain, and GL coding in the expense system. Retain 7 years per policy. Generate audit log entry automatically.', action_type: 'documentation', approval_level: 'auto' },
  ],
};

// ─── Step banks — Audit Documentation ────────────────────────────────────────

const AUDIT_STEPS = {
  invoice: [
    { title: 'Define audit scope and sampling period', description: 'Specify the date range, vendor population, and dollar threshold for the audit. Document the sampling methodology (statistical random, risk-based, or 100% for high-value).', action_type: 'planning', approval_level: 'auto' },
    { title: 'Extract all AP transactions from ERP', description: 'Pull a complete AP transaction ledger for the audit period. Export includes: vendor, invoice #, amount, GL code, approver, and payment date.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Verify each invoice has a corresponding PO or approval', description: 'For every transaction in the sample, confirm there is either a linked PO or a documented approval from an authorized signer at the correct spend level.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Confirm three-way match documentation is complete', description: 'Verify PO, goods receipt, and invoice are all present and reconcile within tolerance for every PO-based transaction in the sample.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Check for duplicate payments or invoices', description: 'Run duplicate detection across the full population: same vendor + same amount + same period. Investigate all matches to confirm legitimate or identify recovery items.', action_type: 'investigation', approval_level: 'auto' },
    { title: 'Review approval authority compliance', description: 'Confirm every invoice was approved by the correct authority level per the Delegated Authority Matrix. Flag any where approval was below the required level.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Verify payment terms and actual payment timing', description: 'For a random sample, confirm payments were made within contracted terms. Identify early or late payments and their financial impact.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Identify exceptions and document findings', description: 'List every exception with the invoice number, finding type, risk rating (high/medium/low), root cause, and recommended remediation.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Generate structured audit report', description: 'Compile executive summary, scope, methodology, findings table, and recommendations into a formal audit report. Include statistics: exception rate, total exceptions, dollar impact.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'CFO sign-off and distribution', description: 'Submit report to CFO or Controller for sign-off. Distribute to AP manager, internal audit, and external auditors if applicable. Archive with 7-year retention.', action_type: 'approval', approval_level: 'finance' },
  ],
  expense: [
    { title: 'Define audit scope and sampling methodology', description: 'Specify the period, employee population, and sampling approach. Higher-risk groups (frequent travelers, senior executives, sales team) receive increased sample rates.', action_type: 'planning', approval_level: 'auto' },
    { title: 'Extract all expense reports for the period', description: 'Pull expense data from the expense management system. Export: employee name, report date, total amount, category breakdown, approval chain, and reimbursement date.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Verify receipts for all items over the threshold', description: 'For each transaction over $25 in the sample, confirm a receipt is attached and matches the claimed amount, vendor, and date.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Test compliance with category limits', description: 'Compare each expense category to the current Travel & Expense Policy. Flag any amounts exceeding: meal per diem, hotel cap, flight class restrictions.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Confirm manager and finance approvals are documented', description: 'For each expense report in the sample, verify the full approval chain is complete and approvers are authorized for the claimed amounts.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Screen for duplicate and suspicious submissions', description: 'Run duplicate detection: same employee + similar amount + same vendor within 30 days. Also flag weekend personal expenses submitted as business, or personal categories.', action_type: 'investigation', approval_level: 'auto' },
    { title: 'Review and categorize exceptions', description: 'Document each exception: type (missing receipt, over-limit, duplicate, unauthorized category), risk level, employee, amount, and whether it was approved as exception.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Calculate total exception impact', description: 'Sum all exceptions by type and category. Calculate exception rate (exceptions / total reports) and total dollar value of policy deviations.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Generate expense audit report', description: 'Compile formal report: scope, methodology, key findings, exception analysis, trend comparison vs. prior periods, and recommendations for policy or control updates.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Distribute to Finance Director and HR', description: 'Share report with Finance Director, HR (for potential policy training), and Internal Audit. Follow up with affected employees for reimbursement recovery if applicable.', action_type: 'communication', approval_level: 'finance' },
  ],
  payment: [
    { title: 'Extract all payment transactions for the audit period', description: 'Pull complete payment register from the bank and ERP: payment date, payee, amount, payment method, and reference number. Reconcile total to GL cash account.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Verify each payment has an approved source document', description: 'For every payment in the sample, confirm there is an approved invoice or expense report as the source. Payments without source documents are critical findings.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Confirm payment amounts match approved source documents', description: 'Compare the payment amount to the approved invoice or expense amount. Flag any variance. Overpayments are recovery items; underpayments indicate process failure.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Review dual-authorization controls for large payments', description: 'Payments over the dual-authorization threshold (typically $10K) must have two authorized signers. Verify both approvals are present and authorizers are different individuals.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Reconcile payments against bank statements', description: 'Match every ERP payment record to the corresponding bank statement line item for the audit period. Identify and investigate all unreconciled items within 10 days.', action_type: 'accounting', approval_level: 'auto' },
    { title: 'Review for unauthorized or unusual payees', description: 'Screen all payees against vendor master. Flag any payments to non-vendors, employees (outside payroll), or new payees added within 30 days of payment.', action_type: 'investigation', approval_level: 'auto' },
    { title: 'Document all exceptions with dispositions', description: 'List every exception: payment without approval, payee mismatch, amount discrepancy, or dual-auth failure. Record the disposition (resolved, recovered, reported to management).', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Generate payment audit trail report', description: 'Compile formal report with executive summary, exception register, total dollar exposure, and recommendations for control improvements. Include bank reconciliation as appendix.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Archive with bank reconciliation evidence', description: 'Store the audit report, exception register, bank statements, and disposition documentation. Retain 7 years. Provide auditor access link for external review.', action_type: 'documentation', approval_level: 'finance' },
  ],
  general: [
    { title: 'Define audit scope, objectives, and timeline', description: 'Document: processes in scope, date range, materiality threshold, sampling size, audit team, and report delivery date. Get CFO sign-off on scope before starting.', action_type: 'planning', approval_level: 'auto' },
    { title: 'Collect financial documentation for the period', description: 'Gather: GL trial balance, bank statements, AP/AR aging, payroll register, fixed asset schedule, and all supporting transaction-level documentation.', action_type: 'data-entry', approval_level: 'auto' },
    { title: 'Review internal controls: segregation of duties', description: 'Map key control points: who initiates, who approves, who pays. Identify any instances where one person controls more than one step without oversight.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Test transactions for policy compliance', description: 'For each sampled transaction type, verify compliance against the applicable policy: Delegated Authority Matrix, T&E Policy, Procurement Policy, and Capitalization Policy.', action_type: 'verification', approval_level: 'auto' },
    { title: 'Identify and document control weaknesses', description: 'List every control gap, policy deviation, or segregation of duties issue. Rate severity: critical (immediate remediation), high, medium, low. Link to specific transactions as evidence.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Obtain management responses to preliminary findings', description: 'Share draft findings with process owners. Allow 5 business days for written management responses. Document each response: accepted, disputed, or remediation committed.', action_type: 'communication', approval_level: 'auto' },
    { title: 'Finalize audit report with remediation plan', description: 'Compile final report: executive summary, findings, management responses, risk ratings, and a time-bound remediation plan with named owners for each action item.', action_type: 'documentation', approval_level: 'auto' },
    { title: 'Senior management and audit committee sign-off', description: 'Present findings to CFO and Audit Committee. Obtain sign-off. Record dissenting opinions if any. File report as board-level governance document.', action_type: 'approval', approval_level: 'finance' },
    { title: 'Distribute to stakeholders', description: 'Send final report to CFO, Controller, department heads affected, Internal Audit, and external auditors. Store in audit repository with access controls.', action_type: 'communication', approval_level: 'auto' },
    { title: 'Schedule remediation follow-up', description: 'Calendar 30-, 60-, and 90-day check-ins with remediation owners. Confirm each action item is completed on schedule. Update audit status tracker.', action_type: 'planning', approval_level: 'auto' },
  ],
};

// ─── Step banks — Financial Tool Training ────────────────────────────────────

const TRAINING_STEPS = {
  sap: [
    { title: 'Request SAP user account with correct role', description: 'Submit a user provisioning request specifying the SAP module (FI/CO, MM, SD) and access level. Manager and IT must co-approve before account creation.', action_type: 'setup' },
    { title: 'Log in and navigate SAP Easy Access menu', description: 'Launch SAP GUI or Fiori. Navigate the Easy Access tree: Accounting → Financial Accounting → Accounts Payable. Use the search field (Ctrl+F) to find transaction codes.', action_type: 'training' },
    { title: 'Understand the organizational structure', description: 'Learn key SAP org units: Company Code (legal entity), Plant (operational unit), Cost Center (department bucket), and Profit Center (business segment).', action_type: 'training' },
    { title: 'Master essential transaction codes', description: 'Practice: FB01 (general journal entry), FB60 (vendor invoice entry), MIRO (logistics invoice verification), F-28 (incoming payment), FBL1N (vendor line item report).', action_type: 'training' },
    { title: 'Post a test vendor invoice using FB60 or MIRO', description: 'In the training client, post a complete vendor invoice: enter vendor, invoice date, amount, GL account, cost center, and payment terms. Simulate the full posting cycle.', action_type: 'action' },
    { title: 'Run standard financial reports', description: 'Generate: FS10N (GL account balance), FBL5N (customer line items), FBL1N (vendor line items), and S_ALR_87012082 (AP aging). Export to Excel.', action_type: 'training' },
    { title: 'Learn month-end procedures', description: 'Execute: MMPV (open new MM period), F.16 (carry forward GL balances), and F.07 (post recurring entries). Learn the period-end close sequence for FI.', action_type: 'training' },
    { title: 'Configure personal SAP settings and favorites', description: 'Set up: date format (MM/DD/YYYY), decimal notation, personal SAP GUI theme, and add your 5 most-used transactions to the Favorites menu.', action_type: 'configuration' },
  ],
  oracle: [
    { title: 'Request Oracle Financials access with supervisor approval', description: 'Submit access request to IT specifying Oracle Cloud Financials or E-Business Suite module (GL, AP, AR, Expenses). Supervisor approves; IT provisions with role-based security.', action_type: 'setup' },
    { title: 'Navigate the Oracle home page and product workspaces', description: 'Log in via SSO. Explore the Navigator menu: Financials → General Ledger, Accounts Payable, Accounts Receivable. Understand the Springboard and recent items sidebar.', action_type: 'training' },
    { title: 'Understand the Chart of Accounts structure', description: 'Learn the accounting flexfield segments: Entity (company), Department (cost center), Natural Account (GL code), Project (optional). Understand how segments combine to form GL accounts.', action_type: 'training' },
    { title: 'Create and post a journal entry in General Ledger', description: 'Navigate to General Accounting → Journals. Create a manual journal: enter date, ledger, category, debit/credit lines, and description. Submit for approval and post.', action_type: 'action' },
    { title: 'Process a supplier invoice in Accounts Payable', description: 'Navigate to Payables → Invoices → Create Invoice. Enter supplier, invoice number, date, amount, and distribution lines. Match to PO if applicable. Submit for approval.', action_type: 'action' },
    { title: 'Run standard financial reports from Financial Reporting Center', description: 'Access the Financial Reporting Center. Run: Trial Balance, AP Aging, AR Aging, and Payables Invoice Register. Schedule recurring report delivery to email.', action_type: 'training' },
    { title: 'Understand the approval workflow engine', description: 'Review the BPM approval workflow for AP invoices and expenses. Learn where items appear in your worklist, how to delegate, and how to return items for correction.', action_type: 'training' },
    { title: 'Complete period-end steps', description: 'Learn the period-end sequence: reconcile AP/AR subledgers to GL, run mass additions for fixed assets, close AP module, and open the next period. Understand the Close Manager dashboard.', action_type: 'training' },
  ],
  quickbooks: [
    { title: 'Log in and navigate the QuickBooks Dashboard', description: 'Sign in via QuickBooks Online. Explore the left navigation: Dashboard, Banking, Sales, Expenses, Employees, Reports. Understand the Company Snapshot widget.', action_type: 'training' },
    { title: 'Set up or review the Chart of Accounts', description: 'Navigate to Accounting → Chart of Accounts. Review account types: Assets, Liabilities, Equity, Income, Expenses. Add or edit accounts per your company structure.', action_type: 'setup' },
    { title: 'Create and send a customer invoice', description: 'Click + New → Invoice. Select customer, add line items (products/services), set payment terms, and send via email. Learn how to apply payments and mark invoices as paid.', action_type: 'action' },
    { title: 'Record a vendor bill and schedule payment', description: 'Click + New → Bill. Enter vendor, bill date, due date, and expense category. Save and use Pay Bills to schedule ACH or check payment. Confirm payment in the bank feed.', action_type: 'action' },
    { title: 'Reconcile bank accounts', description: 'Navigate to Accounting → Reconcile. Select the account, enter the statement balance and end date. Match each transaction to the bank statement. Identify and resolve discrepancies.', action_type: 'accounting' },
    { title: 'Run P&L, Balance Sheet, and Cash Flow statements', description: 'Navigate to Reports. Run: Profit & Loss (set date range), Balance Sheet (as of period end), and Statement of Cash Flows. Customize column layout and export to Excel or PDF.', action_type: 'training' },
    { title: 'Configure sales tax and payroll (if applicable)', description: 'Set up sales tax rates in Taxes → Sales Tax. If using QuickBooks Payroll, set up employee profiles, pay schedules, and tax withholding. Run a payroll preview before first run.', action_type: 'configuration' },
    { title: 'Export and share reports for accounting review', description: 'Learn to export reports as PDF or Excel. Share report links with your accountant using the Accountant Access feature. Set up recurring email delivery for monthly reports.', action_type: 'action' },
  ],
  erp: [
    { title: 'Request ERP access through IT with finance manager approval', description: 'Submit access request specifying the ERP system, module (Finance, Procurement, Reporting), and access level. Finance manager and IT security must both approve.', action_type: 'setup' },
    { title: 'Complete MFA setup and security onboarding', description: 'Configure multi-factor authentication on first login. Review data classification policy: what financial data can be exported, shared, or accessed remotely.', action_type: 'security' },
    { title: 'Navigate the main financial modules', description: 'Get a guided tour of: General Ledger, Accounts Payable, Accounts Receivable, and Reporting modules. Understand the menu structure, main screens, and key terminology.', action_type: 'training' },
    { title: 'Learn core data entry for your role', description: 'Practice the 2–3 primary screens you will use daily: invoice entry, journal posting, or report generation. Complete 3 practice transactions in the training environment.', action_type: 'action' },
    { title: 'Understand the approval workflow', description: 'Learn where your submitted items appear in the approval queue. Understand how to check status, add comments, and what happens when items are approved, rejected, or returned.', action_type: 'training' },
    { title: 'Run standard financial reports', description: 'Identify the 3–5 reports required for your role. Learn how to run each: select parameters, set the date range, and export in the required format (Excel, PDF, CSV).', action_type: 'training' },
    { title: 'Understand period-end tasks and your responsibilities', description: 'Review the month-end close calendar. Identify which tasks your role owns: transaction cut-off, reconciliations, report sign-off, or sub-ledger close. Confirm deadlines.', action_type: 'training' },
    { title: 'Locate help documentation and system support contacts', description: 'Bookmark: the internal user guide, the ERP help portal, and the IT service desk contact for ERP issues. Note the P1 escalation path for urgent system outages during close.', action_type: 'documentation' },
  ],
};

// ─── Step generators ──────────────────────────────────────────────────────────

const generateInvoiceSteps = (subtype) => {
  const key = (subtype || 'ap').toLowerCase().replace(/[^a-z]/g, '');
  const bank = INVOICE_STEPS[key] || INVOICE_STEPS.ap;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateExpenseSteps = (category) => {
  const key = (category || 'general').toLowerCase().replace(/[^a-z]/g, '');
  const bank = EXPENSE_STEPS[key] || EXPENSE_STEPS.general;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateAuditSteps = (process) => {
  const key = (process || 'general').toLowerCase().replace(/[^a-z]/g, '');
  const bank = AUDIT_STEPS[key] || AUDIT_STEPS.general;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateTrainingSteps = (tool) => {
  const key = (tool || 'erp').toLowerCase().replace(/[^a-z]/g, '');
  const bank = TRAINING_STEPS[key] || TRAINING_STEPS.erp;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

// ─── POST /api/finance/generate ──────────────────────────────────────────────

router.post('/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().allow('').max(2000).default(''),
    financeType: Joi.string().valid('invoice', 'expense', 'audit', 'training').required(),
    // Variant-specific params
    invoiceSubtype: Joi.string().allow('').max(40).default('ap'),       // invoice
    expenseCategory: Joi.string().allow('').max(40).default('general'), // expense
    auditProcess: Joi.string().allow('').max(40).default('general'),    // audit
    tool: Joi.string().allow('').max(40).default('erp'),                // training
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  let steps;
  let aiInsights;

  switch (value.financeType) {
    case 'invoice':
      steps = generateInvoiceSteps(value.invoiceSubtype);
      aiInsights = [
        'AP workflow pattern detected and mapped',
        'Three-way match verification step included',
        'Spend-threshold approval routing configured',
        '7-year audit retention policy applied',
      ];
      break;

    case 'expense':
      steps = generateExpenseSteps(value.expenseCategory);
      aiInsights = [
        'Expense category limits validated against policy',
        'Duplicate submission detection step added',
        'Multi-level approval chain configured',
        'IRS-compliant 7-year archive step included',
      ];
      break;

    case 'audit':
      steps = generateAuditSteps(value.auditProcess);
      aiInsights = [
        'Risk-based sampling methodology applied',
        'Control weakness detection steps included',
        'Management response checkpoint added',
        'Board-level sign-off step configured',
      ];
      break;

    case 'training':
      steps = generateTrainingSteps(value.tool);
      aiInsights = [
        `${value.tool.toUpperCase()} module-specific steps generated`,
        'Hands-on practice transactions included',
        'Period-end procedures and deadlines covered',
        'Help and escalation resources added',
      ];
      break;

    default:
      return res.status(400).json({ success: false, message: 'Unknown financeType' });
  }

  return res.json({ success: true, title: value.title, steps, aiInsights, financeType: value.financeType });
});

// ─── POST /api/finance/create ─────────────────────────────────────────────────

const stepSchema = Joi.object({
  title: Joi.string().trim().min(1).max(140).required(),
  description: Joi.string().allow('').max(2000).default(''),
  action_type: Joi.string().trim().max(80).default('action'),
  order: Joi.number().integer().min(1).optional(),
  approval_level: Joi.string().valid('auto', 'manager', 'finance', 'cfo').default('auto'),
  role: Joi.string().allow('').max(80).default(''),
  tip: Joi.string().allow('').max(500).default(''),
  compliance_note: Joi.string().allow('').max(300).default(''),
});

const createSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().allow('').max(2000).default(''),
  status: Joi.string().valid('draft', 'published').default('draft'),
  source: Joi.string().valid('invoice', 'expense', 'audit', 'training').required(),
  category: Joi.string().allow('').max(60).default(''),
  tags: Joi.array().items(Joi.string().max(40)).max(10).default([]),
  steps: Joi.array().items(stepSchema).min(1).max(60).required(),
});

router.post('/create', requireAuth, (req, res) => {
  const { error, value } = createSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building finance guides' });
  }

  try {
    const guide = createGuideRecord({
      title: value.title,
      description: value.description,
      workspaceId: req.user.workspace_id,
      ownerUserId: req.user.id,
      status: value.status,
      source: value.source,
    });

    const ordered = [...value.steps]
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
      .map((s, i) => ({
        title: s.title,
        description: s.description,
        action_type: s.action_type,
        step_number: i + 1,
        metadata_json: {
          approval_level: s.approval_level,
          role: s.role,
          tip: s.tip,
          compliance_note: s.compliance_note,
          tags: value.tags,
          category: value.category,
        },
      }));

    const steps = upsertGuideSteps(guide.id, ordered);

    addGuideActivity({
      guideId: guide.id,
      workspaceId: req.user.workspace_id,
      type: 'edited',
      userId: req.user.id,
      metadata: { title: value.title, source: value.source, action: 'finance_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save finance guide' });
  }
});

module.exports = router;

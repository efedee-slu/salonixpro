# SalonixPro — Comprehensive Web Application Test Plan

**Application:** SalonixPro — Caribbean Salon Management SaaS  
**Live URL:** https://salonixpro.com  
**Stack:** Next.js 14 | Prisma | PostgreSQL (Railway) | Vercel  
**GitHub:** https://github.com/efedee-slu/salonixpro  
**Working Directory:** C:\salonixpro-next  
**Version:** 1.0 | March 2026  

## Context for Claude

SalonixPro is a multi-tenant Caribbean salon management SaaS (95% MVP). When testing, use the live site at https://salonixpro.com and/or local dev at localhost:3000. Key architecture details:

- **Auth:** NextAuth with bcrypt password hashing
- **RBAC:** Custom `StaffPermission` model with granular boolean flags. OWNER bypasses all checks. Presets: Staff/Manager/Full Access/Custom
- **Email:** Resend from noreply@salonixpro.com (domain verified)
- **Portal:** /portal with email verification code auth (JWT via jose)
- **Payments:** PayPal subscriptions — $30/month or $300/year (save $60), 14-day free trial
- **Product Costing:** Caribbean tax calculator with VAT, HSL, customs duty, multi-currency. Small businesses below VAT threshold cannot charge VAT separately — they recover import taxes through product markup
- **Multi-tenant:** Shared schema with business_id isolation
- **Deployment:** Vercel auto-deploy from GitHub main branch

### Permission Matrix

| Capability | OWNER | MANAGER | STYLIST | ASSISTANT | CLIENT (Portal) |
|---|---|---|---|---|---|
| All financial reports (P&L, Expenses) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payroll (wages, commissions) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add/edit/delete products | ✅ | ✅ | ❌ | ❌ | ❌ |
| View costPrice & margins | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create orders/sales | ✅ | ✅ | ✅ | ✅ | ❌ |
| View/create appointments | ✅ (all) | ✅ (all) | ✅ (own) | ✅ (all) | ✅ (own) |
| View clients | ✅ (full) | ✅ (full) | ✅ (names only) | ✅ (names only) | ❌ |
| Settings/Billing/Subscription | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete business | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Instructions

Run each test below. Mark status as PASS, FAIL, or BLOCKED. For failures, document the issue with steps to reproduce, expected vs actual result, and screenshots if applicable. Fix Critical and High priority failures before moving to lower priorities.

---

## 1. Functional Testing — CRUD, Business Logic, Data Integrity

### 1.1 Dashboard

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-001 | Dashboard loads with correct stats (appointments today, revenue, clients) | All stat cards display accurate real-time data from database | Critical |
| F-002 | Quick Actions buttons navigate to correct pages (New Appointment, New Client, New Sale) | Each button routes to the correct creation form | High |
| F-003 | Today's appointments list shows only current day appointments | Filtered correctly by date, sorted by time | High |
| F-004 | Revenue card calculates from completed orders only (not cancelled/pending) | Amount matches SUM of completed order totals | Critical |
| F-005 | Dashboard is scoped to current business (multi-tenant isolation) | No data leakage from other businesses | Critical |

### 1.2 Appointments

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-010 | Create appointment with client, stylist, service, date/time | Appointment saved with all fields, appears in calendar | Critical |
| F-011 | Edit existing appointment (change time, stylist, service) | Changes persist, no orphan records created | High |
| F-012 | Cancel appointment with reason | Status changes to cancelled, time slot freed | High |
| F-013 | Double-booking prevention: same stylist, same time slot | Error message displayed, booking rejected | Critical |
| F-014 | Complete appointment and auto-link to order/sale | Appointment status updated, order created if applicable | High |
| F-015 | Filter appointments by stylist, date range, status | Results match filter criteria accurately | Medium |

### 1.3 Clients (CRM)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-020 | Create new client with full details (name, email, phone, notes) | Client saved, appears in client list | Critical |
| F-021 | Edit client details and verify changes persist | All fields updated correctly in database | High |
| F-022 | Delete client and verify cascade behavior (appointments, orders) | Client removed, related data handled per business rules | High |
| F-023 | Search clients by name, email, phone | Partial match search returns relevant results | Medium |
| F-024 | Client history shows all past appointments and purchases | Complete chronological history displayed | Medium |
| F-025 | Duplicate client prevention (same email or phone) | Warning or merge suggestion displayed | Medium |

### 1.4 Services

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-030 | Create service with name, category, price, duration | Service saved, appears in service menu | Critical |
| F-031 | Edit service price and verify it reflects in new bookings | Updated price used for future appointments only | High |
| F-032 | Delete service and verify it does not remove historical appointment data | Service soft-deleted or archived, history preserved | High |
| F-033 | Service categories group correctly on booking page | Customers see organized category-based menu | Medium |

### 1.5 Staff/Stylists

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-040 | Add new stylist with profile, schedule, services offered | Stylist created with correct associations | Critical |
| F-041 | Set stylist working hours and verify booking page respects them | Only available time slots shown to customers | High |
| F-042 | Assign services to specific stylists | Booking page only shows relevant stylists per service | Medium |
| F-043 | Deactivate stylist and verify they are hidden from new bookings | Existing appointments preserved, no new bookings allowed | High |

### 1.6 Shop (Products & Inventory)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-050 | Add product with name, price, stock quantity, costPrice | Product saved with all fields | Critical |
| F-051 | Edit product details including costPrice | Changes persist, P&L recalculations not affected retroactively | High |
| F-052 | Stock decrement when order is completed | Quantity reduced by order amount, low-stock alert if applicable | Critical |
| F-053 | Costed badge (green) appears for products with costPrice set | Visual indicator clearly distinguishes costed vs uncosted | Medium |
| F-054 | Cost unknown badge (amber) for products without costPrice | Warning badge displayed for OWNER/MANAGER only | Medium |

### 1.7 Orders/Sales (POS)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| F-060 | Create order with multiple line items (services + products) | Order total calculated correctly | Critical |
| F-061 | Complete order and verify revenue reflects on dashboard and P&L | Amounts match across all reporting views | Critical |
| F-062 | Cancel order and verify stock restoration | Product quantities restored, revenue adjusted | High |
| F-063 | Order linked to client and appointment correctly | Relational integrity maintained | High |
| F-064 | All users (OWNER, MANAGER, STYLIST, ASSISTANT) can create orders | Order creation accessible per permission matrix | Critical |

---

## 2. Authentication & Authorization Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| A-001 | Sign up with new email, business name, and password | Account created, business initialized, redirected to dashboard | Critical |
| A-002 | Sign up with existing email address | Error: email already registered | Critical |
| A-003 | Login with valid credentials | Session created, redirected to dashboard | Critical |
| A-004 | Login with invalid password | Error message without revealing which field is wrong | Critical |
| A-005 | Login with non-existent email | Generic error (same as invalid password for security) | Critical |
| A-006 | Forgot password: request reset link for valid email | Email sent via Resend from noreply@salonixpro.com | Critical |
| A-007 | Forgot password: request for non-existent email | Same success message (no email enumeration) | Critical |
| A-008 | Reset password with valid token within 1 hour | Password updated, token consumed/deleted | Critical |
| A-009 | Reset password with expired token (>1 hour) | Error: token expired, must request new link | High |
| A-010 | Reset password with already-used token | Error: invalid token | High |
| A-011 | Session persistence: refresh page while logged in | Session maintained, no re-login required | High |
| A-012 | Logout clears session completely | Redirected to login, back button does not restore session | High |
| A-013 | Access dashboard URL without authentication | Redirected to login page | Critical |
| A-014 | Customer portal: email verification code sent and validated (JWT via jose) | 6-digit code sent, JWT token issued on valid code | Critical |
| A-015 | Customer portal: expired verification code rejected | Error message, option to resend code | High |
| A-016 | Customer portal: JWT token expiry handled gracefully | Redirected to re-verify email | High |

---

## 3. Role-Based Access Control (RBAC) Testing

### 3.1 OWNER Role (Full Access)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-001 | OWNER accesses all financial reports (P&L, Expenses, Payroll) | Full access granted | Critical |
| R-002 | OWNER manages all staff (add/remove/edit wages/commissions) | Full CRUD on all staff records | Critical |
| R-003 | OWNER accesses Settings, Billing, Subscription management | All settings pages accessible | Critical |
| R-004 | OWNER sees costPrice and profit margins on product cards | Financial data visible | High |
| R-005 | OWNER can delete business and all associated data | Cascade delete with confirmation | Critical |

### 3.2 MANAGER Role

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-010 | MANAGER accesses P&L and Expenses reports | Access granted | Critical |
| R-011 | MANAGER cannot access Payroll (should not see wages) | Access denied, redirected or hidden from sidebar | Critical |
| R-012 | MANAGER can add/edit products in Shop | CRUD access to products | High |
| R-013 | MANAGER sees costPrice on product cards | Financial data visible | High |
| R-014 | MANAGER cannot change billing/subscription or delete business | Settings restricted, billing tab hidden | Critical |

### 3.3 STYLIST/HAIRDRESSER Role

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-020 | STYLIST can view only their own appointments | Other stylists' appointments hidden | Critical |
| R-021 | STYLIST can create orders/sales | POS accessible | Critical |
| R-022 | STYLIST cannot access Expenses, P&L, Payroll, Reports | Pages hidden from sidebar, direct URL returns 403 | Critical |
| R-023 | STYLIST views products (prices only, NOT costPrice or margins) | CostPrice column hidden | High |
| R-024 | STYLIST cannot add/edit/delete products | Shop management restricted | High |
| R-025 | STYLIST can view client list but not spending history | Client names visible, financial data hidden | High |

### 3.4 ASSISTANT Role

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-030 | ASSISTANT can create/view appointments for all stylists | Scheduling access granted | High |
| R-031 | ASSISTANT can create orders/sales | POS accessible | High |
| R-032 | ASSISTANT has same financial restrictions as STYLIST | No P&L, Expenses, Payroll, Reports access | Critical |

### 3.5 CLIENT (Portal)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-040 | CLIENT via portal sees only their own appointments | No access to other clients' data | Critical |
| R-041 | CLIENT via portal sees only their own orders | Order history scoped to their account | Critical |
| R-042 | CLIENT cannot access any dashboard, financial, or staff pages | Portal is completely isolated from admin | Critical |

### 3.6 Multi-Tenant Isolation

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| R-050 | User from Business A cannot see Business B data via API manipulation | All queries filtered by business_id | Critical |
| R-051 | Changing business_id in request body is rejected | Server-side validation uses session business_id only | Critical |
| R-052 | API routes enforce business_id from session, not from request | No parameter tampering possible | Critical |

---

## 4. API & Integration Testing

### 4.1 Core API Routes

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| I-001 | /api/appointments — GET returns paginated list scoped to business | 200 with correct data, no cross-tenant leakage | Critical |
| I-002 | /api/appointments — POST with missing required fields | 400 with descriptive validation errors | High |
| I-003 | /api/clients — GET, POST, PUT, DELETE full CRUD cycle | All operations return correct status codes | Critical |
| I-004 | /api/services — CRUD operations with category associations | Proper relational handling | High |
| I-005 | /api/orders — POST creates order with line items, updates stock | Transactional integrity maintained | Critical |
| I-006 | /api/profit-loss — GET returns auto-calculated COGS from costPrice | COGS = SUM(costPrice x qty) for completed orders in date range | Critical |
| I-007 | /api/product-costing — POST creates costing with tax calculations | Landed cost computed correctly with VAT, HSL, customs duty | Critical |
| I-008 | /api/product-costing/templates — CRUD for saved templates | Templates save/load correctly with all tax fields | High |

### 4.2 API Security

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| I-020 | All API routes reject unauthenticated requests | 401 Unauthorized returned | Critical |
| I-021 | API routes respect RBAC (STYLIST calling /api/payroll returns 403) | Permission-denied response | Critical |
| I-022 | Rate limiting on authentication endpoints | 429 after threshold exceeded | High |
| I-023 | SQL injection via Prisma parameterized queries | No raw SQL execution, all queries parameterized | Critical |
| I-024 | XSS prevention on all user-input fields | HTML/script tags sanitized or escaped | Critical |

### 4.3 Third-Party Integrations

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| I-030 | Resend email delivery: password reset, portal verification, notifications | Emails arrive within 30 seconds, correct content | Critical |
| I-031 | Resend failure handling (API down or rate limited) | Graceful error, user informed, retry option | High |
| I-032 | PayPal subscription creation and webhook handling | Subscription activated, status synced to database | Critical |
| I-033 | PayPal webhook signature verification | Invalid signatures rejected, valid ones processed | Critical |
| I-034 | Railway PostgreSQL connection resilience | Auto-reconnect after brief outage | High |

---

## 5. Payment & Subscription Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| P-001 | New user starts 14-day free trial (no credit card required) | Full access for 14 days, trial banner displayed | Critical |
| P-002 | Trial expiry: user prompted to subscribe before access restricted | Grace period messaging, then feature lockdown | Critical |
| P-003 | Subscribe to monthly plan ($30/month) via PayPal | Subscription created, billing tab updated, full access | Critical |
| P-004 | Subscribe to annual plan ($300/year, save $60) | Correct amount charged, annual renewal date set | Critical |
| P-005 | Cancel subscription mid-cycle | Access continues until period end, no proration issues | High |
| P-006 | Failed payment retry and dunning flow | User notified, grace period before suspension | High |
| P-007 | Upgrade from monthly to annual mid-cycle | Prorated credit applied correctly | Medium |
| P-008 | PayPal sandbox vs production mode verification | Production uses live keys, no sandbox in prod | Critical |
| P-009 | Subscription status persists across sessions/devices | Database is source of truth, not local state | High |

---

## 6. Email & Notification Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| E-001 | Password reset email: correct branding, link, and 1-hour expiry | Professional HTML email with working reset link | Critical |
| E-002 | Portal verification code email: 6-digit code delivered | Code arrives within 30 seconds, formatted correctly | Critical |
| E-003 | Appointment confirmation email to client | Correct details: stylist, service, date/time, location | High |
| E-004 | Appointment reminder email (if implemented) | Sent 24 hours before, correct details | Medium |
| E-005 | Email rendering across Gmail, Outlook, Apple Mail | Consistent HTML rendering, no broken layouts | Medium |
| E-006 | Email from address shows SalonixPro <noreply@salonixpro.com> | Domain verified, no spam folder issues | High |
| E-007 | Resend daily limit handling (100 emails/day free tier) | Graceful degradation, queuing if approaching limit | High |

---

## 7. Product Costing & Financial Module Testing

### 7.1 Product Costing Calculator

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| C-001 | Create product costing with USD purchase price, converted to business currency | Exchange rate applied correctly, landed cost calculated | Critical |
| C-002 | VAT calculation at editable rate (default 12.5% for Saint Lucia) | VAT computed on (unit price + customs duty) | Critical |
| C-003 | HSL (Health & Security Levy) at editable rate (default 2.5%) | HSL computed correctly and added to landed cost | Critical |
| C-004 | Customs duty at editable rate | Duty calculated on CIF value | Critical |
| C-005 | All tax rates editable (not hardcoded) for different Caribbean countries | User can change VAT, HSL, duty rates freely | Critical |
| C-006 | Landed cost includes all taxes since below-threshold businesses cannot reclaim | Total landed cost = purchase + shipping + duty + VAT + HSL | Critical |
| C-007 | Multi-currency: purchase in USD, EUR, GBP with conversion | Correct exchange rate applied per currency pair | High |
| C-008 | Save costing as template (e.g., Amazon Import, Miami Supplier) | Template saves all rates and can be reloaded | High |
| C-009 | Load template pre-fills duty rates, VAT, HSL, exchange rate | All fields populated from saved template | High |
| C-010 | Link costing to existing Shop product and update costPrice | Product.costPrice updated with calculated landed cost | Critical |

### 7.2 Auto-COGS & P&L Integration

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| C-020 | P&L report auto-calculates COGS from costPrice x quantity sold | COGS = SUM(product.costPrice x orderItem.quantity) for completed orders | Critical |
| C-021 | COGS breakdown shows which products contributed and how much | Itemized COGS table in P&L report | High |
| C-022 | Products without costPrice flagged as "Cost unknown" in P&L | Amber warning in COGS breakdown | High |
| C-023 | Gross Profit = Product Revenue - Auto-calculated COGS | Calculation accurate to 2 decimal places | Critical |
| C-024 | Date range filter on P&L only includes orders in that range | No out-of-range data included | High |

### 7.3 Expenses & Payroll

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| C-030 | Create expense with category, amount, date, receipt/notes | Expense saved, reflected in P&L | High |
| C-031 | Payroll: commissions calculated correctly per stylist | Commission = % of service revenue attributed to stylist | High |
| C-032 | Payroll: base wages display per stylist (if implemented) | Wages shown alongside commissions | Medium |
| C-033 | Reports page uses real data, not mock/hardcoded data | All figures match database totals | Critical |

---

## 8. Customer Portal & Booking Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| B-001 | Public booking page loads at /book/[business-slug] | Shows business name, services, available slots | Critical |
| B-002 | Booking page with non-existent slug returns 404 | Friendly error page, not server error | High |
| B-003 | Customer selects service, stylist, date/time and books | Appointment created in database, confirmation shown | Critical |
| B-004 | Only available time slots shown (respects stylist schedules and existing bookings) | No double-booking possible from customer side | Critical |
| B-005 | Deposit payment during booking (if enabled) | PayPal payment processed, deposit recorded | High |
| B-006 | Customer portal login with email verification code | JWT token issued, portal accessible | Critical |
| B-007 | Portal shows only that client's appointments and orders | Complete data isolation from other clients | Critical |
| B-008 | Chatbot appears on booking page with business data | Chat widget visible, responds to service/hours/location queries | High |
| B-009 | Chatbot keyword matching: hours, prices, location, booking | Correct responses using business settings data | Medium |
| B-010 | Chatbot does not expose internal business data (expenses, payroll, etc.) | Only public information shared | Critical |

---

## 9. Performance & Scalability Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| PF-001 | Dashboard page load time (initial and subsequent) | < 2s initial, < 500ms subsequent (cached) | High |
| PF-002 | API response times for CRUD operations under normal load | < 500ms for single-record operations | High |
| PF-003 | P&L report generation with 1000+ orders in date range | < 3s response time, no timeout | Medium |
| PF-004 | Booking page load time (public, unauthenticated) | < 1.5s (critical for customer conversion) | High |
| PF-005 | Concurrent booking requests for same time slot (race condition) | Only one booking succeeds, others get conflict error | Critical |
| PF-006 | Prisma query optimization: check for N+1 queries | All list queries use includes/joins, not loops | High |
| PF-007 | Database connection pooling (Railway PostgreSQL) | Connections reused, no exhaustion under concurrent requests | High |
| PF-008 | Vercel serverless function cold start times | < 1s for all API routes | Medium |
| PF-009 | Image/asset loading with Vercel CDN | Static assets cached at edge, < 200ms delivery | Low |
| PF-010 | Load test: 50 concurrent users across multiple businesses | No degradation, all responses < 2s | Medium |

---

## 10. Security & Vulnerability Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| S-001 | SQL injection via all user input fields (names, search, notes) | Prisma parameterized queries block all injection attempts | Critical |
| S-002 | XSS: script tags in client name, service description, notes fields | All output escaped/sanitized, no script execution | Critical |
| S-003 | CSRF protection on all state-changing API routes | Requests without valid session/token rejected | Critical |
| S-004 | Password hashing: verify bcrypt/argon2 with sufficient rounds | Passwords never stored in plaintext | Critical |
| S-005 | Sensitive data in API responses (no passwords, tokens, or secrets leaked) | API responses contain only necessary fields | Critical |
| S-006 | HTTP security headers: X-Frame-Options, CSP, HSTS, X-Content-Type | All headers present and correctly configured | High |
| S-007 | Environment variables not exposed in client-side JavaScript | Only NEXT_PUBLIC_ vars accessible in browser | Critical |
| S-008 | Resend API key, PayPal secrets, DATABASE_URL not in client bundle | Build analysis confirms server-only secrets | Critical |
| S-009 | .env excluded from Git (.gitignore verification) | No secrets in repository history | Critical |
| S-010 | npm audit: check for known vulnerabilities in dependencies | No critical or high severity vulnerabilities | High |
| S-011 | Password reset token is single-use and time-limited (1 hour) | Replay attacks prevented | Critical |
| S-012 | Portal JWT token cannot be reused after expiry | Expired tokens rejected with 401 | High |
| S-013 | IDOR: accessing /api/clients/[id] for another business's client | 403 Forbidden returned | Critical |
| S-014 | File upload validation (if any uploads exist) | Only allowed file types, size limits enforced | High |

---

## 11. Usability, Accessibility & Responsiveness Testing

### 11.1 UI/UX Quality

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| U-001 | All pages have premium styling (gradient headers, stat cards, shadow-lg, rounded-2xl) | Consistent $200/month SaaS appearance | High |
| U-002 | Each page has distinct gradient accent color in header banner | Visual differentiation between sections | Medium |
| U-003 | Hover effects and fade-in animations on interactive elements | Smooth transitions, no jank or layout shifts | Medium |
| U-004 | Sidebar navigation: all sections visible, active state highlighted | Clear wayfinding, current page indicated | High |
| U-005 | Form validation: inline errors with clear messaging | Users understand what to fix without guessing | High |
| U-006 | Loading states for all async operations (spinners, skeletons) | No blank screens during data fetching | High |
| U-007 | Empty states: meaningful messages when no data exists | New businesses see helpful onboarding prompts | Medium |

### 11.2 Accessibility (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| U-020 | Color contrast ratio meets 4.5:1 for normal text | All text readable against backgrounds | High |
| U-021 | Keyboard navigation: all interactive elements focusable via Tab | Complete keyboard accessibility | High |
| U-022 | Screen reader: all images have alt text, form inputs have labels | ARIA attributes present and meaningful | Medium |
| U-023 | Focus indicators visible on all interactive elements | Clear focus ring, not removed by CSS | Medium |

### 11.3 Responsiveness

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| U-030 | Mobile (375px): dashboard, sidebar collapses to hamburger menu | All content accessible, no horizontal scroll | Critical |
| U-031 | Tablet (768px): two-column layout where appropriate | Optimized layout, tables horizontally scrollable | High |
| U-032 | Desktop (1440px): full sidebar + content area | Maximum information density, no wasted space | High |
| U-033 | Public booking page responsive on mobile (primary customer device) | Easy to book on phone, large touch targets | Critical |
| U-034 | Cross-browser: Chrome, Safari, Firefox, Edge | Consistent rendering and functionality | High |

---

## 12. Error Handling & Logging

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| EH-001 | API returns structured error JSON (not HTML error pages) | `{ error: string, status: number }` format consistently | High |
| EH-002 | Database connection failure: app shows maintenance page | Friendly error, not Prisma stack trace | Critical |
| EH-003 | Resend email failure: user informed, operation continues | Non-blocking error, alternative notification if possible | High |
| EH-004 | PayPal webhook failure: transaction logged for manual review | No silent data loss | Critical |
| EH-005 | Invalid form submission: field-level error messages | Each invalid field highlighted with specific message | High |
| EH-006 | 404 page: custom styled, not default Next.js error | Branded 404 with navigation back to dashboard/home | Medium |
| EH-007 | 500 error: generic message to user, detailed log server-side | No sensitive information leaked to client | Critical |
| EH-008 | Vercel function logs capture all API errors with context | Searchable logs with request details | High |
| EH-009 | Client-side error boundary catches React crashes | Fallback UI shown, not white screen | High |

---

## 13. Deployment & Infrastructure Testing

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| D-001 | Git push to main triggers Vercel auto-deployment | Build starts within 60 seconds of push | Critical |
| D-002 | Vercel build succeeds: prisma generate runs, no missing dependencies | Clean build with 0 errors | Critical |
| D-003 | All environment variables set in Vercel (RESEND_API_KEY, DATABASE_URL, PAYPAL keys, NEXTAUTH_SECRET) | No undefined env var errors in runtime | Critical |
| D-004 | Railway PostgreSQL accessible from Vercel serverless functions | Database connections establish successfully | Critical |
| D-005 | Prisma migrations: schema matches live database | No drift between schema.prisma and actual DB | Critical |
| D-006 | Rollback: Vercel instant rollback to previous deployment | Previous version restored within seconds | High |
| D-007 | Custom domain salonixpro.com with SSL certificate | HTTPS enforced, valid certificate, no mixed content | Critical |
| D-008 | DNS configuration: A/CNAME records pointing to Vercel | Domain resolves correctly worldwide | High |
| D-009 | Build time < 5 minutes on Vercel | No unnecessary dependencies slowing build | Medium |
| D-010 | package.json valid JSON (no syntax errors blocking build) | npm install and build succeed | Critical |

---

## 14. Disaster Recovery & Business Continuity

| ID | Test Case | Expected Result | Priority |
|---|---|---|---|
| DR-001 | Railway PostgreSQL automated backups enabled | Daily backups retained for minimum 7 days | Critical |
| DR-002 | Database restore from backup: full data recovery | All tables, relationships, and data restored accurately | Critical |
| DR-003 | Recovery Time Objective (RTO): database restore < 1 hour | Service restored within target window | Critical |
| DR-004 | Recovery Point Objective (RPO): maximum 24 hours data loss | Backup frequency meets RPO requirement | Critical |
| DR-005 | GitHub repository: complete codebase recoverable | All code, history, branches available | High |
| DR-006 | Vercel deployment from fresh clone: full app deployable | No manual steps beyond env var configuration | High |
| DR-007 | Railway database migration to alternative provider | pg_dump/pg_restore works for provider migration | Medium |
| DR-008 | Business data export: salon owner can export their data | CSV/JSON export of clients, appointments, orders | Medium |
| DR-009 | Subscription data recovery after payment processor outage | PayPal sync recovers correct subscription states | High |

---

## Appendix: Test Summary

| # | Category | Total Tests | Priority Breakdown |
|---|---|---|---|
| 1 | Functional Testing | 27 | 10 Critical, 11 High, 6 Medium |
| 2 | Authentication & Authorization | 16 | 9 Critical, 7 High |
| 3 | RBAC | 17 | 13 Critical, 4 High |
| 4 | API & Integration | 13 | 9 Critical, 4 High |
| 5 | Payment & Subscription | 9 | 5 Critical, 3 High, 1 Medium |
| 6 | Email & Notification | 7 | 2 Critical, 3 High, 2 Medium |
| 7 | Product Costing & Financial | 13 | 7 Critical, 5 High, 1 Medium |
| 8 | Customer Portal & Booking | 10 | 5 Critical, 3 High, 1 Medium, 1 Critical |
| 9 | Performance & Scalability | 10 | 1 Critical, 5 High, 3 Medium, 1 Low |
| 10 | Security & Vulnerability | 14 | 10 Critical, 4 High |
| 11 | Usability & Responsiveness | 15 | 2 Critical, 8 High, 5 Medium |
| 12 | Error Handling & Logging | 9 | 3 Critical, 5 High, 1 Medium |
| 13 | Deployment & Infrastructure | 10 | 6 Critical, 3 High, 1 Medium |
| 14 | Disaster Recovery | 9 | 4 Critical, 3 High, 2 Medium |
| | **TOTAL** | **179** | |

---

## Environment Variables Checklist

Verify these are set in both Vercel and local .env:

| Variable | Purpose |
|---|---|
| DATABASE_URL | Railway PostgreSQL connection string |
| NEXTAUTH_SECRET | NextAuth session encryption key |
| NEXTAUTH_URL | App base URL (https://salonixpro.com) |
| NEXT_PUBLIC_APP_URL | Public-facing app URL |
| RESEND_API_KEY | Transactional email API key |
| PAYPAL_CLIENT_ID | PayPal subscription client ID |
| PAYPAL_CLIENT_SECRET | PayPal subscription secret |
| PAYPAL_WEBHOOK_ID | PayPal webhook verification ID |
| JWT_SECRET | Portal JWT signing key (jose) |

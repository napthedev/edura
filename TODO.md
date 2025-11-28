# Edura Project Roadmap

Based on the architectural recommendations and schema enhancements.

## 1. Database Schema Enhancements
- [x] **LMS Structure**: Add `class_modules` for grouping content.
- [x] **AI Grading**: Add `questions` and `submission_answers` for granular analytics.
- [x] **Financials**: Add `teacher_rates` for payroll calculation.
- [ ] **Financials**: Add `discounts_promotions` for invoice management.
- [x] **System**: Add `notifications` for alerts.
- [x] **System**: Add `audit_logs` for security.

## 2. Core User & Role Management
- [ ] **Zalo Integration**: Add `parent_zalo_id` to user profiles and implement Zalo API integration.
- [ ] **User Profiles**: Create extended profile management UI (DOB, address, etc.).

## 3. Academic Management (LMS)
- [x] **Class Modules UI**: 
    - Update Class view to support Module-based layout.
    - Allow teachers to create/reorder modules.
- [ ] **Question Bank**:
    - Create UI for managing the global and class-specific question bank.
    - Support JSON-based options for multiple choice.
- [ ] **Smart Grading Logic**: 
    - Implement service to compare `submission_answers` with `questions`.
    - Auto-calculate scores and update `submissions.grade`.
- [ ] **Analytics**: 
    - Build dashboard to show "Percentage Correct" per question.

## 4. Financial Management
- [ ] **Teacher Payroll**: 
    - Implement calculation logic using `teacher_rates` (Hourly vs Per Student).
    - Generate `Salary_Out` transactions automatically.
- [ ] **Invoicing & Discounts**: 
    - Implement `discounts_promotions` table.
    - Create invoice generation logic applying active discounts.
- [ ] **Cash Flow**: 
    - Build the "Managing Finance" dashboard using the `transactions` ledger.

## 5. System & Notifications
- [x] **Notification Engine**: 
    - Create triggers for events (Assignment Graded, Payment Due).
    - Insert into `notifications` table.
- [x] **Notification UI**: 
    - Add "Bell" icon to Header.
    - Create dropdown/page for viewing read/unread notifications.
- [ ] **Audit Logging**: 
    - Implement TRPC middleware to log critical mutations (Grade Change, Transaction Delete) to `audit_logs`.

# Fix translation error prompt
fix all the translation rendering errors when using useTranslation() and t("key") that are caused by key not being defined in the en.json and vi.json files
also, check for any hard coded strings then apply translation to them, update en.json and vi.json accordingly
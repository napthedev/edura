# Edura Project Roadmap

## 📊 Manager Dashboard

- [ ] Build "Overall Summary" widgets:
  - Retention Rate
  - Assignment Completion
  - Revenue
- [ ] Implement "Institutional Performance Trends" graphs (using Recharts or Chart.js)
- [ ] Student retention analytics

---

## 👨‍🏫 Teacher Features

- [x] Build "Weekly Calendar" component to track teaching hours
- [ ] Create "Deadline Management" table with filters for Class, Task Type, and Status
- [ ] Automated deadline reminders
- [x] Teaching hours count

---

## 👨‍🎓 Student Features

- [ ] Build "Progress Dashboard" showing:
  - Accuracy rates
  - Questions attempted
  - Projected scores
- [ ] SAT/IELTS progress tracking:
  - Accuracy
  - Streaks
  - Goals
  - Projected score
- [ ] Personalized study recommendations

---

## 👪 Parent Portal

- [ ] View student results
- [ ] Progress overview
- [ ] Tuition reminders
- [ ] Online payment integration (VNPay/MoMo)
- [ ] Zalo message subscription

---

## 💰 Financial System

### Schema

- [ ] Create tables for:
  - `TuitionBilling`
  - `TutorPayments`
  - `AttendanceLogs`

### Automated Billing

- [ ] Script logic to calculate Tutor Pay: `Sessions Taught × Rate`
- [ ] Generate Invoice views for Centers
- [ ] Exportable financial reports
- [ ] Auto-generated monthly bills

---

## 📱 Zalo Integration (ZNS)

- [ ] Set up Zalo Cloud Account and register ZNS templates
- [ ] Implement webhook/cron job to fetch "Weekly/Monthly Progress" data

---

## 🤖 Automation

### Automated Reporting

- [ ] Build "Bilingual Summary Engine" to translate academic feedback into Vietnamese for parents
- [ ] Automate triggers for alerts via Zalo:
  - "Payment Due"
  - "Student Not Logged In"
- [ ] Daily/weekly class reports
- [ ] Attendance summaries
- [ ] Test score breakdown
- [ ] Tuition invoicing

### Attendance System

- [ ] Implement Digital Check-in/Check-out for students and tutors

---

## 📥 Data Import/Export

- [ ] Upload CSV of students/classes


## login register
- [ ] improve error message
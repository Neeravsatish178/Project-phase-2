# Project-phase-2

# 🎓 Student Academic Dashboard

A responsive, Firebase-authenticated web application to **track attendance**, **calculate CGPA**, and **manage semester-wise subject data**. Built with HTML, CSS (purple-themed), and JavaScript, it provides an intuitive way for students to monitor their academic performance.

---

## 🌟 Features

- 🔐 **Authentication**
  - Login and Registration via Firebase Authentication
  - Redirect to login page if accessing protected features when not logged in

- 📚 **CGPA Tracker**
  - Add subjects with grades and credits
  - Automatically calculate CGPA per semester
  - Save, edit, and delete individual semesters
  - View CGPA history and breakdown by semester

- 📅 **Attendance Tracker**
  - Add subjects and mark attendance (present/bunked)
  - Visualize attendance as a ratio of attended vs. bunked classes
  - Calculates **possible bunks** using expected classes
  - Gives warnings only if attendance drops below **75%**

- 💅 **Design & UX**
  - Clean, responsive layout with a **dark purple color theme**
  - Styled input forms, buttons, tiles, and warning/success messages
  - Login/Register page styled to match the main app theme

---

## 🧰 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend/Database:** Firebase Firestore
- **Auth:** Firebase Authentication

---

## 📁 Folder Structure


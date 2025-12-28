# ⚡ Burak Karagol | Dual-Mode Portfolio

![Status](https://img.shields.io/badge/Status-Live-success)
![Tech](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-blue)

**A Next-Gen Personal Website exploring the intersection of Mechatronics Engineering and Creative Development.**

This project features a unique **Dual-Mode Architecture** that completely transforms the UI, UX, and Content based on the user's intent:
1.  **Professional Mode:** Clean, geometric, and corporate (Mechatronics & Aviation).
2.  **Personal Mode:** Fluid, glowing, and creative (3D Printing, Coding & Hobbies).

🔗 **[Live Demo](https://burakkaragol.github.io/)**

---

## 🚀 Key Features

### 1. The "Shape Shifter" Core
* **Dynamic Layout Engine:** The entire site structure shifts from a rigid Grid (Pro) to a Masonry/Float layout (Personal) instantly.
* **3D Hero Animation:** Features a CSS-only 360° flipping avatar transition and side-swapping layout logic.
* **Advanced CSS Transforms:** Uses `clip-path`, `perspective`, and `rotate3d` to morph shapes (Hexagons → Floating Clouds).

### 2. Full State Management
* **Auto-Detection:** Automatically detects the user's System Theme (Dark/Light) and Browser Language (EN/TR) on first visit.
* **Persistence:** Uses `LocalStorage` to remember the user's preference (Mode, Theme, Language) across sessions.
* **Deep Linking:** Supports URL parameters to share specific views:
    * `?mode=personal` (Forces Personal Mode)
    * `?lang=tr` (Forces Turkish)

### 3. Modern Tech Stack
* **Vanilla JavaScript:** Zero dependencies, lightweight, and blazing fast.
* **EmailJS Integration:** Fully functional contact form without a backend server.
* **CSS Variables:** Extensive use of CSS variables for instant Theme and Mode switching.

---

## 📂 Project Structure

```text
/
├── index.html          # Main semantic HTML structure
├── README.md           # Documentation
└── assets/
    ├── css/
    │   └── style.css   # 100% Consolidated styles (Responsive, Animation, Layout)
    ├── js/
    │   ├── script.js       # Logic (State, Scroll, EmailJS, Toggles)
    │   └── translations.js # JSON-based translation dictionary (EN/TR)
    └── img/
        ├── photo.png       # Professional Photo
        ├── avatar.png      # Personal 3D Avatar
        └── favicon...      # Icons
# BigQuery Release Notes Explorer

A beautiful, interactive web application built with **Python Flask** and **Vanilla HTML/CSS/JS** to fetch, segment, explore, and share Google Cloud BigQuery release notes.

---

## 🚀 Features

- **Dynamic Parsing & Segmentation:** Ingests the official Atom release notes feed and splits multi-topic daily updates into individual, easy-to-read cards categorized by type (*Feature*, *Change*, *Fix*, etc.).
- **Interactive Dashboard:**
  - **Live Filter Chips:** Quickly toggle between Features, Changes, and Fixes.
  - **Instant Search:** Fuzzy search through titles, dates, or details instantly (run locally on the client).
  - **Dashboard Statistics:** Displays animated counters for each category.
- **X (Twitter) Integration:** Select any release note update and compose a Tweet directly via a custom modal. The text is automatically formatted and optimized to fit the 280-character limit before opening the Twitter Web Composer.
- **Performance Optimized:** Uses an in-memory cache to ensure instant loading times, with the ability to force refresh the feed at any time.
- **Premium Interface Design:** A modern slate dark mode utilizing glowing ambient lights, responsive layouts, custom scrollbars, and high-end glassmorphism styling (`backdrop-filter: blur(12px)`).

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Requests (HTTP calls), ElementTree (XML parsing), BeautifulSoup4 (HTML segmentation).
- **Frontend:** Plain HTML5, CSS3 (Custom Variables, Flexbox/Grid, Animations), Javascript ES6 (Fetch API, DOM manipulation).
- **Aesthetics & Icons:** Google Fonts (`Outfit` & `Plus Jakarta Sans`), FontAwesome Icons.

---

## 📦 Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/victor411998/XXiao-agy-day2-talks-app.git
   cd XXiao-agy-day2-talks-app
   ```

2. **Install Dependencies:**
   ```bash
   pip install flask requests beautifulsoup4
   ```

3. **Run the Application:**
   ```bash
   python app.py
   ```

4. **Open in Browser:**
   Go to [**http://127.0.0.1:5000**](http://127.0.0.1:5000) in your web browser.

---

## 📂 Project Directory Structure

```text
├── app.py                 # Flask backend routing & parsing server
├── templates/
│   └── index.html         # Main SPA layout template
├── static/
│   ├── app.js             # Client-side filtering, state, and modal logic
│   └── style.css          # Glassmorphic custom CSS styling
├── .gitignore             # Git ignore patterns
└── README.md              # Project documentation
```

---

## 🔗 Useful Links

- **GitHub Repository:** [victor411998/XXiao-agy-day2-talks-app](https://github.com/victor411998/XXiao-agy-day2-talks-app)
- **BigQuery Official XML Feed:** [GCloud Feed XML](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)

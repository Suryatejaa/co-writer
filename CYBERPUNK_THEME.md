# iPhone / iOS Glass Theme Implementation

This document defines the iOS-inspired glassmorphism theme for the Context Builder app. It focuses on neutral bases, soft shadows, generous spacing, and a single accent color. Use this as the canonical design reference for `Home`, `Admin`, and `Contribute` pages.

## 🎨 Design Principles

- Elegant minimalism, ample negative space
- Neutral light base, subtle contrast, muted tones
- One accent color used sparingly for hierarchy and actions
- Rounded corners (12px–24px), capsule inputs and buttons
- Soft, realistic shadows; translucent cards with background blur

## ✍️ Typography

- **Font**: Inter (fallback: system-ui, -apple-system, Segoe UI)
- **Headings**: 600–700 weight
- **Body**: 400–500 weight
- **Secondary text**: medium-gray; avoid pure black
- **Tracking**: normal; avoid exaggerated letter spacing

## 🎯 Color Palette

- **Base**: `#f7f8fb` (app background), `#ffffff` (surfaces)
- **Text primary**: `#111827`
- **Text secondary**: `#6b7280`
- **Border**: `#e5e7eb`
- **Accent (default)**: `#6366f1` (indigo 500)
- Optional alternate accents: `#8b5cf6` (purple 500) or `#14b8a6` (teal 500)

## 🧩 Components & Treatments

### Glass Card
- Translucent white with blur
- Soft internal/ambient shadow
- 16px–24px radius

### Buttons
- Filled accent button (primary)
- Subtle hover scale and glow; 10–12px radius or fully rounded (capsule)

### Inputs
- Translucent background, subtle border, focus ring using accent tint

### Lists & Chips
- Very light gray item backgrounds, rounded corners, quiet borders

## 📁 File Structure

```
src/
├── ios-theme.css        # Core iOS glass styles (utility classes)
├── index.css            # Imports font, sets base colors
├── App.css              # Page-level layout helpers
├── components/
│   ├── Header.jsx       # iOS-styled header (frosted)
│   └── ...
└── pages/
    ├── Home.jsx
    ├── Admin.jsx
    └── Contribute.jsx
```

## 🧪 Tailwind Tokens (optional but recommended)

Add/extend the following in `tailwind.config.js`:
```js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        neutral: {
          50: "#f7f8fb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          700: "#374151",
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        pill: "9999px"
      },
      boxShadow: {
        card: "0 10px 30px rgba(17,24,39,0.06)",
        glass: "0 8px 24px rgba(17,24,39,0.08)",
      },
      backdropBlur: {
        sm: "2px",
        md: "6px",
        lg: "12px",
      }
    }
  },
  plugins: []
}
```

## 🧱 Core CSS Utilities (drop in `src/ios-theme.css` or `index.css`)

```css
/* Base */
:root {
  --accent: #6366f1;
  --bg: #f7f8fb;
  --surface: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
}

html, body, #root { height: 100%; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* Glass card */
.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
  transition: transform .2s ease, box-shadow .2s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(17,24,39,.08); }

/* Header (frosted) */
.frosted-header {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

/* Buttons */
.btn { 
  display: inline-flex; align-items: center; justify-content: center;
  gap: .5rem; padding: .625rem 1rem; border-radius: 9999px; font-weight: 600;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.btn-primary { background: var(--accent); color: #fff; box-shadow: 0 6px 16px rgba(99,102,241,.25); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,.35); }
.btn-ghost { background: rgba(255,255,255,.7); border: 1px solid var(--border); color: var(--text); }
.btn-ghost:hover { background: rgba(255,255,255,.9); }

/* Inputs */
.input {
  width: 100%; padding: .625rem .875rem; border-radius: 9999px;
  background: rgba(255,255,255,.8); border: 1px solid var(--border);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  transition: box-shadow .15s ease, border-color .15s ease;
}
.input:focus { outline: none; border-color: rgba(99,102,241,.4); box-shadow: 0 0 0 4px rgba(99,102,241,.12); }

/* Text helpers */
.text-secondary { color: var(--muted); }

/* Motion */
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeUp .45s ease-out both; }
```

## 🧭 Layout & Spacing

- Base container width 1200px with 24px–32px padding
- Grid with generous 24px gaps; cards auto-fit 300px min width
- Keep sections airy; avoid dense borders

## ⚙️ Usage Patterns

### Header
```jsx
<header className="frosted-header sticky top-0 z-10">
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    {/* brand + nav */}
  </div>
  {/* optional subtle divider shadow */}
</header>
```

### Card
```jsx
<section className="card p-6 fade-in">
  <h2 className="text-lg font-semibold">Section title</h2>
  <p className="text-secondary mt-1">Supporting copy goes here.</p>
  <button className="btn btn-primary mt-4">Primary action</button>
</section>
```

## ✨ Micro Interactions

- Buttons: slight scale/hover elevation; reduce on active
- Cards: fade/slide-in on mount
- Focus rings: soft, colored by accent (AA compliant)

## ♿ Accessibility

- Maintain 4.5:1 contrast for text vs backgrounds
- Respect `prefers-reduced-motion`; disable non-essential animations
- Large hit areas for interactive elements (44px+ height)

## ✅ Pages To Update

- `pages/Home.jsx` – hero, recent activity, quick actions using cards
- `pages/Admin.jsx` – management cards, inputs in capsule style
- `pages/Contribute.jsx` – form-like layout with glass inputs and primary button

Use the utilities from this document to style each page consistently.

---

Think of this as “native iOS, web-ready”: light, crisp, calm, and focused on content.
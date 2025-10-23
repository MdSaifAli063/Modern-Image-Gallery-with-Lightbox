# 🖼️ Modern Image Gallery with Lightbox

A fast, accessible, themeable image gallery with search, category filters, sorting, adjustable card sizes, and a polished lightbox experience.  
Designed for reliability with graceful fallbacks for remote images.

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff&style=for-the-badge">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff&style=for-the-badge">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge">
  <img alt="Accessible" src="https://img.shields.io/badge/Accessible-A11Y-0f766e?style=for-the-badge">
</p>

- 🎨 Themeable (dark/light)
- 🔎 Instant search & smart filters
- 🧭 Sort and density (card size) controls
- 💡 Lightbox with zoom, rotate, fullscreen, download, share
- 🛡️ Robust image fallback to avoid broken tiles
- ♿ Accessible roles, labels, and focus indicators
- ⚡ Lazy loading, preconnect, and optimized decoding

> Footer: “Made in India” 🇮🇳

---

## ✨ Preview

- Dark theme:
  ![image](https://github.com/MdSaifAli063/Modern-Image-Gallery-with-Lightbox/blob/0325d54dcffa1db8d8dd4c23555d87a5decd7487/Screenshot%202025-09-02%20014230.png)
- Light theme:
  ![image](https://github.com/MdSaifAli063/Modern-Image-Gallery-with-Lightbox/blob/8f2fbd35dc8961239ecebd4eb7e2ac508c677168/Screenshot%202025-09-02%20013138.png)

```text
docs/
 ├─ preview-dark.jpg
 └─ preview-light.jpg
```


## 🚀 Quick Start

- Download or clone the project.
- Open index.html in your browser.
- (Optional) Serve locally for better caching:
- Python: python3 -m http.server 8080
- Node: npx serve
- That’s it—no build step required.

🗂️ Project Structure
.
├─ index.html        # Gallery markup + fallback logic
├─ style.css         # Elegant UI theme (dark/light) + components
└─ script.js         # Lightbox and UI behaviors


🧭 Features

Search: Type in the search box to filter by image title/category.
Category Filters: All, Nature, Architecture, City, Favorites.
Sort: By Name or Category.
Density: Adjust card size via a range slider.
Theme Toggle: Dark/Light switch via the moon icon.
Lightbox:
Next/Previous
Zoom In/Out
Rotate
Fullscreen
Download
Share
Caption and image info panel

🛡️ Image Reliability

Some corporate networks or ad-blockers can disrupt hotlinking or the Unsplash random endpoint. This gallery includes:

Referrer policy to reduce hotlink-related 403s
Preconnects for faster stable fetches
Universal fallback: if any image fails, it swaps to a Picsum placeholder of matching size
To change the fallback provider, modify the tiny inline script in index.html:

const fallbackSrc = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/825`;


Examples:

Placehold: https://placehold.co/1200x825?text=Image
Your CDN: https://cdn.example.com/placeholders/${seed}.jpg

🧩 Add or Edit Images

Add a new card inside the .gallery list:

<div class="gallery-item" data-id="my-id" data-category="nature" role="listitem" tabindex="0">
  <div class="gallery-item-inner">
    <img src="https://images.unsplash.com/photo-XXXX?auto=format&fit=crop&w=1200&q=80" alt="Descriptive Title" loading="lazy">
    <button class="favorite-btn icon-btn" aria-pressed="false" title="Add to favorites">
      <i class="fas fa-heart"></i>
    </button>
    <div class="gallery-item-overlay">
      <i class="fas fa-search-plus"></i>
    </div>
  </div>
  <div class="gallery-item-info">
    <h3>Descriptive Title</h3>
    <span class="category">Nature</span>
  </div>
</div>


Tips:

Prefer fixed images from images.unsplash.com for consistency.
Keep alt descriptive for accessibility.
Use a stable data-id so the fallback “seed” generates consistent placeholders.

🎨 Theming & Customization

Theme is controlled via CSS variables and a body attribute.

Force light theme by default:
<body data-theme="light">

Variables you can customize in style.css:
:root {
  --bg: #0c1022;
  --surface: #141a2d;
  --text: #e9ecf8;
  --text-muted: #aab3d6;
  --primary: #5f87ff;
  --accent: #ff7a88;
  --success: #35d07f;
  --warning: #ffd166;
  --radius: 14px;
  --shadow: 0 12px 28px rgba(0,0,0,0.35);
  /* ... */
}
body[data-theme="light"] {
  --bg: #f6f8fd;
  --surface: #ffffff;
  --text: #0f1530;
  --primary: #3c63ff;
  --accent: #ef476f;
  /* ... */
}

Card density: default range is 180–320px wide; you can tweak min/max in index.html on #cardSizeRange or adapt grid with --card-min in CSS.

♿ Accessibility

Landmarks and roles: role="region", role="list", role="listitem", role="dialog"
ARIA labels and live regions for results count
Focus ring for keyboard users
Reduced motion support via prefers-reduced-motion
Alt text on images
Keyboard (typical defaults):
Esc: Close lightbox
←/→: Previous/Next image
Enter/Space on a focused card: Open lightbox
Tab/Shift+Tab: Navigate controls
Note: Ensure your script.js includes/keeps these bindings.

⚙️ Performance

loading="lazy" on images
decoding="async" set via JS
Preconnects to Unsplash endpoints
Referrer Policy to reduce 403s
Lightweight styles and transitions

📦 Deployment

This is a static site—deploy anywhere:

GitHub Pages
Netlify (drag & drop)
Vercel (import repo)
Ensure you serve over HTTPS to avoid mixed content issues and to keep CDN images accessible.

🧰 Troubleshooting

Images not loading:
Some networks block source.unsplash.com random endpoint—prefer images.unsplash.com with explicit image IDs or your own assets.
Keep the fallback enabled or replace it with your own placeholder.
CORS/403 errors:
The referrer meta is already set to no-referrer.
Serve from HTTPS and avoid modifying URL params that Unsplash expects.
Lightbox controls not responding:
Confirm script.js is included and error-free in console.
Check button IDs/classes match those in index.html.

🙏 Credits

Photos: Unsplash (https://unsplash.com)
Fallback images: Picsum Photos (https://picsum.photos)
Icons: Font Awesome (https://fontawesome.com)
Made with ❤️ in India.

📄 License

Add your preferred license here (MIT recommended). If you include Unsplash images, ensure you follow their guidelines and attribution where required.

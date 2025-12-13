---
description: How to deploy the Par application (dist folder)
---

The `dist` folder contains a completely static web application (HTML, CSS, JS). You can host it on any static site provider.

## Option 1: Netlify / Vercel (Recommended)
The easiest way to ship is using drag-and-drop or CLI.

1.  **Drag and Drop**:
    - Build the project: `npm run build`
    - Go to [Netlify Drop](https://app.netlify.com/drop)
    - Drag the `dist` folder onto the page.
    - Done! You'll get a live URL immediately.

2.  **CLI**:
    - Install CLI: `npm install -g netlify-cli`
    - Run: `netlify deploy --prod --dir=dist`

## Option 2: GitHub Pages
If your code is on GitHub:

1.  Push your code to GitHub.
2.  Install `gh-pages` package: `npm install -D gh-pages`
3.  Add this script to `package.json`:
    ```json
    "deploy": "gh-pages -d dist"
    ```
4.  Run: `npm run deploy`

## Option 3: Traditional Web Server
Upload the **contents** of `dist` (index.html + assets folder) to the public root of any web server (Apache, Nginx, etc.).

## Option 4: Local Preview
To test the production build locally before shipping:
```bash
npx vite preview
# OR
python3 -m http.server --directory dist
```

# Easy GitHub UI Upload Steps

Upload the extracted folder contents, not the ZIP file itself.

## Upload these items to GitHub

- data
- docs
- public
- routes
- uploads
- .gitignore
- README.md
- package.json
- package-lock.json
- server.js
- start.bat
- install-and-run.ps1

## Do not upload

- node_modules
- real resumes
- private candidate documents

## Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Default login:

```text
admin@aihr.local / admin123
```

## Important

GitHub publishes the source code. GitHub Pages cannot run this Node.js backend or save uploaded files. To make the app live with full functionality, deploy the GitHub repo to Render, Railway, AWS, or another Node.js hosting platform.

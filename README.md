# AI HR Assistant — JSON Database + Folder Upload Package

This is a complete working prototype for an AI HR Assistant using:

- HTML
- CSS
- Bootstrap 5
- JavaScript
- jQuery
- Node.js + Express
- JSON files as database
- Folder-based resume storage

No MySQL, MongoDB, PostgreSQL, Firebase database, or traditional database is used.

## Important GitHub Note

GitHub Pages can host only static frontend files. It cannot run Node.js APIs, update JSON database files, or save uploaded documents into folders.

So this package is designed to be:

1. Published to GitHub as a full source-code repository.
2. Run locally with Node.js, or deployed to a backend-supported host such as Render, Railway, AWS EC2, AWS Elastic Beanstalk, or any VPS.

## Default Login

Email:

```text
admin@aihr.local
```

Password:

```text
admin123
```

On first server start, the default password is converted into a bcrypt hash inside `data/users.json`.

## How to Run Locally

Install Node.js first.

Then open terminal inside this folder and run:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Windows Quick Start

Double-click:

```text
start.bat
```

or run PowerShell:

```powershell
./install-and-run.ps1
```

## Main Features

- Login and signup
- Responsive Bootstrap navbar and sidebar
- Dashboard summary
- Create, generate, edit, publish and delete job descriptions
- Candidate upload
- Resume file upload into `uploads/resumes`
- Candidate data saved into `data/candidates.json`
- ATS score generation
- Matched skills and missing skills
- Shortlist management
- Interview scheduling
- Reports and CSV export
- Settings stored in JSON

## JSON Database Files

```text
data/users.json
data/jobs.json
data/candidates.json
data/ats_scores.json
data/shortlisted.json
data/interviews.json
data/activity_logs.json
data/settings.json
```

## Upload Folder

```text
uploads/resumes
```

Uploaded resumes are stored in this folder and the file path is saved inside `candidates.json`.

## GitHub Publishing Steps

1. Create a new GitHub repository.
2. Extract this ZIP.
3. Open terminal inside the extracted folder.
4. Run:

```bash
git init
git add .
git commit -m "Initial AI HR Assistant package"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Your source code will be published to GitHub.

## Live Deployment Options

For full functionality, deploy to a backend-supported platform:

- Render
- Railway
- AWS EC2
- AWS Elastic Beanstalk
- VPS

Do not use only GitHub Pages for this full version because upload and JSON write actions need Node.js.

## Recommended Production Improvements

This is a strong prototype. For production, add:

- Real authentication sessions or JWT validation
- Role-based access control
- HTTPS-only hosting
- Resume virus scan
- Server-side input validation
- Audit logging per user
- Private file access instead of public upload links
- Backup strategy for JSON files
- Optional migration to DynamoDB/S3 later if needed

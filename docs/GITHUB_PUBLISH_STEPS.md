# GitHub Publishing Guide

## What GitHub can do

GitHub can store and share the complete source code repository.

## What GitHub Pages cannot do

GitHub Pages cannot:

- run `server.js`
- save uploaded resumes into `/uploads/resumes`
- update JSON files inside `/data`
- run backend APIs under `/api/...`

Therefore, use GitHub as the repository, then run/deploy the app on a Node.js-supported platform.

## Publish Source Code to GitHub

```bash
git init
git add .
git commit -m "Initial AI HR Assistant app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-hr-assistant.git
git push -u origin main
```

## Run After Cloning

```bash
git clone https://github.com/YOUR-USERNAME/ai-hr-assistant.git
cd ai-hr-assistant
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Recommended Hosted Deployment

Use one of these for full functionality:

- Render Web Service
- Railway Node.js service
- AWS EC2
- AWS Elastic Beanstalk
- VPS with Node.js and PM2

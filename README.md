# 🌾 Oryza – AI Assisted Plant Health Checker

Oryza is a **progressive web application (PWA)** that helps farmers, researchers, and plant enthusiasts check the **health of plants using AI**.  
Users can **upload images of plants** and interact with an **AI-powered chat assistant** to receive insights, guidance, and possible solutions for plant diseases or deficiencies.  

---

## ✨ Features
- 📷 **Image Input** – Upload or capture a plant image for health analysis.
- 🤖 **AI-Assisted Diagnosis** – Get real-time feedback on plant conditions.
- 💬 **Chat Interface** – Ask questions and receive contextual AI responses.
- 📱 **PWA Support** – Works on web, desktop (via wrapper), and mobile devices.
- ⚡ **Powered by OpenRouter** – Flexible AI model integration.

---

## 🔑 Environment Variables

You must create a **`.env`** file in the **root of the project** before running locally.  

```env
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
VITE_OPENROUTER_API_KEY=   # for local dev only
VITE_APP_TITLE=OpenRouter AI PWA
VITE_APP_REFERER=http://localhost:5173
```
⚠️ Important:

Never expose your real API key in public repositories.

For production, use a secure environment variable manager (e.g., Vercel, Netlify, Docker secrets).

🚀 Getting Started
1. Clone the repo
bash
Salin kode
git clone https://github.com/yourusername/oryza.git
cd oryza
2. Install dependencies
bash
Salin kode
npm install
3. Setup environment variables
Create .env file as described above.

4. Run development server
bash
Salin kode
npm run dev
5. Build for production
bash
Salin kode
npm run build
🛠️ Tech Stack
Frontend: React + Tailwind CSS

Bundler: Vite

AI Provider: OpenRouter API

PWA Support: Service workers + manifest

Animation: Framer Motion


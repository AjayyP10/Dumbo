# Dumbo 🐘

Multi-language translation app with CEFR-level customization (A1–B2 for German, Spanish and French) built with Django + DRF (backend) & React + Vite + Tailwind (frontend).  
LLM: `google/gemma-3-27b-it:free` via OpenRouter.

---

## 1. Local development 

```bash
# backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # add your own keys
python manage.py migrate
python manage.py runserver
```

```bash
# frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs on <http://localhost:5173> and proxies to the backend at <http://localhost:8000>.

---

## 2. Deploy to Render (free tier)

1. Create a new **Web Service** → “Deploy from GitHub”.  
2. Add a free **PostgreSQL** DB; Render injects `DATABASE_URL`.  
3. In “Build Command” set `./build.sh`.  
4. In “Start Command” set `gunicorn dumbo.wsgi:application`.  
5. Add environment variables `SECRET_KEY`, `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS` (comma-separated).  
6. Hit “Deploy”.

The script builds the React app and Collects static files; Gunicorn then serves Django with WhiteNoise.

---

## 3. GitHub upload

```bash
git init
git add .
git commit -m "Initial Dumbo commit"
git remote add origin https://github.com/yourname/dumbo.git
git branch -M main
git push -u origin main
```

---

## 4. License

MIT
# UNEC AI Backend — Vercel Deploy

## Deploy Addımları

1. Bu qovluğu ayrıca GitHub repo kimi yüklə
2. [vercel.com](https://vercel.com) → **New Project** → repo connect et
3. **Environment Variables** bölməsində əlavə et:
   ```
   GEMINI_API_KEY = sənin_gemini_açarın
   ```
4. **Deploy** düyməsinə bas

## Gemini API Açarı Almaq

1. [aistudio.google.com](https://aistudio.google.com) → Get API Key
2. Pulsuz, qeydiyyat tələb edir

## Frontend Qoşma

`index.html`-dəki widget-də `VERCEL_URL`-i deploy sonrası alınan URL ilə əvəz et:
```js
const BACKEND_URL = "https://sənin-layihə.vercel.app";
```

## Endpoint

```
POST https://sənin-layihə.vercel.app/api/ask
Content-Type: application/json

{
  "question": "Mikroiqtisadiyyat nə öyrədir?",
  "context": "..."   // optional
}
```

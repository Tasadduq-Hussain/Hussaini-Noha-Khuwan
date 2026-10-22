HUSSAINI NOHA KHUWAN - STARTER

1. Extract this folder.
2. Keep logo.png in the same folder.
3. Create a Supabase project.
4. Open Supabase SQL Editor and paste ALL contents of schema.sql, then Run.
5. In Supabase Authentication > Users, create your admin email/password.
6. Copy that user's UUID and run the final INSERT line from schema.sql after replacing YOUR-AUTH-USER-UUID and email.
7. In app.js and admin.js replace:
   PASTE_YOUR_SUPABASE_URL
   PASTE_YOUR_SUPABASE_ANON_KEY
   with your Supabase Project URL and Publishable/Anon key.
8. Deploy the folder to Netlify.
9. Main website: /
10. Admin: /admin.html

IMPORTANT:
- Never put a Supabase service_role/secret key in these browser files.
- The publishable/anon key is intended for browser use; RLS policies protect the data.
- Offline mode caches the website shell and the last successfully synced Nohay in localStorage. New Nohay require an internet sync first.
- Lyrics image is supported; Urdu lyrics are optional.

# Connecting DevSpace to Supabase (when you're ready)

DevSpace works without this. Connecting it lets your phone and PC share projects even with the PC off.

## What you do (about 5 minutes)

1. Sign in at supabase.com and create a free project (any name, e.g. "devspace"). Pick a strong
   database password and keep it to yourself.
2. Or, in Claude Code, connect the Supabase tool (`/mcp`, then Supabase) and say "connect DevSpace to
   Supabase": Claude can then do steps 3 and 4 for you.
3. In the project: SQL editor, paste `supabase/migrations/20261105000000_devspace_state.sql`, Run.
   It makes one private table where only you can see your row.
4. Authentication, URL configuration: add these as redirect URLs:
   `http://localhost:5180`, `http://127.0.0.1:5181`, and the web address DevSpace is hosted at.
5. Project settings, API: copy the **Project URL** and the **anon public** key (never the service_role key).
6. In DevSpace, Settings, Cloud sync: paste them, Save, then sign in with your email link.
   Do the same on your phone.

## Still to decide
- Where DevSpace is hosted for your phone (GitHub Pages or Cloudflare Pages are free). Hosting it
  puts the app online; your projects stay private in your Supabase row.

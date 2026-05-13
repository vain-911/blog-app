# 6 Specs for Blog App

## 1. Summary
A lightweight blog management app built with Express, EJS, MongoDB, and Supabase authentication. Users can view published posts, create new blogs with optional image uploads, edit their own posts, and delete content they own.

## 2. User Personas
- **Anonymous visitor**: Browses the blog list, views post details, and reads the About page.
- **Authenticated blogger**: Signs in with Supabase, creates new posts, uploads images, edits owned posts, and deletes their own content.
- **Admin / maintainer**: Runs and deploys the Node.js app, maintains database and Supabase auth configuration.

## 3. Problem Statement
Publishers need a simple, secure blog platform without a heavy CMS. The app must let authenticated authors manage posts while preventing unauthenticated users from creating, editing, or deleting content.

## 4. Solution
- Public blog listing at `/blogs` with detail pages for each post.
- Login page at `/login` where Supabase auth is handled client-side.
- Protected create, edit, and delete operations using Supabase JWT verification on the backend.
- Image uploads stored under `public/uploads` using Multer, limited to 2MB and common image formats.
- Common site pages: home redirect to `/blogs`, about at `/about`, and a catch-all 404 page.
- CSP and security headers applied via Helmet.

## 5. Technical Architecture
- `app.js`: main Express server, MongoDB connection, Supabase client, helmet-based CSP, static assets, and route mounting.
- `routes/blogRouter.js`: CRUD routes for blog posts, protected by auth middleware for write operations.
- `models/blog.js`: Mongoose schema for posts with `title`, `snippet`, `content`, optional `imagePath`, and `authorId`.
- `public/js/*`: client-side logic for guarding auth-only UI, submitting create/edit forms with the Supabase access token, and logout handling.
- Environment requirements: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `MONGODB_URI`.

## 6. Acceptance Criteria
- Visitors can browse `/blogs` and view individual post details.
- Unauthenticated users are redirected to `/login` before accessing create/edit pages.
- Authenticated requests require a valid Supabase JWT in `Authorization: Bearer <token>`.
- Blog post creation and editing support optional image uploads with type and size validation.
- Users can only update or delete posts where `authorId` matches their Supabase user ID.
- A missing route returns a rendered 404 page.

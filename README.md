# Avantika Flow - Modern SaaS Landing Page

A stunning, high-conversion SaaS landing page built with React, Vite, Tailwind CSS, and Framer Motion. Inspired by premium landing pages like Scribe.com with smooth animations, gradient designs, and interactive components.

## Google Sign-In + Email Verification Setup

This project now includes a gated onboarding state machine:

- anonymous
- oauth_in_progress
- authenticated_unverified
- email_verification_pending
- email_verified_no_team
- email_verified_with_team
- rejected_or_blocked

### 1. Backend env setup

Copy and edit env:

```bash
cp server/.env.example server/.env
```

Required values:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- FRONTEND_URL
- ADMIN_SECRET

Recommended local values:

- GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
- FRONTEND_URL=http://localhost:5175

### 2. Google Console redirect URI

In your Google OAuth client, add this Authorized redirect URI:

```text
http://localhost:3001/api/auth/google/callback
```

Production values:

- Vercel frontend env: `VITE_API_URL=https://<your-azure-backend>.azurewebsites.net`
- Azure backend env: `FRONTEND_URL=https://avantika-flow-ai.vercel.app`
- Azure backend env: `GOOGLE_CALLBACK_URL=https://<your-azure-backend>.azurewebsites.net/api/auth/google/callback`
- Google Console authorized redirect URI: `https://<your-azure-backend>.azurewebsites.net/api/auth/google/callback`

### 3. Run frontend + backend

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
npm install && npm run dev
```

### 4. Available auth/admin APIs

- GET /api/auth/google
- GET /api/auth/google/callback
- GET /api/auth/verify-email
- POST /api/auth/resend-verification
- GET /api/auth/me
- POST /api/team/create
- POST /api/admin/users/:id/approve
- POST /api/admin/users/:id/reject

Admin endpoints require `x-admin-secret` header or `?secret=` query value.

### 5. Verification flow behavior

- New Google/email users are created with `email_verified=false`.
- Verification email is sent automatically after auth.
- Unverified users are blocked from workspace access and routed to `/verify-email-pending`.
- Clicking verification link marks email as verified and redirects to `/email-verified-success`.
- Verified users with no workspace see the "Name your team" modal on `/welcome`.
- Team creation sends users to `/dashboard`.

## ✨ Features

- 🎨 **Modern Design**: Pixel-perfect UI with gradient backgrounds and smooth animations
- ⚡ **Performance**: Built with Vite for lightning-fast development and production builds
- 🎭 **Animations**: Smooth Framer Motion animations throughout the page
- 🌓 **Dark/Light Mode**: Full theme support with persistent preferences
- 📱 **Responsive**: Mobile-first design that works on all devices
- ♿ **Accessible**: ARIA labels and semantic HTML for better accessibility
- 🎯 **SEO Ready**: Meta tags and semantic structure for search engines
- 🔧 **Component-Based**: Modular, reusable components for easy maintenance

## 📁 Project Structure

```
src/
├── components/
│   ├── Navigation.tsx      # Sticky navbar with mobile menu
│   ├── Hero.tsx            # Full-screen hero section
│   ├── UseCaseCards.tsx    # Interactive use case cards
│   ├── Features.tsx        # Feature highlights
│   ├── CTASection.tsx      # Call-to-action section
│   ├── Footer.tsx          # Footer with links
│   └── index.ts            # Component exports
├── App.tsx                 # Main app component with dark mode
├── main.tsx                # React entry point
├── index.css               # Global styles and animations
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. **Navigate to the project directory**:
```bash
cd /Users/mayankgaur/Documents/Avantika-Flow-AI
```

2. **Install dependencies**:
```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🎨 Key Components

### Navigation
- Sticky header with blur effect
- Responsive mobile menu
- Dark/light mode toggle
- Sign in and CTA buttons

### Hero Section
- Full-screen gradient background (blue → purple → pink)
- Animated circular gradients
- Trust badge with social proof
- Prominent CTA buttons
- Scroll indicator animation

### Use Case Cards
- 6 interactive cards with hover animations
- Icon-based design with gradient backgrounds
- Responsive grid layout
- Smooth scale and glow effects

### Features Section
- 4 key features with icons
- Rotating icon animations
- Left-aligned responsive layout

### CTA Section
- Highlighted call-to-action
- Benefit checklist
- Primary and secondary buttons
- Background gradient overlay

### Footer
- Multiple link sections
- Social media links
- Copyright and legal links
- Brand information

## 🎭 Animations

All animations use Framer Motion for smooth, performant effects:

- **Fade-in animations** on page load
- **Hover effects** on cards and buttons
- **Glow and pulse** effects on CTAs
- **Staggered animations** for sections
- **Floating elements** in background
- **Scroll-triggered animations** for visibility
- **Theme transition** animations

## 🌓 Dark Mode

The landing page includes full dark mode support:
- Toggle button in navigation
- Persistent theme preference (localStorage)
- System preference detection
- Smooth transitions between themes
- Optimized colors for both modes

## 🎯 Key Features Implemented

✅ Full-screen gradient background with radial patterns  
✅ Sticky navigation with blur effect  
✅ Interactive use case cards with hover animations  
✅ Smooth fade-in and slide-up animations  
✅ Button pulse/glow effects  
✅ Mobile-first responsive design  
✅ Dark/light mode toggle  
✅ Reusable component architecture  
✅ SEO-friendly meta tags  
✅ Production-ready code  

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.263.1",
  "tailwindcss": "^3.3.5"
}
```

## 🚀 Deployment

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel
1. Import your project
2. Vercel automatically detects Vite
3. Deploy with one click

### GitHub Pages
```bash
npm run build
# Deploy the dist folder
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🎯 Customization

### Colors
Edit `tailwind.config.js` to customize the color palette:
```js
colors: {
  primary: { /* ... */ },
  secondary: { /* ... */ },
}
```

### Animations
Modify animation timings in `tailwind.config.js` or `src/index.css`

### Content
Update text and copy directly in component files (`.tsx`)

### Spacing
Adjust margins and padding using Tailwind's utility classes

## 🔒 Performance Optimization

- ✅ Code splitting with Vite
- ✅ Image optimization (use next-gen formats)
- ✅ Tree-shaking for unused code
- ✅ Minification in production
- ✅ CSS purging with Tailwind
- ✅ Lazy animation loading

## 🐛 Troubleshooting

**Build fails**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Styles not applying**
- Clear browser cache
- Restart dev server
- Check Tailwind config is correct

**Animations not smooth**
- Check browser performance in DevTools
- Ensure GPU acceleration is enabled
- Reduce number of simultaneous animations

## 📄 License

MIT License - feel free to use for commercial projects

## 🤝 Contributing

Contributions are welcome! Feel free to submit pull requests or open issues.

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Happy Building! 🚀**

Made with ❤️ by the Avantika Team

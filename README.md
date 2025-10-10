# 🗺️ MYMAPS - Share Your Favorite Places Safely

<div align="center">

![MYMAPS Banner](https://img.shields.io/badge/MYMAPS-Location%20Sharing%20Platform-blue?style=for-the-badge)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

**Share locations with friends, discover new places, and protect your privacy with smart auto-deletion.**

[🚀 Live Demo](https://your-demo-url.com) • [📖 Documentation](./docs) • [🐛 Report Bug](https://github.com/Stevenalenga/MYMAPS/issues) • [✨ Request Feature](https://github.com/Stevenalenga/MYMAPS/issues)

</div>

---

## ✨ Features

### 🔒 **Privacy First**
- **24-Hour Auto-Deletion**: Public locations automatically delete after 24 hours
- **Granular Visibility Controls**: Choose public, followers-only, or private
- **GDPR Compliant**: Built with privacy regulations in mind

### 🗺️ **Interactive Mapping**
- **Google Maps Integration**: Full-featured maps with satellite and street view
- **Custom Markers**: Beautiful, color-coded location pins
- **Real-time Updates**: See new locations instantly without refreshing

### 👥 **Social Features**
- **Follow System**: Connect with friends and see their shared locations
- **User Profiles**: Customize your profile and track your locations
- **Discovery**: Explore public locations from the community

### 🔗 **Rich Content**
- **Attach Links**: Add URLs to locations (reviews, bookings, articles)
- **Coordinate Input**: Precise location entry with latitude/longitude
- **Search**: Find locations by name or coordinates

### 🎨 **Modern Design**
- **Dark Mode**: Full dark mode support
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Accessible**: Built with accessibility in mind

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Google Maps API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Stevenalenga/MYMAPS.git
cd MYMAPS
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

CRON_SECRET=your_secure_random_secret
```

4. **Set up the database**

Run the schema in your Supabase SQL Editor:

```bash
# Copy and run: supabase/schema.sql
```

Apply the 24-hour expiration migration:

```bash
# Copy and run: supabase/migrations/20250110_add_24hr_expiration.sql
```

Enable pg_cron extension in Supabase:
- Go to Database → Extensions
- Search for `pg_cron` and enable it

5. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📸 Screenshots

<div align="center">

### 🏠 Landing Page
![Landing Page](https://via.placeholder.com/800x450/4F46E5/FFFFFF?text=Beautiful+Landing+Page)

### 🗺️ Interactive Map
![Map View](https://via.placeholder.com/800x450/10B981/FFFFFF?text=Interactive+Map+View)

### 📍 Location Dialog
![Location Dialog](https://via.placeholder.com/800x450/F59E0B/FFFFFF?text=Add+Location+Dialog)

### 👤 User Profile
![User Profile](https://via.placeholder.com/800x450/8B5CF6/FFFFFF?text=User+Profile+Page)

</div>

---

## 🏗️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Google Maps API](https://developers.google.com/maps)** - Interactive maps

### Backend
- **[Supabase](https://supabase.com/)** - PostgreSQL database & authentication
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Backend API
- **[pg_cron](https://github.com/citusdata/pg_cron)** - Scheduled database jobs

### DevOps
- **[Vercel](https://vercel.com/)** - Hosting & deployment
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD
- **[Jest](https://jestjs.io/)** - Testing

---

## 📁 Project Structure

```
MYMAPS/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (routes)/            # Main application routes
│   │   ├── map/             # Map view
│   │   ├── explore/         # Explore locations
│   │   ├── profile/         # User profile
│   │   ├── followers/       # Followers list
│   │   └── following/       # Following list
│   ├── (marketing)/         # Marketing pages
│   │   └── landing/         # Landing page
│   ├── api/                 # API routes
│   │   ├── locations/       # Location CRUD
│   │   ├── followers/       # Follow system
│   │   └── cleanup/         # Auto-deletion
│   └── layout.tsx           # Root layout
├── components/
│   ├── mapscomponents/      # Map-related components
│   ├── ui/                  # Reusable UI components
│   ├── explore/             # Explore page components
│   └── profile/             # Profile page components
├── supabase/
│   ├── schema.sql           # Database schema
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
├── types/                   # TypeScript types
└── public/                  # Static assets
```

---

## 🔐 Privacy & Security

### 24-Hour Auto-Deletion

Public locations are automatically deleted after 24 hours to protect user privacy:

```sql
-- Automated cleanup runs hourly
DELETE FROM locations
WHERE visibility = 'public'
  AND created_at < NOW() - INTERVAL '24 hours';
```

### Security Features

- ✅ **Row-Level Security (RLS)**: Database-level access control
- ✅ **JWT Authentication**: Secure token-based auth with Supabase
- ✅ **Encrypted Connections**: All data transmitted over HTTPS
- ✅ **Input Validation**: Server-side validation for all inputs
- ✅ **CRON Secret**: API endpoints protected with secret keys

See [Security Documentation](./docs/authentication.md) for details.

---

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Test 24-hour expiration feature
npm run test:expiration
```

---

## 📊 API Documentation

### Locations API

#### Create Location
```typescript
POST /api/locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Favorite Cafe",
  "lat": 40.7128,
  "lng": -74.0060,
  "visibility": "public",
  "url": "https://example.com"
}
```

#### Get Locations
```typescript
GET /api/locations?userId=<uuid>
Authorization: Bearer <token>
```

#### Update Location
```typescript
PUT /api/locations/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "visibility": "private"
}
```

#### Delete Location
```typescript
DELETE /api/locations/<id>
Authorization: Bearer <token>
```

See [API Reference](./docs/api-reference.md) for complete documentation.

---

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Stevenalenga/MYMAPS)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📝 Documentation

- [📚 Project Overview](./docs/project-overview.md)
- [🏗️ Architecture](./docs/architecture.md)
- [🔐 Authentication](./docs/authentication.md)
- [🗄️ Database Schema](./docs/database.md)
- [🗺️ Google Maps Integration](./docs/google-maps.md)
- [⏱️ 24-Hour Expiration](./docs/24hr-expiration.md)
- [🚀 Deployment](./docs/deployment.md)
- [🐛 Troubleshooting](./docs/troubleshooting.md)

---

## 🗓️ Roadmap

- [x] Core location sharing functionality
- [x] Follow system
- [x] 24-hour auto-deletion for public locations
- [x] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Location categories and tags
- [ ] Advanced search and filters
- [ ] Location sharing via links
- [ ] Export locations to GPX/KML
- [ ] Integration with travel planning tools
- [ ] AI-powered location recommendations

See the [open issues](https://github.com/Stevenalenga/MYMAPS/issues) for a full list of proposed features and known issues.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- [Next.js](https://nextjs.org/) - Amazing React framework
- [Supabase](https://supabase.com/) - Fantastic backend platform
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Google Maps](https://developers.google.com/maps) - Powerful mapping platform
- [Vercel](https://vercel.com/) - Excellent hosting platform

---

## 📧 Contact

**Project Maintainer**: [@Stevenalenga](https://github.com/Stevenalenga)

**Project Link**: [https://github.com/Stevenalenga/MYMAPS](https://github.com/Stevenalenga/MYMAPS)

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with ❤️ by the MYMAPS team

</div>

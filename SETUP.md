# Private Room Manager - Setup Guide

This is a Whop app extension that allows creators to create paid private rooms with unique passwords for access.

## Features

- ✅ Create paid rooms with custom pricing ($20, $100, $1000, etc.)
- ✅ Whop authentication integration
- ✅ Dashboard for room management
- ✅ Unique password generation for each room
- ✅ Clean UI with ShadCN components

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Whop API Configuration
WHOP_API_KEY=your_whop_api_key_here
WHOP_API_SECRET=your_whop_api_secret_here

# Public Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_whop_company_id_here
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_whop_agent_user_id_here

# Database (we'll use a simple JSON file for now)
DATABASE_URL=./data/rooms.json
```

### 2. Get Your Whop API Credentials

1. Go to your [Whop Dashboard](https://whop.com/dashboard)
2. Navigate to the Developer section
3. Create a new app
4. Copy the API key, secret, app ID, company ID, and agent user ID

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Development Server

```bash
pnpm dev
```

### 5. Install Your App

Once your environment variables are set, you can install your app into your Whop community using the link provided in the app.

## Usage

### For Creators

1. **Authentication**: Users must authenticate through Whop to access the dashboard
2. **Create Rooms**: Use the dashboard to create new rooms with custom names and prices
3. **Get Passwords**: Each room gets a unique password that's shown after creation
4. **Manage Rooms**: View all your created rooms in the dashboard

### For Users

1. **Payment**: Users will see a payment UI powered by Whop checkout
2. **Password**: After successful payment, users receive a unique password
3. **Access**: Use the password to enter the private room

## File Structure

```
├── app/
│   ├── api/rooms/          # API routes for room management
│   ├── dashboard/          # Dashboard page for creators
│   ├── layout.tsx          # Root layout with Whop provider
│   └── page.tsx            # Home page with authentication
├── components/ui/          # ShadCN UI components
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utility functions
│   └── whop-sdk.ts         # Whop SDK configuration
├── data/
│   └── rooms.json          # Room data storage
└── package.json
```

## Next Steps

This is a basic implementation with placeholder UI. Future enhancements could include:

- [ ] Video call integration
- [ ] Real-time chat
- [ ] Payment tracking
- [ ] Room analytics
- [ ] User management
- [ ] Advanced room settings

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ShadCN UI** - Component library
- **Whop SDK** - Authentication and API
- **Lucide React** - Icons

## Support

For issues or questions:
- Check the [Whop Documentation](https://dev.whop.com)
- Review the API routes in `app/api/rooms/`
- Ensure all environment variables are properly set

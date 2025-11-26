# ScaleX Frontend

A modern Web3 trading platform frontend built with Next.js 16, featuring blockchain integration and interactive animations.

## 🚀 Features

- **Web3 Integration**: Blockchain connectivity via Privy authentication and Wagmi
- **Modern UI/UX**: Interactive components with Framer Motion animations
- **Trading Interface**: Dedicated trading page for Web3 transactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS 4
- **Type Safety**: Full TypeScript support
- **3D Visuals**: Spline 3D graphics integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **pnpm** (recommended) or npm/yarn
- **Git**

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion (motion)
- **Web3**: 
  - Privy (Authentication)
  - Wagmi 2.x (Ethereum interactions)
  - Viem (Low-level Ethereum utilities)
- **State Management**: TanStack Query
- **Fonts**: Space Grotesk, Roboto Mono
- **3D Graphics**: Spline React

## 📦 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Privy Configuration (Get from https://www.privy.io/)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

## 🚀 Getting Started

### Development Server

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Linting

```bash
pnpm lint
```

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page (redirects to trade)
│   ├── trade/               # Trading interface
│   └── faucet/              # Faucet page
├── components/
│   └── ui/                  # Reusable UI components
├── configs/
│   └── wagmi.ts             # Wagmi blockchain configuration
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
├── providers/
│   └── privyProvider.tsx    # Privy & Web3 provider setup
├── types/                    # TypeScript type definitions
├── public/                   # Static assets
└── next.config.ts           # Next.js configuration
```

## 🔑 Key Features Explained

### Web3 Integration

**Privy Authentication**: Provides seamless Web3 wallet connection and authentication

**Wagmi Configuration**: Pre-configured for Ethereum Mainnet and Sepolia testnet

```typescript
// Supported Networks
- Ethereum Mainnet
- Sepolia Testnet
```

### Component Architecture

- **UI Components**: Built with Radix UI primitives for accessibility
- **Animations**: Smooth transitions using Framer Motion

## 🎨 Styling

This project uses Tailwind CSS 4 with:

- Custom configuration in `postcss.config.mjs`
- Dark mode by default
- Custom animations via `tw-animate-css`
- Utility classes with `clsx` and `tailwind-merge`

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID | Yes |

## 🚢 Deployment

### Vercel (Recommended)

The easiest way to deploy:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your project on [Vercel](https://vercel.com/new)
3. Configure environment variables
4. Deploy

### Other Platforms

This is a standard Next.js application and can be deployed to:
- AWS Amplify
- Netlify
- Railway
- Any Node.js hosting platform

## 🧪 Development Guidelines

### Adding New Pages

1. Create a new folder in `app/` directory
2. Add `page.tsx` for the route
3. Update middleware if access control is needed

### Creating Components

- Place reusable UI components in `components/ui/`
- Feature-specific components go in their respective folders
- Follow the existing naming conventions

### TypeScript

- All components should be typed
- Define interfaces in `types/` for shared types
- Use type inference where possible

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Privy Docs](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [TanStack Query](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests if applicable
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Common Issues

**Module not found errors**: Clear cache and reinstall
```bash
rm -rf .next node_modules
pnpm install
```

**Privy connection issues**: Verify your `NEXT_PUBLIC_PRIVY_APP_ID` is correct

**Build failures**: Check TypeScript errors with `pnpm lint`

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by the ScaleX Team**

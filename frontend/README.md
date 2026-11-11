# Invictus Frontend Client

The web client for **Invictus** — a modern PCB consumption analytics, BOM mapping, and inventory tracking platform.

## Tech Stack
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visuals & Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in this directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_URL` (default: `http://localhost:5000/api`).

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application runs by default at `http://localhost:5173`.

4. **Build for production**:
   ```bash
   npm run build
   ```

For full system setup, database configuration, and backend instructions, refer to the [Root README](../README.md).

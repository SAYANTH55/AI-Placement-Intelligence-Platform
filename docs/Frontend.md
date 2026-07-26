# Frontend Documentation

The JobMode frontend is a modern Single Page Application (SPA) built with **React 19** and **Vite**.

## Directory Structure (`src/`)

- `components/`: Reusable UI elements, grouped by feature domain (e.g., `ats/`, `dashboard/`, `common/`).
- `pages/`: Top-level route components corresponding to distinct URLs.
- `index.css`: Global styles, CSS variables, and Tailwind imports.

## Key Technologies

- **React 19**: Leverages modern hooks (`useState`, `useEffect`, custom hooks).
- **React Router 7**: Manages client-side routing.
- **TailwindCSS 4**: Utility-first CSS framework for rapid, responsive UI development.
- **Axios**: Configured for intercepting requests to inject JWT headers automatically.
- **Lucide React**: Icon library used consistently across the platform.

## State Management

Currently, the application relies on React Context and local component state. As the platform scales, integrating a global state manager like Zustand or Redux is planned for complex cross-domain state (e.g., complex multi-step application forms).

## Running Locally

1. Install Node.js dependencies: `npm install`
2. Start development server: `npm run dev`

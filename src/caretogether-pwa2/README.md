# CareTogether PWA

A modern Progressive Web Application built with cutting-edge web technologies.

## Tech Stack

- **Vite 7** - Lightning-fast build tool
- **React 19** - Modern React with latest features
- **TypeScript 5.9** - Type-safe development
- **MUI 7** - Material-UI component library
- **Storybook 10** - Component development environment
- **ESLint & Prettier** - Code quality and formatting

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Storybook

Launch Storybook to develop components in isolation:

```bash
npm run storybook
```

Storybook will be available at [http://localhost:6006](http://localhost:6006)

### Build

Build the production application:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run storybook` - Start Storybook
- `npm run build-storybook` - Build Storybook for deployment

## Project Structure

```
caretogether-pwa2/
├── .storybook/          # Storybook configuration
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── stories/         # Storybook example stories
│   ├── App.tsx          # Main app component
│   ├── App.stories.tsx  # App component story
│   ├── theme.ts         # MUI theme configuration
│   └── main.tsx         # Application entry point
├── dist/                # Production build output
└── package.json         # Dependencies and scripts
```

## UI Components Library

This project is designed to use the `@caretogether/ui-components` library. To link the local ui-components package, update the dependencies in package.json with the correct path to your ui-components directory.

## Code Quality

The project is configured with ESLint and Prettier to maintain code quality and consistent formatting. Run `npm run lint:fix` and `npm run format` before committing changes.

## License

Private - CareTogether Project

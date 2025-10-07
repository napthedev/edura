# Internationalization Setup

This project has been configured with next-intl for internationalization support with Vietnamese (default) and English languages.

## Features

- 🌐 **Vietnamese as default language** - The application defaults to Vietnamese
- 🇺🇸 **English support** - Full English translation support
- 🔄 **Language switcher** - Dropdown in the navigation bar to switch languages
- 🍪 **Persistent preference** - Language choice is saved in cookies
- ⚡ **Optimized rendering** - Next.js App Router optimized implementation

## File Structure

```
apps/web/
├── messages/
│   ├── vi.json          # Vietnamese translations
│   └── en.json          # English translations
├── src/
│   ├── i18n/
│   │   └── request.ts   # i18n configuration
│   ├── components/
│   │   └── language-switcher.tsx  # Language dropdown component
│   └── app/
│       ├── layout.tsx   # Root layout with NextIntlClientProvider
│       ├── page.tsx     # Home page with translations
│       ├── dashboard/   # Dashboard with mock data
│       └── todos/       # Todo list with interactive features
```

## Available Languages

- **Vietnamese (vi)** - Default language
- **English (en)** - Secondary language

## Usage

### In Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

### In Client Components
```tsx
import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

## Translation Keys

### Header Navigation
- `Header.home` - Home link
- `Header.dashboard` - Dashboard link
- `Header.todos` - Todos link
- `Header.language` - Language selector tooltip

### Home Page
- `HomePage.title` - Main title
- `HomePage.description` - App description
- `HomePage.apiStatus` - API status label
- `HomePage.connected` - Connection status
- `HomePage.checking` - Loading status
- `HomePage.error` - Error status

### Dashboard
- `Dashboard.title` - Dashboard page title
- `Dashboard.welcome` - Welcome message
- `Dashboard.overview` - Overview section
- `Dashboard.analytics` - Analytics section
- `Dashboard.settings` - Settings section
- `Dashboard.recentActivity` - Recent activity section
- `Dashboard.quickStats` - Quick stats section
- `Dashboard.newUserRegistered` - New user activity
- `Dashboard.taskCompleted` - Task completion activity
- `Dashboard.settingsUpdated` - Settings update activity
- `Dashboard.cpuUsage` - CPU usage label
- `Dashboard.memoryUsage` - Memory usage label
- `Dashboard.diskUsage` - Disk usage label

### Todos
- `Todos.title` - Todo list page title
- `Todos.addTodo` - Add todo button
- `Todos.noTodos` - Empty state message
- `Todos.completed` - Completed count
- `Todos.pending` - Pending count
- `Todos.addNewTask` - Add task description
- `Todos.enterNewTask` - Input placeholder
- `Todos.completionProgress` - Progress label

### Language Names
- `Languages.vi` - Vietnamese language name
- `Languages.en` - English language name

## How Language Switching Works

1. User clicks the language switcher in the header
2. A cookie named `locale` is set with the selected language code
3. The page reloads to apply the new language
4. The i18n configuration reads the cookie to determine the active locale
5. All translations are automatically updated

## Mock Content

The application includes rich mock content to demonstrate the internationalization:

### Dashboard Features
- Statistics cards with user counts and completion rates
- Recent activity feed with timestamps
- System performance metrics with progress bars
- Fully translated Vietnamese and English content

### Todo List Features
- Interactive todo items with checkboxes
- Add new todos functionality
- Delete todos with confirmation
- Progress tracking with visual progress bar
- Completion statistics

## Adding New Languages

1. Create a new JSON file in `messages/` directory (e.g., `messages/fr.json`)
2. Add all translation keys following the existing structure
3. Update the language switcher component to include the new language
4. Test the implementation

## Technical Implementation

- **next-intl** - Internationalization library for Next.js
- **Cookie-based language selection** - Persists user preference
- **App Router integration** - Optimized for Next.js 13+ App Router
- **Type-safe translations** - TypeScript support for translation keys
- **Server and client components** - Works with both rendering strategies

The setup follows Next.js best practices and provides an excellent foundation for multilingual applications.
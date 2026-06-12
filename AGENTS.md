# AGENTS.md — WB Analytics Dashboard

## Обзор проекта

**WB Analytics Dashboard** — это фронтенд-приложение для анализа финансовой отчетности селлеров на маркетплейсе Wildberries. Приложение предоставляет возможности управления товарами, просмотра аналитики рентабельности, управления налоговыми ставками и синхронизации данных с API Wildberries.

## Технологический стек

### Основные технологии
- **React 19** — библиотека UI
- **TypeScript ~5.9.3** — типизация
- **Vite 7.2** — сборщик и dev-сервер
- **Tailwind CSS 4.1** — CSS-фреймворк
- **React Router DOM 7** — маршрутизация

### Библиотеки
- **Zustand 5** — управление состоянием (с persist middleware для localStorage)
- **Axios 1.13** — HTTP-клиент с интерцепторами
- **React Hook Form 7** + **Zod 4** — валидация форм
- **Recharts 3** — графики и диаграммы
- **React Hot Toast 2** — уведомления (toast)
- **Lucide React** — иконки
- **date-fns 4** — работа с датами
- **TanStack React Table 8** — таблицы

### Структура путей (tsconfig path aliases)
```
@/*         -> src/*
@api/*      -> src/api/*
@components/* -> src/components/*
@pages/*    -> src/pages/*
@store/*    -> src/store/*
@utils/*    -> src/utils/*
```

> **Важно:** На момент анализа path aliases **не используются** в импортах — все импорты относительные (`../api/...`). Это может быть изменено в будущем.

## Структура проекта

```
src/
├── api/                  # API-клиенты и вызовы к бэкенду
│   ├── axiosClient.ts    # Базовый Axios клиент с интерцепторами
│   ├── authApi.ts        # Аутентификация (login, register, profile)
│   ├── analyticsApi.ts   # Аналитика рентабельности, экспорт
│   ├── productsApi.ts    # CRUD товаров и себестоимости
│   ├── dashboardApi.ts   # Данные дашборда (метрики, графики)
│   ├── taxApi.ts         # Налоговые ставки
│   ├── syncApi.ts        # Синхронизация с WB
│   └── mock*.ts(.mock)   # Моковые данные (заглушки, не используются)
│
├── components/           # Переиспользуемые UI-компоненты
│   ├── AnalyticsFilters.tsx   # Фильтры аналитики (даты, группировка)
│   ├── AnalyticsTable.tsx     # Таблица аналитики с сортировкой
│   ├── AnalyticsCharts.tsx    # Графики аналитики (Recharts)
│   ├── ClosePeriodModal.tsx   # Модалка закрытия налогового периода
│   ├── CostModal.tsx          # Модалка себестоимости
│   ├── ImageTooltip.tsx       # Тултип с изображением товара
│   ├── ProductModal.tsx       # Модалка создания/редактирования товара
│   ├── ProductDeleteModal.tsx # Модалка удаления товара
│   ├── SalesChart.tsx         # График продаж
│   ├── ToastNotification.tsx  # Компонент уведомлений
│   ├── WbApiKeyModal.tsx      # Модалка ввода API-ключа WB
│   └── ApiStatus.tsx          # Статус API (закомментирован)
│
├── hooks/                # Кастомные React-хуки
│   ├── index.ts
│   └── useTaxRate.ts
│
├── pages/                # Страницы приложения (маршруты)
│   ├── Login.tsx         # Страница входа/регистрации
│   ├── Dashboard.tsx     # Главный дашборд
│   ├── Products.tsx      # Каталог товаров (CRUD)
│   ├── ProductDetail.tsx # Детальная страница товара
│   ├── Analytics.tsx     # Аналитика рентабельности
│   ├── Taxes.tsx         # Управление налоговыми ставками
│   ├── TenantProfile.tsx # Профиль tenant (пользователя)
│   └── ApiTest.tsx       # Страница тестирования API (без защиты)
│
├── store/                # Zustand stores
│   └── authStore.ts      # Состояние аутентификации (persist в localStorage)
│
├── types/                # TypeScript типы
│   ├── analytics.ts      # Типы аналитики рентабельности
│   ├── api.ts            # Типы продуктов, себестоимости
│   ├── dashboard.ts      # Типы дашборда
│   └── tax.ts            # Типы налоговых ставок
│
├── utils/                # Утилиты
│   └── apiHealthCheck.ts # Проверка здоровья API
│
├── App.tsx               # Корневой компонент с маршрутами
├── main.tsx              # Точка входа
└── index.css             # Глобальные стили (Tailwind)
```

## Архитектура

### Аутентификация
- **JWT-токены** хранятся в `localStorage` (ключи: `access_token`, `refresh_token`)
- **authStore** (Zustand + persist) хранит `user`, `token`, `isLoading`, `error`
- **axiosClient** автоматически добавляет `Authorization: Bearer <token>` к каждому запросу
- При **401** — попытка refresh (заглушена), затем редирект на `/login`
- **Маршруты** защищены через компонент `PrivateRoute` (проверяет наличие `token`)
- Публичный маршрут `PublicRoute` — только для неавторизованных (Login)

### API-слой
Все API-вызовы организованы в модули:

| Модуль | Базовый URL | Описание |
|--------|-------------|----------|
| `authApi` | `/auth/*`, `/tenants/*` | Логин, регистрация, профиль |
| `productsApi` | `/products/*`, `/product-costs/*` | CRUD товаров и себестоимости |
| `analyticsApi` | `/analytics/*`, `/supplier-reports/*` | Рентабельность, экспорт |
| `dashboardApi` | `/dashboard/*`, `/sync/wb/` | Метрики дашборда, синхронизация |
| `taxApi` | `/tax-rates/*` | Налоговые ставки |
| `syncApi` | `/sync/*` | Фоновые задачи синхронизации |

> **Важно:** `dashboardApi` на момент анализа **возвращает захардкоженные моковые данные** вместо реальных API-вызовов. Реальные запросы закомментированы.

### Типы данных

#### Продукт (`Product`)
```typescript
interface Product {
  id: number;
  tenant_id: number;
  sku: string;
  marketplace_sku: string;
  foto: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Расширенный продукт с метриками (`ProductWithMetrics`)
Расширяет `Product` полями: `current_cost?`, `last_month_sales?`, `last_month_revenue?`, `profitability?`, `stock?`

#### Аналитика рентабельности (`RentabilityResponse`)
Содержит: `period`, `totals`, `rentability` (метрики), `products`, `summary`

#### Налоговая ставка (`TaxRate`)
Содержит: `id`, `tax_rate`, `start_date`, `end_date`, `created_by`, `created_at`, `updated_at`

## Маршруты приложения

| Путь | Компонент | Доступ | Описание |
|------|-----------|--------|----------|
| `/` | Navigate → `/dashboard` | Любой | Редирект |
| `/login` | Login | Публичный | Вход/регистрация |
| `/dashboard` | Dashboard | Защищённый | Главный дашборд |
| `/products` | Products | Защищённый | Каталог товаров |
| `/products/:id` | ProductDetail | Защищённый | Детали товара |
| `/analytics` | Analytics | Защищённый | Аналитика рентабельности |
| `/taxes` | Taxes | Защищённый | Налоговые ставки |
| `/profile` | TenantProfile | Защищённый | Профиль пользователя |
| `/api-test` | ApiTest | Публичный | Тестирование API |
| `*` | 404 | Любой | Страница не найдена |

## Переменные окружения

Файл `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/
VITE_APP_NAME=WB Analytics Dashboard
```

Бэкенд ожидается на `http://localhost:8000/`.

## Команды

```bash
npm run dev       # Запуск dev-сервера (Vite + HMR)
npm run build     # Типизация (tsc) + продакшн-сборка
npm run lint      # ESLint проверка
npm run preview   # Предпросмотр продакшн-сборки
```

## Особенности и известные моменты

### Заглушки и моковые данные
1. **`dashboardApi`** — все методы возвращают захардкоженные данные. Реальные API-вызовы закомментированы.
2. **`mock*.ts.mock`** — файлы с расширением `.mock` не компилируются TypeScript и служат справочным материалом.
3. **Vite proxy** — конфигурация проксирования в `vite.config.ts` закомментирована.

### Закомментированные участки кода
- В `Dashboard.tsx` закомментированы блоки метрик, графиков продаж и топ-товаров
- В `Products.tsx` закомментированы блоки статистики и некоторые колонки таблицы
- В `analyticsApi.ts` метод `exportPdf` возвращает ошибку (не реализован)

### Себестоимость
- Каждый товар может иметь историю изменений себестоимости (`ProductCost`)
- Себестоимость имеет период действия (`start_date`, `end_date`)
- Текущая себестоимость определяется по дате

### Налоговые ставки
- Поддержка периодов действия ставок (бессрочные — если `end_date` пустой)
- Возможность закрытия периода через модальное окно
- Валидация: только одна ставка может быть активна в момент времени

### Синхронизация с WB
- Запускается через POST `/sync/wb/`
- Поддержка фоновых задач (task_id, статус задачи)
- История синхронизаций доступна через API

## Паттерны разработки

### Компоненты страниц
- Каждый файл страницы — default export компонента
- Навигация через `react-router-dom` (`<Link>`, `useNavigate`)
- Загрузка данных через `useEffect` + async/await
- Состояния загрузки и ошибок обрабатываются локально

### API модули
- Каждый API-модуль — объект с методами
- Типы импортируются из `src/types/`
- Ошибки пробрасываются выше (обрабатываются в компонентах)

### Формы
- `react-hook-form` + `zod` для валидации
- Схемы Zod определяются рядом с компонентами форм

### Уведомления
- `react-hot-toast` для toast-уведомлений
- `<ToastNotification />` рендерится в `App.tsx` (глобально)
- Используется как `toast.success()`, `toast.error()`, `toast.loading()`

## Рекомендации для дальнейшей разработки

1. **Раскомментировать реальные API-вызовы** в `dashboardApi` когда бэкенд будет готов
2. **Использовать path aliases** (`@api/`, `@components/`) для чистоты импортов
3. **Добавить обработку refresh токена** в интерцептор axiosClient
4. **Включить Vite proxy** в `vite.config.ts` для удобной разработки
5. **Покрытие тестами** — на момент анализа тесты отсутствуют
6. **Раскомментировать UI-блоки** в Dashboard и Products когда данные будут доступны
7. **Реализовать экспорт в PDF** в `analyticsApi`
8. **Добавить type-checked linting** в ESLint конфигурацию

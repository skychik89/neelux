/* =====================================================================
   Neelux — скрипты сайта. Без библиотек: CSS-анимации + IntersectionObserver
   + один обработчик прокрутки на requestAnimationFrame.
   ===================================================================== */

/* =====================================================================
   ЕДИНЫЙ КОНФИГ ЦЕН (перенесён с действующего сайта без изменений цен).
   Направления, пакеты, калькулятор, FAQ и форма берут цены только отсюда.
   from:false — фиксированная цена; unit:'мес' — ежемесячно;
   cx:true — сложный проект (итог после расчёта); hidden:true — только для пакетов.
   grp — подгруппа внутри направления.
   ===================================================================== */
const DIRS = [
  {
    "id": "web",
    "name": "Сайты и веб-приложения",
    "short": "Сайты",
    "img": "dir-web",
    "desc": "Помогаем понятно представить услуги, показать товары или организовать работу онлайн: от сайта-визитки до записи, CRM и личного кабинета.",
    "pts": [
      "Структура и тексты, которые ведут к заявке",
      "Дизайн сначала для телефона",
      "Домен, аналитика и связка с ботом"
    ],
    "grows": "количество страниц и уникальных блоков, тексты и фото, интеграции, роли пользователей, сжатые сроки",
    "minGrp": [
      "Сайты",
      "Веб-приложения"
    ],
    "support": [
      "fix",
      "support",
      "speed",
      "hosting"
    ]
  },
  {
    "id": "bots",
    "name": "Telegram-боты и автоматизация",
    "short": "Боты",
    "img": "dir-bots",
    "desc": "Собираем сценарии записи, заявок, каталога и оплаты в Telegram. Подключаем нужные сервисы, чтобы данные не приходилось переносить вручную.",
    "pts": [
      "Запись 24/7 и напоминания клиентам",
      "Приём оплат, воронки и рассылки",
      "Связка с CRM, таблицами и сервисами"
    ],
    "grows": "число сценариев, приём оплат, интеграции с CRM и таблицами, админ-панель",
    "support": [
      "fix",
      "support"
    ]
  },
  {
    "id": "ai",
    "name": "AI для работы с информацией",
    "short": "AI",
    "img": "dir-ai",
    "desc": "Подключаем нейросети к материалам и процессам компании: ответы на вопросы, разбор обращений, подготовка текстов и отчётов. Продумываем ограничения и передачу задачи человеку.",
    "pts": [
      "Ответы клиентам 24/7 по вашим материалам",
      "Передача диалога человеку",
      "Ограничения и контроль качества ответов"
    ],
    "grows": "объём базы знаний, число каналов и интеграций, сложность сценариев — сложные системы считаем после созвона",
    "support": [
      "fix",
      "support"
    ]
  },
  {
    "id": "promo",
    "name": "Продвижение и контент",
    "short": "Продвижение",
    "img": "dir-promo",
    "desc": "Оформляем карточки в Яндекс Картах и 2ГИС, настраиваем SEO, аналитику и рекламу. Готовим материалы для соцсетей и связи с вашей аудиторией.",
    "pts": [
      "Карточки на картах по правилам площадок",
      "Реклама, рассылки и аналитика",
      "Оформление соцсетей и ролики Reels/Shorts"
    ],
    "grows": "число площадок и филиалов, объём контента, рекламный бюджет оплачивается отдельно",
    "warn": "Не обещаем позиций и рейтинга и не используем накрутки — порядок выдачи определяют площадки.",
    "support": [
      "map_care",
      "support"
    ]
  }
];
const SERVICES = [
  {
    "id": "card",
    "cat": "web",
    "grp": "Сайты",
    "name": "Сайт-визитка",
    "price": 9900,
    "d": "Услуги, портфолио и способы связи на одном небольшом сайте",
    "inc": [
      "Услуги, прайс, портфолио и контакты",
      "Кнопки записи в Telegram и звонка",
      "Адаптив под телефоны"
    ]
  },
  {
    "id": "landing",
    "cat": "web",
    "grp": "Сайты",
    "name": "Лендинг",
    "price": 16900,
    "d": "Одна страница, которая объясняет предложение и помогает оставить заявку",
    "inc": [
      "Структура под заявки",
      "Форма и кнопки связи",
      "Адаптив и базовая SEO-разметка"
    ]
  },
  {
    "id": "multi",
    "cat": "web",
    "grp": "Сайты",
    "name": "Многостраничный сайт",
    "price": 29900,
    "d": "Отдельные страницы для услуг, новостей и информации о компании",
    "inc": [
      "Индивидуальная структура",
      "Страницы услуг и новостей",
      "Базовая SEO-разметка"
    ]
  },
  {
    "id": "corp",
    "cat": "web",
    "grp": "Сайты",
    "name": "Корпоративный сайт",
    "price": 29900,
    "d": "Сайт компании с услугами, проектами и формами связи",
    "inc": [
      "Дизайн под фирменный стиль",
      "Разделы компании, услуг и кейсов",
      "Формы и связка с мессенджерами"
    ]
  },
  {
    "id": "shop",
    "cat": "web",
    "grp": "Сайты",
    "name": "Интернет-магазин",
    "price": 39900,
    "cx": true,
    "d": "Каталог товаров с корзиной, оформлением заказа и онлайн-оплатой",
    "inc": [
      "Каталог с фильтрами и карточками",
      "Корзина, оформление и оплата",
      "Управление товарами"
    ]
  },
  {
    "id": "redesign",
    "cat": "web",
    "grp": "Сайты",
    "name": "Редизайн сайта",
    "price": 9900,
    "d": "Новая подача действующего сайта с переносом его контента",
    "inc": [
      "Аудит текущего сайта",
      "Новый дизайн ключевых страниц",
      "Перенос контента"
    ]
  },
  {
    "id": "webapp",
    "cat": "web",
    "grp": "Веб-приложения",
    "name": "Веб-приложение",
    "price": 34900,
    "cx": true,
    "d": "Веб-сервис с интерфейсом, серверной частью и администрированием",
    "inc": [
      "Прототип и проектирование",
      "Интерфейс и серверная часть",
      "Админ-панель"
    ]
  },
  {
    "id": "crm",
    "cat": "web",
    "grp": "Веб-приложения",
    "name": "CRM-система",
    "price": 34900,
    "cx": true,
    "d": "Клиенты, сделки, роли команды и отчёты в общей системе",
    "inc": [
      "Карточки клиентов и воронка",
      "Роли и права сотрудников",
      "Отчёты и уведомления"
    ]
  },
  {
    "id": "booking",
    "cat": "web",
    "grp": "Веб-приложения",
    "name": "Онлайн-запись и бронирование",
    "price": 19900,
    "d": "Выбор услуги, специалиста и времени без ручного согласования",
    "inc": [
      "Выбор услуги, специалиста и времени",
      "Подтверждения и напоминания",
      "Кабинет администратора"
    ]
  },
  {
    "id": "cabinet",
    "cat": "web",
    "grp": "Веб-приложения",
    "name": "Личный кабинет",
    "price": 14900,
    "d": "Личное пространство клиента с профилем и историей обращений",
    "inc": [
      "Регистрация и вход",
      "История заказов и записей",
      "Профиль и уведомления"
    ]
  },
  {
    "id": "uiux",
    "cat": "web",
    "grp": "Дизайн интерфейсов и бренд",
    "name": "UI/UX-дизайн",
    "price": 7900,
    "d": "Прототип и макеты интерфейса сайта, бота или приложения",
    "inc": [
      "Прототипы",
      "Макеты ключевых экранов",
      "UI-кит"
    ]
  },
  {
    "id": "land_dsgn",
    "cat": "web",
    "grp": "Дизайн интерфейсов и бренд",
    "name": "Дизайн лендинга",
    "price": 6900,
    "d": "Дизайн страницы для компьютера и телефона без разработки",
    "inc": [
      "Структура страницы",
      "Дизайн для компьютера и телефона",
      "Исходники в Figma"
    ]
  },
  {
    "id": "logo",
    "cat": "web",
    "grp": "Дизайн интерфейсов и бренд",
    "name": "Логотип",
    "price": 3900,
    "d": "Концепции знака и подготовка выбранного решения к использованию",
    "inc": [
      "Несколько концепций",
      "Правки выбранного варианта",
      "Файлы для веба и печати"
    ]
  },
  {
    "id": "brand",
    "cat": "web",
    "grp": "Дизайн интерфейсов и бренд",
    "name": "Фирменный стиль",
    "price": 12900,
    "d": "Логотип, палитра, шрифты и материалы в едином стиле",
    "inc": [
      "Логотип",
      "Палитра и типографика",
      "Носители и шаблоны"
    ]
  },
  {
    "id": "brandbook",
    "cat": "web",
    "grp": "Дизайн интерфейсов и бренд",
    "name": "Брендбук",
    "price": 14900,
    "d": "Правила использования визуального языка компании",
    "inc": [
      "Правила использования логотипа",
      "Цвета, шрифты, графика",
      "Примеры применения"
    ]
  },
  {
    "id": "fix",
    "cat": "web",
    "grp": "Поддержка",
    "name": "Доработка сайта или бота",
    "price": 1900,
    "d": "Отдельная правка, новый блок или согласованная функция",
    "inc": [
      "Оценка задачи до начала",
      "Внесение изменений",
      "Проверка на устройствах"
    ]
  },
  {
    "id": "support",
    "cat": "web",
    "grp": "Поддержка",
    "name": "Сопровождение",
    "price": 5000,
    "from": false,
    "unit": "мес",
    "d": "Мелкие правки контента, мониторинг и ежемесячная рассылка",
    "inc": [
      "Мелкие правки контента",
      "Мониторинг работы сайта и бота",
      "Ежемесячная рассылка"
    ]
  },
  {
    "id": "speed",
    "cat": "web",
    "grp": "Поддержка",
    "name": "Оптимизация скорости",
    "price": 3900,
    "d": "Проверка загрузки и оптимизация изображений и ресурсов",
    "inc": [
      "Сжатие изображений",
      "Оптимизация загрузки",
      "Проверка до и после"
    ]
  },
  {
    "id": "hosting",
    "cat": "web",
    "grp": "Поддержка",
    "name": "Хостинг и домен",
    "price": 1900,
    "d": "Подбор домена, подключение хостинга и SSL-сертификата",
    "inc": [
      "Подбор и подключение домена",
      "Настройка хостинга",
      "SSL-сертификат"
    ]
  },
  {
    "id": "bot_card",
    "cat": "bots",
    "grp": "Боты",
    "name": "Бот-визитка",
    "price": 8900,
    "d": "Услуги, цены, портфолио и ответы на вопросы внутри Telegram",
    "inc": [
      "Меню услуг и цен",
      "Портфолио и FAQ",
      "Перевод на администратора"
    ]
  },
  {
    "id": "bot_lead",
    "cat": "bots",
    "grp": "Боты",
    "name": "Бот онлайн-записи и заявок",
    "price": 14900,
    "d": "Сценарий записи с напоминаниями и базой клиентов",
    "inc": [
      "Выбор услуги, мастера и времени",
      "Напоминания клиентам",
      "База клиентов и рассылки"
    ]
  },
  {
    "id": "bot_pay",
    "cat": "bots",
    "grp": "Боты",
    "name": "Бот с оплатой и интеграциями",
    "price": 24900,
    "cx": true,
    "d": "Продажи, приём оплат и связь с CRM или таблицами в боте",
    "inc": [
      "Приём оплат",
      "Воронка и прогрев",
      "Связка с CRM и таблицами"
    ]
  },
  {
    "id": "miniapp",
    "cat": "bots",
    "grp": "Боты",
    "name": "Telegram Mini App",
    "price": 19900,
    "cx": true,
    "d": "Каталог, запись или кабинет в интерфейсе внутри Telegram",
    "inc": [
      "Интерфейс как у мобильного приложения",
      "Вход через Telegram",
      "Каталог, запись или личный кабинет"
    ]
  },
  {
    "id": "tg_auto",
    "cat": "bots",
    "grp": "Автоматизация и интеграции",
    "name": "Автоматизация в Telegram",
    "price": 7900,
    "d": "Уведомления, автоответы и передача данных между сервисами",
    "inc": [
      "Уведомления о заявках и заказах",
      "Автоответы и сценарии",
      "Связка с таблицами и сервисами"
    ]
  },
  {
    "id": "api",
    "cat": "bots",
    "grp": "Автоматизация и интеграции",
    "name": "API и интеграции",
    "price": 6900,
    "d": "Интеграции сайта, бота, CRM, таблиц и платёжных систем",
    "inc": [
      "Платёжные системы",
      "CRM и таблицы",
      "Сторонние API"
    ]
  },
  {
    "id": "ai_bot",
    "cat": "ai",
    "grp": "AI",
    "name": "AI-чат-бот",
    "price": 9900,
    "d": "Ответы на основе ваших материалов с передачей диалога человеку",
    "inc": [
      "Обучение на ваших материалах",
      "Передача диалога человеку",
      "Telegram или сайт"
    ]
  },
  {
    "id": "ai_site",
    "cat": "ai",
    "grp": "AI",
    "name": "AI-консультант для сайта",
    "price": 9900,
    "d": "Виджет, который отвечает об услугах и помогает оставить контакт",
    "inc": [
      "Виджет на сайте",
      "Ответы по услугам и ценам",
      "Сбор контактов"
    ]
  },
  {
    "id": "ai_auto",
    "cat": "ai",
    "grp": "AI",
    "name": "AI-автоматизация процессов",
    "price": 14900,
    "cx": true,
    "d": "Сценарии обработки обращений, текстов и отчётов с контролем качества",
    "inc": [
      "Разбор рутинных процессов",
      "Сценарии автоматизации",
      "Контроль качества ответов"
    ]
  },
  {
    "id": "ai_int",
    "cat": "ai",
    "grp": "AI",
    "name": "Интеграция нейросетей",
    "price": 9900,
    "d": "Подбор модели и подключение нейросети к вашему продукту",
    "inc": [
      "Подбор модели под задачу",
      "Подключение по API",
      "Ограничения и безопасность"
    ]
  },
  {
    "id": "map_one",
    "cat": "promo",
    "grp": "Яндекс Карты и 2ГИС",
    "name": "Яндекс Карты или 2ГИС",
    "price": 7900,
    "from": false,
    "d": "Создание или проверка и оформление карточки на одной площадке",
    "inc": [
      "Категории, услуги, график и контакты",
      "Фото и описание",
      "Кнопки записи и ссылки на сайт или бота"
    ]
  },
  {
    "id": "map_both",
    "cat": "promo",
    "grp": "Яндекс Карты и 2ГИС",
    "name": "Яндекс Карты + 2ГИС",
    "price": 12900,
    "from": false,
    "d": "Оформление двух площадок с согласованными данными",
    "inc": [
      "Оформление обеих карточек",
      "Единые данные на обеих площадках",
      "Работа с отзывами по правилам площадок"
    ]
  },
  {
    "id": "map_care",
    "cat": "promo",
    "grp": "Поддержка",
    "name": "Ведение карточек",
    "price": 2900,
    "unit": "мес",
    "d": "Обновление цен, акций и фото, ответы на отзывы по правилам площадок",
    "inc": [
      "Обновление информации",
      "Ответы на отзывы",
      "Ежемесячная сверка данных"
    ]
  },
  {
    "id": "seo",
    "cat": "promo",
    "grp": "Трафик и аналитика",
    "name": "Базовая SEO-настройка",
    "price": 4900,
    "d": "Базовая техническая подготовка сайта к работе с поиском",
    "inc": [
      "Мета-теги и заголовки",
      "Карта сайта и индексация",
      "Подключение вебмастеров"
    ]
  },
  {
    "id": "analytics",
    "cat": "promo",
    "grp": "Трафик и аналитика",
    "name": "Подключение аналитики",
    "price": 2900,
    "d": "Подключение Метрики, целей на обращения и инструкции",
    "inc": [
      "Установка счётчиков",
      "Цели на заявки и клики",
      "Короткая инструкция"
    ]
  },
  {
    "id": "ads",
    "cat": "promo",
    "grp": "Трафик и аналитика",
    "name": "Настройка рекламы",
    "price": 9900,
    "d": "Настройка кампаний и креативов; рекламный бюджет оплачивается отдельно",
    "inc": [
      "Настройка кампаний",
      "Креативы и тексты",
      "Первичная оптимизация"
    ]
  },
  {
    "id": "mailing",
    "cat": "promo",
    "grp": "Трафик и аналитика",
    "name": "Рассылка по базе в Telegram",
    "price": 3500,
    "from": false,
    "d": "Текст, сегментация вашей базы и отправка сообщения в Telegram",
    "inc": [
      "Текст и оформление",
      "Сегментация базы",
      "Отправка"
    ]
  },
  {
    "id": "social",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "Оформление соцсетей",
    "price": 6900,
    "d": "Аватар, обложки и шаблоны для профиля Instagram или ВК",
    "inc": [
      "Аватар и обложки",
      "Шаблоны постов и сторис",
      "Оформление актуального"
    ]
  },
  {
    "id": "pricelist",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "Прайс-лист, сертификаты, гайды",
    "price": 2500,
    "from": false,
    "d": "Дизайн прайса, сертификата или гайда для печати и интернета",
    "inc": [
      "Дизайн в вашем стиле",
      "Файлы для печати и соцсетей"
    ]
  },
  {
    "id": "creatives",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "Рекламные креативы",
    "price": 1900,
    "d": "Рекламные баннеры в нескольких форматах для выбранных площадок",
    "inc": [
      "Креативы под площадки",
      "Несколько форматов",
      "Варианты для теста"
    ]
  },
  {
    "id": "reels",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "Монтаж Reels / Shorts",
    "price": 1500,
    "from": false,
    "d": "1 ролик; 5 шт. — 6 500 ₽, 10 шт. — 11 900 ₽",
    "inc": [
      "Монтаж и ритм под тренды",
      "Титры и музыка",
      "Формат 9:16"
    ]
  },
  {
    "id": "ad_video",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "Монтаж рекламного ролика",
    "price": 2900,
    "d": "Монтаж рекламного ролика с титрами, музыкой и нужными форматами",
    "inc": [
      "Сценарная структура",
      "Монтаж, титры, музыка",
      "Форматы под площадки"
    ]
  },
  {
    "id": "reels5",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "5 роликов Reels/Shorts",
    "price": 6500,
    "from": false,
    "hidden": true
  },
  {
    "id": "reels10",
    "cat": "promo",
    "grp": "Контент и соцсети",
    "name": "10 роликов Reels/Shorts",
    "price": 11900,
    "from": false,
    "hidden": true
  }
];
const PACKAGES = [
  {
    "id": "start",
    "name": "Быстрый старт",
    "price": 19900,
    "items": [
      "card",
      "bot_lead",
      "map_one"
    ],
    "for": "Частным мастерам и небольшим кабинетам",
    "features": [
      "Сайт-визитка с услугами, прайсом и портфолио",
      "Telegram-бот онлайн-записи 24/7",
      "Оформление Яндекс Карт или 2ГИС",
      "Кнопки быстрой связи и записи"
    ]
  },
  {
    "id": "business",
    "name": "Студия под ключ",
    "price": 39900,
    "hit": true,
    "items": [
      "landing",
      "bot_lead",
      "map_both",
      "pricelist",
      "social"
    ],
    "for": "Салонам, студиям и локальному бизнесу",
    "features": [
      "Продающий лендинг",
      "Бот записи: мастера, напоминания, рассылки",
      "Оформление Яндекс Карт и 2ГИС",
      "Прайс-листы, сертификаты и оформление соцсетей"
    ]
  },
  {
    "id": "full",
    "name": "Полный масштаб",
    "price": 80000,
    "items": [
      "multi",
      "bot_pay",
      "map_both",
      "brand",
      "social",
      "pricelist",
      "reels10",
      "ads",
      "mailing",
      "support"
    ],
    "for": "Бизнесу, которому нужно всё и сразу",
    "features": [
      "Многостраничный сайт",
      "Бот с воронкой и оплатами",
      "Яндекс Карты и 2ГИС под ключ",
      "Фирменный стиль, соцсети и полиграфия",
      "10 роликов Reels/Shorts",
      "Настройка рекламы (бюджет отдельно)"
    ],
    "gift": "1 месяц сопровождения в подарок"
  }
];
const CALC_ADDONS = ['map_one','map_both','map_care','logo','brand','social','pricelist','creatives','reels','api','ai_site','analytics','seo','hosting','mailing','ads','support'];
const EXCLUSIVE = [['map_one','map_both'],['logo','brand']];
/* как добавки калькулятора сгруппированы на экране */
const ADDON_GROUPS = [
  { name:'Карты', items:['map_one','map_both','map_care'] },
  { name:'Дизайн и контент', items:['logo','brand','social','pricelist','creatives','reels'] },
  { name:'Продвижение', items:['ads','mailing','seo','analytics'] },
  { name:'Техническое и AI', items:['api','ai_site','hosting'] },
  { name:'Поддержка', items:['support'] }
];

/* Автоотправка заявок на свой сервер. Пусто — выключено (открывается чат @xwias с готовым текстом).
   Токены бота сюда НЕ вставлять: endpoint сам пересылает заявку в Telegram на стороне сервера. */
const LEAD_ENDPOINT = '';
const TG_USER = 'xwias';

/* Analytics is owned by analytics.js and runs only after the visitor's choice.
   lead_draft means prepared text; lead_received requires a successful server response. */

/* Быстрые сообщения: кнопка открывает чат @xwias с готовой фразой */
const QUICK_MSGS = [
  { label:'Хочу сайт',       text:'Здравствуйте! Хочу сайт для своего бизнеса. Подскажете по цене и срокам?' },
  { label:'Хочу бота',       text:'Здравствуйте! Нужен Telegram-бот (запись, заявки или каталог). Подскажете, с чего начать?' },
  { label:'Нужны карты',     text:'Здравствуйте! Хочу оформить карточку в Яндекс Картах и 2ГИС. Сколько стоит?' },
  { label:'AI-ассистент',    text:'Здравствуйте! Интересует AI-ассистент для бизнеса. Можно обсудить?' },
  { label:'Выбрать пакет',   text:'Здравствуйте! Хочу подобрать пакет «под ключ». Помогите выбрать.' }
];

/* Демонстрация на первом экране: длительность сцен (мс) и подписи */
const DEMO = {
  sites: { ms:7600, cap:'Сайт студии: клиент выбирает услугу и время, заявка сразу приходит в Telegram.' },
  bots:  { ms:8600, cap:'Бот записывает клиентов 24/7, напоминает о визите и собирает базу — без переписок вручную.' },
  ai:    { ms:8200, cap:'AI-ассистент разбирает входящие, готовит ответ по вашей базе знаний и заносит заявку в CRM.' },
  promo: { ms:7600, cap:'Карточки в Яндекс Картах и 2ГИС оформлены полностью, а заявки со всех каналов — в одном списке.' }
};

(function(){
'use strict';
window.NEELUX_READY = true;
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; try { reduced = reduced || localStorage.getItem('neelux-reduce-motion') === 'true'; } catch(e) {}
var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var NB = ' ';
var BY = {}; SERVICES.forEach(function(s){ BY[s.id] = s; });
var DIR = {}; DIRS.forEach(function(d){ DIR[d.id] = d; });
function money(n){ return Number(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽'; }
function isFrom(s){ return s.from !== false; }
function priceTxt(s){ return (isFrom(s) ? 'от' + NB : '') + money(s.price) + (s.unit ? '/' + s.unit : ''); }
function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function icon(id, cls){ return '<svg class="i' + (cls ? ' ' + cls : '') + '"><use href="#' + id + '"/></svg>'; }
function visible(cat){ return SERVICES.filter(function(s){ return !s.hidden && (!cat || s.cat === cat); }); }
function core(cat){ return visible(cat).filter(function(s){ return s.grp !== 'Поддержка' && !s.unit; }); }
function grpMin(cat, grps){ return Math.min.apply(null, core(cat).filter(function(s){ return !grps || grps.indexOf(s.grp) > -1; }).map(function(s){ return s.price; })); }
function catMin(cat){ return grpMin(cat, DIR[cat].minGrp); }
function pkgSum(p){ return p.items.reduce(function(a, k){ return a + BY[k].price; }, 0); }
function plural(n, a, b, c){ var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14)) ? b : c; }
function clamp(v, a, b){ return Math.min(Math.max(v, a), b); }
/* старый Safari (iOS 13 и ниже) знает только addListener */
function onMQ(mq, fn){ if (mq.addEventListener) mq.addEventListener('change', fn); else mq.addListener(fn); }
var toastT;
function toast(msg){ var t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('is-on'); }, 2600); }
function copy(text){
  function legacy(){ try { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly',''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return ok; } catch(e){ return false; } }
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function(){ return true; }, legacy);
  return Promise.resolve(legacy());
}
function store(k, v){ try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch(e){ return null; } }
function go(sel){ var el = typeof sel === 'string' ? $(sel) : sel; if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'start' }); }

/* ---------- Необязательная событийная аналитика ---------- */
window.NEELUX_ANALYTICS_HOOKED = true;
function goal(name){ try { if (window.NeeluxAnalytics) window.NeeluxAnalytics.track(name); } catch(e){} }
document.addEventListener('click', function(e){
  var a = e.target.closest('a,button'); if (!a) return;
  var href = a.getAttribute('href') || '';
  if (a.dataset.quick) goal('tg_quick');
  else if (href.indexOf('https://t.me/') === 0) goal('tg_click');
  if (href === '#contact') goal('cta_discuss');
  if (a.dataset.pkg) goal('pkg_select');
  if (a.dataset.concept) goal('concept_click');
  if (a.classList.contains('dt')) goal('demo_tab');
}, true);

/* ---------- самопроверка конфига ---------- */
SERVICES.forEach(function(s){ console.assert(DIR[s.cat], 'Нет направления у ' + s.id); });
DIRS.forEach(function(d){ d.support.forEach(function(k){ console.assert(BY[k], 'Поддержка ' + d.id + ': нет услуги ' + k); }); });
PACKAGES.forEach(function(p){ p.items.forEach(function(k){ console.assert(BY[k], 'Пакет ' + p.id + ': нет услуги ' + k); }); console.assert(pkgSum(p) > p.price, 'Пакет ' + p.id + ' не выгоднее'); });
console.assert(pkgSum(PACKAGES[0]) === 32700 && pkgSum(PACKAGES[1]) === 54100 && pkgSum(PACKAGES[2]) === 120300, 'Суммы пакетов по отдельности изменились');
CALC_ADDONS.forEach(function(k){ console.assert(BY[k], 'Калькулятор: нет услуги ' + k); });

/* ---------- цены в текстах ---------- */
$$('[data-price]').forEach(function(el){ var s = BY[el.dataset.price]; if (s) el.textContent = priceTxt(s); });
$$('[data-pkg-min]').forEach(function(el){ el.textContent = money(Math.min.apply(null, PACKAGES.map(function(p){ return p.price; }))); });
$('#faqPrice').innerHTML = 'Сайт — от ' + money(catMin('web')) + ', Telegram-бот — от ' + money(grpMin('bots', ['Боты'])) +', AI-интеграции — от ' + money(catMin('ai')) + ', карточка на картах — ' + money(BY.map_one.price) + ', пакеты — от ' + money(PACKAGES[0].price) + '. Цены «от» — минимальный состав: итог зависит от объёма и называется до начала работ. Прикинуть бюджет можно в <a href="#calc">калькуляторе</a>.';
$('#faqSupport').innerHTML = 'Остаёмся на связи. Разовые доработки — от ' + money(BY.fix.price) + ', сопровождение — ' + money(BY.support.price) + '/мес: правки цен, акций и дат, мониторинг и рассылки. Ведение карточек на картах — ' + money(BY.map_care.price) + '/мес. В пакете «' + esc(PACKAGES[2].name) + '» первый месяц сопровождения — в подарок.';
$('#year').textContent = new Date().getFullYear();

/* ---------- меню ---------- */
var burger = $('#burger');
function setMenu(open){ document.body.classList.toggle('menu-open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); }
burger.addEventListener('click', function(){ setMenu(!document.body.classList.contains('menu-open')); });
$$('#mmenu a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
onMQ(window.matchMedia('(min-width: 1081px)'), function(e){ if (e.matches) setMenu(false); });

var rotT=null;function startRot(){}

var userPaused=false;function syncPlay(){}

/* ---------- направления ---------- */
var serviceUrls={"web":"/services/website-development.html","promo":"/services/business-promotion.html","ai":"/services/business-automation.html","bots":"/services/telegram-bots.html"};
function svcRow(s, sup){
  return '<div class="svc' + (sup ? ' svc-sup' : '') + '"><b>' + esc(s.name) + '</b><span class="pr">' + priceTxt(s) + '</span><p>' + esc(s.d) + '</p>' +
    '<ul>' + s.inc.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
    (s.cx ? '<p class="cx">Объём таких проектов сильно различается — итог назовём после короткого обсуждения.</p>' : '') +
    '<div class="acts"><a class="btn btn-ghost btn-sm" href="#contact" data-pick="' + s.id + '">Обсудить</a>' + (s.unit ? '' : '<a class="btn btn-ghost btn-sm" href="#calc" data-calc="' + s.id + '">Посчитать</a>') + '</div></div>';
}
$('#dirNav').innerHTML = DIRS.map(function(d, i){ return '<li><a href="#dir-' + d.id + '" data-i="' + i + '"><span>0' + (i + 1) + '</span>' + esc(d.name).replace('-', '-\u2060') + '</a></li>'; }).join('');
$('#dirList').innerHTML = DIRS.map(function(d, i){
  var list = visible(d.id).filter(function(s){ return s.grp !== 'Поддержка'; }), grps = [];
  list.forEach(function(s){ if (grps.indexOf(s.grp) < 0) grps.push(s.grp); });
  var n = list.length + d.support.length;
  return '<article class="dir rv" id="dir-' + d.id + '" aria-labelledby="dirh-' + d.id + '">' +
    '<div class="dir-head"><span class="dir-num">0' + (i + 1) + '</span><h3 id="dirh-' + d.id + '">' + esc(d.name).replace('-', '-\u2060') + '</h3><p class="dir-price">от <b>' + money(catMin(d.id)) + '</b></p></div>' +
    '<div class="dir-body"><p class="dir-desc">' + esc(d.desc) + '</p>' +
      '<ul class="dir-pts">' + d.pts.map(function(p){ return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      (d.warn ? '<p class="dir-warn">' + esc(d.warn) + '</p>' : '') +
      '<div class="dir-foot">' +
        '<a class="btn btn-accent btn-sm" href="#contact" data-pick="dir:' + d.id + '">Обсудить' + icon('i-arr') + '</a>' +
        '<a class="btn btn-ghost btn-sm" href="#calc" data-dircalc="' + d.id + '">Посчитать</a><a class="text-link service-read-more" href="' + serviceUrls[d.id] + '">Подробнее о направлении</a></div>' +
      '<details class="dir-more"><summary><span>Все услуги и цены<small>' + n + ' ' + plural(n, 'позиция', 'позиции', 'позиций') + '</small></span><span class="pm">' + icon('i-plus') + '</span></summary>' +
        '<div class="svc-groups">' + grps.map(function(g){ return '<div class="svc-group"><h4>' + esc(g) + '</h4>' + list.filter(function(s){ return s.grp === g; }).map(function(s){ return svcRow(s); }).join('') + '</div>'; }).join('') +
        '<div class="svc-group"><h4>Поддержка</h4>' + d.support.map(function(k){ return svcRow(BY[k], true); }).join('') + '</div>' +
        '<p class="dir-warn">Что влияет на цену: ' + esc(d.grows) + '.</p></div></details>' +
    '</div></article>';
}).join('');
var dirEls = $$('.dir'), dirLinks = $$('#dirNav a');
function setDir(i){ dirEls.forEach(function(d, k){ d.classList.toggle('is-on', k === i); }); dirLinks.forEach(function(a, k){ a.classList.toggle('is-on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
setDir(0);
if ('IntersectionObserver' in window) {
  var dio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) setDir(dirEls.indexOf(e.target)); }); }, { rootMargin:'-42% 0px -52% 0px' });
  dirEls.forEach(function(d){ dio.observe(d); });
}
$$('.dir-fig img').forEach(function(img){ img.addEventListener('error', function(){ img.remove(); }); });

/* ---------- пакеты ---------- */
$('#pkgs').innerHTML = PACKAGES.map(function(p, i){
  var sum = pkgSum(p);
  return '<article class="pkg rv' + (p.hit ? ' pkg--hit' : '') + (i ? ' d' + i : '') + '"><div class="top"><h3>' + esc(p.name) + '</h3>' + (p.hit ? '<span class="hit">Для студий и салонов</span>' : '') + '</div>' +
    '<p class="for">' + esc(p.for) + '</p><div class="price">' + money(p.price) + '</div>' +
    '<p class="sep">По отдельности — ' + money(sum) + '. Выгода <b>' + money(sum - p.price) + '</b></p>' +
    '<ul>' + p.features.map(function(f){ return '<li>' + icon('i-check') + '<span>' + esc(f) + '</span></li>'; }).join('') + '</ul>' +
    (p.gift ? '<p class="gift">🎁 ' + esc(p.gift) + '</p>' : '') +
    '<a class="btn ' + (p.hit ? 'btn-accent' : 'btn-ghost') + ' btn-block" href="#contact" data-pkg="' + p.id + '">Выбрать «' + esc(p.name) + '»' + icon('i-arr') + '</a></article>';
}).join('');

/* ---------- калькулятор ---------- */
var CALC_DEFAULT = { cat:'web', main:'landing' };
var calc = { cat:CALC_DEFAULT.cat, main:CALC_DEFAULT.main, adds:{} };
var calcAddSet = []; ADDON_GROUPS.forEach(function(g){ calcAddSet = calcAddSet.concat(g.items); });
console.assert(CALC_ADDONS.every(function(k){ return calcAddSet.indexOf(k) > -1; }), 'Калькулятор: добавка без группы в ADDON_GROUPS');
function mains(cat){ return visible(cat).filter(function(s){ return !s.unit; }); }
function renderCalcCats(){
  $('#cCats').innerHTML = DIRS.map(function(d){
    return '<div class="dp"><input type="radio" name="ccat" id="cc-' + d.id + '" value="' + d.id + '"' + (calc.cat === d.id ? ' checked' : '') + '>' +
      '<label for="cc-' + d.id + '"><span class="dp-n" aria-hidden="true">0' + (DIRS.indexOf(d) + 1) + '</span><b>' + esc(d.short) + '</b><small>от ' + money(catMin(d.id)) + '</small></label></div>';
  }).join('');
}
var calcGrp = '';
function renderCalcMain(){
  var list = mains(calc.cat), grps = [];
  if (!list.some(function(s){ return s.id === calc.main; })) calc.main = list[0].id;
  list.forEach(function(s){ if (grps.indexOf(s.grp) < 0) grps.push(s.grp); });
  if (grps.indexOf(calcGrp) < 0) calcGrp = BY[calc.main].grp;
  var tabs = grps.length > 1 ? '<div class="mp-tabs" role="group" aria-label="Подгруппа услуг">' + grps.map(function(g){
    return '<button type="button" class="mp-tab" data-grp="' + esc(g) + '" aria-pressed="' + (g === calcGrp) + '">' + esc(g) + (g === BY[calc.main].grp ? '<i aria-hidden="true"></i>' : '') + '</button>';
  }).join('') + '</div>' : '';
  $('#cMain').innerHTML = tabs + '<div class="mp-list">' + list.filter(function(s){ return s.grp === calcGrp; }).map(function(s){
    return '<div class="mp"><input type="radio" name="cmain" id="cm-' + s.id + '" value="' + s.id + '"' + (calc.main === s.id ? ' checked' : '') + '>' +
      '<label for="cm-' + s.id + '"><span class="mp-top"><b>' + esc(s.name) + '</b><em>' + priceTxt(s) + '</em></span><small>' + esc(s.d) + '</small>' + (s.cx ? '<i class="mp-cx">расчёт после созвона</i>' : '') + '</label></div>';
  }).join('') + '</div>';
}/* добавка конфликтует с основной услугой: это она же или они взаимоисключающие (например, фирменный стиль уже включает логотип) */
function clash(k){ return k === calc.main || EXCLUSIVE.some(function(g){ return g.indexOf(k) > -1 && g.indexOf(calc.main) > -1; }); }
function renderCalcAdds(){
  Object.keys(calc.adds).forEach(function(k){ if (!calc.adds[k] || clash(k)) delete calc.adds[k]; });
  $('#cAdds').innerHTML = ADDON_GROUPS.map(function(g){
    var items = g.items.filter(function(k){ return CALC_ADDONS.indexOf(k) > -1 && !clash(k); });
    if (!items.length) return '';
    return '<div class="ag"><p class="mp-h">' + esc(g.name) + '</p><div class="ag-list">' + items.map(function(k){ var s = BY[k];
      return '<label class="chipc"><input type="checkbox" value="' + k + '"' + (calc.adds[k] ? ' checked' : '') + '><span><i class="chk" aria-hidden="true"></i>' + esc(s.name) + '<em>' + priceTxt(s) + '</em></span></label>';
    }).join('') + '</div></div>';
  }).join('');
  var n = Object.keys(calc.adds).length, cnt = $('#cAddCount');
  cnt.hidden = !n; cnt.textContent = n ? 'выбрано: ' + n : '';
}
function calcState(){
  var ids = [calc.main].concat(Object.keys(calc.adds).filter(function(k){ return calc.adds[k] && !clash(k); }));
  var once = 0, mo = 0, cx = false, from = false;
  ids.forEach(function(k){ var s = BY[k]; if (s.unit) mo += s.price; else { once += s.price; if (isFrom(s)) from = true; } if (s.cx) cx = true; });
  return { ids:ids, once:once, mo:mo, cx:cx, from:from };
}
function bestPackage(st){
  var best = null;
  PACKAGES.forEach(function(p){
    var covers = st.ids.filter(function(k){ return !BY[k].unit; }).every(function(k){ return p.items.indexOf(k) > -1 || (k === 'map_one' && p.items.indexOf('map_both') > -1) || (k === 'logo' && p.items.indexOf('brand') > -1); });
    if (covers && st.once >= p.price && (!best || p.price < best.price)) best = p;
  });
  return best;
}
function sumText(st){ return (st.from ? 'от' + NB : '') + money(st.once); }
var sumShown = 0, sumRaf = null;
function animateSum(to,prefix){cancelAnimationFrame(sumRaf);$('#cSum').textContent=prefix+money(to);sumShown=to;}
function renderCalcRes(){
  var st = calcState();
  animateSum(st.once, st.from ? 'от' + NB : '');
  $('#cBarSum').textContent = sumText(st) + (st.mo ? ' + ' + money(st.mo) + '/мес' : '');
  var mo = $('#cMo'); mo.hidden = !st.mo; mo.textContent = '+ ' + money(st.mo) + ' в месяц';
  $('#cList').innerHTML = st.ids.map(function(k, i){ var s = BY[k];
    return '<li><span class="cl-n">' + esc(s.name) + (i ? '' : '<i>основа</i>') + '</span><span class="cl-p">' + priceTxt(s) + '</span>' +
      (i ? '<button type="button" class="cl-x" data-rm="' + k + '" aria-label="Убрать: ' + esc(s.name) + '">' + icon('i-x') + '</button>' : '<span class="cl-x" aria-hidden="true"></span>') + '</li>';
  }).join('');
  $('#cWarn').innerHTML = (st.cx ? '<b>Индивидуальный расчёт.</b> В составе есть сложная система — точную цену назовём после короткого созвона. ' : '<b>Это ориентир.</b> ') + 'На стоимость влияют: ' + esc(DIR[BY[calc.main].cat].grows) + '.';
  var tip = $('#cTip'), best = bestPackage(st);
  tip.hidden = !best;
  if (best) tip.innerHTML = '<p><b>Выгоднее пакетом.</b> «' + esc(best.name) + '» за ' + money(best.price) + ' включает всё это и больше' +
    (st.once > best.price ? ' — дешевле на ' + money(st.once - best.price) : '') + '.</p><a class="btn btn-ghost btn-sm" href="#contact" data-pkg="' + best.id + '">Выбрать пакет' + icon('i-arr') + '</a>';
}
function renderCalc(){ renderCalcCats(); renderCalcMain(); renderCalcAdds(); renderCalcRes(); }
$('#cCats').addEventListener('change', function(e){ calc.cat = e.target.value; renderCalcMain(); renderCalcAdds(); renderCalcRes(); });
$('#cMain').addEventListener('change', function(e){ calc.main = e.target.value; calcGrp = BY[calc.main].grp; $$('.mp-tab', $('#cMain')).forEach(function(t){ var i = t.querySelector('i'); if (i) i.remove(); if (t.dataset.grp === calcGrp) t.insertAdjacentHTML('beforeend', '<i aria-hidden="true"></i>'); }); renderCalcAdds(); renderCalcRes(); });
$('#cMain').addEventListener('click', function(e){ var t = e.target.closest('.mp-tab'); if (!t) return; calcGrp = t.dataset.grp; renderCalcMain(); var nt = $('#cMain .mp-tab[data-grp="' + calcGrp + '"]'); if (nt) nt.focus({ preventScroll:true }); });
$('#cAdds').addEventListener('change', function(e){
  var k = e.target.value;
  if (e.target.checked) { calc.adds[k] = true; EXCLUSIVE.forEach(function(g){ if (g.indexOf(k) > -1) g.forEach(function(o){ if (o !== k) delete calc.adds[o]; }); }); }
  else delete calc.adds[k];
  renderCalcAdds(); renderCalcRes();
  var el = $('#cAdds input[value="' + k + '"]'); if (el) el.focus({ preventScroll:true });
});
$('#cList').addEventListener('click', function(e){
  var b = e.target.closest('[data-rm]'); if (!b) return;
  delete calc.adds[b.dataset.rm]; renderCalcAdds(); renderCalcRes();
  var next = $('#cList [data-rm]') || $('#cSend'); next.focus({ preventScroll:true });
});
$('#cReset').addEventListener('click', function(){ calc = { cat:CALC_DEFAULT.cat, main:CALC_DEFAULT.main, adds:{} }; calcGrp = ''; renderCalc();window.dispatchEvent(new CustomEvent('neelux-task',{detail:{id:''}})); toast('Расчёт сброшен'); });
$('#cBarGo').addEventListener('click', function(){ go('#calcRes'); });

/* ссылка на расчёт: #calc=направление.основа.добавка1,добавка2 — только коды услуг, без личных данных */
function calcHash(){ return 'calc=' + calc.cat + '.' + calc.main + '.' + Object.keys(calc.adds).join(','); }
function readCalcHash(){
  var m = location.hash.match(/^#calc=([a-z_]+)\.([a-z_0-9]+)\.?([a-z_0-9,]*)$/); if (!m || !DIR[m[1]] || !BY[m[2]] || BY[m[2]].cat !== m[1] || BY[m[2]].unit) return false;
  calc = { cat:m[1], main:m[2], adds:{} };
  (m[3] ? m[3].split(',') : []).forEach(function(k){ if (CALC_ADDONS.indexOf(k) > -1) calc.adds[k] = true; });
  return true;
}
var fromLink = readCalcHash();
renderCalc();
if (fromLink) setTimeout(function(){ go('#calc'); toast('Открыт сохранённый расчёт'); }, 300);
$('#cShare').addEventListener('click', function(){
  var url = location.origin + location.pathname + '#' + calcHash();$('#calcShareBox').hidden=false;$('#calcShareUrl').value=url;
  copy(url).then(function(ok){ toast(ok ? 'Ссылка на расчёт скопирована' : 'Не удалось скопировать ссылку'); });
  goal('calc_share');
});
function calcSummary(){ var st = calcState(); return st.ids.map(function(k){ return BY[k].name + ' (' + priceTxt(BY[k]) + ')'; }).join(', ') + ' — итого ' + (st.from ? 'от ' : '') + money(st.once) + (st.mo ? ' + ' + money(st.mo) + '/мес' : ''); }

/* печать / PDF: отдельный лист с расчётом */
function fillPrint(){
  var st = calcState(), d = new Date();
  $('#printSheet').innerHTML = '<div class="ps-head"><span class="lg"></span><b>Neelux</b><span>neelux.space · t.me/xwias</span></div>' +
    '<h1>Предварительный расчёт</h1><p class="ps-date">' + d.toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) + ' · направление: ' + esc(DIR[calc.cat].name) + '</p>' +
    '<table><tbody>' + st.ids.map(function(k){ var s = BY[k]; return '<tr><td>' + esc(s.name) + '<small>' + esc(s.d) + '</small></td><td>' + priceTxt(s) + '</td></tr>'; }).join('') + '</tbody>' +
    '<tfoot><tr><td>Итого разово</td><td>' + sumText(st) + '</td></tr>' + (st.mo ? '<tr><td>Ежемесячно</td><td>' + money(st.mo) + '/мес</td></tr>' : '') + '</tfoot></table>' +
    '<p class="ps-note">' + $('#cWarn').textContent + '</p>' +
    '<p class="ps-note">Расчёт ориентировочный: итоговую стоимость и сроки называем до начала работ. Открыть этот расчёт на сайте: ' + esc(location.origin + location.pathname + '#' + calcHash()) + '</p>' +
    '<p class="ps-foot">Обсудить проект: Telegram @xwias · каталог услуг @neelux_bot</p>';
}
window.addEventListener('beforeprint', fillPrint);
$('#cPdf').addEventListener('click', function(){ fillPrint(); goal('calc_pdf'); document.body.classList.add('print-calc'); window.print(); });
window.addEventListener('afterprint', function(){ document.body.classList.remove('print-calc'); });

/* ---------- связи: кнопки → форма / калькулятор ---------- */
var typeSel = $('#fType');
typeSel.innerHTML = '<option value="">Пока не знаю — нужна консультация</option>' +
  '<optgroup label="Пакеты">' + PACKAGES.map(function(p){ return '<option value="pkg:' + p.id + '">Пакет «' + esc(p.name) + '» — ' + money(p.price) + '</option>'; }).join('') + '</optgroup>' +
  '<optgroup label="Направления">' + DIRS.map(function(d){ return '<option value="dir:' + d.id + '">' + esc(d.name) + ' — обсудить задачу</option>'; }).join('') + '</optgroup>' +
  DIRS.map(function(d){ return '<optgroup label="' + esc(d.name) + '">' + visible(d.id).map(function(s){ return '<option value="' + s.id + '">' + esc(s.name) + ' — ' + priceTxt(s) + '</option>'; }).join('') + '</optgroup>'; }).join('');
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-pick],[data-pkg],[data-calc],[data-dircalc],[data-copy]');
  if (!a) return;
  if (a.dataset.copy) { copy(a.dataset.copy).then(function(ok){ toast(ok ? 'Скопировано: ' + a.dataset.copy : 'Не удалось скопировать'); }); return; }
  if (a.dataset.pick) typeSel.value = a.dataset.pick;
  if (a.dataset.pkg) typeSel.value = 'pkg:' + a.dataset.pkg;
  if (a.dataset.calc) { var s = BY[a.dataset.calc]; calc.cat = s.cat; calc.main = s.id; calcGrp = ''; renderCalc(); }
  if (a.dataset.dircalc) { calc.cat = a.dataset.dircalc; calcGrp = ''; renderCalc(); }
});
function attachCalc(txt){ var box = $('#fCalc'); box.hidden = !txt; box.dataset.v = txt || ''; $('#fCalcTxt').innerHTML = txt ? '<b>Расчёт:</b> ' + esc(txt) : ''; }
$('#fCalcDel').addEventListener('click', function(){ attachCalc(''); });
$('#cSend').addEventListener('click', function(){ goal('calc_send'); attachCalc(calcSummary()); typeSel.value = calc.main; go('#contact'); setTimeout(function(){ $('#fName').focus({ preventScroll:true }); }, reduced ? 0 : 900); });


var TASKS = [{"id": "launch", "title": "Запустить новый проект", "description": "Нужны сайт, каталог или запись клиентов.", "categories": ["web", "bots"]}, {"id": "refresh", "title": "Обновить то, что уже есть", "description": "Есть сайт, но хочется изменить дизайн, структуру или функции.", "serviceIds": ["redesign", "fix"]}, {"id": "automate", "title": "Убрать ручную работу", "description": "Нужны бот, интеграции или AI для повседневных задач.", "categories": ["bots", "ai"]}, {"id": "promote", "title": "Помочь клиентам нас найти", "description": "Нужны карты, SEO, реклама или оформление соцсетей.", "categories": ["promo"]}];
var selectedTask = '';
window.addEventListener('neelux-task',function(e){
 var task=TASKS.find(function(t){return t.id===e.detail.id;});
 selectedTask=task?task.title:'';
 var chosen=task?task.id:'';
 $$('.task-option').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.task===chosen?'true':'false');});
 dirEls.forEach(function(el){el.classList.toggle('task-recommended',!!task&&(task.categories?task.categories.indexOf(el.id.replace('dir-',''))>-1:el.id==='dir-web'));});
 if(task){
  var id=task.serviceIds?task.serviceIds[0]:({launch:'card',automate:'bot_lead',promote:'map_one'})[task.id];
  var s=BY[id];calc.cat=s.cat;calc.main=s.id;calcGrp='';renderCalc();typeSel.value=id;
 }
 var note=$('#selectedTaskForm');note.hidden=!task;note.textContent=task?'Выбранная задача: '+task.title:'';
 $('#taskResult').textContent=task?'Выбрано: '+task.title+'. Подходящие направления отмечены ниже; основа расчёта уже выбрана.':'Можно выбрать любое направление — все услуги доступны ниже.';
});
$('#taskSkip').addEventListener('click',function(){window.dispatchEvent(new CustomEvent('neelux-task',{detail:{id:''}}));});
/* ---------- быстрые сообщения в Telegram ---------- */
if($('#quickTg')) $('#quickTg').innerHTML = QUICK_MSGS.map(function(q){ return '<a class="qchip" href="https://t.me/' + TG_USER + '?text=' + encodeURIComponent(q.text) + '" target="_blank" rel="noopener" data-quick="1">' + icon('i-tg') + esc(q.label) + '</a>'; }).join('');

/* ---------- форма ---------- */
var form = $('#form'), done = $('#done');
store('neelux-brief',null); store('neelux-lead-last',null); var lastLeadText='';
function setErr(el, msg){ el.setAttribute('aria-invalid', msg ? 'true' : 'false'); $('#' + el.getAttribute('aria-describedby')).textContent = msg || ''; }
function validate(field){
  var ok = true, n = form.elements.name, c = form.elements.contact, cv = c.value.trim();
  if (!field || field === 'name') { if (n.value.trim().length < 2 || n.value.length > 80) { setErr(n, 'Напишите, как к вам обращаться'); ok = false; } else setErr(n, ''); }
  var tg = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cv.replace(/^https?:\/\/t\.me\//, ''));
  var ph = cv.replace(/\D/g, '').length >= 10 && /^[\d\s()+-]+$/.test(cv);
  if (!field || field === 'contact') { if ((!tg && !ph) || cv.length > 100) { setErr(c, 'Укажите Telegram (@username) или телефон'); ok = false; } else setErr(c, ''); }
  if (!field) { var consent = form.elements.consent, message = form.elements.message; if (!consent.checked) { setErr(consent,'Отметьте согласие на обработку данных для ответа на обращение'); ok=false; } else setErr(consent,''); if (message.value.length>2000) { setErr(message,'Сократите описание до 2000 символов'); ok=false; } else setErr(message,''); }
  if (!field && !ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); }
  return ok;
}
['name','contact'].forEach(function(k){ form.elements[k].addEventListener('blur', function(){ if (form.elements[k].value) validate(k); }); });
function typeLabel(){ var o = typeSel.options[typeSel.selectedIndex]; return o ? o.textContent : ''; }
function leadText(){
  var L = ['Заявка с сайта neelux.space', '', 'Имя: ' + form.elements.name.value.trim(), 'Контакт: ' + form.elements.contact.value.trim(), 'Что нужно: ' + typeLabel()];
  if(selectedTask)L.push('Выбранная задача: '+selectedTask);
  var m = form.elements.message.value.trim(); if (m) L.push('Задача: ' + m);
  var cc = $('#fCalc').dataset.v; if (cc) L.push('Расчёт: ' + cc);
  if (window.NeeluxAnalytics) L.push('Источник: ' + window.NeeluxAnalytics.attributionLabel());
  L.push('Согласие на обработку данных для ответа на обращение: https://neelux.space/consent.html (редакция 25.11.2026)');
  return L.join('\n');
}
function openTg(text){
  var url = 'https://t.me/' + TG_USER + '?text=' + encodeURIComponent(text);
  $('#doneOpen').href = url;
  window.open(url, '_blank', 'noopener,noreferrer');
}
function finish(){ form.hidden = true; done.hidden = false; done.focus(); store('neelux-brief', null); }
form.addEventListener('submit', function(e){
  e.preventDefault();
  if (form.elements.website.value) return;
  if (!validate()) return;
  var text = leadText(), lastTs = Number(store('neelux-lead-ts') || 0);
  if (Date.now() - lastTs < 30000) { toast(lastLeadText === text ? 'Сообщение уже подготовлено — проверьте Telegram' : 'Подождите полминуты перед повторной отправкой'); return; }
  store('neelux-lead-ts', String(Date.now())); lastLeadText = text;
  goal('lead_draft');
  if (!LEAD_ENDPOINT) { openTg(text); finish(); return; }
  var btn = $('#fSubmit'), lbl = $('span', btn); btn.disabled = true; lbl.textContent = 'Отправляем…';
  var ctl = 'AbortController' in window ? new AbortController() : null, to = setTimeout(function(){ if (ctl) ctl.abort(); }, 8000);
  fetch(LEAD_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, signal: ctl ? ctl.signal : undefined,
    body: JSON.stringify({ name:form.elements.name.value.trim(), contact:form.elements.contact.value.trim(), service:typeSel.value, serviceLabel:typeLabel(), message:form.elements.message.value.trim(), calc:$('#fCalc').dataset.v || '', source:'neelux.space' }) })
    .then(function(r){ if (!r.ok) throw 0; goal('lead_received'); $('h3', done).textContent = 'Заявка отправлена!'; $('p', done).textContent = 'Мы получили заявку и скоро напишем. Чтобы ускорить — напишите @xwias в Telegram.'; finish(); })
    .catch(function(){ openTg(text); finish(); })
    .then(function(){ clearTimeout(to); btn.disabled = false; lbl.textContent = 'Отправить в Telegram'; });
});
$('#fSubmit').disabled=false;
form.elements.consent.addEventListener('change',function(){if(this.checked)setErr(this,'');});
$('#doneNew').addEventListener('click', function(){ form.reset(); attachCalc(''); done.hidden = true; form.hidden = false; $('#fName').focus(); });

/* ---------- появление ---------- */
requestAnimationFrame(function(){ document.body.classList.add('is-ready'); });
if ('IntersectionObserver' in window && !reduced) {
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin:'0px 0px -8% 0px', threshold:.06 });
  $$('.rv').forEach(function(el){ io.observe(el); });
} else $$('.rv').forEach(function(el){ el.classList.add('in'); });

/* активный пункт меню */
/* разделы без своего пункта меню (этапы, заявка) снимают подсветку */
var navMap = { top:'', services:'services', projects:'projects', concepts:'', pricing:'pricing', calc:'calc', process:'process', faq:'faq', contact:'' };
if ('IntersectionObserver' in window) {
  var nio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { var k = navMap[e.target.id]; $$('.nav a').forEach(function(a){ a.classList.toggle('is-active', a.dataset.nav === k); }); } }); }, { rootMargin:'-45% 0px -50% 0px' });
  Object.keys(navMap).forEach(function(id){ var el = document.getElementById(id); if (el) nio.observe(el); });
}

/* ---------- прокрутка: прогресс, демо, направления, стопка проектов, шаги ---------- */
var calcSec = $('#calc'), hdr = $('#hdr'), prog = $('#progress'), mbar = $('#mbar'), heroImg = $('.hero-bg img'), dirList = $('#dirList'), dirNavOl = $('#dirNav');
var steps = $('#steps'), stepEls = $$('.step'), projs = $$('.proj'), figs = $$('.dir-fig');
var wideMQ = window.matchMedia('(min-width: 901px)'), stackMQ = window.matchMedia('(min-width: 1081px) and (min-height: 700px)');
function applyStack(){}
var ticking=false;
function onScroll(){ticking=false;var y=scrollY,vh=innerHeight,h=document.documentElement.scrollHeight-vh;prog.style.transform='scaleX('+(h>0?y/h:0)+')';hdr.classList.toggle('is-solid',y>10);var cr=calcSec.getBoundingClientRect();mbar.classList.toggle('is-on',y>$('.hero').offsetHeight-80&&!(cr.top<vh*.6&&cr.bottom>vh*.4)&&$('#contact').getBoundingClientRect().top>vh*.5);stepEls.forEach(function(el){el.classList.toggle('is-on',reduced||el.getBoundingClientRect().top<vh*.7);});}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});window.addEventListener('resize',onScroll);onScroll();
/* ---------- концепты: глубина прокрутки макета и автопрокрутка на сенсорных экранах ---------- */
var cxs = $$('.cx-grid > .cx');
function fitConcept(cx){ var v = $('.cx-view', cx), pg = $('.cx-page', cx); $('.cx-frame', cx).style.setProperty('--shift', Math.max(0, pg.scrollHeight - v.clientHeight)); }
function fitConcepts(){ cxs.forEach(fitConcept); }
cxs.forEach(function(cx){ var f = $('.cx-frame', cx); f.addEventListener('mouseenter', function(){ fitConcept(cx); }); f.addEventListener('focus', function(){ fitConcept(cx); }); });
if ('ResizeObserver' in window) { var cro = new ResizeObserver(function(es){ es.forEach(function(e){ fitConcept(e.target.closest('.cx')); }); }); cxs.forEach(function(cx){ cro.observe($('.cx-page', cx)); cro.observe($('.cx-view', cx)); }); }
fitConcepts(); window.addEventListener('load', fitConcepts); window.addEventListener('resize', fitConcepts);
$$('.cx-page img').forEach(function(img){ img.addEventListener('load', fitConcepts); });
if (!fine && !reduced && 'IntersectionObserver' in window) {
  var cio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) fitConcept(e.target); e.target.classList.toggle('is-play', e.isIntersecting); }); }, { threshold:.6 });
  cxs.forEach(function(cx){ cio.observe(cx); });
}
/* ---------- маскот-ролики: играют только на экране; при «уменьшенной анимации» и экономии трафика — неподвижный кадр ---------- */
var mVids = $$('video[data-mascot]');
var saveData = navigator.connection && navigator.connection.saveData;
if (reduced || saveData) mVids.forEach(function(v){ v.removeAttribute('autoplay'); v.preload = 'none'; });
else if ('IntersectionObserver' in window) {
  var vio = new IntersectionObserver(function(es){ es.forEach(function(e){
    var v = e.target;
    if (e.isIntersecting && !reduced && !document.hidden) { if (v.preload !== 'auto') v.preload = 'auto'; v.playbackRate = 0.85; var pr = v.play(); if (pr && pr.catch) pr.catch(function(){}); }
    else v.pause();
  }); }, { rootMargin:'200px 0px' });
  mVids.forEach(function(v){ vio.observe(v); });
  document.addEventListener('visibilitychange', function(){ mVids.forEach(function(v){ if (document.hidden) v.pause(); }); });
}
/* ---------- магнитные кнопки (только мышь) ---------- */
if (fine && !reduced) $$('.magnet').forEach(function(b){
  b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px)'; });
  b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
});

window.addEventListener('neelux-motion', function(e){
  reduced = e.detail.reduced;
  if(reduced){ clearInterval(rotT); rotT=null; userPaused=true; mVids.forEach(function(v){v.pause();}); }
  else { startRot(); }
  syncPlay();
  applyStack(); onScroll();
});
})();

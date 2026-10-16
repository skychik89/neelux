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
  { id:'web', name:'Сайты и веб-приложения', short:'Сайты', img:'dir-web',
    desc:'Сайт-визитка, лендинг, многостраничный сайт или магазин — и веб-приложения: онлайн-запись, CRM, личные кабинеты. Дизайн интерфейсов делаем сами.',
    pts:['Структура и тексты, которые ведут к заявке','Дизайн сначала для телефона','Домен, аналитика и связка с ботом'],
    grows:'количество страниц и уникальных блоков, тексты и фото, интеграции, роли пользователей, сжатые сроки',
    minGrp:['Сайты','Веб-приложения'], support:['fix','support','speed','hosting'] },
  { id:'bots', name:'Telegram-боты и автоматизация', short:'Боты', img:'dir-bots',
    desc:'Боты для записи, продаж и каталога, Telegram Mini Apps и автоматизация рутины — там, где уже сидят ваши клиенты.',
    pts:['Запись 24/7 и напоминания клиентам','Приём оплат, воронки и рассылки','Связка с CRM, таблицами и сервисами'],
    grows:'число сценариев, приём оплат, интеграции с CRM и таблицами, админ-панель',
    support:['fix','support'] },
  { id:'ai', name:'AI-интеграции', short:'AI', img:'dir-ai',
    desc:'Нейросети в вашем бизнесе: AI-консультант на сайте, чат-бот по базе знаний, разбор заявок, тексты и отчёты.',
    pts:['Ответы клиентам 24/7 по вашим материалам','Передача диалога человеку','Ограничения и контроль качества ответов'],
    grows:'объём базы знаний, число каналов и интеграций, сложность сценариев — сложные системы считаем после созвона',
    support:['fix','support'] },
  { id:'promo', name:'Продвижение и поиск клиентов', short:'Продвижение', img:'dir-promo',
    desc:'Яндекс Карты и 2ГИС, SEO, реклама, рассылки и контент — чтобы вас находили рядом и возвращались снова.',
    pts:['Карточки на картах по правилам площадок','Реклама, рассылки и аналитика','Оформление соцсетей и ролики Reels/Shorts'],
    grows:'число площадок и филиалов, объём контента, рекламный бюджет оплачивается отдельно',
    warn:'Не обещаем позиций и рейтинга и не используем накрутки — порядок выдачи определяют площадки.',
    support:['map_care','support'] }
];
const SERVICES = [
  { id:'card',      cat:'web', grp:'Сайты', name:'Сайт-визитка',          price:9900,  d:'Быстрый старт для мастера, кабинета или эксперта', inc:['Услуги, прайс, портфолио и контакты','Кнопки записи в Telegram и звонка','Адаптив под телефоны'] },
  { id:'landing',   cat:'web', grp:'Сайты', name:'Лендинг',               price:16900, d:'Продающая страница под услугу, курс или акцию', inc:['Структура под заявки','Форма и кнопки связи','Адаптив и базовая SEO-разметка'] },
  { id:'multi',     cat:'web', grp:'Сайты', name:'Многостраничный сайт',  price:29900, d:'Несколько разделов для бизнеса с разными услугами', inc:['Индивидуальная структура','Страницы услуг и новостей','Базовая SEO-разметка'] },
  { id:'corp',      cat:'web', grp:'Сайты', name:'Корпоративный сайт',    price:29900, d:'Представительство компании: о нас, услуги, проекты', inc:['Дизайн под фирменный стиль','Разделы компании, услуг и кейсов','Формы и связка с мессенджерами'] },
  { id:'shop',      cat:'web', grp:'Сайты', name:'Интернет-магазин',      price:39900, cx:true, d:'Каталог, корзина и оплата онлайн', inc:['Каталог с фильтрами и карточками','Корзина, оформление и оплата','Управление товарами'] },
  { id:'redesign',  cat:'web', grp:'Сайты', name:'Редизайн сайта',        price:9900,  d:'Обновим устаревший сайт без потери заявок', inc:['Аудит текущего сайта','Новый дизайн ключевых страниц','Перенос контента'] },
  { id:'webapp',    cat:'web', grp:'Веб-приложения', name:'Веб-приложение',               price:34900, cx:true, d:'Сервис под ваш процесс: от MVP до продукта', inc:['Прототип и проектирование','Интерфейс и серверная часть','Админ-панель'] },
  { id:'crm',       cat:'web', grp:'Веб-приложения', name:'CRM-система',                  price:34900, cx:true, d:'Клиенты, сделки и задачи команды в одном окне', inc:['Карточки клиентов и воронка','Роли и права сотрудников','Отчёты и уведомления'] },
  { id:'booking',   cat:'web', grp:'Веб-приложения', name:'Онлайн-запись и бронирование', price:19900, d:'Расписание, специалисты и свободные слоты на сайте', inc:['Выбор услуги, специалиста и времени','Подтверждения и напоминания','Кабинет администратора'] },
  { id:'cabinet',   cat:'web', grp:'Веб-приложения', name:'Личный кабинет',               price:14900, d:'Заказы, записи и история для ваших клиентов', inc:['Регистрация и вход','История заказов и записей','Профиль и уведомления'] },
  { id:'uiux',      cat:'web', grp:'Дизайн интерфейсов и бренд', name:'UI/UX-дизайн',    price:7900,  d:'Интерфейсы сайтов, ботов и приложений', inc:['Прототипы','Макеты ключевых экранов','UI-кит'] },
  { id:'land_dsgn', cat:'web', grp:'Дизайн интерфейсов и бренд', name:'Дизайн лендинга', price:6900,  d:'Макет страницы без вёрстки', inc:['Структура страницы','Дизайн для компьютера и телефона','Исходники в Figma'] },
  { id:'logo',      cat:'web', grp:'Дизайн интерфейсов и бренд', name:'Логотип',         price:3900,  d:'Знак, который узнают', inc:['Несколько концепций','Правки выбранного варианта','Файлы для веба и печати'] },
  { id:'brand',     cat:'web', grp:'Дизайн интерфейсов и бренд', name:'Фирменный стиль', price:12900, d:'Логотип, цвета, шрифты и носители', inc:['Логотип','Палитра и типографика','Носители и шаблоны'] },
  { id:'brandbook', cat:'web', grp:'Дизайн интерфейсов и бренд', name:'Брендбук',        price:14900, d:'Правила, по которым бренд выглядит одинаково везде', inc:['Правила использования логотипа','Цвета, шрифты, графика','Примеры применения'] },
  { id:'fix',       cat:'web', grp:'Поддержка', name:'Доработка сайта или бота', price:1900, d:'Разовая задача: правка, новый блок, функция', inc:['Оценка задачи до начала','Внесение изменений','Проверка на устройствах'] },
  { id:'support',   cat:'web', grp:'Поддержка', name:'Сопровождение',            price:5000, from:false, unit:'мес', d:'Правки цен, акций и дат, мониторинг, рассылки', inc:['Мелкие правки контента','Мониторинг работы сайта и бота','Ежемесячная рассылка'] },
  { id:'speed',     cat:'web', grp:'Поддержка', name:'Оптимизация скорости',     price:3900, d:'Сайт открывается быстро даже с телефона', inc:['Сжатие изображений','Оптимизация загрузки','Проверка до и после'] },
  { id:'hosting',   cat:'web', grp:'Поддержка', name:'Хостинг и домен',          price:1900, d:'Подберём, подключим, настроим SSL', inc:['Подбор и подключение домена','Настройка хостинга','SSL-сертификат'] },
  { id:'bot_card',  cat:'bots', grp:'Боты', name:'Бот-визитка',                  price:8900,  d:'Прайс, портфолио и ответы на вопросы в Telegram', inc:['Меню услуг и цен','Портфолио и FAQ','Перевод на администратора'] },
  { id:'bot_lead',  cat:'bots', grp:'Боты', name:'Бот онлайн-записи и заявок',   price:14900, d:'Запись 24/7 и сбор заявок без переписок', inc:['Выбор услуги, мастера и времени','Напоминания клиентам','База клиентов и рассылки'] },
  { id:'bot_pay',   cat:'bots', grp:'Боты', name:'Бот с оплатой и интеграциями', price:24900, cx:true, d:'Воронка продаж, оплаты, курсы или магазин в боте', inc:['Приём оплат','Воронка и прогрев','Связка с CRM и таблицами'] },
  { id:'miniapp',   cat:'bots', grp:'Боты', name:'Telegram Mini App',            price:19900, cx:true, d:'Приложение внутри Telegram — без App Store', inc:['Интерфейс как у мобильного приложения','Вход через Telegram','Каталог, запись или личный кабинет'] },
  { id:'tg_auto',   cat:'bots', grp:'Автоматизация и интеграции', name:'Автоматизация в Telegram', price:7900, d:'Уведомления, отчёты и рутина — автоматически', inc:['Уведомления о заявках и заказах','Автоответы и сценарии','Связка с таблицами и сервисами'] },
  { id:'api',       cat:'bots', grp:'Автоматизация и интеграции', name:'API и интеграции',         price:6900, d:'Свяжем сайт, бота, CRM и платёжные сервисы', inc:['Платёжные системы','CRM и таблицы','Сторонние API'] },
  { id:'ai_bot',    cat:'ai', grp:'AI', name:'AI-чат-бот',                 price:9900,  d:'Отвечает клиентам 24/7 по вашей базе знаний', inc:['Обучение на ваших материалах','Передача диалога человеку','Telegram или сайт'] },
  { id:'ai_site',   cat:'ai', grp:'AI', name:'AI-консультант для сайта',   price:9900,  d:'Помогает выбрать услугу и оставить заявку', inc:['Виджет на сайте','Ответы по услугам и ценам','Сбор контактов'] },
  { id:'ai_auto',   cat:'ai', grp:'AI', name:'AI-автоматизация процессов', price:14900, cx:true, d:'Разбор заявок, тексты и отчёты силами нейросетей', inc:['Разбор рутинных процессов','Сценарии автоматизации','Контроль качества ответов'] },
  { id:'ai_int',    cat:'ai', grp:'AI', name:'Интеграция нейросетей',      price:9900,  d:'Подключим нейросети к вашему продукту', inc:['Подбор модели под задачу','Подключение по API','Ограничения и безопасность'] },
  { id:'map_one',   cat:'promo', grp:'Яндекс Карты и 2ГИС', name:'Яндекс Карты или 2ГИС', price:7900,  from:false, d:'Создание или проверка и оформление одной площадки', inc:['Категории, услуги, график и контакты','Фото и описание','Кнопки записи и ссылки на сайт или бота'] },
  { id:'map_both',  cat:'promo', grp:'Яндекс Карты и 2ГИС', name:'Яндекс Карты + 2ГИС',   price:12900, from:false, d:'Обе площадки под ключ с едиными данными', inc:['Оформление обеих карточек','Единые данные на обеих площадках','Работа с отзывами по правилам площадок'] },
  { id:'map_care',  cat:'promo', grp:'Поддержка', name:'Ведение карточек',     price:2900,  unit:'мес', d:'Актуальные цены, акции, фото и ответы на отзывы', inc:['Обновление информации','Ответы на отзывы','Ежемесячная сверка данных'] },
  { id:'seo',       cat:'promo', grp:'Трафик и аналитика', name:'Базовая SEO-настройка',       price:4900, d:'Чтобы сайт корректно видели поисковики', inc:['Мета-теги и заголовки','Карта сайта и индексация','Подключение вебмастеров'] },
  { id:'analytics', cat:'promo', grp:'Трафик и аналитика', name:'Подключение аналитики',       price:2900, d:'Яндекс Метрика, цели и понятные отчёты', inc:['Установка счётчиков','Цели на заявки и клики','Короткая инструкция'] },
  { id:'ads',       cat:'promo', grp:'Трафик и аналитика', name:'Настройка рекламы',           price:9900, d:'Запуск трафика; рекламный бюджет оплачивается отдельно', inc:['Настройка кампаний','Креативы и тексты','Первичная оптимизация'] },
  { id:'mailing',   cat:'promo', grp:'Трафик и аналитика', name:'Рассылка по базе в Telegram', price:3500, from:false, d:'Продающая рассылка, чтобы закрыть пустые окна', inc:['Текст и оформление','Сегментация базы','Отправка'] },
  { id:'social',    cat:'promo', grp:'Контент и соцсети', name:'Оформление соцсетей',            price:6900,  d:'Упаковка профиля Instagram или ВК', inc:['Аватар и обложки','Шаблоны постов и сторис','Оформление актуального'] },
  { id:'pricelist', cat:'promo', grp:'Контент и соцсети', name:'Прайс-лист, сертификаты, гайды', price:2500,  from:false, d:'Печатные и цифровые материалы', inc:['Дизайн в вашем стиле','Файлы для печати и соцсетей'] },
  { id:'creatives', cat:'promo', grp:'Контент и соцсети', name:'Рекламные креативы',             price:1900,  d:'Баннеры для рекламы и соцсетей', inc:['Креативы под площадки','Несколько форматов','Варианты для теста'] },
  { id:'reels',     cat:'promo', grp:'Контент и соцсети', name:'Монтаж Reels / Shorts',          price:1500,  from:false, d:'1 ролик; 5 шт. — 6 500 ₽, 10 шт. — 11 900 ₽', inc:['Монтаж и ритм под тренды','Титры и музыка','Формат 9:16'] },
  { id:'ad_video',  cat:'promo', grp:'Контент и соцсети', name:'Монтаж рекламного ролика',       price:2900,  d:'Ролик для рекламы и сайта', inc:['Сценарная структура','Монтаж, титры, музыка','Форматы под площадки'] },
  { id:'reels5',    cat:'promo', grp:'Контент и соцсети', name:'5 роликов Reels/Shorts',         price:6500,  from:false, hidden:true },
  { id:'reels10',   cat:'promo', grp:'Контент и соцсети', name:'10 роликов Reels/Shorts',        price:11900, from:false, hidden:true }
];
const PACKAGES = [
  { id:'start', name:'Быстрый старт', price:19900, items:['card','bot_lead','map_one'], for:'Частным мастерам и небольшим кабинетам',
    features:['Сайт-визитка с услугами, прайсом и портфолио','Telegram-бот онлайн-записи 24/7','Оформление Яндекс Карт или 2ГИС','Кнопки быстрой связи и записи'] },
  { id:'business', name:'Студия под ключ', price:39900, hit:true, items:['landing','bot_lead','map_both','pricelist','social'], for:'Салонам, студиям и локальному бизнесу',
    features:['Продающий лендинг','Бот записи: мастера, напоминания, рассылки','Оформление Яндекс Карт и 2ГИС','Прайс-листы, сертификаты и оформление соцсетей'] },
  { id:'full', name:'Полный масштаб', price:80000, items:['multi','bot_pay','map_both','brand','social','pricelist','reels10','ads','mailing','support'], for:'Бизнесу, которому нужно всё и сразу',
    features:['Многостраничный сайт','Бот с воронкой и оплатами','Яндекс Карты и 2ГИС под ключ','Фирменный стиль, соцсети и полиграфия','10 роликов Reels/Shorts','Настройка рекламы (бюджет отдельно)'],
    gift:'1 месяц сопровождения в подарок' }
];
const CALC_ADDONS = ['map_one','map_both','map_care','logo','brand','social','pricelist','creatives','reels','api','ai_site','analytics','seo','hosting','mailing','ads','support'];
const EXCLUSIVE = [['map_one','map_both'],['logo','brand']];

/* Автоотправка заявок на свой сервер. Пусто — выключено (открывается чат @xwias с готовым текстом).
   Токены бота сюда НЕ вставлять: endpoint сам пересылает заявку в Telegram на стороне сервера. */
const LEAD_ENDPOINT = '';
const TG_USER = 'xwias';

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
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
var toastT;
function toast(msg){ var t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('is-on'); }, 2600); }
function copy(text){
  function legacy(){ try { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly',''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return ok; } catch(e){ return false; } }
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function(){ return true; }, legacy);
  return Promise.resolve(legacy());
}
function store(k, v){ try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch(e){ return null; } }
function go(sel){ var el = typeof sel === 'string' ? $(sel) : sel; if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'start' }); }

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
window.matchMedia('(min-width: 1081px)').addEventListener('change', function(e){ if (e.matches) setMenu(false); });

/* ---------- ротатор слов в заголовке ---------- */
var rot = $('#rot'), words = $$('.rot-w', rot), wi = 0, rotT = null;
words.forEach(function(w){
  var txt = w.textContent; w.textContent = '';
  Array.prototype.forEach.call(txt, function(c, k){ var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--k', k); s.textContent = c === ' ' ? NB : c; w.appendChild(s); });
});
function fitRot(){ rot.style.width = words[wi].getBoundingClientRect().width + 'px'; }
function nextWord(){
  var cur = words[wi]; wi = (wi + 1) % words.length; var nx = words[wi];
  cur.classList.remove('is-on'); cur.classList.add('is-out');
  setTimeout(function(){ cur.classList.remove('is-out'); }, 700);
  nx.classList.add('is-on'); fitRot();
}
function startRot(){ if (!reduced && !rotT) rotT = setInterval(function(){ if (!document.hidden) nextWord(); }, 2800); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitRot); fitRot();
window.addEventListener('resize', fitRot);
setTimeout(startRot, reduced ? 0 : 2200);

/* ---------- демонстрация ---------- */
var demo = $('#demo'), tabs = $$('.dt', demo), scenes = {}, order = tabs.map(function(t){ return t.dataset.scene; });
order.forEach(function(k){ scenes[k] = $('#scene-' + k); });
var cur = -1, elapsed = 0, last = 0, userPaused = reduced, hoverPause = false, inView = true, raf = null;
var playBtn = $('#demoPlay'), cap = $('#demoCap'), stageTitle = $('#stageTitle');
function setScene(i, focus){
  if (i === cur) return;
  cur = i; elapsed = 0;
  tabs.forEach(function(t, k){ var on = k === i; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; t.style.setProperty('--p', 0); });
  order.forEach(function(k, n){ var sc = scenes[k], on = n === i; sc.classList.toggle('is-on', on); sc.hidden = !on; if (on) { sc.removeAttribute('inert'); sc.removeAttribute('aria-hidden'); } else { sc.setAttribute('inert', ''); sc.setAttribute('aria-hidden', 'true'); } });
  var key = order[i];
  stageTitle.textContent = scenes[key].dataset.title;
  cap.textContent = DEMO[key].cap; cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
  if (focus) tabs[i].focus();
}
function paused(){ return userPaused || hoverPause || !inView || document.hidden; }
function syncPlay(){ playBtn.setAttribute('aria-pressed', userPaused); playBtn.setAttribute('aria-label', userPaused ? 'Запустить автопрокрутку демонстрации' : 'Остановить автопрокрутку демонстрации'); }
function tick(now){
  raf = requestAnimationFrame(tick);
  var dt = last ? now - last : 0; last = now;
  if (paused()) return;
  var key = order[cur]; elapsed += dt;
  var p = clamp(elapsed / DEMO[key].ms, 0, 1);
  tabs[cur].style.setProperty('--p', p.toFixed(4));
  if (p >= 1) setScene((cur + 1) % order.length);
}
tabs.forEach(function(t, i){ t.addEventListener('click', function(){ setScene(i); }); });
$('.demo-tabs').addEventListener('keydown', function(e){
  var i = cur;
  if (e.key === 'ArrowRight') i = (cur + 1) % tabs.length; else if (e.key === 'ArrowLeft') i = (cur + tabs.length - 1) % tabs.length;
  else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = tabs.length - 1; else return;
  e.preventDefault(); setScene(i, true);
});
playBtn.addEventListener('click', function(){ userPaused = !userPaused; syncPlay(); });
if (fine) { $('#demoStage').addEventListener('mouseenter', function(){ hoverPause = true; }); $('#demoStage').addEventListener('mouseleave', function(){ hoverPause = false; }); }
demo.addEventListener('focusin', function(){ hoverPause = true; });
demo.addEventListener('focusout', function(e){ if (!demo.contains(e.relatedTarget)) hoverPause = false; });
if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ inView = es[0].isIntersecting; }, { threshold:.25 }).observe(demo);
setScene(0); syncPlay();
raf = requestAnimationFrame(tick);

/* ---------- направления ---------- */
function svcRow(s, sup){
  return '<div class="svc' + (sup ? ' svc-sup' : '') + '"><b>' + esc(s.name) + '</b><span class="pr">' + priceTxt(s) + '</span><p>' + esc(s.d) + '</p>' +
    '<ul>' + s.inc.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
    (s.cx ? '<p class="cx">Объём таких проектов сильно различается — итог назовём после короткого обсуждения.</p>' : '') +
    '<div class="acts"><a class="btn btn-ghost btn-sm" href="#contact" data-pick="' + s.id + '">Обсудить</a>' + (s.unit ? '' : '<a class="btn btn-ghost btn-sm" href="#calc" data-calc="' + s.id + '">Посчитать</a>') + '</div></div>';
}
$('#dirNav').innerHTML = DIRS.map(function(d, i){ return '<li><a href="#dir-' + d.id + '" data-i="' + i + '"><span>0' + (i + 1) + '</span>' + esc(d.name) + '</a></li>'; }).join('');
$('#dirList').innerHTML = DIRS.map(function(d, i){
  var list = visible(d.id).filter(function(s){ return s.grp !== 'Поддержка'; }), grps = [];
  list.forEach(function(s){ if (grps.indexOf(s.grp) < 0) grps.push(s.grp); });
  var n = list.length + d.support.length;
  return '<article class="dir rv" id="dir-' + d.id + '" aria-labelledby="dirh-' + d.id + '">' +
    '<figure class="dir-fig"><span class="dir-num">0' + (i + 1) + ' / 04</span>' +
      '<img src="' + d.img + '-1200.webp" srcset="' + d.img + '-800.webp 800w, ' + d.img + '-1200.webp 1200w" sizes="(max-width: 1080px) 92vw, 820px" alt="" width="1200" height="900" loading="lazy" decoding="async"></figure>' +
    '<div class="dir-body"><h3 id="dirh-' + d.id + '">' + esc(d.name) + '</h3><p class="dir-desc">' + esc(d.desc) + '</p>' +
      '<ul class="dir-pts">' + d.pts.map(function(p){ return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      (d.warn ? '<p class="dir-warn">' + esc(d.warn) + '</p>' : '') +
      '<div class="dir-foot"><p class="dir-price">от<b>' + money(catMin(d.id)) + '</b></p>' +
        '<a class="btn btn-accent btn-sm" href="#contact" data-pick="dir:' + d.id + '">Обсудить' + icon('i-arr') + '</a>' +
        '<a class="btn btn-ghost btn-sm" href="#calc" data-dircalc="' + d.id + '">Посчитать</a></div>' +
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
  return '<article class="pkg rv' + (p.hit ? ' pkg--hit' : '') + (i ? ' d' + i : '') + '"><div class="top"><h3>' + esc(p.name) + '</h3>' + (p.hit ? '<span class="hit">Чаще выбирают</span>' : '') + '</div>' +
    '<p class="for">' + esc(p.for) + '</p><div class="price">' + money(p.price) + '</div>' +
    '<p class="sep">По отдельности — ' + money(sum) + '. Выгода <b>' + money(sum - p.price) + '</b></p>' +
    '<ul>' + p.features.map(function(f){ return '<li>' + icon('i-check') + '<span>' + esc(f) + '</span></li>'; }).join('') + '</ul>' +
    (p.gift ? '<p class="gift">🎁 ' + esc(p.gift) + '</p>' : '') +
    '<a class="btn ' + (p.hit ? 'btn-accent' : 'btn-ghost') + ' btn-block" href="#contact" data-pkg="' + p.id + '">Выбрать «' + esc(p.name) + '»' + icon('i-arr') + '</a></article>';
}).join('');

/* ---------- калькулятор ---------- */
var calc = { cat:'web', main:'landing', adds:{} };
function mains(cat){ return visible(cat).filter(function(s){ return !s.unit; }); }
function renderCalcCats(){ $('#cCats').innerHTML = DIRS.map(function(d){ return '<div class="opt"><input type="radio" name="ccat" id="cc-' + d.id + '" value="' + d.id + '"' + (calc.cat === d.id ? ' checked' : '') + '><label for="cc-' + d.id + '"><b>' + esc(d.short) + '</b><small>от ' + money(catMin(d.id)) + '</small></label></div>'; }).join(''); }
function renderCalcMain(){
  var list = mains(calc.cat);
  if (!list.some(function(s){ return s.id === calc.main; })) calc.main = list[0].id;
  $('#cMain').innerHTML = list.map(function(s){ return '<div class="opt"><input type="radio" name="cmain" id="cm-' + s.id + '" value="' + s.id + '"' + (calc.main === s.id ? ' checked' : '') + '><label for="cm-' + s.id + '"><b>' + esc(s.name) + '</b><small>' + priceTxt(s) + '</small></label></div>'; }).join('');
}
function renderCalcAdds(){
  delete calc.adds[calc.main];
  $('#cAdds').innerHTML = CALC_ADDONS.filter(function(k){ return k !== calc.main; }).map(function(k){ var s = BY[k]; return '<label class="add"><input type="checkbox" value="' + k + '"' + (calc.adds[k] ? ' checked' : '') + '><span>' + esc(s.name) + '</span><em>' + priceTxt(s) + '</em></label>'; }).join('');
}
function calcState(){
  var ids = [calc.main].concat(Object.keys(calc.adds).filter(function(k){ return calc.adds[k] && k !== calc.main; }));
  var once = 0, mo = 0, cx = false, from = false;
  ids.forEach(function(k){ var s = BY[k]; if (s.unit) mo += s.price; else { once += s.price; if (isFrom(s)) from = true; } if (s.cx) cx = true; });
  return { ids:ids, once:once, mo:mo, cx:cx, from:from };
}
var sumShown = 0, sumRaf = null;
function animateSum(to, prefix){
  var el = $('#cSum'), from = sumShown, t0 = performance.now(), d = reduced ? 0 : 600;
  cancelAnimationFrame(sumRaf);
  (function step(now){ var k = d ? clamp((now - t0) / d, 0, 1) : 1, e = 1 - Math.pow(1 - k, 4), v = Math.round((from + (to - from) * e) / 100) * 100; if (k === 1) v = to; el.textContent = prefix + money(v); sumShown = v; if (k < 1) sumRaf = requestAnimationFrame(step); })(t0);
}
function renderCalcRes(){
  var st = calcState();
  animateSum(st.once, st.from ? 'от' + NB : '');
  var mo = $('#cMo'); mo.hidden = !st.mo; mo.textContent = '+ ' + money(st.mo) + ' в месяц';
  $('#cList').innerHTML = st.ids.map(function(k){ var s = BY[k]; return '<li><span>' + esc(s.name) + '</span><span>' + priceTxt(s) + '</span></li>'; }).join('');
  $('#cWarn').innerHTML = (st.cx ? '<b>Индивидуальный расчёт.</b> В составе есть сложная система — точную цену назовём после короткого созвона. ' : '<b>Это ориентир.</b> ') + 'На стоимость влияют: ' + esc(DIR[BY[calc.main].cat].grows) + '.';
  var tip = $('#cTip'), best = null;
  PACKAGES.forEach(function(p){
    var covers = st.ids.filter(function(k){ return !BY[k].unit; }).every(function(k){ return p.items.indexOf(k) > -1 || (k === 'map_one' && p.items.indexOf('map_both') > -1) || (k === 'logo' && p.items.indexOf('brand') > -1); });
    if (covers && st.once >= p.price && (!best || p.price < best.price)) best = p;
  });
  tip.hidden = !best;
  if (best) tip.innerHTML = 'Пакет «' + esc(best.name) + '» за ' + money(best.price) + ' включает всё это и больше. <a href="#pricing">Смотреть пакеты</a>';
}
function renderCalc(){ renderCalcCats(); renderCalcMain(); renderCalcAdds(); renderCalcRes(); }
$('#cCats').addEventListener('change', function(e){ calc.cat = e.target.value; renderCalcMain(); renderCalcAdds(); renderCalcRes(); });
$('#cMain').addEventListener('change', function(e){ calc.main = e.target.value; renderCalcAdds(); renderCalcRes(); });
$('#cAdds').addEventListener('change', function(e){
  var k = e.target.value; calc.adds[k] = e.target.checked;
  if (e.target.checked) EXCLUSIVE.forEach(function(g){ if (g.indexOf(k) > -1) g.forEach(function(o){ if (o !== k && calc.adds[o]) { calc.adds[o] = false; var el = $('#cAdds input[value="' + o + '"]'); if (el) el.checked = false; } }); });
  renderCalcRes();
});
renderCalc();
function calcSummary(){ var st = calcState(); return st.ids.map(function(k){ return BY[k].name + ' (' + priceTxt(BY[k]) + ')'; }).join(', ') + ' — итого ' + (st.from ? 'от ' : '') + money(st.once) + (st.mo ? ' + ' + money(st.mo) + '/мес' : ''); }

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
  if (a.dataset.calc) { var s = BY[a.dataset.calc]; calc.cat = s.cat; calc.main = s.id; renderCalc(); }
  if (a.dataset.dircalc) { calc.cat = a.dataset.dircalc; renderCalc(); }
});
function attachCalc(txt){ var box = $('#fCalc'); box.hidden = !txt; box.dataset.v = txt || ''; $('#fCalcTxt').innerHTML = txt ? '<b>Расчёт:</b> ' + esc(txt) : ''; }
$('#fCalcDel').addEventListener('click', function(){ attachCalc(''); });
$('#cSend').addEventListener('click', function(){ attachCalc(calcSummary()); typeSel.value = calc.main; go('#contact'); setTimeout(function(){ $('#fName').focus({ preventScroll:true }); }, reduced ? 0 : 900); });

/* ---------- форма ---------- */
var form = $('#form'), done = $('#done');
var draft = store('neelux-brief'); if (draft) { try { var dj = JSON.parse(draft); ['name','contact','message'].forEach(function(k){ if (dj[k]) form.elements[k].value = dj[k]; }); } catch(e){} }
form.addEventListener('input', function(){ store('neelux-brief', JSON.stringify({ name:form.elements.name.value, contact:form.elements.contact.value, message:form.elements.message.value })); });
function setErr(el, msg){ el.setAttribute('aria-invalid', msg ? 'true' : 'false'); $('#' + el.getAttribute('aria-describedby')).textContent = msg || ''; }
function validate(){
  var ok = true, n = form.elements.name, c = form.elements.contact, cv = c.value.trim();
  if (n.value.trim().length < 2) { setErr(n, 'Напишите, как к вам обращаться'); ok = false; } else setErr(n, '');
  var tg = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cv.replace(/^https?:\/\/t\.me\//, ''));
  var ph = cv.replace(/\D/g, '').length >= 10 && /^[\d\s()+-]+$/.test(cv);
  if (!tg && !ph) { setErr(c, 'Укажите Telegram (@username) или телефон'); ok = false; } else setErr(c, '');
  if (!ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); }
  return ok;
}
['name','contact'].forEach(function(k){ form.elements[k].addEventListener('blur', function(){ if (form.elements[k].value) validate(); }); });
function typeLabel(){ var o = typeSel.options[typeSel.selectedIndex]; return o ? o.textContent : ''; }
function leadText(){
  var L = ['Заявка с сайта neelux.space', '', 'Имя: ' + form.elements.name.value.trim(), 'Контакт: ' + form.elements.contact.value.trim(), 'Что нужно: ' + typeLabel()];
  var m = form.elements.message.value.trim(); if (m) L.push('Задача: ' + m);
  var cc = $('#fCalc').dataset.v; if (cc) L.push('Расчёт: ' + cc);
  return L.join('\n');
}
function openTg(text){
  var url = 'https://t.me/' + TG_USER + '?text=' + encodeURIComponent(text);
  $('#doneOpen').href = url;
  var w = window.open(url, '_blank'); if (w) { try { w.opener = null; } catch(e){} } else location.href = url;
}
function finish(){ form.hidden = true; done.hidden = false; done.focus(); store('neelux-brief', null); }
form.addEventListener('submit', function(e){
  e.preventDefault();
  if (form.elements.website.value) return;
  if (!validate()) return;
  var text = leadText(), lastTs = Number(store('neelux-lead-ts') || 0);
  if (Date.now() - lastTs < 30000) { toast(store('neelux-lead-last') === text ? 'Эта заявка уже отправлена — проверьте Telegram' : 'Подождите полминуты перед повторной отправкой'); return; }
  store('neelux-lead-ts', String(Date.now())); store('neelux-lead-last', text);
  copy(text);
  if (!LEAD_ENDPOINT) { openTg(text); finish(); return; }
  var btn = $('#fSubmit'), lbl = $('span', btn); btn.disabled = true; lbl.textContent = 'Отправляем…';
  var ctl = 'AbortController' in window ? new AbortController() : null, to = setTimeout(function(){ if (ctl) ctl.abort(); }, 8000);
  fetch(LEAD_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, signal: ctl ? ctl.signal : undefined,
    body: JSON.stringify({ name:form.elements.name.value.trim(), contact:form.elements.contact.value.trim(), service:typeSel.value, serviceLabel:typeLabel(), message:form.elements.message.value.trim(), calc:$('#fCalc').dataset.v || '', source:'neelux.space' }) })
    .then(function(r){ if (!r.ok) throw 0; $('h3', done).textContent = 'Заявка отправлена!'; $('p', done).textContent = 'Мы получили заявку и скоро напишем. Чтобы ускорить — напишите @xwias в Telegram.'; finish(); })
    .catch(function(){ openTg(text); finish(); })
    .then(function(){ clearTimeout(to); btn.disabled = false; lbl.textContent = 'Отправить в Telegram'; });
});
$('#doneNew').addEventListener('click', function(){ form.reset(); attachCalc(''); done.hidden = true; form.hidden = false; $('#fName').focus(); });

/* ---------- появление ---------- */
requestAnimationFrame(function(){ document.body.classList.add('is-ready'); });
if ('IntersectionObserver' in window && !reduced) {
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin:'0px 0px -8% 0px', threshold:.06 });
  $$('.rv').forEach(function(el){ io.observe(el); });
} else $$('.rv').forEach(function(el){ el.classList.add('in'); });

/* активный пункт меню */
var navMap = { services:'services', projects:'projects', pricing:'pricing', calc:'calc', process:'calc', faq:'faq', contact:'faq' };
if ('IntersectionObserver' in window) {
  var nio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { var k = navMap[e.target.id]; $$('.nav a').forEach(function(a){ a.classList.toggle('is-active', a.dataset.nav === k); }); } }); }, { rootMargin:'-45% 0px -50% 0px' });
  Object.keys(navMap).forEach(function(id){ var el = document.getElementById(id); if (el) nio.observe(el); });
}

/* ---------- прокрутка: прогресс, демо, направления, стопка проектов, шаги ---------- */
var hdr = $('#hdr'), prog = $('#progress'), mbar = $('#mbar'), heroImg = $('.hero-bg img'), dirList = $('#dirList'), dirNavOl = $('#dirNav');
var steps = $('#steps'), stepEls = $$('.step'), projs = $$('.proj'), figs = $$('.dir-fig');
var wideMQ = window.matchMedia('(min-width: 901px)'), stackMQ = window.matchMedia('(min-width: 1081px) and (min-height: 700px)');
function rich(){ return wideMQ.matches && !reduced; }
function applyStack(){
  var on = stackMQ.matches && !reduced;
  projs.forEach(function(p, i){
    if (on) { p.style.position = 'sticky'; p.style.top = 'calc(var(--hdr) + 24px + ' + (i * 14) + 'px)'; }
    else { p.style.position = ''; p.style.top = ''; p.style.transform = ''; p.style.filter = ''; }
  });
}
var ticking = false;
function onScroll(){
  ticking = false;
  var y = scrollY, vh = innerHeight, h = document.documentElement.scrollHeight - vh;
  prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
  hdr.classList.toggle('is-solid', y > 10);
  mbar.classList.toggle('is-on', y > vh * .7 && $('#contact').getBoundingClientRect().top > vh * .5);
  if (rich()) {
    var hp = clamp(y / (vh * .7), 0, 1);
    demo.style.setProperty('--tilt', (7 * (1 - hp)).toFixed(2) + 'deg');
    demo.style.setProperty('--sc', (.95 + .05 * hp).toFixed(4));
    if (heroImg && y < vh * 1.6) heroImg.style.setProperty('--hy', (y * .22).toFixed(1) + 'px');
    figs.forEach(function(f){ var r = f.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; var c = (r.top + r.height / 2 - vh / 2) / vh; var im = f.querySelector('img'); if (im) im.style.setProperty('--py', (c * -14).toFixed(1) + 'px'); });
  } else { demo.style.removeProperty('--tilt'); demo.style.removeProperty('--sc'); }
  var dr = dirList.getBoundingClientRect();
  dirNavOl.style.setProperty('--dp', clamp((vh * .5 - dr.top) / dr.height, 0, 1).toFixed(3));
  if (stackMQ.matches && !reduced) {
    for (var i = 0; i < projs.length - 1; i++) {
      var a = projs[i].getBoundingClientRect(), b = projs[i + 1].getBoundingClientRect();
      var q = clamp(1 - (b.top - a.top) / a.height, 0, 1);
      projs[i].style.transform = q ? 'scale(' + (1 - q * .05).toFixed(4) + ')' : '';
      projs[i].style.filter = q ? 'brightness(' + (1 - q * .55).toFixed(3) + ')' : '';
    }
  }
  var sr = steps.getBoundingClientRect();
  var sp = reduced ? 1 : clamp((vh * .62 - sr.top) / sr.height, 0, 1);
  steps.style.setProperty('--p', sp.toFixed(3));
  stepEls.forEach(function(el, i){ var r = el.getBoundingClientRect(); el.classList.toggle('is-on', reduced || r.top + r.height * .3 < vh * .62); });
}
window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive:true });
window.addEventListener('resize', onScroll);
stackMQ.addEventListener('change', function(){ applyStack(); onScroll(); });
applyStack(); onScroll();

/* ---------- магнитные кнопки (только мышь) ---------- */
if (fine && !reduced) $$('.magnet').forEach(function(b){
  b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px)'; });
  b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
});
})();

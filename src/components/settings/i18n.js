import { useCallback } from "react";
import { useSelector } from "react-redux";

import { settingsOf } from "../../store/uiSlice";

// Scoped i18n: this covers the settings surface only. The rest of the app ships
// a RU/EN mix of hardcoded copy, so the language switch is honestly presented as
// affecting settings (and the <html lang> attribute), not the whole messenger.
const STRINGS = {
  ru: {
    "app.title": "Настройки",
    "app.close": "Закрыть",
    "app.back": "Назад",
    "app.done": "Готово",
    "app.cancel": "Отмена",
    "app.on": "Вкл.",
    "app.off": "Выкл.",

    "root.editProfile": "Изменить профиль",
    "root.premium": "Premium",
    "root.appearance": "Оформление",
    "root.notifications": "Уведомления и звуки",
    "root.privacy": "Приватность и безопасность",
    "root.language": "Язык",
    "root.storage": "Данные и хранилище",
    "root.devices": "Устройства",
    "root.logout": "Выйти",
    "root.logoutHint": "Завершить сеанс на этом устройстве",
    "root.premiumActive": "Активен",
    "root.premiumOff": "Демо-тарифы",
    "root.version": "Мессенджер · демо-сборка",

    "profile.phone": "Телефон не указан",
    "profile.noUsername": "Имя пользователя не задано",

    "appearance.theme": "Тема",
    "appearance.nightMode": "Ночной режим",
    "appearance.nightModeHint": "Тёмная «фиолетовая» тема — фирменный вид",
    "appearance.textSize": "Размер текста сообщений",
    "appearance.textSizeHint": "Применяется к пузырям чата и полю ввода",
    "appearance.sample": "Как тебе такой размер?",
    "appearance.sampleReply": "Отлично читается!",
    "appearance.wallpaper": "Обои чата",
    "appearance.wallpaperHint": "Фон за сообщениями. Подстраивается под тему и акцент",
    "appearance.accent": "Акцент интерфейса",
    "appearance.accentHint": "Цвет иконок, ссылок и активных элементов",
    "appearance.density": "Плотность списка чатов",
    "appearance.densityHint": "Высота строк в списке слева",
    "appearance.reset": "Сбросить оформление",

    "notif.chats": "Уведомления",
    "notif.private": "Личные чаты",
    "notif.groups": "Группы",
    "notif.channels": "Каналы",
    "notif.sound": "Звук и вид",
    "notif.inAppSounds": "Звуки в приложении",
    "notif.inAppSoundsHint": "Короткий сигнал, синтезируется через Web Audio",
    "notif.preview": "Предпросмотр текста",
    "notif.previewHint": "Показывать текст сообщения, а не только отправителя",
    "notif.test": "Проверить звук",
    "notif.testHint": "Воспроизводит тот же сигнал",
    "notif.testOff": "Включите «Звуки в приложении», чтобы проверить",
    "notif.honest":
      "Кнопка проверки звука работает по-настоящему. Автоматический сигнал на входящее сообщение ещё не подключён — для этого нужен доступ к сокет-хабу. Остальные переключатели сохраняются локально.",

    "privacy.lastSeen": "Последняя активность",
    "privacy.calls": "Кто может звонить",
    "privacy.groupAdd": "Кто может добавлять в группы",
    "privacy.blocked": "Заблокированные",
    "privacy.blockedEmpty": "Список пуст",
    "privacy.blockedAdd": "Заблокировать контакт",
    "privacy.unblock": "Разблокировать",
    "privacy.blockedCount": "Заблокировано",
    "privacy.everybody": "Все",
    "privacy.contacts": "Мои контакты",
    "privacy.nobody": "Никто",
    "privacy.honest":
      "Внимание: это локальные настройки. Сервер их пока не применяет — он не проверяет эти правила и продолжит показывать вашу активность и принимать звонки. Считайте это заготовкой интерфейса, а не защитой.",
    "privacy.blockedHonest":
      "Блокировка хранится только в этом браузере и никого реально не ограничивает.",

    "lang.title": "Язык",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.honest":
      "Переключатель переводит экран настроек и меняет атрибут lang у страницы. Остальные экраны мессенджера пока используют смешанную русско-английскую вёрстку без i18n.",

    "storage.usage": "Использование хранилища",
    "storage.total": "Всего в localStorage",
    "storage.avatars": "Локальные фото контактов",
    "storage.calls": "Журнал звонков",
    "storage.groups": "Группы и каналы",
    "storage.other": "Прочие данные",
    "storage.clear": "Очистить кэш",
    "storage.clearHint": "Удалит локальные фото контактов и журнал звонков",
    "storage.clearConfirm": "Точно очистить?",
    "storage.clearYes": "Да, очистить",
    "storage.cleared": "Освобождено",
    "storage.nothing": "Нечего очищать",
    "storage.autoDownload": "Автозагрузка медиа",
    "storage.photos": "Фото",
    "storage.voice": "Голосовые",
    "storage.video": "Видео",
    "storage.files": "Файлы",
    "storage.autoHonest":
      "Вложения сейчас всегда приходят вместе с сообщением, поэтому эти переключатели пока только сохраняются — отложенной загрузки в протоколе нет.",
    "storage.cacheHonest":
      "Очистка затрагивает реальные данные: локальные аватары контактов и журнал звонков в localStorage. Сообщения и профиль хранятся на сервере и не удаляются.",

    "premium.title": "Premium",
    "premium.active": "Premium активен",
    "premium.until": "Действует до",
    "premium.plan": "Тариф",
    "premium.inactive": "Premium не подключён",
    "premium.choose": "Выберите тариф",
    "premium.buy": "Подключить",
    "premium.extend": "Продлить",
    "premium.busy": "Обработка…",
    "premium.loading": "Загрузка тарифов…",
    "premium.empty": "Сервер не вернул тарифы",
    "premium.error": "Не удалось подключить",
    "premium.demo":
      "Демонстрация: реальной оплаты нет. Платёжный провайдер не подключён, деньги не списываются — кнопка просто включает флаг premium в вашем профиле на сервере.",
    "premium.perks": "Что входит",
    "premium.perk1": "Значок Premium рядом с именем",
    "premium.perk2": "Расширенные лимиты профиля",
    "premium.perk3": "Поддержка проекта",

    "devices.current": "Это устройство",
    "devices.browser": "Браузер",
    "devices.os": "Система",
    "devices.screen": "Экран",
    "devices.session": "Сеанс активен",
    "devices.terminate": "Завершить сеанс",
    "devices.honest":
      "Показаны данные текущего браузера. Список других активных сеансов недоступен: сервер хранит токены, но не отдаёт их список — управлять чужими устройствами отсюда нельзя.",
  },
  en: {
    "app.title": "Settings",
    "app.close": "Close",
    "app.back": "Back",
    "app.done": "Done",
    "app.cancel": "Cancel",
    "app.on": "On",
    "app.off": "Off",

    "root.editProfile": "Edit profile",
    "root.premium": "Premium",
    "root.appearance": "Appearance",
    "root.notifications": "Notifications and sounds",
    "root.privacy": "Privacy and security",
    "root.language": "Language",
    "root.storage": "Data and storage",
    "root.devices": "Devices",
    "root.logout": "Log out",
    "root.logoutHint": "End the session on this device",
    "root.premiumActive": "Active",
    "root.premiumOff": "Demo plans",
    "root.version": "Messenger · demo build",

    "profile.phone": "No phone number",
    "profile.noUsername": "No username set",

    "appearance.theme": "Theme",
    "appearance.nightMode": "Night mode",
    "appearance.nightModeHint": "The dark purple theme is the signature look",
    "appearance.textSize": "Message text size",
    "appearance.textSizeHint": "Applies to chat bubbles and the composer",
    "appearance.sample": "How does this size feel?",
    "appearance.sampleReply": "Very readable!",
    "appearance.wallpaper": "Chat wallpaper",
    "appearance.wallpaperHint": "Background behind messages. Follows theme and accent",
    "appearance.accent": "Interface accent",
    "appearance.accentHint": "Colour of icons, links and active elements",
    "appearance.density": "Chat list density",
    "appearance.densityHint": "Row height in the list on the left",
    "appearance.reset": "Reset appearance",

    "notif.chats": "Notifications",
    "notif.private": "Private chats",
    "notif.groups": "Groups",
    "notif.channels": "Channels",
    "notif.sound": "Sound and preview",
    "notif.inAppSounds": "In-app sounds",
    "notif.inAppSoundsHint": "A short tone synthesised via Web Audio",
    "notif.preview": "Message preview",
    "notif.previewHint": "Show message text, not just the sender",
    "notif.test": "Test sound",
    "notif.testHint": "Plays the very same tone",
    "notif.testOff": "Turn on in-app sounds to test",
    "notif.honest":
      "The test button really works. An automatic tone on an incoming message is not wired up yet — that needs access to the socket hub. The other switches are stored locally.",

    "privacy.lastSeen": "Last seen",
    "privacy.calls": "Who can call me",
    "privacy.groupAdd": "Who can add me to groups",
    "privacy.blocked": "Blocked users",
    "privacy.blockedEmpty": "The list is empty",
    "privacy.blockedAdd": "Block a contact",
    "privacy.unblock": "Unblock",
    "privacy.blockedCount": "Blocked",
    "privacy.everybody": "Everybody",
    "privacy.contacts": "My contacts",
    "privacy.nobody": "Nobody",
    "privacy.honest":
      "Heads up: these are local settings. The server does not enforce them yet — it will keep sharing your activity and accepting calls. Treat this as UI groundwork, not protection.",
    "privacy.blockedHonest":
      "Blocks live in this browser only and do not actually restrict anyone.",

    "lang.title": "Language",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.honest":
      "This switch translates the settings screen and sets the page lang attribute. The rest of the messenger still uses mixed Russian/English copy with no i18n layer.",

    "storage.usage": "Storage usage",
    "storage.total": "Total in localStorage",
    "storage.avatars": "Local contact photos",
    "storage.calls": "Call log",
    "storage.groups": "Groups and channels",
    "storage.other": "Other data",
    "storage.clear": "Clear cache",
    "storage.clearHint": "Removes local contact photos and the call log",
    "storage.clearConfirm": "Clear for sure?",
    "storage.clearYes": "Yes, clear",
    "storage.cleared": "Freed",
    "storage.nothing": "Nothing to clear",
    "storage.autoDownload": "Media auto-download",
    "storage.photos": "Photos",
    "storage.voice": "Voice messages",
    "storage.video": "Video",
    "storage.files": "Files",
    "storage.autoHonest":
      "Attachments always arrive with the message today, so these switches are stored only — the protocol has no deferred download.",
    "storage.cacheHonest":
      "Clearing touches real data: local contact avatars and the call log in localStorage. Messages and your profile live on the server and are not deleted.",

    "premium.title": "Premium",
    "premium.active": "Premium is active",
    "premium.until": "Valid until",
    "premium.plan": "Plan",
    "premium.inactive": "Premium is not enabled",
    "premium.choose": "Choose a plan",
    "premium.buy": "Get Premium",
    "premium.extend": "Extend",
    "premium.busy": "Processing…",
    "premium.loading": "Loading plans…",
    "premium.empty": "The server returned no plans",
    "premium.error": "Could not enable",
    "premium.demo":
      "Demo: there is no real payment. No provider is connected and no money moves — the button just flips the premium flag on your server-side profile.",
    "premium.perks": "What you get",
    "premium.perk1": "A Premium badge next to your name",
    "premium.perk2": "Extended profile limits",
    "premium.perk3": "Supporting the project",

    "devices.current": "This device",
    "devices.browser": "Browser",
    "devices.os": "System",
    "devices.screen": "Screen",
    "devices.session": "Session active",
    "devices.terminate": "End session",
    "devices.honest":
      "This shows the current browser only. A list of other active sessions is unavailable: the server stores tokens but never exposes them — you cannot manage other devices from here.",
  },
};

export const t = (lang, key) => STRINGS[lang]?.[key] ?? STRINGS.ru[key] ?? key;

export function useT() {
  const lang = useSelector((s) => settingsOf(s.ui).language);
  const translate = useCallback((key) => t(lang, key), [lang]);
  return [translate, lang];
}

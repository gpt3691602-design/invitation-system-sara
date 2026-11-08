# מערכת הזמנות לאירועים

מערכת לעסק אחד: יצירת דפי הזמנה דיגיטליים לאירועים, הפצה ידנית של קישור אחד לכל אירוע, הרשמה עצמית של המוזמנים, מעקב ותזכורות.
האפיון ותכנית העבודה: [docs/work-plan.md](docs/work-plan.md).

## סטטוס

| שלב | תיאור | מצב |
|---|---|---|
| 0 | תשתית: Next.js, Supabase, שתי שפות, פריסה ל-Vercel | ✅ |
| 1 | כניסת עובדים וניהול אירועים | ✅ |
| 2 | דף הזמנה ציבורי והרשמה | ⏳ |
| 3 | ניהול נרשמים | ⏳ |
| 4 | תזכורות אוטומטיות | ⏳ |
| 5 | השלמת תבניות ושיפורי UX | ⏳ |
| 6 | סידור שולחנות | ⏳ |

## טכנולוגיה

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4. התכנית כתבה Next.js 15; גרסה 16 היא הגרסה היציבה הנוכחית.
- Supabase: Postgres, Auth, Storage. פרויקט: `kedyaookuyxvdpxzntay` (אזור eu-central-1).
- next-intl: עברית (ברירת מחדל, RTL) ואנגלית. השפה נשמרת בעוגייה ולא בכתובת, כך שלכל אירוע יש קישור אחד.
- Vercel לאירוח.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ומלאו את הערכים
npm run dev
```

האתר עולה ב-http://localhost:3000. בדיקת חיבור: http://localhost:3000/api/health

## משתני סביבה

| משתנה | מאיפה | הערה |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API Keys | נחשף לדפדפן, מוגן ע"י RLS |
| `SUPABASE_SECRET_KEY` | Supabase > Project Settings > API Keys | **שרת בלבד**. נדרש משלב 2 |

## מסד נתונים

קבצי השינוי נמצאים ב-`supabase/migrations/` ורצים לפי הסדר.

- `events`: אירועים. `registrations`: נרשמים, עם מניעת כפילות לפי `(event_id, phone)`.
- `staff`: רשימת העובדים המורשים. **כל הטבלאות פתוחות רק למשתמש שמופיע ב-`staff`**, ולא לכל משתמש מחובר. הסיבה: ב-Supabase כל אחד יכול לפתוח חשבון כברירת מחדל, ובלי הרשימה הזו הוא היה רואה את מספרי הטלפון של כל המוזמנים.
- למוזמנים אין גישה ישירה למסד. ההרשמה הציבורית עוברת דרך השרת (שלב 2).

### Storage

דלי `event-media` (ציבורי לקריאה, עד 10MB, JPG/PNG/WebP/GIF). רק עובדים יכולים להעלות, להחליף ולמחוק.

### הוספת עובד

1. ב-Supabase: Authentication > Users > Add user. הזינו אימייל וסיסמה וסמנו Auto Confirm.
2. ב-SQL Editor:

```sql
select public.add_staff('person@example.com', 'שם לתצוגה');
```

## ניהול אירועים (שלב 1)

- `/login`: כניסת עובדים (אימייל וסיסמה). `/admin` מוגן: מי שלא מחובר מועבר לכניסה, ומשתמש מחובר שאינו עובד מועבר ל-`/no-access`.
- יצירה ועריכה של אירוע: פרטים, תאריך לפי שעון ישראל, בחירת תבנית מתוך 10, העלאת תמונה או GIF, וכתובת עם כפתור "מציאת מיקום".
- "מציאת מיקום" משתמש ב-OpenStreetMap Nominatim (חינמי, בלי מפתח). המדיניות שלו מגבילה לבקשה אחת בשנייה, וזה מספיק לעסק אחד.
- לכל אירוע נוצר קישור קבוע בן 8 תווים (`/e/xxxxxxxx`) עם כפתור העתקה. הקישור לא משתנה בעריכה, כדי שקישורים שכבר הופצו ימשיכו לעבוד.

## פקודות

```bash
npm run dev     # פיתוח
npm run build   # בנייה
npm run start   # הרצת גרסת production
npm run lint    # ESLint
```

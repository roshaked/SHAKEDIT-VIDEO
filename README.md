# SHAKEDIT Cyber Video Site

אתר סטטי בעברית למותג SHAKEDIT להצגת עבודות וידאו בסגנון Cyber/Futuristic. מתאים לפרסום ישיר ב-GitHub Pages.

## קבצים

- `index.html` - מבנה הדף והתוכן.
- `styles.css` - כל העיצוב הוויזואלי.
- `app.js` - תפריט מובייל, סינון עבודות ומודל נגן וידאו.
- `assets/shakedit-logo.png` - לוגו המותג.
- `assets/hero-cyber-studio.png` - רקע Hero מקורי שנוצר עבור האתר.
- `assets/profile.png` - התמונה האישית באזור "עליי".
- `assets/profile-placeholder.svg` - תמונת דמה חלופית לאזור "עליי".

## עדכון תמונה אישית

אפשר להחליף את התמונה האישית בתמונה אחרת:

1. הוסיפו תמונה לתיקייה `assets`, למשל `profile.jpg`.
2. בקובץ `index.html`, החליפו:

```html
src="assets/profile.png"
```

ב:

```html
src="assets/profile.jpg"
```

## עדכון קישורי YouTube

באזור `youtube` בקובץ `index.html` יש כרגע 9 קישורי YouTube. כל כרטיס משתמש גם בתמונה ממוזערת אוטומטית:

```html
https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
```

כדי להחליף סרטון, עדכנו גם את כתובת ה-`href` וגם את מזהה הסרטון בתוך כתובת התמונה.

## החלפת סרטונים בגלריה

בתוך `index.html`, לכל כרטיס וידאו יש מאפיין `data-video`.

לדוגמה:

```html
data-video="videos/my-video.mp4"
```

אפשר ליצור תיקיית `videos`, להכניס אליה קבצי MP4, ולעדכן את הנתיבים בכרטיסים.

## טופס יצירת קשר

כרגע הטופס מוגדר כמקום שמור ולא שולח נתונים. כשיהיו פרטי קשר, אפשר לבחור אחת משתי אפשרויות:

1. לחבר את הטופס ל-Formspree או שירות דומה.
2. להחליף את הטופס בכפתור WhatsApp ישיר.

כדי לחבר Formspree, החליפו את:

```html
action="#"
```

בכתובת האמיתית של הטופס, והסירו את `disabled` מהשדות ומהכפתור.

## רשתות חברתיות

בפוטר יש כרגע מקומות שמורים ל-Instagram, YouTube ו-TikTok. כשיהיו קישורים, החליפו את תגיות ה-`span` בתגיות `a` עם הקישור המתאים.

## פרסום ב-GitHub Pages

1. העלו את כל תוכן התיקייה הזו לריפוזיטורי GitHub.
2. היכנסו ל-Settings ואז Pages.
3. בחרו Deploy from a branch.
4. בחרו את הענף `main` ואת התיקייה `/root`.
5. שמרו, והאתר יפורסם אחרי כדקה.

## אתר תרגול למבחן

אתר התרגול במבוא לשיווק ופרסום נמצא בתיקייה `marketing-practice`.
לאחר הפעלת GitHub Pages, ניתן להגיע אליו דרך:

```text
https://ROSHAKED.github.io/SHAKEDIT-VIDEO/marketing-practice/
```

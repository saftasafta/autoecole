# دليل رفع التطبيق على الإنترنت (Cloud) خطوة بخطوة 🚀

بما أنك ليس لديك خبرة، اتبع هذه المراحل البسيطة جداً. سنستخدم أدوات مجانية.

## المرحلة 1: وضع الكود على GitHub (مستودع الكود)

GitHub هو المكان الذي سنضع فيه نسخة من تطبيقك ليراها السيرفر.

1. اذهب إلى [GitHub.com](https://github.com) وأنشئ حساباً جديداً.
2. قم بتحميل برنامج [GitHub Desktop](https://desktop.github.com) وثبته على حاسوبك.
3. افتح البرنامج وسجل الدخول بحسابك.
4. اختر **"Add Existing Repository"** ثم اختر المجلد الموجود فيه التطبيق الآن (`autoecole`).
5. اضغط على **"Publish Repository"** (تأكد من إلغاء اختيار "Keep this code private" إذا كنت تريد الرفع المجاني السهل).

## المرحلة 2: إنشاء حساب على Render (السيرفر السحابي)

Render هو المكان الذي سيعمل فيه التطبيق فعلياً.

1. اذهب إلى [Render.com](https://render.com) وأنشئ حساباً باستخدام حساب GitHub الخاص بك.
2. ستجد زر **"New +"**، اضغط عليه واختر **"Web Service"**.

## المرحلة 3: تشغيل السيرفر الخلفي (Backend)

1. في Render، اختر المستودع الخاص بك (autoecole) الذي رفعته على GitHub.
2. الإعدادات المطلوبة:
   - **Name**: `autoecole-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
3. اضغط على **"Advanced"** ثم **"Add Environment Variable"**:
   - أضف `JWT_SECRET` واكتب أي كلمة سر طويلة من اختيارك.
4. اضغط على **"Create Web Service"**. انتظر حتى تظهر كلمة "Live".
5. **هام جداً**: انسخ الرابط الذي سيظهر لك (مثلاً: `https://autoecole-api.onrender.com`).

## المرحلة 4: تشغيل واجهة التطبيق (Frontend)

1. ارجع إلى صفحة Render الرئيسية، اضغط **"New +"** ثم اختر **"Static Site"**.
2. اختر نفس المستودع (autoecole).
3. الإعدادات المطلوبة:
   - **Name**: `autoecole-app`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. اضغط على **"Advanced"** ثم **"Add Environment Variable"**:
   - أضف `VITE_API_URL` واكتب الرابط الذي نسخته في "المرحلة 3".
5. اضغط على **"Create Static Site"**.

---

### مبروك! 🎉

الآن لديك رابط خاص بتطبيقك (مثلاً: `https://autoecole-app.onrender.com`).

- افتحه من حاسوبك وقم بتثبيته كـ PWA.
- افتحه من هاتفك وقم بإضافته للشاشة الرئيسية.
- كل البيانات التي ستدخلها من الهاتف ستظهر فوراً في الحاسوب والعكس صحيح!

**ملاحظة تقنية**: بما أننا نستخدم النسخة المجانية، البيانات (السيارات، الطلاب) قد تُحذف إذا توقف السيرفر عن العمل لفترة طويلة. إذا نجحت هذه الخطوات وأردت تثبيت البيانات للأبد، سأشرح لك كيف تربط قاعدة بيانات سحابية دائمة (مثل Supabase).

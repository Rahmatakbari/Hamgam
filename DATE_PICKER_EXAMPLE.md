# Persian/Jalali Material Date Picker

## نحوه استفاده

```javascript
// باز کردن Date Picker
jalaliDatePicker(currentDate, function(selectedDate) {
  // selectedDate یک Date object است (Gregorian)
  console.log('تاریخ انتخاب شده:', selectedDate);
  console.log('تاریخ شمسی:', faDate(selectedDate));
});
```

## مثال‌ها

### ۱. باز کردن Date Picker با تاریخ امروز
```javascript
jalaliDatePicker(new Date(), function(selectedDate) {
  console.log('تاریخ:', faDate(selectedDate));
});
```

### ۲. باز کردن Date Picker با تاریخ خاص
```javascript
var myDate = new Date('2024-08-10');
jalaliDatePicker(myDate, function(selectedDate) {
  console.log('تاریخ:', faDate(selectedDate));
});
```

### ۳. استفاده در فرم
```javascript
// در HTML
<input type="text" id="dateInput" readonly onclick="openDatePicker()">

// در JavaScript
function openDatePicker() {
  var currentDate = $('#dateInput').value ? new Date($('#dateInput').value) : new Date();
  jalaliDatePicker(currentDate, function(selectedDate) {
    $('#dateInput').value = selectedDate.toISOString().split('T')[0];
  });
}
```

## ویژگی‌ها

- ✅ تقویم شمسی (Jalali/Shamsi)
- ✅ ماه‌های افغانستان (حمل، ثور، جوزا، ...)
- ✅ فرمت تاریخ: YYYY/MM/DD
- ✅ RTL کامل
- ✅ Material Design
- ✅ انتخاب سریع سال و ماه
- ✅ نمایش روز جاری
- ✅ دکمه‌های تأیید و لغو
- ✅ مناسب موبایل
- ✅ بدون کتابخانه خارجی

## ساختار UI

```
┌─────────────────────────────────────┐
│       ۱۴۰۵/۰۵/۲۰                    │
│       ۲۰ / ۰۵ / ۱۴۰۵               │
│       ۰۵ — اسد                     │
├─────────────────────────────────────┤
│  [←]      ۰۵ / ۱۴۰۵       [→]     │
├─────────────────────────────────────┤
│  ش  ی  د  س  چ  پ  ج               │
│                       ۱  ۲  ۳  ۴   │
│  ۵  ۶  ۷  ۸  ۹  ۱۰  ۱۱            │
│  ۱۲ ۱۳ ۱۴ ۱۵ ۱۶ ۱۷ ۱۸            │
│  ۱۹ ۲۰ ۲۱ ۲۲ ۲۳ ۲۴ ۲۵            │
│  ۲۶ ۲۷ ۲۸ ۲۹ ۳۰ ۳۱               │
├─────────────────────────────────────┤
│  [لغو]                    [تأیید]  │
└─────────────────────────────────────┘
```

## توابع کمکی

### toJalali(date)
تبدیل Date object به تاریخ شمسی

```javascript
var jalali = toJalali(new Date());
console.log(jalali); // { jy: 1405, jm: 5, jd: 20, dow: 6 }
```

### toGregorian(jy, jm, jd)
تبدیل تاریخ شمسی به Date object

```javascript
var date = toGregorian(1405, 5, 20);
console.log(date); // Date object
```

### jalaliMonthLength(jy, jm)
محاسبه تعداد روزهای ماه

```javascript
var days = jalaliMonthLength(1405, 5);
console.log(days); // 31
```

### jalaliLeap(jy)
بررسی سال کبیسه

```javascript
var isLeap = jalaliLeap(1405);
console.log(isLeap); // false
```

### faDate(date)
تبدیل Date object به فرمت YYYY/MM/DD

```javascript
var dateStr = faDate(new Date());
console.log(dateStr); // "۱۴۰۵/۵/۲۰"
```

### faDateLong(date)
تبدیل Date object به فرمت کامل

```javascript
var dateStr = faDateLong(new Date());
console.log(dateStr); // "شنبه، ۱۴۰۵/۵/۲۰"
```

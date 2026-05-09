/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { DateTimePicker } from "@web/core/datetime/datetime_picker";
import { localization } from "@web/core/l10n/localization";

const { DateTime } = luxon;

// Persian month names
const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

function isPersianLocale() {
    const loc = localization.locale || '';
    return loc.startsWith('fa');
}

function gregToPersian(year, month, day) {
    if (typeof farvardin !== 'undefined' && farvardin.gregorianToSolar) {
        return farvardin.gregorianToSolar(year, month, day);
    }
    return [year, month, day];
}

// ============================================
// Save original getter BEFORE patching
// ============================================
const originalDescriptor = Object.getOwnPropertyDescriptor(DateTimePicker.prototype, 'activePrecisionLevel');
const originalGetter = originalDescriptor && originalDescriptor.get;

// ============================================
// Patch activePrecisionLevel to show Persian titles
// ============================================
patch(DateTimePicker.prototype, {
    get activePrecisionLevel() {
        // Call original getter first
        if (!originalGetter) {
            return undefined;
        }
        
        const original = originalGetter.call(this);
        
        // Only modify if Persian locale and we have a result
        if (!isPersianLocale() || !original) {
            return original;
        }
        
        const precision = this.state ? this.state.precision : null;
        
        if (precision === "days") {
            return {
                ...original,
                getTitle: (date) => {
                    if (!date) date = DateTime.now();
                    const [jy, jm] = gregToPersian(date.year, date.month, date.day);
                    return [`${PERSIAN_MONTHS[jm - 1]} ${jy}`];
                },
            };
        }
        
        if (precision === "months") {
            return {
                ...original,
                getTitle: (date) => {
                    if (!date) date = DateTime.now();
                    const [jy] = gregToPersian(date.year, date.month, date.day);
                    return String(jy);
                },
            };
        }
        
        if (precision === "years") {
            return {
                ...original,
                getTitle: (date) => {
                    if (!date) date = DateTime.now();
                    const [jy] = gregToPersian(date.year, date.month, date.day);
                    const startDecade = Math.floor(jy / 10) * 10;
                    return `${startDecade} - ${startDecade + 9}`;
                },
            };
        }
        
        if (precision === "decades") {
            return {
                ...original,
                getTitle: (date) => {
                    if (!date) date = DateTime.now();
                    const [jy] = gregToPersian(date.year, date.month, date.day);
                    const startCentury = Math.floor(jy / 100) * 100;
                    return `${startCentury} - ${startCentury + 99}`;
                },
            };
        }
        
        return original;
    },
});

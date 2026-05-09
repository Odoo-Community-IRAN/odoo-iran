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

// Persian weekday names starting from Saturday
const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const PERSIAN_WEEKDAYS_LONG = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

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

// ============================================================
// Patch DateTimePicker to show Persian labels in the picker
// ============================================================

patch(DateTimePicker.prototype, {
    /**
     * Override to show Persian month/year title
     */
    get activePrecisionLevel() {
        const precision = this.state.precision;
        const self = this;
        
        // Get original precision level
        const _super = DateTimePicker.prototype.activePrecisionLevel;
        let original;
        try {
            // Try to get the original getter's value
            const descriptor = Object.getOwnPropertyDescriptor(DateTimePicker.prototype, 'activePrecisionLevel');
            if (descriptor && descriptor.get) {
                original = descriptor.get.call(this);
            }
        } catch (e) {
            // Fallback: the original getter might have been patched already
            return null;
        }
        
        if (!original || !isPersianLocale()) {
            return original;
        }
        
        // Only modify days precision (month grid view)
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
        
        // For months precision (month selector)
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
        
        // For years/decades precision
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

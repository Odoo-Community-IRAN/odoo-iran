/** @odoo-module **/

import { registry } from "@web/core/registry";
import { DateTimeField } from "@web/views/fields/datetime/datetime_field";
import { formatDate, formatDateTime, parseDate, parseDateTime } from "@web/core/l10n/dates";
import { localization } from "@web/core/l10n/localization";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { usePopover } from "@web/core/popover/popover_hook";

const { Component, xml, css, useState, onWillStart, onMounted, onPatched } = owl;

// Persian month names
const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

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

function persianToGreg(year, month, day) {
    if (typeof farvardin !== 'undefined' && farvardin.solarToGregorian) {
        return farvardin.solarToGregorian(year, month, day);
    }
    return [year, month, day];
}

function persianMonthDays(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    const leapRem = year % 33;
    const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(leapRem);
    return isLeap ? 30 : 29;
}

function getPersianWeekday(gregYear, gregMonth, gregDay) {
    const dt = luxon.DateTime.local(gregYear, gregMonth, gregDay);
    const mapping = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0, 7: 1 };
    return mapping[dt.weekday];
}

// ============================================
// Jalali Calendar Picker Component
// ============================================
class JalaliDatePicker extends Component {
    setup() {
        this.state = useState({
            year: 1404,
            month: 1,
            selectedDay: null,
            showMonthSelector: false,
        });
        
        // Initialize from props
        if (this.props.value) {
            const [jy, jm, jd] = gregToPersian(
                this.props.value.year,
                this.props.value.month,
                this.props.value.day
            );
            this.state.year = jy;
            this.state.month = jm;
            this.state.selectedDay = jd;
        } else {
            // Default to today
            const now = luxon.DateTime.now();
            const [jy, jm, jd] = gregToPersian(now.year, now.month, now.day);
            this.state.year = jy;
            this.state.month = jm;
            this.state.selectedDay = null;
        }
    }
    
    get days() {
        const year = this.state.year;
        const month = this.state.month;
        const [gy, gm, gd] = persianToGreg(year, month, 1);
        const firstDayWeekday = getPersianWeekday(gy, gm, gd);
        const daysInMonth = persianMonthDays(year, month);
        
        // Previous month
        let prevYear = year, prevMonth = month - 1;
        if (prevMonth < 1) { prevMonth = 12; prevYear--; }
        const prevDays = persianMonthDays(prevYear, prevMonth);
        
        // Today's Persian date
        const now = luxon.DateTime.now();
        const [todayJy, todayJm, todayJd] = gregToPersian(now.year, now.month, now.day);
        
        const result = [];
        let dayCounter = 1 - firstDayWeekday;
        
        for (let i = 0; i < 42; i++) {
            let isCurrentMonth = true;
            let displayDay = dayCounter;
            let pYear = year, pMonth = month;
            
            if (dayCounter < 1) {
                isCurrentMonth = false;
                displayDay = prevDays + dayCounter;
                pYear = prevYear; pMonth = prevMonth;
            } else if (dayCounter > daysInMonth) {
                isCurrentMonth = false;
                displayDay = dayCounter - daysInMonth;
                pYear = year; pMonth = month + 1;
                if (pMonth > 12) { pMonth = 1; pYear++; }
            }
            
            const isToday = isCurrentMonth && todayJy === year && todayJm === month && todayJd === dayCounter;
            const isSelected = isCurrentMonth && this.state.selectedDay === dayCounter;
            
            result.push({
                id: i,
                persianDay: displayDay,
                isCurrentMonth: isCurrentMonth,
                isToday: isToday,
                isSelected: isSelected,
                pYear: pYear,
                pMonth: pMonth,
                pDay: displayDay,
            });
            
            dayCounter++;
        }
        
        return result;
    }
    
    get monthName() {
        return PERSIAN_MONTHS[this.state.month - 1];
    }
    
    selectDay(day) {
        if (!day.isCurrentMonth) {
            // Navigate to that month
            this.state.year = day.pYear;
            this.state.month = day.pMonth;
            this.state.selectedDay = day.pDay;
            return;
        }
        
        this.state.selectedDay = day.persianDay;
        
        // Convert to Gregorian and notify parent
        const [gy, gm, gd] = persianToGreg(this.state.year, this.state.month, day.persianDay);
        const gregDate = luxon.DateTime.local(gy, gm, gd);
        this.props.onSelect(gregDate);
    }
    
    prevMonth() {
        if (this.state.month > 1) {
            this.state.month--;
        } else {
            this.state.month = 12;
            this.state.year--;
        }
    }
    
    nextMonth() {
        if (this.state.month < 12) {
            this.state.month++;
        } else {
            this.state.month = 1;
            this.state.year++;
        }
    }
    
    toggleMonthSelector() {
        this.state.showMonthSelector = !this.state.showMonthSelector;
    }
    
    selectMonth(month) {
        this.state.month = month;
        this.state.showMonthSelector = false;
    }
    
    selectToday() {
        const now = luxon.DateTime.now();
        const [jy, jm, jd] = gregToPersian(now.year, now.month, now.day);
        this.state.year = jy;
        this.state.month = jm;
        this.state.selectedDay = jd;
        this.props.onSelect(now);
    }
    
    clearDate() {
        this.props.onSelect(null);
    }
    
    get persianMonths() {
        return PERSIAN_MONTHS.map((name, index) => ({ name, index }));
    }
}

JalaliDatePicker.template = xml`
    <div class="o_jalali_picker position-relative">
        <!-- Header -->
        <div class="o_jalali_header d-flex justify-content-between align-items-center p-2 border-bottom">
            <button class="btn btn-sm btn-light" t-on-click="prevMonth">
                <i class="fa fa-chevron-right"/>
            </button>
            <div class="o_jalali_title fw-bold" t-on-click="toggleMonthSelector">
                <t t-out="monthName"/> <t t-out="state.year"/>
            </div>
            <button class="btn btn-sm btn-light" t-on-click="nextMonth">
                <i class="fa fa-chevron-left"/>
            </button>
        </div>
        
        <!-- Weekday Headers -->
        <div class="d-grid o_jalali_weekdays" style="grid-template-columns: repeat(7, 1fr);">
            <t t-foreach="['ش','ی','د','س','چ','پ','ج']" t-as="day" t-key="day_index">
                <div class="text-center py-1 small text-muted fw-bold border-bottom" t-out="day"/>
            </t>
        </div>
        
        <!-- Days Grid -->
        <div class="d-grid o_jalali_days" style="grid-template-columns: repeat(7, 1fr);">
            <t t-foreach="days" t-as="day" t-key="day.id">
                <div 
                    class="o_jalali_day text-center py-1"
                    t-att-class="{
                        'o_jalali_other_month text-muted': !day.isCurrentMonth,
                        'o_jalali_selected bg-primary text-white rounded': day.isSelected,
                        'o_jalali_today bg-info bg-opacity-25 rounded': day.isToday and !day.isSelected,
                        'cursor-pointer': day.isCurrentMonth,
                    }"
                    t-on-click="() => selectDay(day)"
                    t-out="day.persianDay"
                />
            </t>
        </div>
        
        <!-- Month Selector Overlay -->
        <div t-if="state.showMonthSelector" class="o_jalali_month_selector position-absolute top-0 start-0 w-100 h-100 bg-white d-grid p-2" style="grid-template-columns: repeat(3, 1fr); gap: 4px; z-index: 10;">
            <t t-foreach="persianMonths" t-as="month" t-key="month.index">
                <button 
                    class="btn btn-sm"
                    t-att-class="{'btn-primary': month.index + 1 === state.month, 'btn-outline-primary': month.index + 1 !== state.month}"
                    t-on-click="() => selectMonth(month.index + 1)"
                    t-out="month.name"
                />
            </t>
        </div>
        
        <!-- Footer -->
        <div class="o_jalali_footer d-flex justify-content-between p-2 border-top mt-1">
            <button class="btn btn-sm btn-link" t-on-click="selectToday">امروز</button>
            <button class="btn btn-sm btn-link text-danger" t-on-click="clearDate">پاک کردن</button>
        </div>
    </div>
`;

// ============================================
// Jalali Date Field Widget
// ============================================
class JalaliDateField extends DateTimeField {
    setup() {
        super.setup();
        
        if (!isPersianLocale()) {
            return; // Use default for non-Persian
        }
        
        this.state = useState({
            ...this.state,
            isOpen: false,
        });
        
        // Setup popover
        this.popover = usePopover(JalaliDatePicker, {
            position: "bottom",
            fixedPosition: false,
            onClose: () => { this.state.isOpen = false; },
        });
    }
    
    getFormattedValue(valueIndex) {
        if (!isPersianLocale()) {
            return super.getFormattedValue(valueIndex);
        }
        
        const value = this.values[valueIndex];
        if (!value) return "";
        
        const [jy, jm, jd] = gregToPersian(value.year, value.month, value.day);
        return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    }
    
    onDatePickerInputClick(ev) {
        if (!isPersianLocale()) {
            return super.onDatePickerInputClick(ev);
        }
        
        if (this.state.isOpen) {
            this.popover.close();
            this.state.isOpen = false;
            return;
        }
        
        this.state.isOpen = true;
        const value = this.values[0] || null;
        
        this.popover.open(ev.target, {
            value: value,
            onSelect: (date) => {
                this.state.isOpen = false;
                if (date) {
                    this.onDateTimeInputChange(0, date);
                } else {
                    // Clear value
                    this.props.record.update({ [this.props.name]: false });
                }
            },
        });
    }
    
    onDatePickerInputKeydown(ev) {
        if (!isPersianLocale()) {
            return super.onDatePickerInputKeydown(ev);
        }
        // Prevent default for space/enter to not open native picker
        if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            this.onDatePickerInputClick(ev);
        }
    }
}

// Only register for Persian locale
if (isPersianLocale()) {
    registry.category("fields").add("jalali_date", JalaliDateField);
}

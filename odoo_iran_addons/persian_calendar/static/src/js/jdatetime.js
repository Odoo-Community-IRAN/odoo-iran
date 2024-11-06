/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { DateTimePicker } from "@web/core/datetime/datetime_picker";
import { localization } from "@web/core/l10n/localization";
import { Component, onWillRender, onWillUpdateProps, useState } from "@odoo/owl";

import { markRaw, markup, toRaw } from "@odoo/owl";


import {
    MAX_VALID_DATE,
    MIN_VALID_DATE,
    clampDate,
    is24HourFormat,
    isInRange,
    isMeridiemFormat,
    today,
} from "@web/core/l10n/dates";

const { DateTime, Info } = luxon;


import { _t } from "@web/core/l10n/translation";



/**
 * @typedef DateItem
 * @property {string} id
 * @property {boolean} includesToday
 * @property {boolean} isOutOfRange
 * @property {boolean} isValid
 * @property {string} label
 * @property {DateRange} range
 * @property {string} extraClass
 *
 * @typedef {"today" | NullableDateTime} DateLimit
 *
 * @typedef {[DateTime, DateTime]} DateRange
 *
 * @typedef {luxon.DateTime} DateTime
 *
 * @typedef DateTimePickerProps
 * @property {number} [focusedDateIndex=0]
 * @property {boolean} [showWeekNumbers]
 * @property {DaysOfWeekFormat} [daysOfWeekFormat="short"]
 * @property {DateLimit} [maxDate]
 * @property {PrecisionLevel} [maxPrecision="decades"]
 * @property {DateLimit} [minDate]
 * @property {PrecisionLevel} [minPrecision="days"]
 * @property {(value: DateTime) => any} [onSelect]
 * @property {boolean} [range]
 * @property {number} [rounding=5] the rounding in minutes, pass 0 to show seconds, pass 1 to avoid
 *  rounding minutes without displaying seconds.
 * @property {{ buttons?: any }} [slots]
 * @property {"date" | "datetime"} [type]
 * @property {NullableDateTime | NullableDateRange} [value]
 * @property {(date: DateTime) => boolean} [isDateValid]
 * @property {(date: DateTime) => string} [dayCellClass]
 *
 * @typedef {DateItem | MonthItem} Item
 *
 * @typedef MonthItem
 * @property {[string, string][]} daysOfWeek
 * @property {string} id
 * @property {number} number
 * @property {WeekItem[]} weeks
 *
 * @typedef {import("@web/core/l10n/dates").NullableDateTime} NullableDateTime
 *
 * @typedef {import("@web/core/l10n/dates").NullableDateRange} NullableDateRange
 *
 * @typedef PrecisionInfo
 * @property {(date: DateTime, params: Partial<DateTimePickerProps>) => string} getTitle
 * @property {(date: DateTime, params: Partial<DateTimePickerProps>) => Item[]} getItems
 * @property {string} mainTitle
 * @property {string} nextTitle
 * @property {string} prevTitle
 * @property {Record<string, number>} step
 *
 * @typedef {"days" | "months" | "years" | "decades"} PrecisionLevel
 *
 * @typedef {"short" | "narrow"} DaysOfWeekFormat
 *
 * @typedef WeekItem
 * @property {DateItem[]} days
 * @property {number} number
 */

/**
 * @param {NullableDateTime} date1
 * @param {NullableDateTime} date2
 */
const earliest = (date1, date2) => (date1 < date2 ? date1 : date2);

/**
 * @param {DateTime} date
 */
const getStartOfDecade = (date) => Math.floor(date.year / 10) * 10;

/**
 * @param {DateTime} date
 */
const jgetStartOfDecade = (date) => Math.floor(Math.round(date.reconfigure({ outputCalendar: 'persian', locale: 'fa' }).toLocaleString({ year: 'numeric' })) / 10) * 10;

/**
 * @param {DateTime} date
 */
const getStartOfCentury = (date) => Math.floor(date.year / 100) * 100;

/**
 * @param {DateTime} date
 */
const jgetStartOfCentury = (date) => Math.floor(Math.round(date.reconfigure({ outputCalendar: 'persian', locale: 'fa' }).toLocaleString({ year: 'numeric' })) / 100) * 100;

/**
 * @param {DateTime} date
 */
const getStartOfWeek = (date) => {
    const { weekStart } = localization;
    return date.set({ weekday: date.weekday < weekStart ? weekStart - 7 : weekStart });
};

/**
 * @param {NullableDateTime} date1
 * @param {NullableDateTime} date2
 */
const latest = (date1, date2) => (date1 > date2 ? date1 : date2);

/**
 * @param {number} min
 * @param {number} max
 */
const numberRange = (min, max) => [...Array(max - min)].map((_, i) => i + min);

/**
 * @param {NullableDateTime | "today"} value
 * @param {NullableDateTime | "today"} defaultValue
 */
const parseLimitDate = (value, defaultValue) =>
    clampDate(value === "today" ? today() : value || defaultValue, MIN_VALID_DATE, MAX_VALID_DATE);

/**
 * @param {Object} params
 * @param {boolean} [params.isOutOfRange=false]
 * @param {boolean} [params.isValid=true]
 * @param {keyof DateTime} params.label
 * @param {string} [params.extraClass]
 * @param {[DateTime, DateTime]} params.range
 * @returns {DateItem}
 */
const toDateItem = ({ isOutOfRange = false, isValid = true, label, range, extraClass }) => ({
    id: range[0].toISODate(),
    includesToday: isInRange(today(), range),
    isOutOfRange,
    isValid,
    label: String(range[0][label]),
    range,
    extraClass,
});

const jtoDateItem = ({ isOutOfRange = false, isValid = true, label, range, extraClass, jlable }) => ({
    id: range[0].toISODate(),
    includesToday: isInRange(today(), range),
    isOutOfRange,
    isValid,
    label: jlable,
    range,
    extraClass,
});

/**
 * @param {DateItem[]} weekDayItems
 * @returns {WeekItem}
 */
const toWeekItem = (weekDayItems) => ({
    number: weekDayItems[3].range[0].weekNumber,
    days: weekDayItems,
});


function jtoWeekItem(weekDayItems) {
    const date = weekDayItems[3].range[0];
    const jdate = farvardin.gregorianToSolar(date.year, date.month, date.day);
    const jday = new persianDate([jdate[0], jdate[1], jdate[2]]).toCalendar('persian');
    return ({
        number: jday.format('w'),
        days: weekDayItems,
    })
};

// Time constants
const HOURS = numberRange(0, 24).map((hour) => [hour, String(hour)]);
const MINUTES = numberRange(0, 60).map((minute) => [minute, String(minute || 0).padStart(2, "0")]);
const SECONDS = [...MINUTES];
const MERIDIEMS = ["AM", "PM"];

/**
 * Precision levels
 * @type {Map<PrecisionLevel, PrecisionInfo>}
 */
const PRECISION_LEVELS = new Map()
    .set("days", {
        mainTitle: _t("Select month"),
        nextTitle: _t("Next month"),
        prevTitle: _t("Previous month"),
        step: { month: 1 },
        getTitle: (date, { additionalMonth }) => {
            if (!date){
                date = DateTime.now();
            }
            const jdate = farvardin.gregorianToSolar(date.year, date.month, date.day);
            const jday = new persianDate([jdate[0], jdate[1], jdate[2]]).toCalendar('persian');
            const titles = [`${jday.format('MMMM')} ${jday.toLocale('en').format('YYYY')}`];
            if (additionalMonth) {
                const jnext = jday.add('months', 1);
                const next = date.plus({ month: 1 });
                titles.push(`${jnext.format('MMMM')} ${jnext.toLocale('en').format('YYYY')}`);
            }
            return titles;
        },
        getItems: (
            date,
            { additionalMonth, maxDate, minDate, showWeekNumbers, isDateValid, dayCellClass }
        ) => {
            if (!date){
                date = DateTime.now();
            }
            const startDates = [date];
            if (additionalMonth) {
                startDates.push(date.plus({ month: 1 }));
            }
            return startDates.map((date, i) => {
                let jdate = []
                if (!String(date.ts).includes("-", 0)){
                    jdate = farvardin.gregorianToSolar(date.year, date.month, date.day);
                }
                else {
                    jdate = [date.year, date.month, date.day];
                }
                

                const jstartofmonth = new persianDate([jdate[0], jdate[1], jdate[2]]).toCalendar('persian').startOf("month").toCalendar('gregorian');
                const startofmonth = luxon.DateTime.local().set({"years": jstartofmonth.year(), "month": jstartofmonth.month(), "days": jstartofmonth.date()})

                const jendofmonth = new persianDate([jdate[0], jdate[1], jdate[2]]).toCalendar('persian').endOf("month").toCalendar('gregorian');
                const endtofmonth = luxon.DateTime.local().set({"years": jendofmonth.year(), "month": jendofmonth.month(), "days": jendofmonth.date()})


                const monthRange = [startofmonth, endtofmonth];
                /** @type {WeekItem[]} */
                const weeks = [];

                // Generate 6 weeks for current month
                let startOfNextWeek = getStartOfWeek(monthRange[0]);
                for (let w = 0; w < 6; w++) {
                    const weekDayItems = [];
                    // Generate all days of the week
                    for (let d = 0; d < 7; d++) {
                        const day = startOfNextWeek.plus({ day: d });
                        const jday = farvardin.gregorianToSolar(day.year, day.month, day.day);
                        const range = [day.startOf("day"), day.endOf("day")];
                        const dayItem = jtoDateItem({
                            isOutOfRange: !isInRange(day, monthRange),
                            isValid: isInRange(range, [minDate, maxDate]) && isDateValid?.(day),
                            label: "day",
                            range,
                            extraClass: dayCellClass?.(day) || "",
                            jlable: String(jday[2]),
                        });
                        weekDayItems.push(dayItem);
                        if (d === 6) {
                            startOfNextWeek = day.plus({ day: 1 });
                        }
                    }
                    weeks.push(jtoWeekItem(weekDayItems));
                    // weeks.push(toWeekItem(weekDayItems));
                }
                // Generate days of week labels
                const daysOfWeek = weeks[0].days.map((d) => [
                    d.range[0].weekdayShort,
                    d.range[0].weekdayLong,
                    Info.weekdays("narrow", { locale: d.range[0].locale })[d.range[0].weekday - 1],
                ]);
                if (showWeekNumbers) {
                    daysOfWeek.unshift(["#", _t("Week numbers"), "#"]);
                }
                return {
                    id: `__month__${i}`,
                    number: monthRange[0].month,
                    daysOfWeek,
                    weeks,
                };
            });
        },
    })
    .set("months", {
        mainTitle: _t("Select year"),
        nextTitle: _t("Next year"),
        prevTitle: _t("Previous year"),
        step: { year: 1 },
        getTitle: (date) => String(date.reconfigure({ outputCalendar: 'persian', locale: 'fa' }).toLocaleString({ year: 'numeric' })),
        getItems: (date, { maxDate, minDate }) => {
            const startOfYear = date.startOf("year");
            return numberRange(0, 12).map((i) => {
                const startOfMonth = startOfYear.plus({ month: i });
                const range = [startOfMonth, startOfMonth.endOf("month")];
                return toDateItem({
                    isValid: isInRange(range, [minDate, maxDate]),
                    label: "monthShort",
                    range,
                });
            });
        },
    })
    .set("years", {
        mainTitle: _t("Select decade"),
        nextTitle: _t("Next decade"),
        prevTitle: _t("Previous decade"),
        step: { year: 10 },
        getTitle: (date) => `${jgetStartOfDecade(date) - 2} - ${jgetStartOfDecade(date) + 9}`,
        getItems: (date, { maxDate, minDate }) => {
            const startOfDecade = date.startOf("year").set({ year: getStartOfDecade(date) });
            return numberRange(-GRID_MARGIN, GRID_COUNT + GRID_MARGIN).map((i) => {
                const startOfYear = startOfDecade.plus({ year: i });
                const range = [startOfYear, startOfYear.endOf("year")];
                const jday = farvardin.gregorianToSolar(range[1].year, range[1].month, range[1].day);
                return jtoDateItem({
                    isOutOfRange: i < 0 || i >= GRID_COUNT,
                    isValid: isInRange(range, [minDate, maxDate]),
                    label: "year",
                    range,
                    jlable: String(jday[0]),
                });
            });
        },
    })
    .set("decades", {
        mainTitle: _t("Select century"),
        nextTitle: _t("Next century"),
        prevTitle: _t("Previous century"),
        step: { year: 100 },
        getTitle: (date) => `${jgetStartOfCentury(date) - 32} - ${jgetStartOfCentury(date) + 78}`,
        getItems: (date, { maxDate, minDate }) => {
            const startOfCentury = date.startOf("year").set({ year: getStartOfCentury(date) });
            return numberRange(-GRID_MARGIN, GRID_COUNT + GRID_MARGIN).map((i) => {
                const startOfDecade = startOfCentury.plus({ year: i * 10 });
                const range = [startOfDecade, startOfDecade.plus({ year: 10, millisecond: -1 })];
                const jday = farvardin.gregorianToSolar(range[0].year, range[0].month, range[0].day);
                return jtoDateItem({
                    label: "year",
                    isOutOfRange: i < 0 || i >= GRID_COUNT,
                    isValid: isInRange(range, [minDate, maxDate]),
                    range,
                    jlable: String(jday[0]),
                });
            });
        },
    });

// Other constants
const GRID_COUNT = 10;
const GRID_MARGIN = 1;
const NULLABLE_DATETIME_PROPERTY = [DateTime, { value: false }, { value: null }];


patch(DateTimePicker.prototype, {
      
    props : {
        focusedDateIndex: { type: Number, optional: true },
        showWeekNumbers: { type: Boolean, optional: true },
        daysOfWeekFormat: { type: String, optional: true },
        maxDate: { type: [NULLABLE_DATETIME_PROPERTY, { value: "today" }], optional: true },
        maxPrecision: {
            type: [...PRECISION_LEVELS.keys()].map((value) => ({ value })),
            optional: true,
        },
        minDate: { type: [NULLABLE_DATETIME_PROPERTY, { value: "today" }], optional: true },
        minPrecision: {
            type: [...PRECISION_LEVELS.keys()].map((value) => ({ value })),
            optional: true,
        },
        onSelect: { type: Function, optional: true },
        range: { type: Boolean, optional: true },
        rounding: { type: Number, optional: true },
        slots: {
            type: Object,
            shape: { buttons: { type: Object, optional: true } },
            optional: true,
        },
        type: { type: [{ value: "date" }, { value: "datetime" }], optional: true },
        value: {
            type: [
                NULLABLE_DATETIME_PROPERTY,
                { type: Array, element: NULLABLE_DATETIME_PROPERTY },
            ],
            optional: true,
        },
        isDateValid: { type: Function, optional: true },
        dayCellClass: { type: Function, optional: true },
    },
    get activePrecisionLevel() {
        return PRECISION_LEVELS.get(this.state.precision);
    },
    adjustFocus(values, focusedDateIndex) {
        if (
            !this.shouldAdjustFocusDate &&
            this.state.focusDate &&
            focusedDateIndex === this.props.focusedDateIndex
        ) {
            return;
        }

        let dateToFocus =
            today();

        if (
            this.additionalMonth &&
            focusedDateIndex === 1 &&
            values[0] &&
            values[1] &&
            values[0].month !== values[1].month
        ) {
            dateToFocus = dateToFocus.minus({ month: 1 });
        }

        this.shouldAdjustFocusDate = false;

        if(this.values[0]){
            this.state.focusDate = this.values[0];
        }else{
            this.state.focusDate = this.clamp(dateToFocus.startOf("month"));
        }
        // this.state.focusDate = this.clamp(dateToFocus.startOf("month"));
    }
});




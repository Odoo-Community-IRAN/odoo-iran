/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { CalendarCommonRenderer } from "@web/views/calendar/calendar_common/calendar_common_renderer";
import { CalendarController } from "@web/views/calendar/calendar_controller";
import { _t } from "@web/core/l10n/translation";
import { renderToString } from "@web/core/utils/render";
import { CalendarYearRenderer } from "@web/views/calendar/calendar_year/calendar_year_renderer";
import { localization } from "@web/core/l10n/localization";
import { is24HourFormat } from "@web/core/l10n/dates";

import { getWeekNumber, jgetWeekNumber } from "@web/views/calendar/utils";
import { browser } from "@web/core/browser/browser";

import { useCalendarPopover, useClickHandler, useFullCalendar  } from "@persian_calendar/js/calendar_hook";
import { useDebounced } from "@web/core/utils/timing";

import {
    onMounted,
    onPatched,
    onWillStart,
    onWillUnmount,
    onWillUpdateProps,
    useComponent,
    useExternalListener,
    useEffect,
    useRef,
} from "@odoo/owl";


const SCALE_TO_FC_VIEW = {
    day: "timeGridDay",
    week: "timeGridWeek",
    month: "dayGridMonth",
};
const SCALE_TO_HEADER_FORMAT = {
    day: "DDD",
    week: "EEE d",
    month: "EEEE",
};
const SHORT_SCALE_TO_HEADER_FORMAT = {
    ...SCALE_TO_HEADER_FORMAT,
    day: "D",
    month: "EEE",
};
const HOUR_FORMATS = {
    12: {
        hour: "numeric",
        minute: "2-digit",
        omitZeroMinute: true,
        meridiem: "short",
    },
    24: {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
    },
};


const { DateTime } = luxon;


patch(CalendarCommonRenderer.prototype, {

    getHeaderHtml(date) {
        const scale = this.props.model.scale;
        var {
            weekdayShort: weekdayShort,
            weekdayLong: weekdayLong,
            day,
        } = DateTime.fromJSDate(date);
        const jdate = new persianDate(date);
        day = jdate.toLocale('en').date();
        return renderToString(this.constructor.headerTemplate, {
            weekdayShort,
            weekdayLong,
            day,
            scale,
        });
    }
});

patch(CalendarController.prototype, {
    get currentYear() {
        const jdate = farvardin.gregorianToSolar(this.date.year, this.date.month, this.date.day);
        return jdate[0];
    },
    get dayHeader() {
        const jdate = farvardin.gregorianToSolar(this.date.year, this.date.month, this.date.day);
        return `${jdate[2]} ${this.date.toFormat("MMMM")} ${jdate[0]}`;
    },

    get currentMonth() {
        const jdate = farvardin.gregorianToSolar(this.date.year, this.date.month, this.date.day);
        return `${this.date.toFormat("MMMM")} ${jdate[0]}`;
    },

    get weekHeader() {
        const { rangeStart, rangeEnd } = this.model;
        const jrangestart = farvardin.gregorianToSolar(rangeStart.year, rangeStart.month, rangeStart.day)[0];
        const jrangeend = farvardin.gregorianToSolar(rangeEnd.year, rangeEnd.month, rangeEnd.day)[0];
        if (rangeStart.year != rangeEnd.year) {
            return `${rangeStart.toFormat("MMMM")} ${jrangestart} - ${rangeEnd.toFormat(
                "MMMM"
            )} ${jrangeend}`;
        } else if (rangeStart.month != rangeEnd.month) {
            return `${rangeEnd.toFormat("MMMM")} ${
                jrangestart
            }`;
        }
        return `${rangeStart.toFormat("MMMM")} ${jrangestart}`;
    },

    get currentWeek() {
        const date = this.model.rangeStart
        const jday = farvardin.gregorianToSolar(date.year, date.month, date.day);
        const jdate = new persianDate([jday[0], jday[1], jday[2]]).toCalendar('persian');
        return jdate.format("w");
    }

});

patch(CalendarYearRenderer.prototype, {
    setup() {
        this.months = luxon.Info.months();
        this.fcs = {};
        for (const month of this.months) {
            this.fcs[month] = useFullCalendar(
                `fullCalendar-${month}`,
                this.getOptionsForMonth(month)
            );
        }
        this.popover = useCalendarPopover(this.constructor.components.Popover);
        this.rootRef = useRef("root");
        this.onWindowResizeDebounced = useDebounced(this.onWindowResize, 200);

        useEffect(() => {
            this.updateSize();
        });
    },
    getDateWithMonth(month) {
        return this.props.model.date.set({ month: this.months.indexOf(month) + 4, day: 1 }).toISO();
    }
})

patch(CalendarCommonRenderer.prototype, {
    setup() {
        this.fc = useFullCalendar("fullCalendar", this.options);
        this.click = useClickHandler(this.onClick, this.onDblClick);
        this.popover = useCalendarPopover(this.constructor.components.Popover);
        this.onWindowResizeDebounced = useDebounced(this.onWindowResize, 200);

        onMounted(() => {
            if (this.props.model.scale === "day" || this.props.model.scale === "week") {
                //Need to wait React
                browser.setTimeout(() => {
                    if (this.fc.api.view) {
                        this.fc.api.scrollToTime("06:00:00");
                    }
                }, 0);
            }
        });

        useEffect(() => {
            this.updateSize();
        });
    }
    // get options() {
    //     return {
    //         allDaySlot: this.props.model.hasAllDaySlot,
    //         allDayText: _t(""),
    //         columnHeaderFormat: this.env.isSmall
    //             ? SHORT_SCALE_TO_HEADER_FORMAT[this.props.model.scale]
    //             : SCALE_TO_HEADER_FORMAT[this.props.model.scale],
    //         dateClick: this.onDateClick,
    //         dayRender: this.onDayRender,
    //         defaultDate: this.props.model.date.toISO(),
    //         defaultView: SCALE_TO_FC_VIEW[this.props.model.scale],
    //         dir: localization.direction,
    //         droppable: true,
    //         editable: this.props.model.canEdit,
    //         eventClick: this.onEventClick,
    //         eventDragStart: this.onEventDragStart,
    //         eventDrop: this.onEventDrop,
    //         eventLimit: this.props.model.eventLimit,
    //         eventLimitClick: this.onEventLimitClick,
    //         eventLimitText: this.env.isSmall ? "" : "more",
    //         eventMouseEnter: this.onEventMouseEnter,
    //         eventMouseLeave: this.onEventMouseLeave,
    //         eventRender: this.onEventRender,
    //         eventResizableFromStart: true,
    //         eventResize: this.onEventResize,
    //         eventResizeStart: this.onEventResizeStart,
    //         events: (_, successCb) => successCb(this.mapRecordsToEvents()),
    //         firstDay: this.props.model.firstDayOfWeek,
    //         header: false,
    //         height: "parent",
    //         locale: luxon.Settings.defaultLocale,
    //         longPressDelay: 500,
    //         navLinks: false,
    //         nowIndicator: true,
    //         plugins: ["dayGrid", "interaction", "timeGrid", "luxon"],
    //         select: this.onSelect,
    //         selectAllow: this.isSelectionAllowed,
    //         selectMinDistance: 5, // needed to not trigger select when click
    //         selectMirror: true,
    //         selectable: this.props.model.canCreate,
    //         slotLabelFormat: is24HourFormat() ? HOUR_FORMATS[24] : HOUR_FORMATS[12],
    //         snapDuration: { minutes: 15 },
    //         timeZone: luxon.Settings.defaultZone.name,
    //         unselectAuto: false,
    //         weekLabel: this.props.model.scale === "month" && this.env.isSmall ? "" : _t("Week"),
    //         weekends: this.props.isWeekendVisible,
    //         weekNumberCalculation: "651651",
    //         weekNumbers: true,
    //         weekNumbersWithinDays: !this.env.isSmall,
    //         windowResize: this.onWindowResizeDebounced,
    //         columnHeaderHtml: this.getHeaderHtml,
    //     };
    // }
    // get options() {
    //     let options = this._super();
    //     options.weekNumberCalculation = function (date) {
    //         const jday = farvardin.gregorianToSolar(date.year, date.month, date.day);
    //         const jdate = new persianDate([jday[0], jday[1], jday[2]]).toCalendar('persian');
    //         return jdate.format("w");
    //     };
    //     return options;
    // },
})

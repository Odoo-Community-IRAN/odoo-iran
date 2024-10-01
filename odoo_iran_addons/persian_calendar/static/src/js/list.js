/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { getFormattedValue } from "@persian_calendar/js/format_utils";


const DEFAULT_GROUP_PAGER_COLSPAN = 1;

const FIELD_CLASSES = {
    char: "o_list_char",
    float: "o_list_number",
    integer: "o_list_number",
    monetary: "o_list_number",
    text: "o_list_text",
    many2one: "o_list_many2one",
};

const FIXED_FIELD_COLUMN_WIDTHS = {
    boolean: "70px",
    date: "92px",
    datetime: "146px",
    float: "92px",
    integer: "74px",
    monetary: "104px",
    handle: "33px",
};


patch(ListRenderer.prototype, {
    getCellTitle(column, record) {
        const fieldType = this.fields[column.name].type;
        // Because we freeze the column sizes, it may happen that we have to shorten
        // field values. In order for the user to have access to the complete value
        // in those situations, we put the value as title of the cells.
        // This is only necessary for some field types, as for the others, we hardcode
        // a minimum column width that should be enough to display the entire value.
        // Also, we don't set title for json fields, because it's not human readable anyway.
        if (
            !(fieldType in FIXED_FIELD_COLUMN_WIDTHS) &&
            !["json", "one2many", "many2many"].includes(fieldType)
        ) {
            return this.getFormattedValue(column, record);
        }
    },

    getFieldClass(column) {
        return column.attrs && column.attrs.class;
    },

    getFormattedValue(column, record) {
        const fieldName = column.name;
        if (column.options.enable_formatting === false) {
            return record.data[fieldName];
        }
        return getFormattedValue(record, fieldName, column.attrs);
    }
})
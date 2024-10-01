/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { DateTimeField } from "@web/views/fields/datetime/datetime_field";
import {
      areDatesEqual,
      deserializeDate,
      deserializeDateTime,
      formatDate,
      formatDateTime,
      today,
  } from "@web/core/l10n/dates";



patch(DateTimeField.prototype, {

    getFormattedValue(valueIndex) {
      const value = this.values[valueIndex];
      const ressult_date = value ? this.field.type === "date" ? formatDate(value) : formatDateTime(value) : "";
      if (!value || !ressult_date){
        return ressult_date;
      }
      if (ressult_date.split(" ")[1]) {
        return `${value.reconfigure().toLocaleString({  year: "numeric", month: "2-digit", day: "2-digit" })} ${ressult_date.split(" ")[1]}`;
      }else{
        return value.reconfigure().toLocaleString({  year: "numeric", month: "2-digit", day: "2-digit" }) ;
      }
      
      }
});
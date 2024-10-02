# -*- coding: utf-8 -*-
# Copyright (C) 2024-Today: Odoo Community Iran
# @author: Odoo Community Iran (https://odoo-community.ir/
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from datetime import datetime
import logging

from odoo.models import AbstractModel
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

def add_years(today, years):
    """Return a date that's `years` years after the date (or datetime)
    object `today`. Return the same calendar date (month and day) in the
    destination year, if it exists, otherwise use the following day
    (thus changing February 29 to March 1).

    """
    try:
        return today.replace(year = today.year + years)
    except ValueError:
        return today + (datetime.date(today.year + years, 1, 1) - datetime.date(today.year, 1, 1))

class PublisherWarrantyContract(AbstractModel):
    _inherit = "publisher_warranty.contract"


    def _get_message(self):
        res = super(PublisherWarrantyContract, self)._get_message()
        return {}

    def update_notification(self, cron_mode=True):
        """
        This func was running from expiration_panel.js and change expiration_date & expiration_reason
        Now override : expiration_date += 1 & expiration_reason=fawan
        """
        res = super(PublisherWarrantyContract, self).update_notification(cron_mode)
        expiration_date = add_years(datetime.now(),1)
        expiration_reason = 'nothing'
        try:
            set_param = self.env['ir.config_parameter'].sudo().set_param
            set_param('database.expiration_date', expiration_date)
            set_param('database.expiration_reason', expiration_reason)
            set_param('database.enterprise_code', "ABC")
            _logger.info('Disable Enterprise by Date: %s, reason: %s', expiration_date, expiration_reason)
        except Exception:
            _logger.debug("Exception while change expiration_date", exc_info=1)

        return res
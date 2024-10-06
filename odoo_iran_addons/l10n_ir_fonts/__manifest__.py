# -*- coding: utf-8 -*-
# Copyright (C) 2024-Today: Odoo Community Iran
# @author: Odoo Community Iran (https://odoo-community.ir/
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).
{
    'name': "Persian font",
    'summary': """change defult font to nice persian font""",
    'author': "Odoo Community Iran",
    'website': "https://odoo-community.ir/",
    "category": "Localization/Iran",
    "version": "1.0.2",
    'depends': ['web'],
    'license': 'LGPL-3',
    'assets': {
        'web._assets_primary_variables': [
            'l10n_ir_fonts/static/src/scss/persianfont.scss',
        ],
        'web.assets_backend': [
            'l10n_ir_fonts/static/src/css/pos_style.css',
            'l10n_ir_fonts/static/src/css/web_style.css',
        ],
        'web.report_assets_common': [
            'l10n_ir_fonts/static/src/css/pdf_style.css',
        ],
        'web.report_assets_pdf': [
            'l10n_ir_fonts/static/src/css/pdf_style.css',
        ],
        'account_reports.assets_financial_report': [
            'l10n_ir_fonts/static/src/css/pdf_style.css',
        ],
    },
    "installable": True,
    "auto_install": False,
}

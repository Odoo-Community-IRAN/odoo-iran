# -*- coding: utf-8 -*-
# Copyright (C) 2024-Today: Odoo Community Iran
# @author: Odoo Community Iran (https://odoo-community.ir/
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "Disable Enterprise",
    'summary': """Disable Enterprise Code""",
    'description': """Disable Enterprise Code""",
    'author': "Odoo Community Iran",
    'website': "https://odoo-community.ir/",
    'category': 'Technical',
    'version': '1.0',
    "license": "AGPL-3",
    'depends': ['base', 'mail', 'web_enterprise'],
    'data': [
        'data/update_notification.xml',
        'data/service_cron.xml',
        
    ],
    'assets': {
        'web.assets_backend': [
            'disable_enterprise/static/src/webclient/**/*.xml',
    ],
    },
    "installable": True,
}

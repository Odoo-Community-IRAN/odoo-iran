# -*- coding: utf-8 -*-
# Copyright (C) 2024-Today: Odoo Community Iran
# @author: Odoo Community Iran (https://odoo-community.ir/
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import logging
import os

from odoo import fields, models
from odoo.exceptions import UserError
from odoo.tools.translate import TranslationImporter

lang_code = "fa_IR"
_logger = logging.getLogger(__name__)


class BaseLanguageImport(models.TransientModel):
    _name = "persian.language.import"
    _description = "Persian Language Import"

    code = fields.Char(
        "ISO Code", default="fa_IR", help="ISO Language and Country code, e.g. en_US"
    )
    data = fields.Binary("File", attachment=False)
    filename = fields.Char("File Name")
    overwrite = fields.Boolean(
        "Overwrite Existing Terms",
        default=True,
        help="If you enable this option, existing translations (including custom ones) "
        "will be overwritten and replaced by those in this file",
    )

    log_messages = fields.Text(default="")

    # @api.model
    def import_lang(self):
        self.ensure_one()
        try:
            module_path = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(module_path, "i18n_po")
            file_path = file_path.replace("wizard/", "")
            translation_importer = TranslationImporter(self.env.cr, verbose=True)

            for subdir, _, files in os.walk(file_path):
                for file in files:
                    if file.endswith(".po"):
                        po_file = os.path.join(subdir, file)
                        _logger.info(
                            "loading translation file for language fa_IR \n %s"
                            % po_file
                        )
                        with open(po_file, mode="rb") as fileobj:
                            fileformat = os.path.splitext(po_file)[-1][1:].lower()
                            translation_importer.load(fileobj, fileformat, lang_code)
                        self.write(
                            {
                                "log_messages": str(self.log_messages)
                                + "<p> loading translation file for language fa_IR \n %s </p>"
                                % po_file
                            }
                        )

            translation_importer.save(overwrite=True, force_overwrite=True)
            self.env.cr.commit()
        except Exception as ex:
            _logger.exception("File unsuccessfully imported, due to format mismatch.")
            raise UserError(
                _(
                    "File %(self.filename)r not imported due to format mismatch"
                    " or a malformed file."
                    " (Valid formats are .csv, .po, .pot)\n\n"
                    "Technical Details:\n%(tools.ustr(e))s"
                )
            ) from ex
        return {
            "type": "ir.actions.act_window",
            "res_model": "persian.language.import",
            "view_mode": "form",
            "res_id": self[0].id,
            "views": [(False, "form")],
            "target": "new",
        }

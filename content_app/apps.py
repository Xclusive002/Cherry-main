import copy

from django.apps import AppConfig
from django.template.context import BaseContext


def _monkey_patch_basecontext_copy():
    """Work around Python 3.14 / Django 4.2 copy compatibility.

    Django 4.2.30's BaseContext.__copy__ calls copy(super()), which fails
    under Python 3.14 with AttributeError on the super proxy. This patch
    installs a compatible implementation for project startup.
    """
    def __copy__(self):
        duplicate = self.__class__.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    BaseContext.__copy__ = __copy__


_monkey_patch_basecontext_copy()


class ContentAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'content_app'

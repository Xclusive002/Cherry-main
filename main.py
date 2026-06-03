#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adultsite.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH environment variable? Did you forget to activate a virtual environment?"
        ) from exc

    # If no command is passed, start the Django development server.
    if len(sys.argv) == 1:
        sys.argv += ['runserver', '0.0.0.0:8000']

    execute_from_command_line(sys.argv)

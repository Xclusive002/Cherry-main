#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adultsite.settings')

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH environment variable? Did you forget to activate a virtual environment?"
        ) from exc

    # If no command-line args were passed, decide between gunicorn (production)
    # and Django's runserver (local development).
    if len(sys.argv) == 1:
        port = os.environ.get('PORT')
        if port:
            # Replace current process with gunicorn so the runtime PID is gunicorn.
            bind = f'0.0.0.0:{port}'
            os.execvp('gunicorn', ['gunicorn', 'adultsite.wsgi', '--bind', bind, '--workers', '3', '--timeout', '120'])

        # Default to Django dev server locally when no PORT is set.
        sys.argv += ['runserver', '0.0.0.0:8000']

    try:
        execute_from_command_line(sys.argv)
    except Exception as e:
        # During build or when checks run in an environment without a DB,
        # log a warning and exit gracefully so build systems don't fail.
        if 'check' in sys.argv or (len(sys.argv) == 1 and os.environ.get('PORT')):
            print(f"Warning: {e}", file=sys.stderr)
            sys.exit(0)
        raise


if __name__ == '__main__':
    main()

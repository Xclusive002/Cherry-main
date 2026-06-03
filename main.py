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

    if len(sys.argv) == 1:
        port = os.environ.get('PORT')
        if port:
            # In production deploys, use gunicorn instead of Django's dev server.
            sys.argv = ['gunicorn', 'adultsite.wsgi', '--bind', f'0.0.0.0:{port}', '--workers', '3', '--timeout', '120']
            from gunicorn.app.wsgiapp import run
            run()
            sys.exit(0)

        sys.argv += ['runserver', '0.0.0.0:8000']

    try:
        execute_from_command_line(sys.argv)
    except Exception as e:
        if 'check' in sys.argv or (len(sys.argv) == 1 and os.environ.get('PORT')):
            print(f"Warning: {e}", file=sys.stderr)
            sys.exit(0)
        raise


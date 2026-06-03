import os
import sys
from gunicorn.app.wsgiapp import run

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adultsite.settings')

if __name__ == '__main__':
    port = os.environ.get('PORT', '3000')
    sys.argv = [
        'gunicorn',
        'adultsite.wsgi',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '3',
        '--timeout', '120',
    ]
    run()

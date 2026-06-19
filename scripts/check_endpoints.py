import requests

def check(url):
    try:
        r = requests.get(url)
        print(url)
        print('Status', r.status_code)
        print('Content-Type:', r.headers.get('content-type'))
        print(r.text[:1000])
    except Exception as e:
        print('Error', e)

check('http://127.0.0.1:8000/api/locations/countries/')
print('\n')
check('http://127.0.0.1:8000/api/terms/')
print('\n')
check('http://127.0.0.1:8000/api/auth/user/')

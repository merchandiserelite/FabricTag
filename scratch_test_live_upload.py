import requests

url = 'http://localhost:8050/api/upload/parse-preview'
session = requests.Session()
login_res = session.post('http://localhost:8050/api/auth/login', json={'username': 'admin', 'password': '123'})
print('Login status:', login_res.status_code)

with open('data/uploads/20260922_144626_Elite MS ss27.pdf', 'rb') as f:
    files = {'files': ('Elite MS ss27.pdf', f, 'application/pdf')}
    res = session.post(url, files=files)
    print('Upload status:', res.status_code)
    data = res.json()
    print('Type badge:', data.get('type'))
    print('Count:', data.get('count'))
    if data.get('data'):
        for i in range(min(4, len(data['data']))):
            it = data['data'][i]
            print(f"Item {i+1}: {it.get('style_no')} | Total Qty: {it.get('total_quantity')} | Sizes: {it.get('size_distribution')}")

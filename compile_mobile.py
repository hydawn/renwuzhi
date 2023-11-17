#!/usr/bin/python3

import sys
import base64
from urllib.parse import urlparse

from bs4 import BeautifulSoup

with open(sys.argv[1], 'r', encoding='utf-8') as file:
    html = file.read()

soup = BeautifulSoup(html, 'html.parser')

for i in soup.find_all('script'):
    src = i.get('src')
    if not src:
        continue
    del i['src']
    with open(src, 'r', encoding='utf-8') as file:
        i.string = file.read()


for i in soup.find_all('link'):
    href = i.get('href')
    if not href:
        continue
    itype = i.get('type')
    path = urlparse(href).path
    if not itype:
        itype = f"image/{urlparse(href).path.rsplit('.', maxsplit=1)[-1]}"
    else:
        del i['type']
    with open(href, 'rb') as file:
        i['href'] = f"data:{itype};base64,{base64.b64encode(file.read()).decode()}"


for i in soup.find_all('img'):
    src = i.get('src')
    if not src:
        continue
    itype = i.get('type')
    path = urlparse(src).path
    if not itype:
        itype = f"image/{urlparse(src).path.rsplit('.', maxsplit=1)[-1]}"
    else:
        del i['type']
    with open(src, 'rb') as file:
        i['src'] = f"data:{itype};base64,{base64.b64encode(file.read()).decode()}"


name_list = sys.argv[1].rsplit('.', maxsplit=1)

with open(f'{name_list[0]}_contained.{name_list[1]}', 'w', encoding='utf-8') as file:
    file.write(str(soup))

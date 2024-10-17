#!/usr/bin/python3

import re
import sys
import base64
from urllib.parse import urlparse

from bs4 import BeautifulSoup


def css_mini(css: str) -> str:
    return ''.join([i.strip() for i in css.split('\n')])


def js_mini(js_str: str) -> str:
    mini = ''
    for i in js_str.split('\n'):
        # this is comment
        if re.match(r'[\s]*//', i):
            continue
        # WARNING: strip is dangerous
        mini += i.strip() + '\n'
    return mini


def main():
    with open(sys.argv[1], 'r', encoding='utf-8') as file:
        html = file.read()
    cdnver = sys.argv[2]
    if cdnver not in ['cdn', 'contained']:
        raise RuntimeError(f'argument cdnver {cdnver} not in {['cdn', 'contained']}')
    if cdnver == 'cdn':
        reg = r'https://cdn.sheetjs.com/[-/.a-z0-9]+?xlsx.full.min.js'
        match = re.search(reg, html)
        if not match:
            raise RuntimeError(f'failed to search reg {reg} from html file {sys.argv[1]}')
        cdnsrc = match.group()
    else:
        cdnsrc = ''

    soup = BeautifulSoup(html, 'html.parser')
    for i in soup.find_all('script'):
        src = i.get('src')
        if not src:
            continue
        if src == 'xlsx.full.min.js' and cdnver == 'cdn':
            i['src'] = cdnsrc
            continue
        del i['src']
        with open(src, 'r', encoding='utf-8') as file:
            i.string = js_mini(file.read())


    for i in soup.find_all('link', {'rel': 'icon'}):
        href = i.get('href')
        if not href:
            continue
        itype = i.get('type')
        if not itype:
            itype = f"image/{urlparse(href).path.rsplit('.', maxsplit=1)[-1]}"
        else:
            del i['type']
        with open(href, 'rb') as file:
            i['href'] = f"data:{itype};base64,{base64.b64encode(file.read()).decode()}"

    for i in soup.find_all('link', {'rel': 'stylesheet'}):
        href = i.get('href')
        if not href:
            continue
        style = soup.new_tag('style')
        with open(href, 'r', encoding='utf-8') as file:
            style.string = css_mini(file.read())
        soup.find('head').append(style)
        #i.parent.append(style)
        i.decompose()
        # del i['src']

    for i in soup.find_all('img'):
        src = i.get('src')
        if not src:
            continue
        itype = i.get('type')
        if not itype:
            itype = f"image/{urlparse(src).path.rsplit('.', maxsplit=1)[-1]}"
        else:
            del i['type']
        with open(src, 'rb') as file:
            i['src'] = f"data:{itype};base64,{base64.b64encode(file.read()).decode()}"


    name_list = sys.argv[1].rsplit('.', maxsplit=1)
    html = '\n'.join([i.strip() for i in str(soup).split('\n')])

    with open(f'dist/{name_list[0]}_{cdnver}.{name_list[1]}', 'w', encoding='utf-8') as file:
        file.write(html)


if __name__ == "__main__":
    main()

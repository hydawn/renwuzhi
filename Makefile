.PHONY: publish version mobile nginx

publish: version
	echo "doesn't matter if lad is unreachable"
	rsync -acP dist/ lad:hikerjoy/renwuzhi/
	ssh lad brotli -f9 hikerjoy/renwuzhi/renwuzhi_cdn.html hikerjoy/renwuzhi/renwuzhi_contained.html

version: mobile
	bash scripts/makever.sh

mobile: renwuzhi.html scripts/compile_mobile.py favicon.ico loadfile.js process_xlsx.js load_mode.js xlsxjs.js jszip.min.js control_mode.js progressing_bar.js
	#python scripts/compile_mobile.py renwuzhi.html cdn
	python scripts/compile_mobile.py renwuzhi.html contained

nginx:
	rsync -rctoDPL lad:/usr/local/nginx/conf/enabled/hikerjoy http.conf

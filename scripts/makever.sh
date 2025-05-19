#!/bin/bash

set -e

cd dist

ver=$(grep -oP '(?<=<title>人物志转换 )v[\d]+.[\d]+.[\d]+' renwuzhi_contained.html)
if test -z "$ver"; then
  echo failed to grep version
  exit 1
fi

cp renwuzhi_contained.html renwuzhi_contained."$ver".html
#cp renwuzhi_cdn.html renwuzhi_cdn."$ver".html

grep -v renwuzhi_contained."$ver".html md5sums.txt > md5sums.txt~
#grep -v renwuzhi_cdn."$ver".html md5sums.txt~ > md5sums.txt

rm md5sums.txt~

echo "# $(date -Isec)" >> md5sums.txt
md5sum renwuzhi_contained."$ver".html >> md5sums.txt
#md5sum renwuzhi_cdn."$ver".html >> md5sums.txt

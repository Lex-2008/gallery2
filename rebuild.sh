#!/bin/bash

LISTS="$PWD/lists"
THUMBS="$PWD/thumbs"
INDEX=view.html

ALBUM_WIDTH="$(sed '/^var ALBUM_WIDTH/!d;s/[^0-9]//g' $INDEX)"
ALBUM_HEIGHT="$(sed '/^var ALBUM_HEIGHT/!d;s/[^0-9]//g' $INDEX)"
PHOTO_WIDTH="$(sed '/^var PHOTO_WIDTH/!d;s/[^0-9]//g' $INDEX)"
PHOTO_HEIGHT="$(sed '/^var PHOTO_HEIGHT/!d;s/[^0-9]//g' $INDEX)"

echo ${ALBUM_WIDTH}x${ALBUM_HEIGHT} ${PHOTO_WIDTH}x${PHOTO_HEIGHT}

rm $LISTS/_.txt

sed '/^<div id="data"/q' $INDEX >$INDEX.new
ls photos | while read album; do
	echo $album/
	ls -1 photos/$album | tee $LISTS/$album.txt 
	echo "photos/$album/$(head -n1 $LISTS/$album.txt)" >> $LISTS/_.txt
	( cd photos/$album
		convert -strip -thumbnail ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -gravity center -extent ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -append @$LISTS/$album.txt $THUMBS/$album.jpg
	)
	echo .
done >>$INDEX.new
sed -n '\?^</div> <!-- do not change this line -->$?,/EOF/p' $INDEX >>$INDEX.new


convert -strip -thumbnail ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -gravity center -extent ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -append @$LISTS/_.txt $THUMBS/_.jpg





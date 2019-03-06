#!/bin/bash

LISTS="$PWD/lists"
THUMBS="$PWD/thumbs"
INDEX=view.html

ALBUM_WIDTH=300
ALBUM_HEIGHT=200
PHOTO_WIDTH=100
PHOTO_HEIGHT=100

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

sed -i "s/^var ALBUM_WIDTH=.*/var ALBUM_WIDTH=$ALBUM_WIDTH;/;
        s/^var ALBUM_HEIGHT=.*/var ALBUM_HEIGHT=$ALBUM_HEIGHT;/;
        s/^var PHOTO_WIDTH=.*/var PHOTO_WIDTH=$PHOTO_WIDTH;/;
        s/^var PHOTO_HEIGHT=.*/var PHOTO_HEIGHT=$PHOTO_HEIGHT;/;" $INDEX.new

convert -strip -thumbnail ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -gravity center -extent ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -append @$LISTS/_.txt $THUMBS/_.jpg





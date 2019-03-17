#!/bin/bash

LISTS="$PWD/lists"
PHOTOS="$PWD/photos"
THUMBS="$PWD/thumbs"
SETTINGS="$PWD/settings.txt"

. "$SETTINGS"

NL='
'

if test "$(uname -o)" = "Cygwin"; then
	GM_THUMBS="$(cygpath -w "$THUMBS")"
else
	GM_THUMBS="$THUMBS"
fi

test -z "GM" && GM=gm

test -f "$LISTS/_.txt" || touch "$LISTS/_.txt"
sed -i '/^[^^]/s/^/^/' "$LISTS/_.txt"

find "$PHOTOS" -mindepth 1 -type d -printf '%P\n' | LC_ALL=POSIX sort >"$LISTS/_.new"
sed 's/^^//;s/|.*//' "$LISTS/_.txt" | LC_ALL=POSIX sort >"$LISTS/_.old"

echo "Detecting album changes..."
comm -3 "$LISTS/_.new" "$LISTS/_.old" | sed '/^[^\t]/{s/^/A /};/^\t/{s/^/D /}' | LC_ALL=POSIX sort -r | while read change album; do
	case "$change" in
		( A ) 
			echo "Added album [$album]"
			cover="$(ls "$PHOTOS/$album" | head -n1)"
			if test -z "$cover"; then
				echo "Album empty, ignoring"
				continue
			fi
			echo "^$album|" >"$LISTS/_.tmp"
			cat "$LISTS/_.txt" >>"$LISTS/_.tmp"
			mv "$LISTS/_.tmp" "$LISTS/_.txt"
			touch "$LISTS/$album.txt"
		;;
		( D )
			echo "Deleted album [$album]"
			grep -Fv "^$album|" "$LISTS/_.txt" >"$LISTS/_.tmp"
			mv "$LISTS/_.tmp" "$LISTS/_.txt"
			rm -f "$LISTS/$album.txt"
			rm -f "$THUMBS/$album.jpg"
		;;
	esac
done

echo "Detecting photo changes..."
cat "$LISTS/_.new" | while read album; do
	echo "Working on [$album]..."
	ls -1 "$PHOTOS/$album" | LC_ALL=POSIX sort >"$LISTS/$album.new"
	sed -i 's/\*^/^*/;/^[^^]/s/^/^/' "$LISTS/$album.txt"
	sed 's/^^\*\?//;s/|.*//' "$LISTS/$album.txt" | LC_ALL=POSIX sort >"$LISTS/$album.old"
	comm -3 "$LISTS/$album.new" "$LISTS/$album.old" | sed '/^[^\t]/{s/^/A /};/^\t/{s/^/D /}' | LC_ALL=POSIX sort -r | while read change photo; do
		case "$change" in
			( A ) 
				echo "Added photo [$photo]"
				echo "^$photo|" >"$LISTS/$album.tmp"
				cat "$LISTS/$album.txt" >>"$LISTS/$album.tmp"
				mv "$LISTS/$album.tmp" "$LISTS/$album.txt"
			;;
			( D )
				echo "Deleted photo [$photo]"
				grep -Fv "^$photo$NL^*$photo" "$LISTS/$album.txt" >"$LISTS/$album.tmp"
				mv "$LISTS/$album.tmp" "$LISTS/$album.txt"
			;;
		esac
		rm -f "$THUMBS/$album.jpg"
	done
	rm -f "$LISTS/$album.new" "$LISTS/$album.old"
	if ! test -f "$THUMBS/$album.jpg"; then
		echo "Rebuilding thumbnails..."
		sed 's/^^\*\?//;s/|.*//' "$LISTS/$album.txt" >"$THUMBS/$album.txt"
		( cd "$PHOTOS/$album"
			"$GM" convert -strip -thumbnail ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -gravity center -extent ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -append @"$GM_THUMBS/$album.txt" "$GM_THUMBS/$album.jpg"
		)
	fi
done

echo "Building album thumbnails..."
sed 's/^^//;s/|.*//' "$LISTS/_.txt" | while read album; do
	cover="$(sed '/^^\*/!d;s/^^\*//;s/|.*//' "$LISTS/$album.txt")"
	test -z "$cover" && cover="$(ls -r "$PHOTOS/$album" | head -n1)"
	if test -z "$cover"; then
		echo "Album empty, deleting. PLEASE RUN ME AGAIN"
		rmdir "$PHOTOS/$album"
		continue
	fi
	echo "$album/$cover">>"$THUMBS/_.new"
done

if test -f "$THUMBS/_.jpg" && diff -q >/dev/null "$THUMBS/_.new" "$THUMBS/_.txt"; then
	rm -f "$THUMBS/_.new"
	echo "No rebuild needed"
else
	echo "Rebuild needed"
	mv "$THUMBS/_.new" "$THUMBS/_.txt"
	( cd "$PHOTOS"
		"$GM" convert -strip -thumbnail ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -gravity center -extent ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -append @"$GM_THUMBS/_.txt" "$GM_THUMBS/_.jpg"
	)
fi

echo "Updating HTML files..."

column=1
for index in $INDEXES; do
	echo "Updating [$index]..."
	sed -i '/<script id="data"/,/<.script>/{/<.\?script.*>/!d}' $index
        ((column++))
	echo "var ALBUM_WIDTH=$ALBUM_WIDTH;
		var ALBUM_HEIGHT=$ALBUM_HEIGHT;
		var PHOTO_WIDTH=$PHOTO_WIDTH;
		var PHOTO_HEIGHT=$PHOTO_HEIGHT;
		var TITLE_COLUMN=$column;
		albumize(function f(){/*" >data.tmp
	cut -d'|' -s -f1,2,$column "$LISTS/_.txt" | sed 's/^^//;s/|.*|/|/' | while IFS='|' read album title; do
		echo "$album|$title|$(cat "$LISTS/$album.txt" | wc -l)"
	done >>data.tmp
	echo '*/});' >>data.tmp
	sed -i '/<script id="data"/r data.tmp' $index
done

rm "$LISTS/_.new" "$LISTS/_.old" data.tmp

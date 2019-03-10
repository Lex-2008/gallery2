#!/bin/bash

LISTS="$PWD/lists"
PHOTOS="$PWD/photos"
THUMBS="$PWD/thumbs"
TITLES="$PWD/titles.txt"
SETTINGS="$PWD/settings.txt"

. "$SETTINGS"

NL='
'

find "$PHOTOS" -type d -printf '%P\n' | LC_ALL=POSIX sort >"$LISTS/_.new"
LC_ALL=POSIX sort "$LISTS/_.txt" >"$LISTS/_.old"

test -f "$LISTS/_.txt" || touch "$LISTS/_.txt"

echo "Detecting album changes..."
comm -3 $LISTS/_.new $LISTS/_.old | sed '/^[^\t]/{s/^/A /};/^\t/{s/^/D /}' | while read change album; do
	case "$change" in
		( A ) 
			echo "Added album [$album]"
			cover="$(ls "$PHOTOS/$album" | head -n1)"
			if test -z "$cover"; then
				echo "Album empty, ignoring"
				continue
			fi
			echo "$album" >"$LISTS/_.tmp"
			cat "$LISTS/_.txt" >>"$LISTS/_.tmp"
			mv "$LISTS/_.tmp" "$LISTS/_.txt"
			echo "$album|" >>"$TITLES"
			touch "$LISTS/$album.txt"
		;;
		( D )
			echo "Deleted album [$album]"
			grep -Fvx "$album" "$LISTS/_.txt" >"$LISTS/_.tmp" && mv "$LISTS/_.tmp" "$LISTS/_.txt"
			grep -Fvx "$album|" "$TITLES" >"$TITLES.tmp" && mv "$TITLES.tmp" "$TITLES"
			rm -f "$LISTS/$album.txt"
			rm -f "$THUMBS/$album.jpg"
		;;
	esac
done

echo "Detecting photo changes..."
cat "$LISTS/_.txt" | while read album; do
	echo "Working on [$album]..."
	ls -1 "$PHOTOS/$album" | LC_ALL=POSIX sort >"$LISTS/$album.new"
	sed 's/^\*//' "$LISTS/$album.txt" | LC_ALL=POSIX sort >"$LISTS/$album.old"
	comm -3 "$LISTS/$album.new" "$LISTS/$album.old" | sed '/^[^\t]/{s/^/A /};/^\t/{s/^/D /}' | while read change photo; do
		case "$change" in
			( A ) 
				echo "Added photo [$photo]"
				echo "$photo" >"$LISTS/$album.tmp"
				cat "$LISTS/$album.txt" >>"$LISTS/$album.tmp"
				mv "$LISTS/$album.tmp" "$LISTS/$album.txt"
				# echo "$album/$photo|" >>"$TITLES"
			;;
			( D )
				echo "Deleted photo [$photo]"
				grep -Fvx "$photo$NL*$photo" "$LISTS/$album.txt" >"$LISTS/$album.tmp" && mv "$LISTS/$album.tmp" "$LISTS/$album.txt"
				grep -Fvx "$album/$photo|" "$TITLES" >"$TITLES.tmp" && mv "$TITLES.tmp" "$TITLES"
			;;
		esac
		rm -f "$THUMBS/$album.jpg"
	done
	rm -f "$LISTS/$album.new" "$LISTS/$album.old"
	if ! test -f $THUMBS/$album.jpg; then
		echo "Rebuilding thumbnails..."
		( cd "$PHOTOS/$album"
			convert -strip -thumbnail ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -gravity center -extent ${PHOTO_WIDTH}x${PHOTO_HEIGHT} -append @$LISTS/$album.txt $THUMBS/$album.jpg
		)
	fi
done

echo "Building album thumbnails..."
cat "$LISTS/_.txt" | while read album; do
	cover="$(sed '/^\*/!d;s/^\*//' "$LISTS/$album.txt")"
	test -z "$cover" && cover="$(ls -r "$PHOTOS/$album" | head -n1)"
	if test -z "$cover"; then
		echo "Album empty, deleting. PLEASE RUN ME AGAIN"
		rmdir "$PHOTOS/$album"
		continue
	fi
	echo "$album/$cover">>"$THUMBS/new"
done

if test -f "$THUMBS/_.jpg" && diff -q >/dev/null "$THUMBS/new" "$THUMBS/_.txt"; then
	rm -f "$THUMBS/new"
	echo "No rebuild needed"
else
	echo "Rebuild needed"
	mv "$THUMBS/new" "$THUMBS/_.txt"
	( cd "$PHOTOS"
		convert -strip -thumbnail ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -gravity center -extent ${ALBUM_WIDTH}x${ALBUM_HEIGHT} -append @$THUMBS/_.txt $THUMBS/_.jpg
	)
fi

echo "Updating HTML files..."

cat "$LISTS/_.txt" | while read album; do
	echo "$album|$(cat "$LISTS/$album.txt" | wc -l)"
done >data.tmp

column=1
for index in $INDEXES; do
	echo "Updating [$index]..."
	sed -i '/<div id="data"/,/<.div>/{/<.\?div.*>/!d}' $index
	sed -i '/<div id="data"/r data.tmp' $index
        ((column++))
        if test "$column" = "2"; then
                cut -d'|' -s -f1,2 "$TITLES" >titles.tmp
        else
                cut -d'|' -s -f1,2,$column "$TITLES" | sed 's/|.*|/|/' >titles.tmp
        fi
	sed -i '/<div id="titles"/,/<.div>/{/<.\?div.*>/!d}' $index
	sed -i '/<div id="titles"/r titles.tmp' $index
	sed -i "s/^var ALBUM_WIDTH=.*/var ALBUM_WIDTH=$ALBUM_WIDTH;/;
		s/^var ALBUM_HEIGHT=.*/var ALBUM_HEIGHT=$ALBUM_HEIGHT;/;
		s/^var PHOTO_WIDTH=.*/var PHOTO_WIDTH=$PHOTO_WIDTH;/;
		s/^var PHOTO_HEIGHT=.*/var PHOTO_HEIGHT=$PHOTO_HEIGHT;/;" $index
done
rm -f data.tmp titles.tmp


function $(q){return document.querySelector(q)};
function $$(q){return document.querySelectorAll(q)};
function gebi(q){return document.getElementById(q)};
// https://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript/5571069#5571069
function hereDoc(f) {
	return f.toString().
		replace(/^[^\/]+\/\*!?/, '').
		replace(/\*\/[^\/]+$/, '');
}
// https://stackoverflow.com/a/378001
function templateData(template, data){
	return template.replace(/{(\w*)}/g,function(m,key){return data[key]});
}

function ajax(url, cb){
	var req = new XMLHttpRequest();
	req.open('GET', url, true); 
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if(req.status == 200) {
				cb(req.responseText);
			}
		}
	};
	req.send(null); 
}

albums=[];
photos={};
titles={};
function readData(){
	var lines=gebi('data').innerText.split('\n');
	for(var i=1;i<lines.length;i++){ //note that here we ignore first line
		line=lines[i].split('|');
		if(line.length!=2) continue;
		albums.push(line[0]);
		photos[line[0]]=[];
		photos[line[0]].length=line[1];
	}
	var lines=gebi('titles').innerText.split('\n');
	for(var i=1;i<lines.length;i++){ //note that here we ignore first line
		line=lines[i].split('|');
		if(line.length!=2 || !line[1]) continue;
		titles[line[0]]=line[1];
	}
}

function showAllAlbums(){
	gebi('albums').innerHTML=albums.map(function(name, index){
		return templateData(
				'<a href="#{name}"><div style="background-position: 0 -{offset}px"></div>{title}</a>',
				{
					name:name,
					title:titles[name] || name,
					offset:index*ALBUM_HEIGHT
				});
	}).join(' ');
}

function showOneAlbum(album){
	thumbs_style.innerHTML="#thumbnails a{background: url('thumbs/"+album+".jpg');}";
	var a=Array(photos[album].length);
	for(var i=0; i<photos[album].length; i++){
		a[i]=templateData(
				'<a href="#{album}/" style="background-position: 0 -{offset}px"></a>',
				{
					album:album,
					offset:i*PHOTO_HEIGHT
				});
	}
	$('#photos h1 span').innerText=titles[album] || album;
	gebi('thumbnails').innerHTML=a.join(' ');
	ajax('lists/'+album+'.txt', function(text){
		var lines=text.split('\n');
		var links=$$('#thumbnails a');
		for(var i=0; i<links.length; i++){
			links[i].href+=lines[i].replace(/^\*/,'');
		}
	});

}

function showOnePhoto(album, photo){
	// https://bugs.chromium.org/p/chromium/issues/detail?id=468915#c6
	view.src='';
	view.src=templateData('photos/{album}/{photo}',{album:album, photo:photo});
	close.href="#"+album;
	ajax('lists/'+album+'.txt', function(text){
		var lines=text.split('\n');
		var i=lines.indexOf(photo);
		left.href=templateData('#{album}/{photo}',{album:album, photo:lines[Math.max(i-1,0)].replace(/^\*/,'')});
		right.href=templateData('#{album}/{photo}',{album:album, photo:lines[Math.min(i+1,lines.length-1)].replace(/^\*/,'')});
	});
}

window.onresize=function(){
	if (!view.naturalWidth) {
		setTimeout(window.onresize,10);
		return false;
	}
	var windowRatio=window.innerWidth/window.innerHeight;
	var imageRatio=view.naturalWidth/view.naturalHeight;
	if(imageRatio > windowRatio){
		view.width=window.innerWidth-16;
		view.removeAttribute('height');
	} else {
		view.height=window.innerHeight-16;
		view.removeAttribute('width');
	}
	var imageBorder=(window.innerWidth-view.width)/2;
	view.style.left=imageBorder+'px';
};

window.onhashchange=function(){
	var loc=decodeURIComponent(location.hash.slice(1));
	var i=loc.lastIndexOf('/'); //IE6+
	if(i>=0){
		var album=loc.slice(0,i);
		var photo=loc.slice(i+1);
	} else {
		var album=loc;
		var photo='';
	}
	if(!album){
		showAllAlbums();
		gebi('albums').style.display='';
		gebi('photos').style.display='none';
		gebi('single-photo').style.display='none';
	} else if(!photo){
		showOneAlbum(album);
		gebi('albums').style.display='none';
		gebi('photos').style.display='';
		gebi('single-photo').style.display='none';
	} else {
		showOnePhoto(album, photo);
		gebi('albums').style.display='none';
		gebi('photos').style.display='none';
		gebi('single-photo').style.display='';
		window.onresize();
	}
}

var main_style = document.createElement("style");
main_style.innerHTML = templateData(hereDoc(mainStyle),{
		album_width: ALBUM_WIDTH,
		album_height: ALBUM_HEIGHT,
		photo_width: PHOTO_WIDTH,
		photo_height: PHOTO_HEIGHT,
	});
document.head.appendChild(main_style);

var thumbs_style = document.createElement("style");
document.head.appendChild(thumbs_style);

var main_html = gebi('gallery');
main_html.innerHTML = hereDoc(mainHTML);

var view=gebi('view');
var next=gebi('next');
var prev=gebi('prev');
var left=gebi('left');
var right=gebi('right');
var close=gebi('close');

readData();
window.onhashchange();


function mainStyle() {/*!
#albums{
	text-align: center;
}
#albums a{
	display:inline-block;
	width:{album_width}px;
	height:calc({album_height}px + 2em + 8px);
	overflow:hidden;
}
#albums a div{
	background: url('thumbs/_.jpg');
	width:{album_width}px;
	height:{album_height}px;
}

#thumbnails{
	text-align: center;
}
#thumbnails a{
	display:inline-block;
	width:{photo_width}px;
	height:{photo_height}px;
}
#photos h1 a{
	text-decoration:none;
}

#view, #prev, #next, #left, #right {
	position:absolute;
	transform: translateY(-50%);
	top: 50%;
}
#close {
	position:absolute;
	top: 8px;
}
#left {
	left: 8px;
}
#close, #right {
	right: 8px;
}
#left, #right, #close {
	color: white;
	font-size: 60px;
	font-weight: bold;
	text-decoration: none;
	border-radius: 5px;
	background-clip: content-box;
	transition: 0.3s ease;
	height: 1.33ex;
	line-height: 1.3ex;
}
:hover #left, :hover #right, :hover #close {
	background-color: rgba(0,0,0,0.8);
}
*/};

function mainHTML() {/*!
<div id="albums"></div>
<div id="photos">
	<h1>
		<a href="#">&laquo;</a>
		<span></span>
	</h1>
	<div id="thumbnails">
	</div>
</div>
<div id="single-photo">
	<img id="view">
	<a id="left">&lt;</a>
	<a id="right">&gt;</a>
	<a id="close">&times;</a>
</div>
*/};

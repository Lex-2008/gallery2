function $(q){return document.querySelector(q)};
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


albums=[];
photos={};
comments={};
function readData(){
	var lines=gebi('data').innerText.split('\n');
	var dir='';
	for(var i=1;i<lines.length;i++){ //note that here we ignore first line
		line=lines[i];
		if(line.slice(-1)=='/'){ //ends with '/'
			dir=line.slice(0, -1);//remove last '/'
			albums.push(dir);
			photos[dir]=[];
			comments[dir]={};
		}else if(!line || line==='.' || !photos[dir]){
			// do nothing
			continue;
		}else {
			// remove first * - it's used elsewhere
			if(line[0]=='*'){
				line=line.slice(1);
			}
			var data=line.split('|');
			photos[dir].push(data[0]);
			if(data.length>0){
				comments[dir][data[0]]=data;
			}
		}
	}
}

function showAllAlbums(){
	gebi('albums').innerHTML=albums.map(function(name, index){
		return templateData('<a href="#{name}"><div style="background-position: 0 -{offset}px"></div>{name}</a>',{name:name, offset:index*ALBUM_HEIGHT});
	}).join(' ');
}

function showOneAlbum(album){
	gebi('thumbnails').innerHTML=photos[album].map(function(photo, index){
		return templateData('<a href="#{album}/{photo}" style="background-position: 0 -{offset}px"></a>',{album:album, photo:photo, offset:index*PHOTO_HEIGHT});
	}).join(' ');
	thumbs_style.innerHTML="#thumbnails a{background: url('thumbs/"+album+".jpg');}";
}

function showOnePhoto(album, photo){
	// https://bugs.chromium.org/p/chromium/issues/detail?id=468915#c6
	view.src='';
	view.src=templateData('photos/{album}/{photo}',{album:album, photo:photo});
	close.href="#"+album;
	var i=photos[album].indexOf(photo);
	left.href=templateData('#{album}/{photo}',{album:album, photo:photos[album][Math.max(i-1,0)]});
	right.href=templateData('#{album}/{photo}',{album:album, photo:photos[album][Math.min(i+1,photos[album].length-1)]});
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
		$('#photos h1 span').innerText=album;
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

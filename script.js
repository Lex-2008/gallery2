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
		var line=lines[i].split('|');
		if(line.length!=3) continue;
		albums.push(line[0]);
		titles[line[0]]=line[1];
		photos[line[0]]=[];
		photos[line[0]].length=line[2];
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
		var lines=text.split('\n').map(function(line){return line.replace(/^\^\*?/,'').split('|')});
		var links=$$('#thumbnails a');
		for(var i=0; i<links.length; i++){
			var line=lines[i];
			if(line.length>TITLE_COLUMN) {
				links[i].innerText=line[TITLE_COLUMN];
			}
			links[i].href+=line[0];
		}
	});

}

function showOnePhoto(album, photo){
	// https://bugs.chromium.org/p/chromium/issues/detail?id=468915#c6
	view.src='';
	view.src=templateData('photos/{album}/{photo}',{album:album, photo:photo});
	close.href="#"+album;
	ajax('lists/'+album+'.txt', function(text){
		var lines=text.split('\n').map(function(line){return line.replace(/^\^\*?/,'').split('|')[0]});
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
		setTimeout(window.onresize,10);
		// window.onresize();
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
var single_photo=gebi('single-photo');

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

#single-photo {
	position:absolute;
	top: 0px;
	left: 0px;
	width: 100%;
	height: 100%;
}
#view {
	position:absolute;
	transform: translate(-50%, -50%);
	top:50%;
	left:50%;
}
#left, #right {
	position:absolute;
	top: 0px;
	bottom: 0px;
}
#left {
	left: 0px;
	right: 75%;
}
#right {
	left: 25%;
	right: 0px;
}
#close {
	position:absolute;
	top: 0px;
	right: 0px;
	width: 32px;
	height: 32px;
}
#left span, #right span {
	position:absolute;
	transform: translateY(-50%);
	top: 50%;
	width: 20px;
	height: 32px;
}
#left span {
	left: 8px;
}
#right span {
	right: 8px;
}
#close span {
	position:absolute;
	top: 8px;
	right: 8px;
	width: 19px;
	height: 16px;
}
#single-photo {
	background: #1e1e1e;
}
#left span, #right span {
	transition: 0.3s ease;
	background-image: url(https://vk.com/images/icons/pv_layer_controls.png);
}
#left span, #right span {
	opacity: 0;
}
#close span {
	opacity: 0.5;
}
#left span {
	background-position: 0px -25px;
}
#right span {
	background-position: 0px -63px;
}
#close span {
	color: white;
	text-decoration: none;
	text-shadow: 0 0 10px black;
	font-size: 30pt;
	line-height: 1ex;
	transition: 0.3s ease;
}
#single-photo:hover span {
	opacity: 0.3;
}
#left:hover span, #right:hover span, #close:hover span {
	opacity: 1 !important;
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
	<a id="left"><span></span></a>
	<a id="right"><span></span></a>
	<a id="close"><span>&times;</span></a>
</div>
*/};

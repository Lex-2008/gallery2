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
function readData(f){
	var lines=hereDoc(f).split('\n');
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
	thumbs_style.innerHTML=templateData(hereDoc(function f(){/*
		#thumbs div a{
			width:{width}px;
			height:calc({height}px + 2em + 8px);
		}
		#thumbs div a div{
			background: url('thumbs/_.jpg');
			width:{width}px;
			height:{height}px;
		}
		*/}),
			{
				width:ALBUM_WIDTH,
				height:ALBUM_HEIGHT,
			});
	$('#thumbs div').innerHTML=albums.map(function(name, index){
		return templateData(
				'<a href="#{name}"><div style="background-position: 0 -{offset}px"></div><span>{title}</span></a>',
				{
					name:name,
					title:titles[name] || name,
					offset:index*ALBUM_HEIGHT
				});
	}).join(' ');
}

function showOneAlbum(album){
	thumbs_style.innerHTML=templateData(hereDoc(function f(){/*
		#thumbs div a{
			width:{width}px;
			height:calc({height}px + 2em + 8px);
		}
		#thumbs div a div{
			background: url('thumbs/{album}.jpg');
			width:{width}px;
			height:{height}px;
		}
		*/}),
			{
				album:album,
				width:PHOTO_WIDTH,
				height:PHOTO_HEIGHT,
			});
	var a=Array(photos[album].length);
	for(var i=0; i<photos[album].length; i++){
		a[i]=templateData(
				'<a href="#{album}/"><div style="background-position: 0 -{offset}px"></div><span></span></a>',
				{
					album:album,
					offset:i*PHOTO_HEIGHT
				});
	}
	$('#thumbs h1 span').innerText=titles[album] || album;
	$('#thumbs div').innerHTML=a.join(' ');
	ajax('lists/'+album+'.txt', function(text){
		var lines=text.split('\n').map(function(line){return line.replace(/^\^\*?/,'').split('|')});
		var links=$$('#thumbs div a');
		for(var i=0; i<links.length; i++){
			var line=lines[i];
			if(line.length>TITLE_COLUMN) {
				links[i].querySelector('span').innerText=line[TITLE_COLUMN];
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
		$('#thumbs h1').style.display='none';
		gebi('single-photo').style.display='none';
	} else if(!photo){
		showOneAlbum(album);
		$('#thumbs h1').style.display='';
		gebi('single-photo').style.display='none';
	} else {
		showOnePhoto(album, photo);
		gebi('single-photo').style.display='';
		setTimeout(window.onresize,10);
		// window.onresize();
	}
}

function albumize(f){
	thumbs_style = document.createElement("style");
	document.head.appendChild(thumbs_style);
	main_html = gebi('gallery');
	main_html.innerHTML = hereDoc(mainHTML);
	thumbs=gebi('thumbs');
	view=gebi('view');
	left=gebi('left');
	right=gebi('right');
	close=gebi('close');
	single_photo=gebi('single-photo');
	readData(f);
	window.onhashchange();
}

function mainHTML() {/*!
<div id="thumbs">
	<h1>
		<a href="#">&laquo;</a>
		<span></span>
	</h1>
	<div></div>
</div>
<div id="single-photo">
	<img id="view">
	<a id="left"><span></span></a>
	<a id="right"><span></span></a>
	<a id="close"><span>&times;</span></a>
</div>
*/};

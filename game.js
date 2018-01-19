var click={x:0, y:0}, keysDown = {};

// Кнопка нажата
addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
}, true);

// Кнопка отжата
addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, true);

document.querySelector("canvas").addEventListener("click", function(event) {
	// Обработка текущего интерфейса (описание ниже)
    switch(screen){
        case 1:
            buttonSound();
		    screen2();
			break;
        case 3:
			if(hero.shots){//Игрок стреляет
				shotSound();
				var s = hShots.length;
				hShots[s] = {};
				hShots[s].x = hero.x+13;
				hShots[s].y = hero.y+2;
				var X = hShots[s].x-event.clientX;
				var Y = hShots[s].y-event.clientY+40;
				var speed = 300*widthFactor;
				var denom = Math.sqrt(X*X+Y*Y)/speed;
				hShots[s].movementX = -X/denom;
				hShots[s].movementY = -Y/denom;
				hero.shots--;
			}
			break;
        case 4:
			buttonSound();
			screen2();
			break;
    }
}, true);

function get(url, onsuccess) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if ((request.readyState == 4) && (request.status == 200))
            onsuccess(request);
    }
    request.open("GET", url, true);
    request.send();
}

var scoreArray = JSON.parse(getItem("scoreboard")) || [];
scoreArray.getMax = function(){
	return scoreArray.length > 0 ? scoreArray[0][2] : 0;
};
function scoreTable(){
	scoreArray.sort(function(a,b) {
		return a[2] - b[2];
	});
	
	var n, content = "";
	for(n = 0; n < scoreArray.length; n++){
		content += "<tr><td>" + scoreArray[n][0] + "</td>" + "<td>" + scoreArray[n][1] + "</td>" + "<td>" + scoreArray[n][2] + "</td></tr>";
	}
	document.getElementById("records").innerHTML = content;
}	

var loadedItems = 0, allItems = 17;
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

var map, m_objects, planets = [],
	w_coeff, h_coeff;

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 50;
document.getElementById("container").style.width = canvas.width;

// Объекты игры
var nickname,
	curr_level = 1,
	max_level = 3,
	levels = [5, 10, 15],
	mShots = [],
	hShots = [],
	modifier = 0,
	shield = 196,
	hero = {speed: 200, isDieing: false, image:0, shots:5},
	allmonsters = 0,
	monsters = [],
	introMonsters = [],
	monstersCaught = 0,
	timer,
	widthFactor = canvas.width * 0.001;

//----------------
//Графоний и карта
//----------------

//Карта
var planet_onload = function(obj, img){
	var planet = {img : img};
	
	planet.height = Math.round(obj.height * h_coeff);
	planet.width = Math.round(img.width * (planet.height /img.height));
				
	planet.x = Math.round(obj.x * w_coeff);
	planet.y = Math.round(obj.y * h_coeff);

	loadedItems++;
	planets.push(planet);
};

get("map.json", function(req) {
	map = JSON.parse(req.responseText);
	w_coeff = canvas.width / (map.width * map.tilewidth);
	h_coeff = canvas.height / (map.height * map.tileheight);
	
	m_objects = map.layers[1].objects;
	allItems += m_objects.length || 0;
	
	var n, obj, p_img;
	for (n = 0; n < m_objects.length; n++) {
		obj = m_objects[n];
		
		if(obj.name == "hero"){
			hero.x = obj.x * w_coeff;
			hero.y = obj.y * h_coeff;
			
			loadedItems++;
		}else{
			p_img = new Image();
            p_img.src = "images/planets/" + obj.name + ".png";
			p_img.onload = planet_onload(obj, p_img);
		}
	}
	
	console.log(hero);
	console.log(planets);
});

// Спрайты выстрелов
var hShotImage = new Image();
hShotImage.onload = function () {loadedItems++;};
hShotImage.src = "images/hShot.png";
var mShotImage = new Image();
mShotImage.onload = function () {loadedItems++;};
mShotImage.src = "images/mShot.png";

// Фон
var bgImage = new Image();
bgImage.onload = function () {loadedItems++;screen1();};
bgImage.src = "images/background.png";

// Спрайт игрока
var heroImage = [];
for(var i=0; i<3; i++) {
	heroImage[i] = new Image();
	heroImage[i].onload = function () {loadedItems++;};
	heroImage[i].src = "images/hero"+i+".png";
}

// Спрайт пришельцев
var monsterImage=[];
for(var i=0; i<11; i++) {
    monsterImage[i] = new Image();
    monsterImage[i].onload = function () {loadedItems++;};
    monsterImage[i].src = "images/monster"+i+".png";
}

// Ввод никнейма
function Start(){
	nickname = document.getElementById("nick").value;
	if (nickname.length > 0) {
		document.getElementById("myModal").style.display = "none";
	}
}

// Пришелец в случайном месте
function monsterIntro(){
	if(allmonsters < levels[curr_level - 1]){
		var i = introMonsters.length;
		introMonsters[i] = {};
		introMonsters[i].destX = Math.random() * (canvas.width - 64);
		introMonsters[i].destY = Math.random() * (canvas.height - 64);
		//var x, y;
		var speed = 1000 * widthFactor;
		while(
			(introMonsters[i].destX+90) > hero.x
			&& introMonsters[i].destX < (hero.x+90)
			&& (introMonsters[i].destY+90) > hero.y
			&& introMonsters[i].destY < (hero.y+90)
		){
			introMonsters[i].destX = Math.random() * (canvas.width - 64);
			introMonsters[i].destY = Math.random() * (canvas.height - 64);
		}
		
		if (introMonsters[i].destX < (canvas.width * 0.5)){
			introMonsters[i].x = 0;
		} else {
			introMonsters[i].x = canvas.width-64;
		}
		if (introMonsters[i].destY < (canvas.height * 0.5)){
			introMonsters[i].y = 0;
		} else {
			introMonsters[i].y = canvas.height-64;
		}
		var X = introMonsters[i].x - introMonsters[i].destX+32;
		var Y = introMonsters[i].y - introMonsters[i].destY+32;
		var denom = Math.sqrt(X*X+Y*Y)/speed;
		introMonsters[i].movementX = -X/denom;
		introMonsters[i].movementY = -Y/denom;
		introMonsters[i].image = Math.floor((Math.random() * 2));
		
		allmonsters++;
	}else{
		allmonsters = 0;
	}
}

var interval = setInterval(monsterAddIn,3000/curr_level); //Каждые 4 секунды новый пришелец
function monsterAddIn(){
	if(screen == 3)
		monsterIntro();
}

// Цикл игры - перемещения, выстрелы и тд
var RAN=0, wavingHand=0, explosion=0, chance = 1;
function update() {
	switch(hero.image){
		case 0:
			shield+=100*modifier;
			if(shield > 196)
				shield = 196;
			break;
		case 1:
			shield-=50*modifier;
			if(shield<=0){ 
				delete keysDown[32]; 
				shield = -500; 
			}
			break;
	}
	if(hero.image !== 2) { // Если не второй спрайт - игрок жив
		if (87 in keysDown) { // W
			hero.y -= hero.speed * modifier*widthFactor;
		}
		if (83 in keysDown) { // S
			hero.y += hero.speed * modifier*widthFactor;
		}
		if (65 in keysDown) { // A
			hero.x -= hero.speed * modifier*widthFactor;
		}
		if (68 in keysDown) { // D
			hero.x += hero.speed * modifier*widthFactor;
		}
		if (16 in keysDown && shield > 0) { // SHIFT
			hero.image = 1;
		}
		else{
			hero.image = 0;
		}
		
		if(hero.x > canvas.width-64)hero.x=canvas.width-64;
		if(hero.x < 0)hero.x=0;
		if(hero.y > canvas.height-64)hero.y=canvas.height-64;
		if(hero.y < 0)hero.y=0;
	}
	else{
		if(hero.y > canvas.height)
			screen4(false); // Игрока подбили, он улетает за пределы игровой области -> экран конца игры
		hero.y+=400*modifier;
	}
	for(i in mShots){
        mShots[i].y += mShots[i].movementY*modifier;
        mShots[i].x += mShots[i].movementX*modifier;
        if(mShots[i].x > canvas.width-2 || mShots[i].x < -2 || mShots[i].y > canvas.height-2 || mShots[i].y < -2){
            mShots.splice(i,1);
        }
		else if(hero.x<mShots[i].x+2 && hero.x+64>mShots[i].x+2 && hero.y<mShots[i].y+2 && hero.y+64>mShots[i].y+2){
			if(hero.image){// Включен щит
				hero.shots++;
				mShots.splice(i,1);
			}
			else{
				EFsound();
				mShots.splice(i,1);
				hero.image = 2;
			}
		}
    }
	for(i in hShots){
        hShots[i].y += hShots[i].movementY*modifier;
        hShots[i].x += hShots[i].movementX*modifier;
        if(hShots[i].x > canvas.width-2 || hShots[i].x < -2 || hShots[i].y > canvas.height-2 || hShots[i].y < -2 ){
            hShots.splice(i,1);
        }
    }
	
	// Движение пришельцев
    for(var i in introMonsters){
        introMonsters[i].x += introMonsters[i].movementX*modifier;
        introMonsters[i].y += introMonsters[i].movementY*modifier;
        if(introMonsters[i].x<=introMonsters[i].destX+40 && introMonsters[i].x>=introMonsters[i].destX-40){
            var monster = introMonsters[i];
            introMonsters.splice(i,1);
            var n = monsters.length;
            monsters[n] = {};
            monsters[n].shoot = Math.floor((Math.random() * 2))==1? true : false;
            monsters[n].x = monster.x;
            monsters[n].y = monster.y;
            monsters[n].movementY=((Math.random() * 200)-99);
	        monsters[n].movementX=((Math.random() * 200)-99);
            monsters[n].image = monster.image;
        }
    }
	chance-=(0.0000000000023 * modifier);
	if(Math.random() > chance) monsterIntro(); 
	wavingHand+=modifier;
	if(wavingHand > 0.05) {wavingHand = 0;}
	explosion+=modifier;
	if(explosion > 0.03) {explosion = 0;}
	for(i in monsters){
        if(monsters[i].shoot){
            if(Math.random() > 0.994){ // Выстрелы 
                var s = mShots.length;
                mShots[s] = {};
                mShots[s].x = monsters[i].x+47;
                mShots[s].y = monsters[i].y+2;
	            var speed = 100*widthFactor;
                var X = mShots[s].x-hero.x-32;
                var Y = mShots[s].y-hero.y-32;
                var denom = Math.sqrt(X*X+Y*Y)/speed;
                mShots[s].movementX = -X/denom;
                mShots[s].movementY = -Y/denom;
	        }
	        // Куда направится пришелец
	        if(Math.random() > 0.95){ // Смена направления
		        monsters[i].movementY = ((Math.random() * 200) - 99) * widthFactor;
		        monsters[i].movementX = ((Math.random() * 200) - 99) * widthFactor;
	        }
        } else {
            var speed = 120 * widthFactor;
            var X = monsters[i].x - hero.x-32;
            var Y = monsters[i].y - hero.y-32;
            var denom = Math.sqrt(X*X+Y*Y)/speed;
            monsters[i].movementX = -X/denom;
            monsters[i].movementY = -Y/denom;
        }
	    // Движение пришельца
	    monsters[i].x += monsters[i].movementX*modifier;
	    monsters[i].y += monsters[i].movementY*modifier;
	    // Не выходим за рамки дозволенного =)
	    if(monsters[i].x > canvas.width-64)monsters[i].x=canvas.width-64;
	    if(monsters[i].x < 0)monsters[i].x=0;
	    if(monsters[i].y > canvas.height-64)monsters[i].y=canvas.height-64;
	    if(monsters[i].y < 0)monsters[i].y=0;
	    for(n in hShots){
		    if(
                monsters[i].x < hShots[n].x+2
                && monsters[i].x+64 > hShots[n].x+2
                && monsters[i].y < hShots[n].y+2
                && monsters[i].y+64 > hShots[n].y+2
                && monsters[i].image < 2
            ){
                hero.shots++;
		        ++monstersCaught;
		        explosionSound();
		        monsters[i].image = 2;
		        hShots.splice(n,1);
		    }
	    }
	    // Соприкосновение игрока и пришельца
	    if (hero.x <= (monsters[i].x + 64)&& monsters[i].x <= (hero.x + 64)&& hero.y <= (monsters[i].y + 64)&& monsters[i].y <= (hero.y + 64)&&monsters[i].image<2) {
		    explosionSound();
		    monstersCaught++;
            hero.shots++;
		    monsters[i].image = 2;
		    if(!hero.image){
			    hero.image = 2;
		    }
	    }
	    if(monsters[i].image > 1){
		    //Взрыв
		    if(!explosion){
		        monsters[i].image++;
		        if(monsters[i].image == 11){
			        monsters.splice(i,1);
		        }
		    }
	    }
	    else if(!wavingHand){
		    //Приветливые пришельцы (машут руками)
		    if (monsters[i].image == 1) monsters[i].image = 0;
		    else monsters[i].image = 1;
	    }
	}
	
	if(monstersCaught == levels[curr_level - 1]){
		clearInterval(interval);
		monstersCaught = 0;
		if(curr_level == max_level){
			screen4(true);
		}else{
			levelupsound();
			curr_level++;
		}
		
		interval = setInterval(monsterAddIn,3000/curr_level)
	}
}

//---------
//Отрисовка
//---------
function render() {
	//Фон
    ctx.drawImage(bgImage, 0, 0);
	
	//Планеты
	renderPlaners();
	
	//Игрок
	ctx.drawImage(heroImage[hero.image], Math.round(hero.x), Math.round(hero.y));
	
	//Монстры
    for(i in introMonsters){
		ctx.drawImage(monsterImage[introMonsters[i].image], Math.round(introMonsters[i].x), Math.round(introMonsters[i].y));
	}
	for(i in monsters){
		ctx.drawImage(monsterImage[monsters[i].image], Math.round(monsters[i].x), Math.round(monsters[i].y));
	}
	
	//Выстрелы
    for(i in mShots){
        ctx.drawImage(mShotImage, Math.round(mShots[i].x), Math.round(mShots[i].y));
    }
    for(i in hShots){
        ctx.drawImage(hShotImage, Math.round(hShots[i].x), Math.round(hShots[i].y));
    }
	
	// Счёт, выстрелы, заряд щита
	ctx.fillStyle = '#FFF';
	ctx.font = "24px avg";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("wave: " + curr_level + " ammo: "+hero.shots+" killed: "+monstersCaught+"/"+levels[curr_level - 1], 32, 64);
  	ctx.fillRect(32,32,200,16);
  	ctx.fillStyle = '#00F';
  	ctx.fillRect(34,34,shield < 0 ? 0 : shield,12);
}

function renderPlaners(){
	var i, pl;
	for(i = 0; i < planets.length; i++){
		pl = planets[i];
		ctx.drawImage(pl.img, pl.x, pl.y, pl.width, pl.height);
	}
}

//---------------
//Интерфейсы игры
//---------------
var bgX=0, bgY=0, phase=1, screen=1, then = 0.001;


//API для анимации, в зависимости от браузера
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback, element) {
            window.setTimeout(callback, 1000 / 60);
        }
}

// Начальный интерфейс
function screen1(){
    document.querySelector("canvas").setAttribute("class","");
    
	document.getElementById("SC1").pause();
    document.getElementById("intro").play();
	if(document.getElementById("SC1").currentTime) document.getElementById("SC1").currentTime = 0;
	
    screen=1;
	screen1loop();
}

function screen1loop() {
	ctx.drawImage(bgImage, 0, 0);
	
    var score = "Best time: " + scoreArray.getMax();
    score.length*canvas.width*0.006;
	ctx.fillStyle = '#FFF';
    ctx.font = canvas.width*0.03+"px avg";
    ctx.fillText(score, canvas.width*0.5-score.length*canvas.width*0.0075, canvas.height*0.7);
	ctx.fillRect(canvas.width*0.4, canvas.height*0.4, canvas.width*0.2, canvas.width*0.1);
	ctx.fillStyle = '#000';
	ctx.font = canvas.width*0.1+"px avg";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("PLAY", canvas.width*0.402, canvas.height*0.407);
    //if(screen == 1)requestAnimationFrame(screen1loop);
}

// Промежуточный интерфес для проверки загрузки объектов и спрайтов
function screen2()  {
	screen = 2;
	
	screen2loop();
}

function screen2loop(){
	if(loadedItems == allItems) { // Всё збс, стартуем!
		screen3();
	}
	else{ // Бл*ть, кто-то спёр картинки
		ctx.drawImage(bgImage,0,0);
		var i;
		for(i = 0; i < planets.length; i++){
			ctx.drawImage(planets[i].img, planets[i].x, planets[i].y, planets[i].width, planets[i].height);
		}
		ctx.fillStyle = "rgb(250, 250, 250)";
		ctx.font = "24px avg";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(allItems - loadedItems + " things left to load", canvas.width/2-130, canvas.height/2-40);
		requestAnimationFrame(screen2loop);
	}
}

// Пошла жара
function screen3() {
    // Эй диджей, у тебя что за херня играет?
    document.getElementById("intro").pause();
	document.getElementById("intro").currentTime = 0;
	document.getElementById("end").pause();
    document.getElementById("SC1").play();
    
    // Сброс игровых переменных
    screen = 3;
	chance = 1;
	curr_level = 1;
	shield = 196;
    hero.image = 0;
	hero.isDieing = false;
    hero.shots = 2;
    monstersCaught = 0;
	hShots = [];
	mShots = [];
	monsters = [];
	timer = new Date().getTime();
    
    screen3loop();
}

function screen3loop() {
	var now = Date.now();
	var delta = now - then;
    modifier = delta / 1000;
	update();
	render();

	then = now;

	// Анимация
	if (screen == 3){
		requestAnimationFrame(screen3loop);
	}
}

// Всё, наигрались (Game Over)
var msg = "GAME OVER";
function screen4(game_end){
	screen = 4;
    canvas.setAttribute("class","");
	timer = Math.round((new Date().getTime() - timer)/1000);
	
	if(game_end){
		endsound();
		msg = "GOOD JOB!";
		
		var date = new Date(), time = date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
		scoreArray.push([time, nickname, timer]);
		setItem("scoreboard", JSON.stringify(scoreArray));
		scoreTable();
	}else{
		msg = "GAME OVER";
		gameoversound();
	}
	screen4loop();
}

function screen4loop(end){
	if(screen == 4){
		var textSize = canvas.width*0.1;
		var textWidth = textSize*5;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.drawImage(bgImage, 0, 0);
		renderPlaners()
		ctx.fillStyle = "white";
		ctx.font = textSize+"px avg";
		ctx.fillText(msg, (canvas.width-textWidth)*0.55, (canvas.height-textSize)*0.4);
        ctx.font = textSize*0.4+"px avg";
		ctx.textBaseline = "bottom";
		ctx.fillText("Time: " + timer, 32, canvas.height-32);
        ctx.fillRect(canvas.width*0.36, canvas.height*0.7, canvas.width*0.27, canvas.width*0.05);
        ctx.fillStyle = "black";
        ctx.font = canvas.width*0.05+"px avg";
        ctx.textBaseline = "top";
        ctx.fillText("play again", canvas.width*0.37, canvas.height*0.7);
		requestAnimationFrame(screen4loop);
	}
}

// Звуки
function buttonSound(){
	document.getElementById("clickSound").play();
}
function explosionSound(){
	document.getElementById("explosionSound").currentTime = 0;
	document.getElementById("explosionSound").play();
}
function shotSound(){
	if(document.getElementById("shotSound").currentTime)
		document.getElementById("shotSound").currentTime = 0;
	document.getElementById("shotSound").play();
}
function EFsound(){
	document.getElementById("engineFail").play();
}
function levelupsound(){
	document.getElementById("levelup").play();
}
function gameoversound(){
	document.getElementById("SC1").pause();
	document.getElementById("intro").play();
}
function endsound(){
	document.getElementById("SC1").pause();
	document.getElementById("end").play();
}

// Локальное хранилище
function getItem(item){
	if(localStorage)
		return localStorage.getItem(item);
	else
		return null;
}

function setItem(item, val){
	if(localStorage){
		localStorage.setItem(item, val);
	}
}
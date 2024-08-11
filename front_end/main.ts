var globalSprite: Sprite[] = [];

class Sprite {
	id: string;
	name: string;
	x: number;
	y: number;
	speed: number;
	image: HTMLImageElement;
	update: () => void;
	onclick: (x:number,y:number) => void;
	dest_x: number;
	dest_y: number;
	
	constructor(name:string, id:string,x:number, y:number , image_url: string, update_method: () => void, onclick_method: (x:number,y:number) => void) {
		this.id = id;
		this.name = name;
		this.x = x;
		this.y = y;
		this.dest_x = 0;
		this.dest_y = 0;
        this.speed = 4;
		this.image = new Image();
		this.image.src = image_url;
		this.update = update_method;
		this.onclick = onclick_method;
	}

	set_destination(x:number, y:number) {
		this.dest_x = x;
		this.dest_y = y;
	}

	ignore_click(x:number, y:number) {
	}

	move(dx:number, dy:number) {
		this.dest_x = this.x + dx;
		this.dest_y = this.y + dy;
	}

	go_toward_destination() {
		if(this.dest_x === undefined)
			return;

		if(this.x < this.dest_x)
			this.x += Math.min(this.dest_x - this.x, this.speed);
		else if(this.x > this.dest_x)
			this.x -= Math.min(this.x - this.dest_x, this.speed);
		if(this.y < this.dest_y)
			this.y += Math.min(this.dest_y - this.y, this.speed);
		else if(this.y > this.dest_y)
			this.y -= Math.min(this.y - this.dest_y, this.speed);
	}

	sit_still() {
	}
}

interface HttpPostCallback {
	(x:any): any;
}


const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
const g_id = random_id(12);
var g_name = "";
const thing_names = [
	"chair", // 0
	"lamp",
	"mushroom", // 2
	"outhouse",
	"pillar", // 4
	"pond",
	"rock", // 6
	"statue",
	"tree", // 8
	"turtle",
];




// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
	let request = new XMLHttpRequest();
	request.onreadystatechange = () => {
		if(request.readyState === 4)
		{
			if(request.status === 200) {
				let response_obj;
				try {
					response_obj = JSON.parse(request.responseText);
				} catch(err) {}
				if (response_obj) {
					callback(response_obj);
				} else {
					callback({
						status: 'error',
						message: 'response is not valid JSON',
						response: request.responseText,
					});
				}
			} else {
				if(request.status === 0 && request.statusText.length === 0) {
					callback({
						status: 'error',
						message: 'connection failed',
					});
				} else {
					callback({
						status: 'error',
						message: `server returned status ${request.status}: ${request.statusText}`,
					});
				}
			}
		}
	};
	
	request.open('post', `${g_origin}/${page_name}`, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(payload));
}




class Model {
	sprites: Sprite[] = [];
	blueRobot: Sprite;


	constructor() {
		this.sprites = [];
		this.sprites = globalSprite;
		this.blueRobot = new Sprite(g_name, g_id, 50, 50, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
		this.sprites.push(this.blueRobot);
	}

	update() {
		for (const sprite of this.sprites) {
			sprite.update();
		}
	}

	onclick(x: number, y: number) {
		for (const sprite of this.sprites) {
			if(sprite.id == g_id){
				sprite.onclick(x , y);
			}
		}
	}

	move(dx: number, dy: number) {
		this.blueRobot.move(dx, dy);
	}
}



class View
{
	model: Model; 
	canvas: HTMLCanvasElement;
	turtle: HTMLImageElement;
	ctx: CanvasRenderingContext2D;
	g_scroll_x: number
	g_scroll_y: number

	constructor(model: Model) {
		this.model = model;
		this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this.turtle = new Image();
		this.turtle.src = "turtle.png";
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.g_scroll_x = 0;
		this.g_scroll_y = 0;
	}

	update() {
		this.ctx.clearRect(0, 0, 1000, 500);
		for (const sprite of this.model.sprites) {
			const adjustedx = sprite.x - sprite.image.width / 2 - this.g_scroll_x;
			const adjustedy = sprite.y - sprite.image.height - this.g_scroll_y;
			this.ctx.drawImage(sprite.image, adjustedx, adjustedy);
			this.ctx.font = "20px Verdana";
			this.ctx.fillText(sprite.name, adjustedx, adjustedy);
		}
	}
}




class Controller
{
	model: Model;
	view: View;
	key_right: Boolean;
	key_left: Boolean;
	key_up: Boolean;
	key_down: Boolean;

	constructor(model: Model, view: View) {
		this.model = model;
		this.view = view;
		this.key_right = false;
		this.key_left = false;
		this.key_up = false;
		this.key_down = false;
		let self = this;
		view.canvas.addEventListener("click", function(event) { self.onClick(event); });
		document.addEventListener('keydown', function(event) { self.keyDown(event); }, false);
		document.addEventListener('keyup', function(event) { self.keyUp(event); }, false);
	}

	onClick(event: MouseEvent) {
		const x = event.pageX - this.view.canvas.offsetLeft + this.view.g_scroll_x;
		const y = event.pageY - this.view.canvas.offsetTop + this.view.g_scroll_y;
		this.model.onclick(x, y);
		httpPost('ajax.html', {
			id: g_id,
			action: 'move',
			x: x,
			y: y,
			name: g_name,
		}, this.onAcknowledgeClick);
	}

	keyDown(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = true;
		else if(event.keyCode == 37) this.key_left = true;
		else if(event.keyCode == 38) this.key_up = true;
		else if(event.keyCode == 40) this.key_down = true;
	}

	keyUp(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = false;
		else if(event.keyCode == 37) this.key_left = false;
		else if(event.keyCode == 38) this.key_up = false;
		else if(event.keyCode == 40) this.key_down = false;
	}

	update() {
		let dx = 0;
		let dy = 0;
        let speed = this.model.blueRobot.speed;
		if(this.key_right) dx += speed;
		if(this.key_left) dx -= speed;
		if(this.key_up) dy -= speed;
		if(this.key_down) dy += speed;
		if(dx != 0 || dy != 0)
			this.model.move(dx, dy);
	}

	onAcknowledgeClick(ob: any) {
		console.log(`Response to move: ${JSON.stringify(ob)}`);
	}

	on_recieve_updates(ob:any){
		console.log(`ob: ${JSON.stringify(ob)}`);
		var goldID = document.getElementById('gold');
		var bananasID = document.getElementById('bananas');
		var chatWindow = document.getElementById('chatWindow');

		let gold = ob["gold"];
		let bananas = ob["bananas"];

		if(goldID != null){
			goldID.textContent = gold;
		}
		if(bananasID != null){
			bananasID.textContent = bananas;
		}

		for(let i = 0; i < ob.updates.length; i++){
			let up = ob.updates[i];
			let id = up["id"];
			let x = up["x"];
			let y = up["y"];
			let name = up["name"];

			console.log(up);


			// find sprite with id
			// if there is no sprite make a sprite
			// sprite.setDestination

			for(let j = 0; j < this.model.sprites.length; j++)
			{
				console.log(this.model.sprites);
				if(this.model.sprites[j].id == id){
					this.model.sprites[j].set_destination(x,y);
					return;
				}
			}
			let greenBot = new Sprite(name,id,50, 50, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
			this.model.sprites.push(greenBot);
		}

		for(var i = 0; i < ob.chats.length; i++){
			let chatMessage = ob.chats[i];
			if (chatWindow != null) {
				// Assuming 'chatWindow' is a select element
				// Append each chat message as a new option
				let option = document.createElement("option");
				option.text = chatMessage;
				chatWindow.appendChild(option);

				option.scrollIntoView()
			}
		}
		
	}

	requests_updates(){
		let payload = {
			id: g_id,
			action: 'update'
		}
		httpPost('ajax.html', payload, (ob) => this.on_recieve_updates(ob));
	}

	
}







class Game {
	model: Model;
	view: View;
	controller: Controller;
	last_updates_request_time: number;
	constructor() {
		this.model = new Model();
		this.view = new View(this.model);
		this.controller = new Controller(this.model, this.view);
		this.last_updates_request_time = 0;
		
	}

	onTimer() {
		this.controller.update();
		this.model.update();
		this.view.update();
		const time = Date.now();
		
		const center_x = 500;
		const center_y = 270;
		const scroll_rate = 0.03;

		this.view.g_scroll_x += scroll_rate * (this.model.blueRobot.x - this.view.g_scroll_x - center_x);
		this.view.g_scroll_y += scroll_rate * (this.model.blueRobot.y - this.view.g_scroll_y - center_y);

		if (time - this.last_updates_request_time >= 1000) {
		  this.last_updates_request_time = time;
		  this.controller.requests_updates();
		}
	}



}


function canvas(){
	let s: string[] = [];

	var goldAndBananas = `<br><big><big><b>
	Gold: <span id="gold">0</span>,
	Bananas: <span id="bananas">0</span>
	</b></big></big><br>
	`;

	var chatBox = `<br>
	<select id="chatWindow" size="8" style="width:1000px"></select>
	<br>
	<input type="input" id="chatMessage"></input>
	<button onclick="postChatMessage()">Post</button>
	`;

	s.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc; background-color: green;">`);
	s.push(`</canvas>`);
	s.push(goldAndBananas);
	s.push(chatBox);
	const content = document.getElementById('content');


	if (content !== null) {
		var input = (<HTMLInputElement>document.getElementById('name')).value;
		g_name = input;
		content.innerHTML = s.join('');
  	} else {
		console.error("Element with ID 'content' not found.");
  	}

}	

function postChatMessage(){
	const chatText = document.getElementById('chatMessage');
	var chatMessage = ""
	if(chatText != null){
		chatMessage = (<HTMLInputElement>document.getElementById('chatMessage')).value;
	}

	httpPost('ajax.html', {
		id: g_id,
		action: 'chat',
		text: chatMessage
	}, (ob) => grabChat(ob));

	if (chatText != null) {
		(<HTMLInputElement>chatText).value = "";
	}
}

function grabChat(ob: any){
	console.log(`ob: ${JSON.stringify(ob)}`);
}

function insertHTML(){
	var content = document.getElementById("content");

    
    var backstoryHTML = `
        <h2>Banana Quest: The Potassium Crisis</h2>
        <p>In a land known as "Fruitopia," the inhabitants thrived on the delicious and nutritious fruits that grew abundantly. 
		One fruit, in particular, was highly treasured - the mighty banana. 
		Fruitopia's inhabitants had always enjoyed the health benefits and energy provided by this potassium-rich treat, 
		which fueled their daily adventures and brought joy to their lives.</p>
		<p>But one day, a mysterious phenomenon occurred: the banana crops across Fruitopia began to wither, 
		and the supply of this essential fruit dwindled rapidly.
		As the days passed, the once energetic and lively inhabitants of Fruitopia started to feel weak and fatigued. 
		The doctors and scientists of the land quickly identified the cause - a severe potassium deficiency was spreading among the residents, 
		and it threatened to plunge Fruitopia into a state of perpetual lethargy.
		Desperate to restore the health and vitality of their beloved land, 
		the citizens of Fruitopia are turning to you to help them find 20 bananas.
		The fate of Fruitopia hangs in the balance.</p>
		<p>tl;dr: Find 20 bananas to win.</p>
    `;

    var nameInputHTML = `
        <label for="name">Enter your name:</label>
        <input type="text" id="name">
        <button onclick="start()">Start</button>
    `;




    
    var combinedHTML = backstoryHTML + nameInputHTML;

	if(content != null){
    	content.innerHTML = combinedHTML;
	}

	httpPost('ajax.html', {
		action: 'get_map',
	}, ob => onReceiveMap(ob));

}

function onReceiveMap(ob : any){
	console.log(`ob: ${JSON.stringify(ob)}`);

	for(var i = 0; i < ob.map.things.length; i++){
		var object = ob.map.things[i];

		var kind = object["kind"];
		var x = object["x"];
		var y = object["y"];

		var image = `${thing_names[kind]}.png`

		let item = new Sprite("", "", x, y, image, Sprite.prototype.sit_still, Sprite.prototype.ignore_click)
		globalSprite.push(item);
	}

	
}

function start(){
	canvas();
	let game = new Game();
	let timer = setInterval(() => { game.onTimer(); }, 40);
}

insertHTML();







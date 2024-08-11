"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var globalSprite = [];
var Sprite = /** @class */ (function () {
    function Sprite(name, id, x, y, image_url, update_method, onclick_method) {
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
    Sprite.prototype.set_destination = function (x, y) {
        this.dest_x = x;
        this.dest_y = y;
    };
    Sprite.prototype.ignore_click = function (x, y) {
    };
    Sprite.prototype.move = function (dx, dy) {
        this.dest_x = this.x + dx;
        this.dest_y = this.y + dy;
    };
    Sprite.prototype.go_toward_destination = function () {
        if (this.dest_x === undefined)
            return;
        if (this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if (this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    };
    Sprite.prototype.sit_still = function () {
    };
    return Sprite;
}());
var random_id = function (len) {
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return __spreadArray([], Array(len), true).reduce(function (a) { return a + p[Math.floor(Math.random() * p.length)]; }, '');
};
var g_origin = new URL(window.location.href).origin;
var g_id = random_id(12);
var g_name = "";
var thing_names = [
    "chair",
    "lamp",
    "mushroom",
    "outhouse",
    "pillar",
    "pond",
    "rock",
    "statue",
    "tree",
    "turtle",
];
// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
var httpPost = function (page_name, payload, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var response_obj = void 0;
                try {
                    response_obj = JSON.parse(request.responseText);
                }
                catch (err) { }
                if (response_obj) {
                    callback(response_obj);
                }
                else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            }
            else {
                if (request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                }
                else {
                    callback({
                        status: 'error',
                        message: "server returned status ".concat(request.status, ": ").concat(request.statusText),
                    });
                }
            }
        }
    };
    request.open('post', "".concat(g_origin, "/").concat(page_name), true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
};
var Model = /** @class */ (function () {
    function Model() {
        this.sprites = [];
        this.sprites = [];
        this.sprites = globalSprite;
        this.blueRobot = new Sprite(g_name, g_id, 50, 50, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
        this.sprites.push(this.blueRobot);
    }
    Model.prototype.update = function () {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.update();
        }
    };
    Model.prototype.onclick = function (x, y) {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            if (sprite.id == g_id) {
                sprite.onclick(x, y);
            }
        }
    };
    Model.prototype.move = function (dx, dy) {
        this.blueRobot.move(dx, dy);
    };
    return Model;
}());
var View = /** @class */ (function () {
    function View(model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
        this.ctx = this.canvas.getContext("2d");
        this.g_scroll_x = 0;
        this.g_scroll_y = 0;
    }
    View.prototype.update = function () {
        this.ctx.clearRect(0, 0, 1000, 500);
        for (var _i = 0, _a = this.model.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            var adjustedx = sprite.x - sprite.image.width / 2 - this.g_scroll_x;
            var adjustedy = sprite.y - sprite.image.height - this.g_scroll_y;
            this.ctx.drawImage(sprite.image, adjustedx, adjustedy);
            this.ctx.font = "20px Verdana";
            this.ctx.fillText(sprite.name, adjustedx, adjustedy);
        }
    };
    return View;
}());
var Controller = /** @class */ (function () {
    function Controller(model, view) {
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        var self = this;
        view.canvas.addEventListener("click", function (event) { self.onClick(event); });
        document.addEventListener('keydown', function (event) { self.keyDown(event); }, false);
        document.addEventListener('keyup', function (event) { self.keyUp(event); }, false);
    }
    Controller.prototype.onClick = function (event) {
        var x = event.pageX - this.view.canvas.offsetLeft + this.view.g_scroll_x;
        var y = event.pageY - this.view.canvas.offsetTop + this.view.g_scroll_y;
        this.model.onclick(x, y);
        httpPost('ajax.html', {
            id: g_id,
            action: 'move',
            x: x,
            y: y,
            name: g_name,
        }, this.onAcknowledgeClick);
    };
    Controller.prototype.keyDown = function (event) {
        if (event.keyCode == 39)
            this.key_right = true;
        else if (event.keyCode == 37)
            this.key_left = true;
        else if (event.keyCode == 38)
            this.key_up = true;
        else if (event.keyCode == 40)
            this.key_down = true;
    };
    Controller.prototype.keyUp = function (event) {
        if (event.keyCode == 39)
            this.key_right = false;
        else if (event.keyCode == 37)
            this.key_left = false;
        else if (event.keyCode == 38)
            this.key_up = false;
        else if (event.keyCode == 40)
            this.key_down = false;
    };
    Controller.prototype.update = function () {
        var dx = 0;
        var dy = 0;
        var speed = this.model.blueRobot.speed;
        if (this.key_right)
            dx += speed;
        if (this.key_left)
            dx -= speed;
        if (this.key_up)
            dy -= speed;
        if (this.key_down)
            dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
    };
    Controller.prototype.onAcknowledgeClick = function (ob) {
        console.log("Response to move: ".concat(JSON.stringify(ob)));
    };
    Controller.prototype.on_recieve_updates = function (ob) {
        console.log("ob: ".concat(JSON.stringify(ob)));
        var goldID = document.getElementById('gold');
        var bananasID = document.getElementById('bananas');
        var chatWindow = document.getElementById('chatWindow');
        var gold = ob["gold"];
        var bananas = ob["bananas"];
        if (goldID != null) {
            goldID.textContent = gold;
        }
        if (bananasID != null) {
            bananasID.textContent = bananas;
        }
        for (var i_1 = 0; i_1 < ob.updates.length; i_1++) {
            var up = ob.updates[i_1];
            var id = up["id"];
            var x = up["x"];
            var y = up["y"];
            var name_1 = up["name"];
            console.log(up);
            // find sprite with id
            // if there is no sprite make a sprite
            // sprite.setDestination
            for (var j = 0; j < this.model.sprites.length; j++) {
                console.log(this.model.sprites);
                if (this.model.sprites[j].id == id) {
                    this.model.sprites[j].set_destination(x, y);
                    return;
                }
            }
            var greenBot = new Sprite(name_1, id, 50, 50, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
            this.model.sprites.push(greenBot);
        }
        for (var i = 0; i < ob.chats.length; i++) {
            var chatMessage = ob.chats[i];
            if (chatWindow != null) {
                // Assuming 'chatWindow' is a select element
                // Append each chat message as a new option
                var option = document.createElement("option");
                option.text = chatMessage;
                chatWindow.appendChild(option);
                option.scrollIntoView();
            }
        }
    };
    Controller.prototype.requests_updates = function () {
        var _this = this;
        var payload = {
            id: g_id,
            action: 'update'
        };
        httpPost('ajax.html', payload, function (ob) { return _this.on_recieve_updates(ob); });
    };
    return Controller;
}());
var Game = /** @class */ (function () {
    function Game() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
        this.last_updates_request_time = 0;
    }
    Game.prototype.onTimer = function () {
        this.controller.update();
        this.model.update();
        this.view.update();
        var time = Date.now();
        var center_x = 500;
        var center_y = 270;
        var scroll_rate = 0.03;
        this.view.g_scroll_x += scroll_rate * (this.model.blueRobot.x - this.view.g_scroll_x - center_x);
        this.view.g_scroll_y += scroll_rate * (this.model.blueRobot.y - this.view.g_scroll_y - center_y);
        if (time - this.last_updates_request_time >= 1000) {
            this.last_updates_request_time = time;
            this.controller.requests_updates();
        }
    };
    return Game;
}());
function canvas() {
    var s = [];
    var goldAndBananas = "<br><big><big><b>\n\tGold: <span id=\"gold\">0</span>,\n\tBananas: <span id=\"bananas\">0</span>\n\t</b></big></big><br>\n\t";
    var chatBox = "<br>\n\t<select id=\"chatWindow\" size=\"8\" style=\"width:1000px\"></select>\n\t<br>\n\t<input type=\"input\" id=\"chatMessage\"></input>\n\t<button onclick=\"postChatMessage()\">Post</button>\n\t";
    s.push("<canvas id=\"myCanvas\" width=\"1000\" height=\"500\" style=\"border:1px solid #cccccc; background-color: green;\">");
    s.push("</canvas>");
    s.push(goldAndBananas);
    s.push(chatBox);
    var content = document.getElementById('content');
    if (content !== null) {
        var input = document.getElementById('name').value;
        g_name = input;
        content.innerHTML = s.join('');
    }
    else {
        console.error("Element with ID 'content' not found.");
    }
}
function postChatMessage() {
    var chatText = document.getElementById('chatMessage');
    var chatMessage = "";
    if (chatText != null) {
        chatMessage = document.getElementById('chatMessage').value;
    }
    httpPost('ajax.html', {
        id: g_id,
        action: 'chat',
        text: chatMessage
    }, function (ob) { return grabChat(ob); });
    if (chatText != null) {
        chatText.value = "";
    }
}
function grabChat(ob) {
    console.log("ob: ".concat(JSON.stringify(ob)));
}
function insertHTML() {
    var content = document.getElementById("content");
    var backstoryHTML = "\n        <h2>Banana Quest: The Potassium Crisis</h2>\n        <p>In a land known as \"Fruitopia,\" the inhabitants thrived on the delicious and nutritious fruits that grew abundantly. \n\t\tOne fruit, in particular, was highly treasured - the mighty banana. \n\t\tFruitopia's inhabitants had always enjoyed the health benefits and energy provided by this potassium-rich treat, \n\t\twhich fueled their daily adventures and brought joy to their lives.</p>\n\t\t<p>But one day, a mysterious phenomenon occurred: the banana crops across Fruitopia began to wither, \n\t\tand the supply of this essential fruit dwindled rapidly.\n\t\tAs the days passed, the once energetic and lively inhabitants of Fruitopia started to feel weak and fatigued. \n\t\tThe doctors and scientists of the land quickly identified the cause - a severe potassium deficiency was spreading among the residents, \n\t\tand it threatened to plunge Fruitopia into a state of perpetual lethargy.\n\t\tDesperate to restore the health and vitality of their beloved land, \n\t\tthe citizens of Fruitopia are turning to you to help them find 20 bananas.\n\t\tThe fate of Fruitopia hangs in the balance.</p>\n\t\t<p>tl;dr: Find 20 bananas to win.</p>\n    ";
    var nameInputHTML = "\n        <label for=\"name\">Enter your name:</label>\n        <input type=\"text\" id=\"name\">\n        <button onclick=\"start()\">Start</button>\n    ";
    var combinedHTML = backstoryHTML + nameInputHTML;
    if (content != null) {
        content.innerHTML = combinedHTML;
    }
    httpPost('ajax.html', {
        action: 'get_map',
    }, function (ob) { return onReceiveMap(ob); });
}
function onReceiveMap(ob) {
    console.log("ob: ".concat(JSON.stringify(ob)));
    for (var i = 0; i < ob.map.things.length; i++) {
        var object = ob.map.things[i];
        var kind = object["kind"];
        var x = object["x"];
        var y = object["y"];
        var image = "".concat(thing_names[kind], ".png");
        var item = new Sprite("", "", x, y, image, Sprite.prototype.sit_still, Sprite.prototype.ignore_click);
        globalSprite.push(item);
    }
}
function start() {
    canvas();
    var game = new Game();
    var timer = setInterval(function () { game.onTimer(); }, 40);
}
insertHTML();

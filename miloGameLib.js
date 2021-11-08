/** 
 * ====================================================================
 * 
 * Milo's Game Library
 * @author Milo Fisher
 * 
 * --------------------------------------------------------------------
 * 
 * What is this weird file?
 * 
 *    Just a shitty game library made to make vanilla JavaScript
 *    game-making easier.
 * 
 * --------------------------------------------------------------------
 * 
 * How do I use this file?
 * 
 *    All you have to do is slap this bad boy in the same folder
 *    as your main js script, then in your index.html make sure to
 *    add this as a script BELOW your main js script, and also, add
 *    the line <canvas id="canvas" width=720 height=360></canvas>
 *    above your main js script and voila!
 * 
 * --------------------------------------------------------------------
 * 
 * Ok, but how do I really USE this file?
 * 
 *    Well, since you asked, all you have to do is declare a
 *    function called start() and update() and BOOM there you go!
 *    Now you basically have Unity to work with (not really, please
 *    don't sue me)
 * 
 * --------------------------------------------------------------------
 * 
 * Mah Goodies (aka what you're really here for)
 * 
 * -Sprite(src, x, y, width, height, layer)
 * 
 * -RenderText(text, x, y, font, color, align, noFill, layer)
 * 
 * -Button(src, x, y, width, height, layer, functionCall, parameters)
 * 
 * -SpriteSheet(src, rows, columns)
 * 
 * -RenderAnimation(spriteSheet, x, y, width, height, fps, loop, layer)
 * 
 * Notes:
 * -Change visibility of objects with .visible
 * -Use destroy(object) to get stuff off the screen permanently
 * -Lower layer objects are rendered in front of higher layer objects
 * -Use .setLayer() to change layer of objects
 * -For Buttons, their render stuff is in their .sprite field
 * -Use RenderAnimations with .play(), .stop(), .resume(), or .pause()
 * 
 * ====================================================================
*/

// Declare canvas and its context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Game object
let GAME = {
    // Canvas area width
    WIDTH: canvas.width,
    // Canvas area height
    HEIGHT: canvas.height,
    // Update speed set to 60fps
    UPDATE_SPEED: 1000 / 60,
    // Assets Path
    ASSETS_PATH: "Assets/",
    // Paused can stop update from being called
    PAUSED: false,
    // Ticks keeps track of game update ticks
    TICKS: 0,
    // SpriteList holds all sprites
    RENDER_LIST: [],
    // Sprite ids
    RENDER_IDS: 0,
    // ButtonList holds all buttons
    BUTTON_LIST: [],
    // Flag set when adding new sprites or changing their layers
    NEED_LAYER_SORT: false,
};

// Start function called before update loop
start();

// Update loop called
setInterval(updateEngine, GAME.UPDATE_SPEED);
function updateEngine() {
    if(!GAME.PAUSED) {
        update();
        updateRenderObjects();
        GAME.TICKS++;
    }
}

// Function to redraw each image after update() is called
function updateRenderObjects() {
    // Clear old sprites first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Sort layers
    if (GAME.NEED_LAYER_SORT) { 
        GAME.RENDER_LIST.sort((a, b) => b.layer - a.layer);
        GAME.BUTTON_LIST.sort((a, b) => a.sprite.layer - b.sprite.layer);
        GAME.NEED_LAYER_SORT = false;
    }
    // Increment Button held ticks while button is held
    GAME.BUTTON_LIST.forEach(e => {
        if(e.heldDown) {
            e.heldTicks++;
        }
    });
    // Draw all rendered items
    GAME.RENDER_LIST.forEach(e => {
        // Draw Sprites
        if(e instanceof Sprite) {
            if (e.visible) {
                ctx.save();
                ctx.translate(e.x + e.width/2, e.y + e.height/2);
                ctx.rotate(e.rotation * Math.PI / 180);
                ctx.translate(-(e.x + e.width / 2), -(e.y + e.height / 2));
                ctx.drawImage(e.image, e.x, e.y, e.width, e.height);
                ctx.restore();
            }
        }
        // Draw Render Texts
        else if (e instanceof RenderText) {
            if (e.visible) {
                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.rotate(e.rotation * Math.PI / 180);
                ctx.font = e.font;
                ctx.fillStyle = e.color;
                ctx.textAlign = e.align;
                if(e.noFill) {
                    ctx.strokeText(e.text, 0, 0);
                }
                else {
                    ctx.fillText(e.text, 0, 0);
                }
                ctx.restore();
            }
        }
        // Draw Render Animations
        else if (e instanceof RenderAnimation) {
            if (e.isPlaying) {
                if (e.runtime % (60/e.fps) == 0 && e.runtime != 0) {
                    e.currentFrame++;
                    if (e.currentFrame >= e.spriteSheet.frames.length) {
                        if(e.loop){
                            e.currentFrame = 0;
                        }
                        else {
                            e.stop();
                        }
                    }
                }
                e.runtime++;
            }
            if (e.visible) {
                var frame = e.spriteSheet.frames[e.currentFrame];
                if(frame) {
                    ctx.drawImage(e.spriteSheet.image, frame.x, frame.y, frame.width, frame.height, e.x, e.y, e.width, e.height);
                }
            }
        }
    });
}

/**
 * A image composite of a grid of sprites.
 * @param {string} src The name of the source image.
 * @param {number} rows The number of rows of sprites in the sheet.
 * @param {number} columns The number of columns of sprites in the sheet.
 */
function SpriteSheet(src, rows, columns) {
    this.image = new Image();
    this.image.src = GAME.ASSETS_PATH + src;
    this.frames = [];
    this.image.onload = () => {
        var frameWidth = this.image.naturalWidth / columns;
        var frameHeight = this.image.naturalHeight / rows;
        for(var r = 0; r < rows; r++) {
            for(var c = 0; c < columns; c++) {
                this.frames.push({
                    x: c * frameWidth,
                    y: r * frameHeight,
                    width: frameWidth,
                    height: frameHeight
                });
            }
        }
    };
}

/**
 * An object that animates a sprite sheet.
 * @param {SpriteSheet} spriteSheet The sprite sheet to animate.
 * @param {number} x The x coordinate to draw the animation at.
 * @param {number} y The y coordinate to draw the animation at.
 * @param {number} width The width to draw the animation.
 * @param {number} height The height to draw the animation.
 * @param {number} fps The frames per second the animation will run at.
 * @param {boolean} loop Do you want the animation to loop?
 * @param {number} layer The layer to draw the animation at.
 */
function RenderAnimation(spriteSheet, x, y, width, height, fps, loop, layer) {
    this.spriteSheet = spriteSheet;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.loop = loop;
    this.layer = layer;
    this.visible = true;
    this.id = GAME.RENDER_IDS++;
    this.runtime = 0;
    this.currentFrame = 0;
    this.isPlaying = false;
    /**
     * A function to play an animation from its start.
     */
    this.play = () => {
        this.runtime = 0;
        this.currentFrame = 0;
        this.isPlaying = true;
    }
    /**
     * A function to stop an animation and reset it.
     */
    this.stop = () => {
        this.currentFrame = 0;
        this.isPlaying = false;
    }
    /**
     * A function to play an animation from its last frame.
     */
    this.resume = () => {
        this.runtime = 0;
        this.isPlaying = true;
    }
    /**
     * A function to stop an animation, keeping its current frame.
     */
    this.pause = () => {
        this.isPlaying = false;
    }
    /**
     * A function to change the rendered layer of this animation.
     * @param {number} layer The new layer to draw the animation at.
     */
    this.setLayer = (layer) => {
        this.layer = layer;
        GAME.NEED_LAYER_SORT = true;
    }
    GAME.RENDER_LIST.push(this);
    GAME.NEED_LAYER_SORT = true;
}

/**
 * A simple text object.
 * @param {string} text The text to display.
 * @param {number} x The x coordinate to draw the text at.
 * @param {number} y The y coordinate to draw the text at.
 * @param {string} font The size(px) and font of the text, example: "30px Arial".
 * @param {color} color The color to fill the text.
 * @param {string} align The alignment of the text: left, center, right.
 * @param {boolean} noFill Do you want only the text stroke?
 * @param {number} layer The layer to draw the text at.
 */
function RenderText(text, x, y, font, color, align, noFill, layer) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.font = font;
    this.color = color;
    this.align = align;
    this.noFill = noFill;
    this.layer = layer;
    this.rotation = 0;
    this.defaultVisibility = true;
    this.visible = true;
    this.id = GAME.RENDER_IDS++;
    /**
     * A function to change the rendered layer of this text.
     * @param {number} layer The new layer to draw the text at.
     */
    this.setLayer = (layer) => { this.layer = layer; GAME.NEED_LAYER_SORT = true; };

    GAME.RENDER_LIST.push(this);
    GAME.NEED_LAYER_SORT = true;
}

/**
 * A simple sprite object.
 * @param {string} src The name of the source image.
 * @param {number} x The x coordinate to draw the sprite at.
 * @param {number} y The y coordinate to draw the sprite at.
 * @param {number} width The width to draw the sprite.
 * @param {number} height The height to draw the sprite.
 * @param {number} layer The layer to draw the sprite at.
 */
function Sprite(src, x, y, width, height, layer) {
    this.image = new Image(this.width, this.height);
    this.image.src = GAME.ASSETS_PATH + src;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.rotation = 0;
    this.defaultVisibility = true;
    this.visible = true;
    this.id = GAME.RENDER_IDS++;
    /**
     * A function to change the rendered layer of this sprite.
     * @param {number} layer The new layer to draw the sprite at.
     */
    this.setLayer = (layer) => {this.layer = layer; GAME.NEED_LAYER_SORT = true;};

    GAME.RENDER_LIST.push(this);
    GAME.NEED_LAYER_SORT = true;
}

/**
 * A simple button object.
 * @param {string} src The name of the source image.
 * @param {number} x The x coordinate to draw the button at.
 * @param {number} y The y coordinate to draw the button at.
 * @param {number} width The width to draw the button.
 * @param {number} height The height to draw the button.
 * @param {number} layer The layer to draw the button at.
 * @param {() => {}} functionCall The function that gets called when the button is clicked.
 * @param {[]} parameters The parameters for functionCall.
 */
function Button(src, x, y, width, height, layer, functionCall = () => { }, parameters = []) {
    this.sprite = new Sprite(src, x, y, width, height, layer);
    this.enabled = true;
    this.defaultEnabled = true;
    this.heldDown = false;
    this.heldTicks = 0;
    this.functionCall = functionCall;
    this.parameters = parameters;

    GAME.BUTTON_LIST.push(this);
}

/**
 * A function to destroy a rendered object.
 * @param {any} object The object to be destroyed (Sprite, RenderText, RenderAnimation, Button).
 */
function destroy(object) {
    if (object == undefined) { return; }
    if(object instanceof Button) {
        for (var i = 0; i < GAME.BUTTON_LIST.length; i++) {
            if (object.sprite.id == GAME.BUTTON_LIST[i].sprite.id) {
                GAME.BUTTON_LIST.splice(i, 1);
                break;
            }
        }
        destroy(object.sprite);
    }
    else{
        for (var i = 0; i < GAME.RENDER_LIST.length; i++) {
            if (object.id == GAME.RENDER_LIST[i].id) {
                GAME.RENDER_LIST.splice(i, 1);
                break;
            }
        }
    }
    object = undefined;
}

// Event Listener on canvas for button clicks
canvas.addEventListener('mousedown', function (event) {
    var bounds = canvas.getBoundingClientRect();
    var mouse = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
    }
    for(var i = 0; i < GAME.BUTTON_LIST.length; i++) {
        if (GAME.BUTTON_LIST[i].enabled && mouse.y > GAME.BUTTON_LIST[i].sprite.y && mouse.y < GAME.BUTTON_LIST[i].sprite.y + GAME.BUTTON_LIST[i].sprite.height && mouse.x > GAME.BUTTON_LIST[i].sprite.x && mouse.x < GAME.BUTTON_LIST[i].sprite.x + GAME.BUTTON_LIST[i].sprite.width) {
            GAME.BUTTON_LIST[i].heldDown = true;
            GAME.BUTTON_LIST[i].functionCall(...GAME.BUTTON_LIST[i].parameters);
            break;
        }
    } 
}, false);

canvas.addEventListener('mouseup', function (event) {
    for (var i = 0; i < GAME.BUTTON_LIST.length; i++) {
        if (GAME.BUTTON_LIST[i].heldDown) {
            GAME.BUTTON_LIST[i].heldDown = false;
            GAME.BUTTON_LIST[i].heldTicks = 0;
            break;
        }
    }
}, false);

// Event Listener on canvas for mobile button clicks
canvas.addEventListener('touchstart', function (event) {
    var bounds = canvas.getBoundingClientRect();
    var mouse = {
        x: event.touches[0].clientX - bounds.left,
        y: event.touches[0].clientY - bounds.top
    }
    for (var i = 0; i < GAME.BUTTON_LIST.length; i++) {
        if (GAME.BUTTON_LIST[i].enabled && mouse.y > GAME.BUTTON_LIST[i].sprite.y && mouse.y < GAME.BUTTON_LIST[i].sprite.y + GAME.BUTTON_LIST[i].sprite.height && mouse.x > GAME.BUTTON_LIST[i].sprite.x && mouse.x < GAME.BUTTON_LIST[i].sprite.x + GAME.BUTTON_LIST[i].sprite.width) {
            GAME.BUTTON_LIST[i].heldDown = true;
            GAME.BUTTON_LIST[i].functionCall(...GAME.BUTTON_LIST[i].parameters);
            break;
        }
    }
}, false);

canvas.addEventListener('touchend', function (event) {
    for (var i = 0; i < GAME.BUTTON_LIST.length; i++) {
        if (GAME.BUTTON_LIST[i].heldDown) {
            GAME.BUTTON_LIST[i].heldDown = false;
            GAME.BUTTON_LIST[i].heldTicks = 0;
            break;
        }
    }
}, false);

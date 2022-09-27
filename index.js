/*
Tiled map information
- zoom level: 475%
- map height: 40 tiles
- map width: 70 tiles
*/
const canvas = document.querySelector('canvas');   //ties html canvas element to js variable
const ctxt = canvas.getContext('2d');   //allows for drawing 2d objects

canvas.width = 1024;
canvas.height = 576;
//---end of initialization---


/*
---create collisions map---
- Tiled map outputs as Json file
- collision map in json file convert from 1d -> 2d
*/
const collisionsMap = [];   //1d -> 2d array
for(let i = 0; i < collisions.length; i+=70) { //70 = 70 cubes per row in Tiled
    collisionsMap.push(collisions.slice(i, i+70));  
}

const offset = {
    x: -175,
    y: -800
};

const boundaries = [];
for(let i = 0; i < collisionsMap.length; i++) {
    for(let j = 0; j < collisionsMap[i].length; j++) {
        if(collisionsMap[i][j] === 1025) {
            boundaries.push(new Boundary({
                position: {
                    x: j * Boundary.width + offset.x,
                    y: i * Boundary.height + offset.y
                } 
            }))
        }
    }
}

/*
---import world map & character sprite---
- map must fully load before drawing aka use map.onLoad
- player sprite loads faster than map thus loads underneath map
- solution: draw map & player sprite after map has loaded
- cannot input filepath of image, thus must create object and pass into drawImage parameter
*/
const map = new Image();    //create image object
map.src = './images/townMap.png';

const playerDownSprite = new Image();
playerDownSprite.src = './images/playerDown.png';

const playerUpSprite = new Image();
playerUpSprite.src = './images/playerUp.png';

const playerRightSprite = new Image();
playerRightSprite.src = './images/playerRight.png';

const playerLeftSprite = new Image();
playerLeftSprite.src = './images/playerLeft.png';

const foregroundImg = new Image();
foregroundImg.src = './images/townMapForegroundObjects.png';

const background = new Sprite({position: {
    x: offset.x,
    y: offset.y
    },
    image: map,
    frames: {
        max: 1
    }
});

const player = new Sprite({position: {
    x: canvas.width/2 - 192/4/2, //this.image & this.frames not passed in yet, can't call image.width so must set to static val
    y: canvas.height/2 - 68/2,
    },
    image: playerDownSprite,
    frames: {
        max: 4
    },
    sprites: {
        up: playerUpSprite,
        down: playerDownSprite,
        left: playerLeftSprite,
        right: playerRightSprite
    }
})

const foreground = new Sprite({position: {
    x: offset.x,
    y: offset.y,
    },
    image: foregroundImg,
    frames: {
        max: 1
    }
})

const keys = {
    w: {pressed: false},
    a: {pressed: false},
    s: {pressed: false},
    d: {pressed: false}
}

/*
organizes all moveable objects into one object
*/
const movables = [background, ...boundaries, foreground];   //spreads all elements of boundaries into movables

/*
check whether sprites are colliding
- rectangle1 = player
- rectangle2 = collision cube
*/
function rectangularCollision({rectangle1, rectangle2}) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x && 
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width && 
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y && 
        rectangle1.position.y + rectangle1.height/2 <= rectangle2.position.y + rectangle2.height    // divide by 2 so can squeeze in narrow passages
    );
}

/*main function*/
function animate() {    
    window.requestAnimationFrame(animate);  //schedules another iteration of function
    background.draw();
    boundaries.forEach(boundary => {
        boundary.draw();
    });
    player.draw();
    foreground.draw();

    //---playerSprite movements registered---
    //---collision handling---
    //sprites x & y coords start @ top left
    let allowMovement = true;
    player.moving = false;
    //up movement
    if(keys.w.pressed && lastKey === 'w') {
        player.image = playerUpSprite;

        for(let i = 0; i < boundaries.length; i++) {    //for loop over foreach as need to use 'break'
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: player, 
                rectangle2: {...boundary, position: {   //(...) spread clones boundary cube so can edit position w/o changing org
                    x: boundary.position.x,
                    y: boundary.position.y+3    //'predicting' 1 move into the future
                }}
            })) {
                console.log("out");
                allowMovement = false;
                break;  //exit loop once collision noted 
            };
        }
        if(allowMovement) {
            movables.forEach(movable => {
                player.moving = true;
                movable.position.y += 3;
            });
        }
    //right movement
    } else if(keys.a.pressed && lastKey === 'a') {
        player.image = playerLeftSprite;

        for(let i = 0; i < boundaries.length; i++) {    
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: player, 
                rectangle2: {...boundary, position: {   
                    x: boundary.position.x+3,
                    y: boundary.position.y    
                }}
            })) {
                console.log("out");
                allowMovement = false;
                break;   
            };
        }
        if(allowMovement) {
            movables.forEach(movable => {
                player.moving = true;
                movable.position.x += 3;
            });
        }
    //down movement
    } else if(keys.s.pressed && lastKey === 's') {
        player.image = playerDownSprite;

        for(let i = 0; i < boundaries.length; i++) {    
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: player, 
                rectangle2: {...boundary, position: {   
                    x: boundary.position.x,
                    y: boundary.position.y-3    
                }}
            })) {
                console.log("out");
                allowMovement = false;
                break;   
            };
        }
        if(allowMovement) {
            movables.forEach(movable => {
                player.moving = true;
                movable.position.y -= 3;
            });
        }
    //right movement
    } else if(keys.d.pressed && lastKey === 'd') {
        player.image = playerRightSprite;

        for(let i = 0; i < boundaries.length; i++) {    
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: player, 
                rectangle2: {...boundary, position: {   
                    x: boundary.position.x-3,
                    y: boundary.position.y    
                }}
            })) {
                console.log("out");
                allowMovement = false;
                break;   
            };
        }
        if(allowMovement) {
            movables.forEach(movable => {
                player.moving = true;
                movable.position.x -= 3;
            });
        }
    } 
}
animate();

let lastKey = '';
window.addEventListener('keypress', (e) => {
    switch(e.key) {
        case 'w':
            keys.w.pressed = true;
            lastKey = 'w';
            break;

        case 'a':
            keys.a.pressed = true;
            lastKey = 'a';
            break;

        case 's':
            keys.s.pressed = true;
            lastKey = 's';
            break;

        case 'd':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'w':
            keys.w.pressed = false;
            player.moving = false;
            break;

        case 'a':
            keys.a.pressed = false;
            player.moving = false;
            break;

        case 's':
            keys.s.pressed = false;
            player.moving = false;
            break;

        case 'd':
            keys.d.pressed = false;
            player.moving = false;
            break;
    }
});


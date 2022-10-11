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

/*
---create battle zones ---
- same procedure as map
*/
const battleZonesMap = []; 
for(let i = 0; i < battleZonesData.length; i+=70) { 
    battleZonesMap.push(battleZonesData.slice(i, i+70));  
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

const battleZones = [];
for(let i = 0; i < battleZonesMap.length; i++) {
    for(let j = 0; j < battleZonesMap[i].length; j++) {
        if(battleZonesMap[i][j] === 1025) {
            battleZones.push(new Boundary({
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
const movables = [background, ...boundaries, foreground, ...battleZones];   //spreads all elements of boundaries into movables

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

//player stops once battle commences


const battle = {
    initiated: false
};  

/*main function*/
function animate() {    
    const animationId = window.requestAnimationFrame(animate);  //schedules another iteration of function
    background.draw();
    boundaries.forEach(boundary => {
        boundary.draw();
    });
    battleZones.forEach(battleZone => {
        battleZone.draw();
    })
    player.draw();
    foreground.draw();

    if(battle.initiated) {  //battle occured: skips rest of code aka no movement or additional battle seqs
        return;
    }

    //---battle occurance---
    if(keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
        for(let i = 0; i < battleZones.length; i++) {    
            const battleZone = battleZones[i];
            const overlappingArea = (Math.min(player.position.x + player.width, battleZone.position.x + battleZone.width) - Math.max(player.position.x, battleZone.position.x)) * (Math.min(player.position.y + player.width, battleZone.position.y + battleZone.width) - Math.max(player.position.y, battleZone.position.y)); 
            if(rectangularCollision({
                rectangle1: player, 
                rectangle2: {...battleZone, position: {   
                    x: battleZone.position.x,
                    y: battleZone.position.y    
                }}
            }) && overlappingArea > player.width * player.height / 2) { //edge case: player walks along edge of zone (hitbox reg)
                if(Math.random() < 0.05) {  //battle occurance probability
                    console.log("battle");

                    //deactivate current animation loop
                    window.cancelAnimationFrame(animationId);

                    battle.initiated = true;
                    //battle commence animation
                    gsap.to('#battleTransitionBlack', {
                        opacity: 1,
                        repeat: 3,
                        yoyo: true, //smoothens animation & returns to org css styling
                        duration: 0.4,
                        onComplete() {
                            gsap.to('#battleTransitionBlack', {
                                opacity: 1,
                                duration: 0.4,
                                onComplete() {
                                    //activate new animation loop
                                    animateBattle();

                                    gsap.to('#battleTransitionBlack', {
                                        opacity: 0,
                                        duration: 0.4,
                                    });
                                }
                            });
                        }
                    });
                    break; 
                }
            };
        }
    }

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

const battleBackgroundImg = new Image();
battleBackgroundImg.src = './images/battleBackground.png';
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBackgroundImg
});

const draggleBattleSpriteImg = Image();
draggleBattleSpriteImg.src = './images/draggleSprite.png';
const draggleBattleSprite = new Sprite({
    position: {
        //add in later
        x: 0,
        y: 0
    },
    image: draggleBattleSpriteImg
});

const embyBattleSpriteImg = Image();
embyBattleSpriteImg.src = './images/embySprite.png';
const embyBattleSprite = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: embyBattleSpriteImg
});

function animateBattle() {
    window.requestAnimationFrame(animateBattle);
    battleBackground.draw();
    console.log('battle');  
}

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


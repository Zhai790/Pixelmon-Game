class Sprite {
    constructor({position, velocity, image, frames = {max: 1}, sprites = []}) {  //use object as a parameter so order of values don't matter
        this.position = position;
        this.image = image;
        this.frames = {...frames, val: 0, elapsed: 0};  //val: tracks character animation frame, elapsed: tracks time inbtwn each frame

        this.image.onload = () => {
            this.width = this.image.width/this.frames.max; //player sprite width to detect collisions 
            this.height = this.image.height;
        }
        this.moving = false;    //whether player sprite allowed to move or not
        this.sprites = sprites; //allows for diff player models for wasd movements
    }

    draw() {
        ctxt.drawImage(
            this.image, 
            this.frames.val * this.width,
            0,
            this.image.width/this.frames.max,
            this.image.height,
            this.position.x,
            this.position.y,
            this.image.width/this.frames.max,
            this.image.height,
        );
        if(this.frames.max > 1) {   //player sprite only
            this.frames.elapsed++;
        }

        //track which character sprite frame to draw
        if(this.moving) {
            if(this.frames.elapsed%10 === 0) {  //slow animation down 
                if(this.frames.val < this.frames.max - 1) {  //-1 cus basically a do-while loop
                    this.frames.val++;  
                } else {
                    this.frames.val = 0;
                }
            }
        }
    }
}

class Boundary {
    //w=12 & h=12(org dimensions) x 5(4.75% zoom) = 57
    static width = 57;
    static height = 57;
    constructor({position}) {
        this.position = position;
        //width & height of each box
        this.width = Boundary.width;
        this.height = Boundary.height;
    }

    draw() {
        ctxt.fillStyle = 'rgba(255, 0, 0, 0)';
        ctxt.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}
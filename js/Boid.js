Dye=(window.Dye?window.Dye:{});
Dye.Boid= function (level,id,x,y,spriteKey) {
    this.id=id;
    this.level=level;
    this.game=this.level.game;

    this.colorHSL=[273,97,48];
    this.colorRGB=Dye.Utils.hslToRgb(this.colorHSL[0],this.colorHSL[1],this.colorHSL[2]);

    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y, spriteKey);
    this.game.physics.p2.enable(this,false)
    this.body.setZeroDamping();
    this.body.collideWorldBounds=true;


    this.bitmapData=this.game.make.bitmapData(10,30);
    this.bitmapData.ctx.fillStyle = "rgba({0},{1},{2},1)".format(this.colorRGB[0],this.colorRGB[1],this.colorRGB[2]);
    this.bitmapData.ctx.beginPath();
    this.bitmapData.ctx.moveTo(5, 0);
    this.bitmapData.ctx.lineTo(0, 30);
    this.bitmapData.ctx.lineTo(10, 30);
    this.bitmapData.ctx.fill();


    this.loadTexture(this.bitmapData);
 //   this.body.rotation=Math.PI/2;

    this.targetFindEvent = this.game.time.events.loop(Phaser.Timer.SECOND*3, this.findTarget, this)

};

Dye.Boid.prototype = Object.create(Phaser.Sprite.prototype);
Dye.Boid.prototype.constructor = Dye.Boid;

Dye.Boid.prototype.update = function(){
    this.body.thrust(100);
    this.limitVelocity(3);
    this.steer();
};

Dye.Boid.prototype.steer=function(){
    if (!this.target){return}

    //var mouseToBoid = new Phaser.Point(this.x-this.game.input.x,this.y-this.game.input.y);
    var targetToBoid= new Phaser.Point(this.x-this.target.x,this.y-this.target.y);
    var cross = (targetToBoid.x * Math.sin(this.rotation+Math.PI/2)) - (targetToBoid.y * Math.cos(this.rotation+Math.PI/2));
    if (Math.abs(cross)>2) {
        if (cross > 0)
            this.body.rotateLeft(50);
         else
            this.body.rotateRight(50);
    }

};


Dye.Boid.prototype.findTarget =function(){
    var closestPixel={h: null,
                           x: null,
                           y:null,
                           physicalDistance: null,
                           hueDistance: null};
    var that=this;
    var searchSize=100;
    var rx=Math.round(this.x);
    var ry=Math.round(this.y);

    this.level.bitmapData.update();
    var tempPixel={};
    this.level.debugGraphic.clear();
    this.level.debugGraphic.lineStyle(1, 0x0000FF, 1);
   // this.level.debugGraphic.drawRect(this.x-searchSize, this.y-searchSize, searchSize*2, searchSize*2);

    var saturationFactor=20;

    for (var x=Math.max(0,rx-searchSize); x<Math.min(rx+searchSize,this.game.width);x++){
        for (var y=Math.max(0,ry-searchSize); y<Math.min(ry+searchSize,this.game.height);y++){

            this.level.bitmapData.getPixel(x, y, tempPixel);
            var hsl=Dye.Utils.rgbToHsl(tempPixel.r,tempPixel.g,tempPixel.b);

            var distance=Phaser.Point.distance(new Phaser.Point(tempPixel.x,tempPixel.y),this.x,this.y);
            var hueDistance=Math.abs(hsl[0]-that.colorHSL[0]);
            if (closestPixel.hueDistance==null || hueDistance<=closestPixel.hueDistance && hsl[1]>saturationFactor){
                closestPixel.hueDistance=hueDistance;
                closestPixel.h=hsl[0];
                closestPixel.s=hsl[1];
                closestPixel.l=hsl[2];
              //  closestPixel.physicalDistance=distance;
                closestPixel.x=x;
                closestPixel.y=y;
            }


        }
    }

  //  console.log(closestPixel);
   // console.log(closestPixel.x,closestPixel.y,closestPixel.hueDistance);
    if (closestPixel.s>saturationFactor){
        this.target=closestPixel;
        this.level.debugGraphic.lineStyle(0);
        this.level.debugGraphic.beginFill(0xFFFF0B, 1);
      //  this.level.debugGraphic.drawCircle(closestPixel.x,closestPixel.y,5);

    }
};

Dye.Boid.prototype.limitVelocity = function(maxVelocity){
    var x = this.body.velocity.x;
    var y = this.body.velocity.y;

    if (Math.pow(x, 2) + Math.pow(y, 2) > Math.pow(maxVelocity, 2)) {

        var a = Math.atan2(y, x);
        x = -20 * Math.cos(a) * maxVelocity;
        y = -20 * Math.sin(a) * maxVelocity;
        this.body.velocity.x = x;
        this.body.velocity.y = y;
    }
};
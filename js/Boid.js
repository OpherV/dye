Dye=(window.Dye?window.Dye:{});
Dye.Boid= function (level,id,x,y,hsla) {
    Dye.Character.call(this, level, id,x,y);

    this.kind="boid";

    this.colorHSLA=hsla;
    this.colorRGB=Dye.Utils.hslToRgb(this.colorHSLA[0],this.colorHSLA[1],this.colorHSLA[2]);

    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y);
    this.game.physics.p2.enable(this,false); +
    this.body.setCircle(2);
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

    this.steeringType=Dye.Character.STEERINGTYPES.chase;

    this.targetFindEvent = this.game.time.events.loop(Phaser.Timer.SECOND*3, this.findTarget, this)

    this.init();

};

Dye.Boid.prototype = Object.create(Dye.Character.prototype);
Dye.Boid.prototype.constructor = Dye.Boid;



Dye.Boid.prototype.init = function() {
    Dye.Character.prototype.init.call(this);
};

Dye.Boid.prototype.update = function(){
    this.body.thrust(100);
    this.limitVelocity(3);
    this.steer();
};


Dye.Boid.prototype.findTarget=function(){
    this.target=this.getClosest(this.level.layers.food,500);
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


Dye.Boid.prototype.startContactHandlers= {
    "food": function (body) {
        body.sprite.destroy();
    }
};
Dye=(window.Dye?window.Dye:{});
Dye.Paintball= function (level,id,x,y,hsla,size) {
    Dye.Character.call(this, level, id,x,y);

    this.kind="food";

    this.stats.speed=5;
    this.stats.maxSpeed=this.stats.speed;
    

    this.colorHSLA=hsla;
    this.colorRGB=Dye.Utils.hslToRgb(this.colorHSLA[0],this.colorHSLA[1],this.colorHSLA[2]);

    this.brush=level.getBrush(hsla[0]?this.colorRGB[0]:null,
                              hsla[1]?this.colorRGB[1]:null,
                              hsla[2]?this.colorRGB[2]:null,
                              hsla[3]);

    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y);
    this.game.physics.p2.enable(this,false);
    this.body.setZeroDamping();
    this.body.collideWorldBounds=true;

    this.body.setCircle(size/3);
    this.body.data.shapes[0].sensor=true;


    this.bitmapData=this.game.make.bitmapData(size,size);
    this.bitmapData.draw(this.brush, size/2, size/2,size,size,null);

    this.loadTexture(this.bitmapData);

    this.blendMode=PIXI.blendModes.ADD;

    this.targetFindEvent = this.game.time.events.loop(Phaser.Timer.SECOND*3, this.findTarget, this);
    this.findTarget();


};

Dye.Paintball.prototype = Object.create(Dye.Character.prototype);
Dye.Paintball.prototype.constructor = Dye.Paintball;

Dye.Paintball.prototype.update = function(){
    if (this.target) {
        this.moveToTarget(this.target,this.stats.speed);
    }
};

Dye.Paintball.prototype.findTarget = function(){
    var closestPaintball=this.getClosest(this.level.layers.food,20);
    if (closestPaintball && Phaser.Point.distance(this,closestPaintball)>10){
        this.target=closestPaintball;
    }
    else{
        var wanderDirection=Math.random()*2-1;
        var wanderDistance=20;
        this.target=new Phaser.Point(this.x+Math.cos(wanderDirection)*wanderDistance,this.y+Math.sin(wanderDirection)*wanderDistance);

        //this.level.debugGraphic.clear();
        //this.level.debugGraphic.lineStyle(0);
        //this.level.debugGraphic.beginFill(0xFFFF0B, 1);
        //this.level.debugGraphic.drawCircle(this.target.x,this.target.y,5);
    }
};



Dye.Paintball.prototype.destroy=function(){
    //TODO how to destroy bitmapdata?
    Phaser.Sprite.prototype.destroy.call(this);
};
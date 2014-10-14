Dye=(window.Dye?window.Dye:{});
Dye.Character= function (level,id,x,y,stats) {
    this.id=id;
    this.level=level;
    this.game=this.level.game;

    var defaultStats={
        speed: 10,
        maxSpeed: 10,
        rotateSpeed: 50
    };

    this.stats=Dye.Utils.extend.call(defaultStats,stats);

    this.steerType=null;

    this.inContactWith={}; //Bodies this is touching
    this.startContactHandler={};
    this.endContactHandler={};

    this.timeEvents = {};


};

Dye.Character.prototype = Object.create(Phaser.Sprite.prototype);
Dye.Character.prototype.constructor = Dye.Character;

Dye.Character.prototype.init= function() {
    //events
    //*************************
    this.body.onBeginContact.add(beginContactHandler, this);
    this.body.onEndContact.add(endContactHandler, this);

    function beginContactHandler(body, shapeA, shapeB, equation) {
        //add to inContactWith
        if (body && !this.inContactWith[body.sprite.id] ){
            this.inContactWith[body.sprite.id]=body;
        }

        if (!(body && body.sprite && body.sprite!=null)){ return; }
        if (this.startContactHandlers[body.sprite.kind]){
            this.startContactHandlers[body.sprite.kind].call(this,body);
        }
    }

    function endContactHandler(body, shapeA, shapeB, equation) {
        //character just died, not relevant
        if (this.health<=0){return;}
        if (body && body.sprite){
            //remove from inContactWith array
            if (this.inContactWith[body.sprite.id]){
                delete this.inContactWith[body.sprite.id]
            }
        }

        if (!(body && body.sprite && body.sprite!=null)){ return; }
        if (this.endContactHandlers[body.sprite.kind]){
            this.endContactHandlers[body.sprite.kind].call(this,body);
        }
    }
};

Dye.Character.prototype.moveInDirecton= function(movementVector,maxSpeed) {
    var maxSpeed=this.stats.maxSpeed;

    var finalVelocity=new Phaser.Point(this.body.world.mpx(this.body.velocity.x)+movementVector.x,
        this.body.world.mpx(this.body.velocity.y)+movementVector.y);

    //make sure not to go over maxspeed
    finalVelocity.setMagnitude(Math.min(finalVelocity.getMagnitude(),maxSpeed));
    this.body.velocity.x=finalVelocity.x;
    this.body.velocity.y=finalVelocity.y;

};

//moves this creature in the direction of the target
Dye.Character.prototype.moveToTarget= function(target,speed) {
    var movementVector=(new Phaser.Point(target.x,target.y)).subtract(this.x,this.y);
    movementVector.setMagnitude(speed);
    this.moveInDirecton(movementVector);
};

Dye.Character.prototype.getClosest=function(objects,maximalDistance){
    var closestCreature=null;
    var closestDistance=null;
    var that=this;
    objects.forEachAlive(function(object){
        var distanceToCreature=Phaser.Point.distance(that,object,true);

        if (object!=that && distanceToCreature<maximalDistance && (closestCreature==null || distanceToCreature<closestDistance)){
            closestCreature=object;
            closestDistance=distanceToCreature;
        }

    });

    return closestCreature;
};

Dye.Character.STEERINGTYPES={
    chase: "chase",
    flee: "flee"
};

Dye.Character.prototype.steer=function(){
    if (this.steeringType==Dye.Character.STEERINGTYPES.chase){
        if (!this.target){return}

        this.body.thrust(this.stats.speed);
        this.limitVelocity(this.stats.maxSpeed);
        //var mouseToBoid = new Phaser.Point(this.x-this.game.input.x,this.y-this.game.input.y);
        var targetToBoid= new Phaser.Point(this.x-this.target.x,this.y-this.target.y);
        var cross = (targetToBoid.x * Math.sin(this.rotation+Math.PI/2)) - (targetToBoid.y * Math.cos(this.rotation+Math.PI/2));
        if (Math.abs(cross)>0) {
            if (cross > 0)
                this.body.rotateLeft(this.stats.rotateSpeed);
            else
                this.body.rotateRight(this.stats.rotateSpeed);
        }
    }
};

//inheriting classes will override this to implement contact event handlers
Dye.Character.prototype.startContactHandlers={};
Dye.Character.prototype.endContactHandlers={};
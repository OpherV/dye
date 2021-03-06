Dye=(window.Dye?window.Dye:{});
Dye.Character= function (level,id,x,y,stats) {
    this.id=id;
    this.level=level;
    this.game=this.level.game;

    Phaser.Sprite.call(this, this.game, x, y);

    this.gui=this.game.add.group();

    Dye.Character.prototype.init.call(this,stats);
};

Dye.Character.prototype = Object.create(Phaser.Sprite.prototype);
Dye.Character.prototype.constructor = Dye.Character;

Dye.Character.prototype.init= function(stats) {
    this.game.physics.p2.enable(this,Dye.getSettings().showDebug);

    var defaultStats={
        speed: 10,
        maxSpeed: 10,
        rotateSpeed: 50,
        maxEnergy: 100
    };

    this.stats=Dye.Utils.extend.call(defaultStats,stats);
    this.stats.energy=this.stats.maxEnergy;
    //if(stats.belongsToPlayer) console.log(this.stats.maxEnergy);
    this.steeringType=null;

    this.inContactWith={}; //Bodies this is touching
    this.startContactHandler={};
    this.endContactHandler={};

    this.timeEvents = {};


    //events
    //*************************
    this.body.onBeginContact.add(beginContactHandler, this);
    this.body.onEndContact.add(endContactHandler, this);

    function beginContactHandler(body, shapeA, shapeB, equation)
    {
        if (this.body) {
            //add to inContactWith
            if (body && !this.inContactWith[body.sprite.id]) {
                this.inContactWith[body.sprite.id] = body;
            }

            if (!(body && body.sprite && body.sprite != null)) {
                return;
            }
            if (this.startContactHandlers[body.sprite.kind]) {
                this.startContactHandlers[body.sprite.kind].call(this, body);
            }
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

Dye.Character.prototype.kill = function(){
    this.body.onBeginContact.removeAll();
    this.body.onEndContact.removeAll();

    for (var timerName in this.timeEvents){
        this.timeEvents[timerName].timer.remove(this.timeEvents[timerName]);
        delete this.timeEvents[timerName];
    }
    Phaser.Sprite.prototype.kill.call(this);
};

Dye.Character.prototype.moveInDirecton= function(movementVector,maxSpeed) {
    var _maxSpeed=maxSpeed?maxSpeed:this.stats.maxSpeed;

    var finalVelocity=new Phaser.Point(this.body.world.mpx(this.body.velocity.x)+movementVector.x,
        this.body.world.mpx(this.body.velocity.y)+movementVector.y);

    //make sure not to go over maxspeed
    finalVelocity.setMagnitude(Math.min(finalVelocity.getMagnitude(),_maxSpeed));
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

Dye.Character.prototype.render=function(){
    this.gui.x=this.x;
    this.gui.y=this.y;
};

//inheriting classes will override this to implement contact event handlers
Dye.Character.prototype.startContactHandlers={};
Dye.Character.prototype.endContactHandlers={};
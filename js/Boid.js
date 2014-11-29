Dye=(window.Dye?window.Dye:{});
Dye.Boid= function (level,id,x,y,stats) {
    Dye.Character.call(this, level, id,x,y,stats);

    var defaultStats={
        speed: 200,
        maxSpeed: 7,
        lifespan: 20,
        minimalSize: 2,
        maximalSize: 10,
        isFood: false
    };

    this.stats=Dye.Utils.extend.call(this.stats,defaultStats);
    this.stats=Dye.Utils.extend.call(this.stats,stats);
    this.stats.size=this.stats.minimalSize;
    if (this.stats.isFood){
        this.stats.colorHSLA[1]=30;
    }

    this.kind="boid";

    this.stats.colorRGB=Dye.Utils.hslToRgb(this.stats.colorHSLA[0],
                                            this.stats.colorHSLA[1],
                                            this.stats.colorHSLA[2]);

    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y);
    this.game.physics.p2.enable(this,false);

    this.setSize(this.stats.size);
    this.body.setZeroDamping();
    this.body.setZeroVelocity();

    this.bitmapData=this.game.make.bitmapData(300,300);
    this.bitmapData.ctx.fillStyle = "rgba({0},{1},{2},1)".format(this.stats.colorRGB[0],this.stats.colorRGB[1],this.stats.colorRGB[2]);
    this.bitmapData.ctx.beginPath();
    this.bitmapData.ctx.moveTo(150, 0);
    this.bitmapData.ctx.lineTo(50, 300);
    this.bitmapData.ctx.lineTo(250, 300);
    this.bitmapData.ctx.fill();


    this.loadTexture(this.bitmapData);
 //   this.body.rotation=Math.PI/2;

    this.steeringType=Dye.Character.STEERINGTYPES.chase;

    this.init();

};

Dye.Boid.prototype = Object.create(Dye.Character.prototype);
Dye.Boid.prototype.constructor = Dye.Boid;



Dye.Boid.prototype.init = function() {
    Dye.Character.prototype.init.call(this);
    this.timeEvents.deathTimer=this.game.time.events.add(Phaser.Timer.SECOND*this.stats.lifespan, this.naturalDeath, this);
    if (!this.stats.isFood){
        this.timeEvents.targetFindEvent = this.game.time.events.loop(Phaser.Timer.SECOND, this.findTarget, this);

        this.findTarget();
    }
};

Dye.Boid.prototype.update = function(){
    this.game.world.wrap(this.body);
    this.steer();
};


Dye.Boid.prototype.findTarget=function(){
    var that=this;
    var closestFood = null;
    var closestFoodDistance=null;

    var closestEnemy = null;
    var closestEnemyDistance=null;

    this.level.layers.boids.forEachAlive(function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that && boid.stats.species!=that.stats.species &&
            boid.stats.size<that.stats.size &&  (closestFood==null || distanceToCreature<closestFoodDistance)){
            closestFood=boid;
            closestFoodDistance=distanceToCreature;
        }

    });

    this.level.layers.boids.forEachAlive(function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that && boid.stats.species!=that.stats.species && boid.stats.size>that.stats.size &&  (closestEnemy==null || distanceToCreature<closestEnemyDistance)){
            closestEnemy=boid;
            closestEnemyDistance=distanceToCreature;
        }
    });

    if (closestFood){
        if (closestEnemy){
            if(closestFoodDistance<closestEnemyDistance){
                this.target=closestFood;
            }
            else{
                var fleeVector=new Phaser.Point(this.x-closestEnemy.x,this.y-closestEnemy.y);
                fleeVector.setMagnitude(fleeVector.getMagnitude()*2);
                this.target={x: closestEnemy.x+fleeVector.x,
                    y: closestEnemy.y+fleeVector.y};
            }
        }
        else{
            this.target=closestFood;
        }
    }
    else {
        if (closestEnemy) {
            var fleeVector=new Phaser.Point(this.x-closestEnemy.x,this.y-closestEnemy.y);
            fleeVector.setMagnitude(fleeVector.getMagnitude()*2);
            this.target={x: closestEnemy.x+fleeVector.x,
                y: closestEnemy.y+fleeVector.y};
        }
        else{
            this.target=null;
        }
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


Dye.Boid.prototype.startContactHandlers= {
    "food": function (body) {
        body.sprite.destroy();
    },
    "boid": function(body){
        //eat target boid
        if (this.stats.species!=body.sprite.stats.species && this.stats.size>body.sprite.stats.size){
            this.setSize(this.stats.size+body.sprite.stats.size);
            body.sprite.die();
            while(this.stats.size>this.stats.maximalSize){
                if (this.body)
                    this.setSize(this.stats.size-this.stats.minimalSize);

                //creature new minicreature
                var newBoid=new Dye.Boid(this.level,Dye.Utils.generateGuid(),this.x,this.y,this.stats);
                this.level.layers.boids.add(newBoid);
            }

        }
    }
};




Dye.Boid.prototype.setSize=function(size){
    this.stats.size=size;
    this.body.setCircle(Math.pow(this.stats.size,1.3));
    this.scale.setTo(this.stats.size/50, this.stats.size/50);

    this.body.collideWorldBounds=false;
    this.body.setCollisionGroup(this.level.collisionGroups.boids);
    this.body.collides(this.level.collisionGroups.boids);
    this.body.data.shapes[0].sensor = true;
};


Dye.Boid.prototype.die=function(){
    //this.kill();
    this.destroy();
    for (var timerName in this.timeEvents){
        this.timeEvents[timerName].timer.remove(this.timeEvents[timerName]);
        delete this.timeEvents[timerName];
    }
};

Dye.Boid.prototype.naturalDeath=function(){
    if (this.stats.isFood) {

    }
    else{
        var newBoidStats=Dye.Utils.clone(this.stats);
        newBoidStats.isFood=true;
        newBoidStats.minimalSize=1;
        for (var x=0;x<this.stats.size;x++){
            var newBoid=new Dye.Boid(this.level,Dye.Utils.generateGuid(),this.x,this.y,newBoidStats);
            newBoid.body.rotation=Math.random()*Math.PI;
            this.level.layers.boids.add(newBoid);
            var randomDirectionPoint=new Phaser.Point(Math.random()*2-1, Math.random()*2-1);
            randomDirectionPoint.setMagnitude(90);
            newBoid.moveInDirecton(randomDirectionPoint);

            //newBoid.moveInDirecton(new Phaser.Point(0,0));

        }
    }
    this.die();
};
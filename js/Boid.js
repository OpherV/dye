Dye=(window.Dye?window.Dye:{});
Dye.Boid= function (level,id,x,y,stats) {
    Dye.Character.call(this, level, id,x,y,stats);
    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y);

    this.bitmapData=this.game.make.bitmapData(300,300);

    this.init(stats);

};

Dye.Boid.prototype = Object.create(Dye.Character.prototype);
Dye.Boid.prototype.constructor = Dye.Boid;



Dye.Boid.prototype.init = function(stats) {
    this.game.physics.p2.enable(this,false);


    Dye.Character.prototype.init.call(this);

    var defaultStats={
        speed: 200,
        maxSpeed: 7,
        //lifespan: 20, old - replaced with energy
        minimalSize: 2,
        maximalSize: 10,
        energyCost: 2,
        isFood: false,
        isEgg: false
    };

    this.stats=Dye.Utils.extend.call(this.stats,defaultStats);
    this.stats=Dye.Utils.extend.call(this.stats,stats);
    this.stats.size=this.stats.minimalSize;
    this.stats.energyCost=Math.max(1,this.stats.maxSpeed/20*Dye.getSettings().energyCostMultiplier);
    //console.log(this.stats.maxSpeed,this.stats.energyCost);

    if (this.stats.isFood){
        this.stats.colorHSLA[1]=30;
    }

    this.kind="boid";

    this.stats.colorRGB=Dye.Utils.hslToRgb(this.stats.colorHSLA[0],
        this.stats.colorHSLA[1],
        this.stats.colorHSLA[2]);


    this.setSize(this.stats.size);
    this.body.setZeroDamping();
    this.body.setZeroVelocity();

    var minTriangleBase=50;
    var maxTriangleBase=250;
    var triangleBase=Math.max(0,Math.min(maxTriangleBase,(1-this.stats.maxSpeed/20)*(maxTriangleBase-minTriangleBase)+minTriangleBase));

    this.bitmapData.clear();
    this.bitmapData.ctx.fillStyle = "rgba({0},{1},{2},1)".format(this.stats.colorRGB[0],this.stats.colorRGB[1],this.stats.colorRGB[2]);
    this.bitmapData.ctx.beginPath();
    this.bitmapData.ctx.moveTo(150, 0);
    this.bitmapData.ctx.lineTo(150-triangleBase/2, 300);
    this.bitmapData.ctx.lineTo(150+triangleBase/2, 300);
    this.bitmapData.ctx.fill();


    this.loadTexture(this.bitmapData);
    //   this.body.rotation=Math.PI/2;

    this.steeringType=Dye.Character.STEERINGTYPES.chase;


    if (!this.stats.isFood){
        this.timeEvents.targetFindEvent = this.game.time.events.loop(Phaser.Timer.SECOND, this.findTarget, this);
        //this.timeEvents.deathTimer=this.game.time.events.add(Phaser.Timer.SECOND*this.stats.lifespan, this.naturalDeath, this);
        this.findTarget();
    }
};

Dye.Boid.prototype.update = function(){
    this.game.world.wrap(this.body);
    if (!this.stats.isEgg && !this.stats.isFood){
        this.steer();
    }
};



Dye.Boid.prototype.findTarget=function(){
    if (this.level.isPaused) {return null}
    if (this.stats.isEgg){ return null}
    var that=this;
    var closestFood = null;
    var closestFoodDistance=null;

    var closestEnemy = null;
    var closestEnemyDistance=null;

    //food
    this.level.layers.boids.forEachAlive(function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that &&
            boid.stats.isEgg == false &&
            boid.stats.size<that.stats.size &&  (closestFood==null || distanceToCreature<closestFoodDistance)){
            closestFood=boid;
            closestFoodDistance=distanceToCreature;
        }

    });

    //enemy
    this.level.layers.boids.forEachAlive(function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that &&
          that.stats.isEgg == false &&
           boid.stats.species!=that.stats.species && boid.stats.size>that.stats.size &&  (closestEnemy==null || distanceToCreature<closestEnemyDistance)){
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
        body.sprite.kill();
    },
    "boid": function(body){
        var mutationChance=Dye.getSettings().mutationChance;
        var nutritionMultiplier=Dye.getSettings().nutritionMultiplier;

        //eat target boid
        if (
          (body.sprite.stats.isFood && !this.stats.isFood)  ||  body.sprite.stats.isEgg == false && this.stats.species!=body.sprite.stats.species && this.stats.size>body.sprite.stats.size){
            this.setSize(this.stats.size+body.sprite.stats.size);
            this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + body.sprite.stats.size*nutritionMultiplier);
            //this.healthbar.redraw();
            body.sprite.die();

            var newBoidStats=Dye.Utils.clone(this.stats);
            newBoidStats.isEgg=true;
            while(this.stats.size>this.stats.maximalSize){
                if (this.body) {
                    this.setSize(this.stats.size - this.stats.minimalSize);
                }

                if (Math.random()<mutationChance){
                    var newMin=newBoidStats.minimalSize;
                    var newDelta=newBoidStats.maximalSize-newBoidStats.minimalSize;

                    newMin=newMin+Math.max(1,Math.random()>0.5?1:-1);
                    newDelta=newDelta+Math.max(1,Math.random()>0.5?1:-1);
                    newBoidStats.minimalSize=newMin;
                    newBoidStats.maximalSize=newMin+newDelta;
                    newBoidStats.colorHSLA[0]=(newBoidStats.colorHSLA[0]+(Math.random()>0.5?40:-40)) % 359;
                    newBoidStats.maxSpeed=Math.max(0,newBoidStats.maxSpeed+(Math.random()>0.5?1:-1));
                    newBoidStats.species=this.level.getNewSpecies();





                    //console.log("mutation",newBoidStats.maxSpeed,newBoidStats.energyCost);
                }

                //creature new minicreature
                var newBoid=this.level.getNewBoid(Dye.Utils.generateGuid(),this.x,this.y,newBoidStats);
                this.level.layers.boids.add(newBoid);
                newBoid.eggTimer();
            }

        }
    }
};




Dye.Boid.prototype.setSize=function(size){
    this.stats.size=size;
    this.body.setCircle(this.stats.size*2);
    this.scale.setTo(Math.sqrt(this.stats.size)/25, Math.sqrt(this.stats.size)/25);

    this.body.collideWorldBounds=false;
    this.body.setCollisionGroup(this.level.collisionGroups.boids);
    this.body.collides(this.level.collisionGroups.boids);
    this.body.data.shapes[0].sensor = true;
};


Dye.Boid.prototype.die=function(){
    this.kill();
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
            var newBoid=this.level.getNewBoid(Dye.Utils.generateGuid(),this.x,this.y,newBoidStats);
            newBoid.body.rotation=Math.random()*Math.PI;
            this.level.layers.boids.add(newBoid);
            var randomDirectionPoint=new Phaser.Point(Math.random()*2-1, Math.random()*2-1);
            randomDirectionPoint.setMagnitude(6);
            newBoid.moveInDirecton(randomDirectionPoint,100);

            //newBoid.moveInDirecton(new Phaser.Point(0,0));

        }
    }
    this.die();
};


Dye.Boid.prototype.eggTimer=function(){
    this.timeEvents.eggTimer=this.game.time.events.add(Phaser.Timer.SECOND*5, function(){
        this.stats.isEgg=false;
    }, this);
};

Dye.Boid.prototype.doHungerEvent=function(){
    if (this.stats.isFood==false && this.stats.isEgg==false){
        this.stats.energy-=this.stats.energyCost;
        //this.healthbar.redraw();
        if (this.stats.energy<=0){
            this.naturalDeath();
        }
    }
};
Dye=(window.Dye?window.Dye:{});
Dye.Boid= function (level,id,x,y,stats) {
    Dye.Character.call(this, level, id,x,y,stats);
    //construct sprite
    Phaser.Sprite.call(this, this.game, x, y);

    this.init(stats);

};

Dye.Boid.prototype = Object.create(Dye.Character.prototype);
Dye.Boid.prototype.constructor = Dye.Boid;



Dye.Boid.prototype.init = function(stats) {
    this.game.physics.p2.enable(this,Dye.getSettings().showDebug);


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
    if (!this.stats.size) {
        this.stats.size = this.stats.minimalSize;
    }
    this.stats.energyCost=Math.max(1,this.stats.maxSpeed/20*Dye.getSettings().energyCostMultiplier);
    //console.log(this.stats.maxSpeed,this.stats.energyCost);


    this.stats.colorHSLA[1]=this.stats.isFood?0:99;

    this.kind="boid";

    this.setSize(this.stats.size);
    this.body.setZeroDamping();
    this.body.setZeroVelocity();

    this.drawBody();
    //   this.body.rotation=Math.PI/2;

    this.steeringType=Dye.Character.STEERINGTYPES.chase;

    this.updateGridPosition();
    this.findTarget();
};

Dye.Boid.prototype.update = function(){
    var that=this;
    //move boid
    this.game.world.wrap(this.body);
    if (!this.stats.isEgg && !this.stats.isFood){
        this.steer();
    }

};

Dye.Boid.prototype.updateGridPosition = function(){
    var that=this;

    this.oldGridPositionString=this.gridPositionString;
    this.gridPosition={x: Math.max(0,Math.floor(this.x/this.level.positionGridSize)),
                       y: Math.max(0,Math.floor(this.y/this.level.positionGridSize))};
    this.gridPositionString=this.gridPosition.x+"x"+this.gridPosition.y;

    //if dead remove from grid
    if (!this.exists && this.level.positionGrid[this.gridPositionString]){
        this.level.positionGrid[this.gridPositionString] = this.level.positionGrid[this.gridPositionString].filter(function (boid) {
          return boid != that;
        });
    }
    else{

    this.body.clearCollision(true,true);
    this.body.setCollisionGroup(this.level.collisionGroups[this.gridPosition.x]);
    this.body.collides(this.level.collisionGroups[this.gridPosition.x]);

    //remove old position
    if (this.gridPositionString!=this.oldGridPositionString) {

      if (this.level.positionGrid[this.oldGridPositionString]) {
        this.level.positionGrid[this.oldGridPositionString] = this.level.positionGrid[this.oldGridPositionString].filter(function (boid) {
          return boid != that;
        });
      }

      if (this.level.positionGrid[this.gridPositionString] == null) {
        this.level.positionGrid[this.gridPositionString] = [this];
      }
      else {
        //add self to position grid
        this.level.positionGrid[this.gridPositionString].push(this);
      }
    }

    }

};



Dye.Boid.prototype.findTarget=function(){
    if (this.level.isPaused) {return null}
    if (this.stats.isFood){ return null}
    if (this.stats.isEgg){ return null}
    var that=this;
    var closestFood = null;
    var closestFoodDistance=null;

    var closestEnemy = null;
    var closestEnemyDistance=null;
    var perceiveClosestFood=function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that &&
            boid.stats.isEgg == false &&
            boid.stats.size<that.stats.size &&  (closestFood==null || distanceToCreature<closestFoodDistance)){
            closestFood=boid;
            closestFoodDistance=distanceToCreature;
        }

    };

    var perceiveClosestEnemy=function(boid){
        var distanceToCreature=Phaser.Point.distance(that,boid,true);

        if (boid!=that &&
            that.stats.isEgg == false &&
            boid.stats.species!=that.stats.species && boid.stats.size>that.stats.size &&  (closestEnemy==null || distanceToCreature<closestEnemyDistance)){
            closestEnemy=boid;
            closestEnemyDistance=distanceToCreature;
        }
    };

    //search in closest squares
    var closeCharacters=[];
    if (this.level.debugMode && this.level.debugSprite==this){
        this.level.debugGraphic.clear();
    }

    if (this.gridPosition) {
        for (var x = this.gridPosition.x - 1; x <= this.gridPosition.x + 1; x++) {
            for (var y = this.gridPosition.y - 1; y <= this.gridPosition.y + 1; y++) {
                var checkedSquare = this.level.positionGrid[x + "x" + y];
                if (checkedSquare && checkedSquare.length > 0) {
                    if (this.level.debugMode && this.level.debugSprite==this) {
                        this.level.drawDebugGrid(x, y);
                    }
                    Array.prototype.push.apply(closeCharacters, checkedSquare);
                }
                else{
                    if (this.level.debugMode && this.level.debugSprite==this) {
                        this.level.drawDebugGrid(x, y, 0xFF0000);
                    }
                }
            }
        }
    }

    closeCharacters.forEach(perceiveClosestFood);
    closeCharacters.forEach(perceiveClosestEnemy);

    if(this.level.debugMode && this.level.debugSprite==this && closestFood){
        this.level.debugGraphic.beginFill(0xFFFF00, 0.5);
        this.level.debugGraphic.drawCircle(closestFood.x, closestFood.y,5)
    }

    //no characters in the position grid, or not found, iterate through all characters
    if (closestFood==null){
        //this.level.layers.boids.forEachAlive(perceiveClosestFood);
    }

    if (closestEnemy==null){
        //this.level.layers.boids.forEachAlive(perceiveClosestEnemy);
    }



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
    "boid": function(body){
        //another boid might have already eaten this in the same collision state
        if (!body.sprite.exists) {return;}

        var mutationChance=Dye.getSettings().mutationChance;
        var nutritionMultiplier=Dye.getSettings().nutritionMultiplier;


        //var totalSizeBefore=this.level.reportSize();
        //var oldStats=Dye.Utils.clone(this.stats);
        //var ateoldStats=Dye.Utils.clone(body.sprite.stats);


        //eat target boid
        if (
          (body.sprite.stats.isFood && !this.stats.isFood && !this.stats.isEgg)  ||
          !this.stats.isEgg && !body.sprite.stats.isEgg && this.stats.species!=body.sprite.stats.species && this.stats.size>body.sprite.stats.size){
            this.setSize(this.stats.size+body.sprite.stats.size);
            this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + body.sprite.stats.size*nutritionMultiplier);

            var newBoidStats=Dye.Utils.clone(this.stats);
            //var ateStats=Dye.Utils.clone(body.sprite.stats);
            newBoidStats.isEgg=true;

            body.sprite.kill();


            //var totalSizeAfter=this.level.reportSize();
            //if (totalSizeBefore.total!=totalSizeAfter.total){
            //    console.log("zzzz",totalSizeBefore.food,totalSizeAfter.food);
            //    //for(boidId in totalSizeAfter.creatures){
            //    //    if (totalSizeAfter.creatures[boidId].size!=totalSizeBefore.creatures[boidId].size){
            //    //        console.log(this.id==boidId);
            //    //    }
            //    //}
            //    //console.log("ate" , ateStats, this.oldStats, this.stats);
            //}

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

                }

                //creature new minicreature
                newBoidStats.size=this.stats.minimalSize;
                var newBoid=this.level.getNewBoid(Dye.Utils.generateGuid(),this.x,this.y,newBoidStats);
                this.level.layers.boids.add(newBoid);
                newBoid.startEggTimer(1);
            }
        }
    }
};




Dye.Boid.prototype.setSize=function(size){
    this.stats.size=size;
    this.body.setCircle(Math.sqrt(this.stats.size*12));
    this.scale.setTo(Math.sqrt(this.stats.size)/Dye.getSettings().sizeMultiplier, Math.sqrt(this.stats.size)/Dye.getSettings().sizeMultiplier);

    this.body.collideWorldBounds=false;
    this.body.data.shapes[0].sensor = true;
};


Dye.Boid.prototype.kill=function(){
    var that=this;
    this.updateGridPosition();

    Dye.Character.prototype.kill.call(this);
};

Dye.Boid.prototype.naturalDeath=function(){
    if (this.stats.isFood) {

    }
    else{
        var newBoidStats=Dye.Utils.clone(this.stats);
        newBoidStats.isFood=true;
        newBoidStats.minimalSize=1;
        newBoidStats.size=1;
        for (var x=0;x<this.stats.size;x++){
            var newBoid=this.level.getNewBoid(Dye.Utils.generateGuid(),this.x,this.y,newBoidStats);
            newBoid.body.rotation=Math.random()*Math.PI;
            this.level.layers.boids.add(newBoid);
            newBoid.drawBody(); //todo not so pretty - init doesn't work before boid added
            var randomDirectionPoint=new Phaser.Point(Math.random()*2-1, Math.random()*2-1);
            randomDirectionPoint.setMagnitude(6);
            newBoid.moveInDirecton(randomDirectionPoint,100);

            //newBoid.moveInDirecton(new Phaser.Point(0,0));

        }
    }
    this.kill();
};

Dye.Boid.prototype.drawBody=function(){
  this.stats.colorRGB=Dye.Utils.hslToRgb(this.stats.colorHSLA[0],
  this.stats.colorHSLA[1],
  this.stats.colorHSLA[2]);

  var bitmapId=this.stats.colorRGB.toString()+this.stats.isEgg; //todo ugly, create proper bitmapid
  var bitmapTexture;

  if (this.level.bitmapCache[bitmapId]){
    bitmapTexture=this.level.bitmapCache[bitmapId];
  }
  else{
    //need to draw new bitmap
    bitmapTexture=this.level.bitmapCache[bitmapId]=this.game.make.bitmapData(300,300);
    var ctx=bitmapTexture.ctx;

    ctx.fillStyle = "rgba({0},{1},{2},1)".format(this.stats.colorRGB[0],this.stats.colorRGB[1],this.stats.colorRGB[2]);

    if (this.stats.isFood){
        ctx.beginPath();
        ctx.rect(25,25,150,150);
        ctx.fill();
    }
    else if (this.stats.isEgg){
      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, 2 * Math.PI, false);
      ctx.fill();
    }
    else{
      var minTriangleBase=50;
      var maxTriangleBase=250;
      var triangleBase=Math.max(0,Math.min(maxTriangleBase,(1-this.stats.maxSpeed/20)*(maxTriangleBase-minTriangleBase)+minTriangleBase));

      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(150-triangleBase/2, 300);
      ctx.lineTo(150+triangleBase/2, 300);
      ctx.fill();
    }
  }

  this.loadTexture(bitmapTexture);
};


Dye.Boid.prototype.startEggTimer=function(time){
    var _time=time?time:5;
    this.timeEvents.startEggTimer=this.game.time.events.add(Phaser.Timer.SECOND*_time, function(){
        this.stats.isEgg=false;
        this.drawBody();
    }, this);
};

Dye.Boid.prototype.doHungerEvent=function(){
    //TODO create proper 'take damage' function
    if (this.stats.isFood==false && this.stats.isEgg==false){
        this.stats.energy-=this.stats.energyCost;
        this.stats.colorHSLA[1]=Math.round(99*this.stats.energy/this.stats.maxEnergy);
        this.drawBody();
        if (this.stats.energy<=0){
            this.naturalDeath();
        }
    }
};
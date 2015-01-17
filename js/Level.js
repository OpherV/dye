Dye=(window.Dye?window.Dye:{});
Dye.Level= function (game) {
    var that=this;

    this.game=game;

    this.isPaused=false;
    this.debugMode=true;

    this.layers={
        food: null,
        boids: null,
        ui: null
    };

    this.positionGridSize=100;
    this.positionGrid={};
    this.bitmapCache={};

    this.collisionGroups={

    };

    //TODO check last iteration
    for (var x=0;x<game.width/this.positionGridSize;x++){
            this.collisionGroups[x]=game.physics.p2.createCollisionGroup();
            console.log(this.collisionGroups[x].mask);
    }


    for (var layerName in this.layers){
        this.layers[layerName]=game.add.group();
    }

    this.timeEvents={};
    this.timeEvents.secondLoop=this.game.time.events.loop(Phaser.Timer.SECOND, function(){
        that.layers.boids.forEachAlive(function(boid){
            boid.doHungerEvent();
            if (boid.exists){
                boid.findTarget();
            }
        });
    });

    this.timeEvents.gridLoop=this.game.time.events.loop(Phaser.Timer.SECOND/8, function(){
        that.layers.boids.forEach(function(boid){
                boid.updateGridPosition();
        });
    });



    this.debugGraphic=game.add.graphics(0,0);

    this.speciesCounter=100;


    //generate food
    var foodData= {
        species: 1,
        colorHSLA: [0, 69, 55, 1],
        minimalSize: 1,
        maximalSize: 4,
        isFood: true,
        lifespan: 10000
    };
    for (var x=0;x<Dye.getSettings().numFood;x++){
        var newBoid=this.getNewBoid(Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,foodData);
        this.layers.boids.add(newBoid);
        newBoid.body.rotation=Math.random()*Math.PI;
        var randomDirectionPoint=new Phaser.Point(Math.random()*2-1, Math.random()*2-1);
        randomDirectionPoint.setMagnitude(10);
        newBoid.moveInDirecton(randomDirectionPoint);
    }

    //generate cow
    var cowData= {
        species: 2,
        colorHSLA: [140, 69, 30, 1],
        minimalSize: Dye.getSettings().cowMinSize,
        maximalSize: Dye.getSettings().cowMaxSize,
        lifespan: 30,
        speed: 200,
        maxSpeed: Dye.getSettings().cowMaxSpeed
    };
    for (x=0;x<Dye.getSettings().numCows;x++){
        var boid=this.getNewBoid(Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,cowData);
        this.layers.boids.add(boid);
    }

    //generate predator
    var predator= {
        species: 3,
        colorHSLA: [340, 99, 60, 1],
        minimalSize: Dye.getSettings().predatorMinSize,
        maximalSize: Dye.getSettings().predatorMaxSize,
        lifespan: 15,
        speed: 200,
        maxSpeed: Dye.getSettings().predatorMaxSpeed,
        rotateSpeed: 50
    };
    for (x=0;x<Dye.getSettings().numPredators;x++){
        var boid=this.getNewBoid(Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,predator);
        this.layers.boids.add(boid);
    }

    this.keyA = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.keyA.onDown.add(function(){
        this.debugMode=!this.debugMode;
        if(!this.debugMode){
            this.debugGraphic.clear();
        }
        console.log("debug mode: ",this.debugMode);
    }, this);


    game.input.onDown.add(function(pointer){
        console.log(this);
            if (this.debugMode) {
                var bodies = game.physics.p2.hitTest(pointer.position, this.layers.boids.children);
                if (bodies.length>0)
                {
                    this.debugSprite=bodies[0].parent.sprite;
                    console.log(this.debugSprite);
                }
            }
            else{

                var minSize=Dye.getSettings().newBoidMinSize;
                var maxSize=Dye.getSettings().newBoidMaxSize;
                var colorRGB=Dye.getSettings().newBoidColor;
                var colorHSL=Dye.Utils.rgbToHsl(colorRGB[0],colorRGB[1],colorRGB[2]);

                //create boid
                var newBoid= {
                    species: this.getNewSpecies(),
                    colorHSLA: [colorHSL[0], colorHSL[1], colorHSL[2], 1],
                    minimalSize: minSize,
                    maximalSize: maxSize,
                    lifespan: 20,
                    speed: 200,
                    maxSpeed: Dye.getSettings().newBoidMaxSpeed,
                    rotateSpeed: 50
                };

                var boid=this.getNewBoid(Dye.Utils.generateGuid(),pointer.x,pointer.y,newBoid);
                this.layers.boids.add(boid);
            }

        },this);

};
Dye.Level.prototype.constructor = Dye.Level;

Dye.Level.prototype.update=function(){
    if (this.isPaused==false) {

        for (var x=0;x<this.layers.boids.children.length;x++){
            this.layers.boids.children[x].update();
        }

        if (this.game.input.mousePointer.isDown && this.isPlanningBoid){
            var didMouseMove=!Phaser.Point.equals(this.game.input.mousePointer,this.previousMousePos);
            if (didMouseMove){
                for (var x=0;x<this.handles.circs.length;x++){
                    this.game.tweens.remove(this.handles.circs[x].tween);
                    this.handles.circs[x].destroy();
                }
                this.handles.circ=[];
                var pointerDistance = Phaser.Point.distance(this.game.input.mousePointer.positionDown,this.game.input.mousePointer);
                for (var x=0; x< pointerDistance/(this.circDNASize*2);x++){
                    var newHandle1 = new Phaser.Sprite(this.game,x*this.circDNASize*2,0,this.circleBitmapData);
                    var newHandle2 = new Phaser.Sprite(this.game,x*this.circDNASize*2,0,this.circleBitmapData);
                    this.handles.addChild(newHandle1);
                    this.handles.addChild(newHandle2);
                    this.handles.circs.push(newHandle1);
                    this.handles.circs.push(newHandle2);

                    var circsPerCycle= 10;
                    var moveDistance= (2 / 5 * (x % circsPerCycle) - Math.pow(x % circsPerCycle,2) / 25) * 20;

                    newHandle1.tween = this.game.add.tween(newHandle1).to({ y: moveDistance, alpha: 0.5 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: 0, alpha: 0.3 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: -moveDistance, alpha: 0.5 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: 0, alpha: 1 }, 500, Phaser.Easing.Linear.None)
                        .loop()
                        .start();

                    newHandle2.tween = this.game.add.tween(newHandle2).to({ y: -moveDistance, alpha: 0.5 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: 0, alpha: 1 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: moveDistance, alpha: 0.5 }, 500, Phaser.Easing.Linear.None)
                        .to({ y: 0, alpha: 0 }, 500, Phaser.Easing.Linear.None)
                        .loop()
                        .start();
                }
            }

            this.handles.x=this.game.input.mousePointer.x+this.circDNASize;
            this.handles.y=this.game.input.mousePointer.y+this.circDNASize;
            this.handles.rotation = Math.atan2(this.game.input.mousePointer.x - this.game.input.mousePointer.positionDown.x,
                                                - (this.game.input.mousePointer.y- this.game.input.mousePointer.positionDown.y) )+Math.PI/2;

            this.handles.endHandle.x=this.game.input.mousePointer.x;
            this.handles.endHandle.y=this.game.input.mousePointer.y;


            this.previousMousePos={x: this.game.input.mousePointer.x, y: this.game.input.mousePointer.y};
        }

    }
};

Dye.Level.prototype.render=function(){
    this.layers.boids.forEachAlive(function(boid){
        boid.render();
    });
};

Dye.Level.prototype.destroy=function(){
    this.isPaused=true;

    var deathList=[];
    this.layers.boids.forEachAlive(function(boid){
        deathList.push(boid);
    });

    for (var x=0;x<deathList.length;x++){
        deathList[x].die();
    }

    for (var layerName in this.layers){
        this.layers[layerName].destroy(true);
    }

    for (var timerName in this.timeEvents){
        this.timeEvents[timerName].timer.remove(this.timeEvents[timerName]);
        delete this.timeEvents[timerName];
    }

    this.debugGraphic.destroy();

    this.circleBitmapData=null; //TODO is this actual destroy?

    this.game.input.onDown.removeAll();


};

Dye.Level.prototype.paint=function(pointer,x,y){
    if (pointer.isDown)
    {
        var randDirection=Math.random()*2-1;
        var randDistance= this.game.rnd.integerInRange(1, 20);
        var randSize= this.game.rnd.integerInRange(20, 150);
        var randLocation=new Phaser.Point(x+Math.cos(randDirection)*randDistance,y+Math.sin(randDirection)*randDistance);

        var newPaintball=new Dye.Paintball(this,null,randLocation.x,randLocation.y,[0,99,99,0.3],randSize);
        this.layers.food.add(newPaintball);
    }
};

Dye.Level.prototype.getBrush=function(r,g,b,a){
    var brushString = "{0},{1},{2},{3}".format(r,g,b,a);
    if (!(brushString in this.brushCache)){
        this.brushCache[brushString]=Dye.Utils.getBrushSprite(this.game,r,g,b,a);
    }

    return this.brushCache[brushString].brush;
};

Dye.Level.prototype.getNewSpecies=function(){
    this.speciesCounter++;
    return this.speciesCounter;
};

Dye.Level.prototype.getNewBoid=function(id,x,y,stats){
    var boidCandidate=this.layers.boids.getFirstDead();
    if(boidCandidate){
        boidCandidate.revive();
        boidCandidate.reset(x,y);
        boidCandidate.init(stats);
    }
    else{
        boidCandidate=new Dye.Boid(this,id,x,y,stats);
    }

    if (this.layers.boids.length!=this.currentNumBoids){
        this.currentNumBoids=this.layers.boids.length;
        //console.log(this.currentNumBoids);
    }


    return boidCandidate;
};

Dye.Level.prototype.drawDebugGrid=function(x,y,color){
    var _color=color?color:0x00FF00;
    this.debugGraphic.beginFill(_color, 0.1);
    this.debugGraphic.drawRect(x*this.positionGridSize,y*this.positionGridSize,this.positionGridSize,this.positionGridSize);
    this.debugGraphic.drawRect(x*this.positionGridSize,y*this.positionGridSize,this.positionGridSize,this.positionGridSize);

    //var style = { font: "12px Arial", fill: "#ffffff", align: "left" };
    //this.game.add.text(x*this.positionGridSize, y*this.positionGridSize, (x+"x"+y), style);

    //that.debugGraphic.clear();
    //that.debugGraphic.beginFill(0x00FF00, 0.1);
    //for (var x=0;x<this.game.width/this.positionGridSize;x++){
    //    for (var y=0;y<this.game.height/this.positionGridSize;y++){
    //        if(that.positionGrid[x+"x"+y] && that.positionGrid[x+"x"+y].length>0){
    //            that.debugGraphic.drawRect(x*this.positionGridSize,
    //                y*this.positionGridSize,
    //                this.positionGridSize,
    //                this.positionGridSize);
    //        }
    //    }
    //}
};

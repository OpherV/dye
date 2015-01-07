Dye=(window.Dye?window.Dye:{});
Dye.Level= function (game) {
    var that=this;

    this.game=game;

    this.isPaused=false;

    this.brushCache={};

    //this.bitmapData: bitmapData,

    this.layers={
        food: null,
        boids: null,
        ui: null
    };

    this.collisionGroups={
        boids: null
    };

    for (var layerName in this.layers){
        this.layers[layerName]=game.add.group();
    }

    for (var collisionGroupName in this.collisionGroups){
        this.collisionGroups[collisionGroupName]=game.physics.p2.createCollisionGroup();
    }

    this.timeEvents={};
    this.timeEvents.hungerEvent=this.game.time.events.loop(Phaser.Timer.SECOND, function(){
        that.layers.boids.forEachAlive(function(boid){
            boid.doHungerEvent();
        });
    });

    this.debugGraphic=game.add.graphics(0,0);

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
        var newBoid=new Dye.Boid(this,Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,foodData);
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
        var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,cowData);
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
        var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,predator);
        this.layers.boids.add(boid);
    }
    //
    //for (var x=0;x<25;x++){
    //    var minimalSize=game.rnd.integerInRange(2, 4);
    //    var speciesData= {
    //        species: x,
    //        colorHSLA: [game.rnd.integerInRange(0, 359), 69, 30, 1],
    //        minimalSize: minimalSize,
    //        maximalSize: Math.round(minimalSize * game.rnd.integerInRange(3, 4)/2),
    //        lifespan: game.rnd.integerInRange(30, 30)
    //    };
    //    for (var y=0;y<10;y++){
    //        var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,speciesData);
    //        this.layers.boids.add(boid);
    //    }
    //}

    //this.game.input.addMoveCallback(this.paint, this);
    //this.game.input.onDown.add(function(pointer){
    //    var newPaintball=new Dye.Paintball(this,null,pointer.x,pointer.y,[0,99,99,1]);
    //    this.layers.food.add(newPaintball);
    //}, this);


    var circDNASize=this.circDNASize=5;

    var circleBitmapData=this.circleBitmapData= this.game.make.bitmapData(circDNASize*2,circDNASize*2);
    circleBitmapData.ctx.fillStyle = "rgba(255,255,255,1)";
    circleBitmapData.ctx.beginPath();
    circleBitmapData.ctx.arc(circDNASize, circDNASize, circDNASize, 0, Math.PI*2, false);
    circleBitmapData.ctx.closePath();
    circleBitmapData.ctx.strokeStyle = '#FFFFFF';
    circleBitmapData.ctx.stroke();
    //circleBitmapData.fill();
    this.handles = new Phaser.Sprite(this.game);
    this.handles.circs=[];
    this.layers.ui.add(this.handles);


    this.isPlanningBoid=false;

    this.previousMousePos={x:0,y:0};
    //game.input.onDown.add(function(pointer){
    //    this.isPlanningBoid=true;
    //
    //    if (!this.handles.startHandle){
    //        this.handles.startHandle= new Phaser.Sprite(this.game,pointer.x,pointer.y,this.circleBitmapData);
    //        this.handles.endHandle= new Phaser.Sprite(this.game,pointer.x,pointer.y,this.circleBitmapData);
    //        this.handles.startHandle.anchor.set(0.5);
    //        this.handles.endHandle.anchor.set(0.5);
    //        //this.layers.ui.add(this.handles.startHandle);
    //        //this.layers.ui.add(this.handles.endHandle);
    //    }
    //    this.handles.alpha=1;
    //    this.handles.scale.setTo(1,1);
    //    this.handles.startHandle.x= pointer.x;
    //    this.handles.startHandle.y= pointer.y;
    //},this);
    //


    game.input.onDown.add(function(pointer){
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

            var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),pointer.x,pointer.y,newBoid);
            this.layers.boids.add(boid);

        },this);

    //
    //game.input.onUp.add(function(pointer){
    //    this.isPlanningBoid=false;
    //
    //    var tween = this.game.add.tween(this.handles.scale).to({ x: 0.1, y: 0.1 }, 300, Phaser.Easing.Cubic.Out).start();
    //    tween.onComplete.add(function () {
    //        for (var x=0;x<this.handles.circs.length;x++){
    //            this.game.tweens.remove(this.handles.circs[x].tween);
    //            this.handles.circs[x].destroy();
    //
    //        }
    //
    //        var pointerDistance = Phaser.Point.distance(this.game.input.mousePointer.positionDown,this.game.input.mousePointer);
    //
    //
    //        var scale1Value= Phaser.Math.clamp(pointerDistance/600,0,1);
    //        var maxSize=scale1Value*13+7;
    //        //create boid
    //        var newBoid= {
    //            species: speciesCounter,
    //            colorHSLA: [Math.round(Math.random()*359), Math.round(Math.random()*99), Math.round(Math.random()*99), 1],
    //            minimalSize: Math.max(2,maxSize/2),
    //            maximalSize: maxSize,
    //            lifespan: (1-scale1Value)*30+15,
    //            speed: 200,
    //            maxSpeed: Math.random()*6,
    //            rotateSpeed: 50
    //        };
    //
    //        speciesCounter++;
    //        var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),pointer.x,pointer.y,newBoid);
    //        this.layers.boids.add(boid);
    //    },this);
    //
    //},this);

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
    this.speciesCounter++;;
    return this.speciesCounter;
};
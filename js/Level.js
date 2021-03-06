Dye=(window.Dye?window.Dye:{});
Dye.Level= function (game) {
    var that=this;

    this.game=game;

    this.isPaused=false;
    this.debugMode=false;

    this.layers={
        food: null,
        boids: null,
        ui: null
    };

    this.positionGridSize=100;
    this.positionGrid={};
    this.bitmapCache={};

    this.collisionGroups={};

    this.playerSpecies={};

    var statisticsData={
        labels: [],
        series: [[],[],[],[]]
    };

    //TODO check last iteration
    for (var x=0;x<=game.width/this.positionGridSize;x++){
            this.collisionGroups[x]=game.physics.p2.createCollisionGroup();
            this.collisionGroups[x].mask=Math.pow(2,x+2);
    }


    for (var layerName in this.layers){
        this.layers[layerName]=game.add.group();
    }

    var secondElapsed=0;

    this.timeEvents={};
    this.timeEvents.secondLoop=this.game.time.events.loop(Phaser.Timer.SECOND, function(){
        secondElapsed++;
        var totalSize=0;
        var totalMinSize=0;
        var totalMaxSize=0;
        var totalMaxSpeed=0;
        var totalBoids=0;

        that.layers.boids.forEachExists(function(boid){
            boid.doHungerEvent();
            if (boid.exists){
                boid.findTarget();

                //count statistics
                totalSize+=boid.stats.size;
                totalMinSize+=boid.stats.minimalSize;
                totalMaxSize+=boid.stats.maximalSize;
                totalMaxSpeed+=boid.stats.maxSpeed;
                totalBoids++;
            }
        });

        statisticsData.labels.push(secondElapsed);
        statisticsData.series[0].push((totalSize/totalBoids).toFixed(1));
        statisticsData.series[1].push((totalMinSize/totalBoids).toFixed(1));
        statisticsData.series[2].push((totalMaxSize/totalBoids).toFixed(1));
        statisticsData.series[3].push((totalMaxSpeed/totalBoids).toFixed(1));
        Dye.Charts.update(statisticsData);
    });

    this.timeEvents.gridLoop=this.game.time.events.loop(Phaser.Timer.SECOND/5, function(){
        that.layers.boids.forEach(function(boid){
                boid.updateGridPosition();
        });
    });

    //this.timeEvents.massCounter=this.game.time.events.loop(Phaser.Timer.SECOND*5, that.reportSize, this);



    this.debugGraphic=game.add.graphics(0,0);

    this.speciesCounter=100;


    //generate food
    var foodData= {
        species: 1,
        colorHSLA: [0, 69, 55, 1],
        minimalSize: 1,
        maximalSize: 4,
        isFood: true
    };
    for (var x=0;x<Dye.getSettings().numFood;x++){
        var newBoid=this.getNewBoid(Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,foodData);
        this.layers.boids.add(newBoid);
        newBoid.body.rotation=Math.random()*Math.PI;
        var randomDirectionPoint=new Phaser.Point(Math.random()*2-1, Math.random()*2-1);
        randomDirectionPoint.setMagnitude(5);
        newBoid.moveInDirecton(randomDirectionPoint);
    }

    //generate cow
    var cowData= {
        species: 2,
        colorHSLA: [140, 69, 30, 1],
        minimalSize: Dye.getSettings().cowMinSize,
        maximalSize: Dye.getSettings().cowMaxSize,
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


    //this.reportSize();

    game.input.onDown.add(function(pointer){
            if (this.debugMode) {
                var bodies = game.physics.p2.hitTest(pointer.position, this.layers.boids.children);
                if (bodies.length>0)
                {
                    this.debugSprite=bodies[0].parent.sprite;

                    console.log(this.debugSprite);
                }
            }
            else{
                var numPlayerSpecies=Object.keys(this.playerSpecies).length;
                if (numPlayerSpecies<10) {
                    var minSize = Dye.getSettings().newBoidMinSize;
                    var maxSize = Dye.getSettings().newBoidMaxSize;
                    var colorRGB = Dye.Utils.hexToRgb(Dye.getSettings().newBoidColor);
                    var colorHSL = Dye.Utils.rgbToHsl(colorRGB[0], colorRGB[1], colorRGB[2]);
                    //create boid
                    var newBoidStats = {
                        species: this.getNewSpecies(),
                        colorHSLA: [colorHSL[0], colorHSL[1], colorHSL[2], 1],
                        minimalSize: minSize,
                        maximalSize: maxSize,
                        speed: 200,
                        maxSpeed: Dye.getSettings().newBoidMaxSpeed,
                        rotateSpeed: 50,
                        belongsToPlayer: true
                    };
                    newBoidStats.originalSpecies=newBoidStats.species;
                    var boid = this.getNewBoid(Dye.Utils.generateGuid(), pointer.x, pointer.y, newBoidStats);
                    this.layers.boids.add(boid);

                    this.startGame(newBoidStats);

                    //update color for next boid
                    Dye.getSettings().newBoidColor='#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6);
                }
            }

        },this);

};
Dye.Level.prototype.constructor = Dye.Level;

Dye.Level.prototype.startGame = function(stats){
    var numPlayerSpecies=Object.keys(this.playerSpecies).length;
    var species=stats.species;
    this.playerSpecies[species]={};
    this.playerSpecies[species].boidCount=0;
    this.playerSpecies[species].survivalTimer=this.game.time.create(false);
    this.playerSpecies[species].survivalTimer.start();

    this.playerSpecies[species].survivalTimerText= new Phaser.Text(this.game, 50, 40+numPlayerSpecies*30, "");
    this.playerSpecies[species].survivalTimerText.visible=true;
    this.layers.ui.addChild(this.playerSpecies[species].survivalTimerText);

    this.playerSpecies[species].survivalTimerText.setStyle({ font: '20px arial', align: 'left', fill: Dye.getSettings().newBoidColor});

    this.isPlaying=true;
};

Dye.Level.prototype.checkLoseCondition= function(){
    if (this.isPlaying) {
        for(var playerSpecies in this.playerSpecies) {
            this.playerSpecies[playerSpecies].boidCount=0;
        }

        var that = this;
        for (var x = 0; x < this.layers.boids.children.length; x++) {
            var boid = this.layers.boids.children[x];
            if (boid.exists && boid.stats.belongsToPlayer) {
                this.playerSpecies[boid.stats.originalSpecies].boidCount++;
            }
        }

        for(playerSpecies in this.playerSpecies){
            if (this.playerSpecies[playerSpecies].boidCount==0){
                this.gameEnded(playerSpecies);
            }
        }
    }
};

Dye.Level.prototype.gameEnded= function(species){
    //this.playerSpecies[species].survivalTimerText.setStyle({ font: '20px arial', align: 'left', fill: "#ff0000"});
    this.playerSpecies[species].survivalTimer.pause();
    this.playerSpecies[species].survivalTimer.destroy();
    this.playerSpecies[species].survivalTimerText.destroy();
    console.log("time to extinction: "+this.playerSpecies[species].survivalTimerText.text);
    delete this.playerSpecies[species];

    var numPlayerSpecies=Object.keys(this.playerSpecies).length;
    if (numPlayerSpecies==0){
        this.isPlaying=false;
    }
};


Dye.Level.prototype.reportSize = function(){
    var log={
        total: 0,
        nonFood: 0,
        food: 0,
        creatures: {}
    };

    var that=this;
    that.layers.boids.forEachExists(function(boid){
        log.total += boid.stats.size;
        if (boid.stats.isFood){
            log.food++
        }
        else{
            log.nonFood++;
            //console.log("nonfood size",boid.stats.size);
        }
        //log.creatures[boid.id]=Dye.Utils.clone(boid.stats);
    });
    console.log("total size ",log.total, "numbood",log.food, "numnonfood",log.nonFood);
    return log;
};

Dye.Level.prototype.update=function(){
    if (this.isPaused==false) {

        for (var x=0;x<this.layers.boids.children.length;x++){
            this.layers.boids.children[x].update();
        }

    }
};

Dye.Level.prototype.updateTimer = function(){
    for(playerSpecies in this.playerSpecies){
        var survivalTimer=this.playerSpecies[playerSpecies].survivalTimer;
        var survivalTimerText=this.playerSpecies[playerSpecies].survivalTimerText;
        if (survivalTimer){
            var seconds = Math.floor(survivalTimer.seconds % 60) + "";
            seconds = seconds.length == 1 ? "0" + seconds : seconds;

            var minutes = Math.floor(survivalTimer.seconds / 60) + "";
            minutes = minutes.length == 1 ? "0" + minutes : minutes;


            survivalTimerText.setText(minutes + ':' + seconds);
        }
    }
};

Dye.Level.prototype.render=function(){
    this.layers.boids.forEachExists(function(boid){
        boid.render();
    });
    this.updateTimer();
};

Dye.Level.prototype.destroy=function(){
    this.isPaused=true;

    var deathList=[];
    this.layers.boids.forEachExists(function(boid){
        deathList.push(boid);
    });

    for (var x=0;x<deathList.length;x++){
        deathList[x].kill();
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

    if(this.survivalTimer){
        this.survivalTimer.stop(true);
    }


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
        boidCandidate.reset(x,y);
        boidCandidate.stats={};
        Dye.Character.prototype.init.call(boidCandidate,stats);
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

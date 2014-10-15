Dye=(window.Dye?window.Dye:{});
Dye.Level= function (game) {
    this.game=game;

    this.brushCache={};

    //this.bitmapData: bitmapData,

    this.layers={
        food: null,
        boids: null
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

    this.debugGraphic=game.add.graphics(0,0);


    for (var x=0;x<5;x++){
        var minimalSize=game.rnd.integerInRange(2, 4);
        var speciesData= {
            species: x,
            colorHSLA: [game.rnd.integerInRange(0, 359), 69, 30, 1],
            minimalSize: minimalSize,
            //maximalSize: minimalSize  +1,
            maximalSize: minimalSize * game.rnd.integerInRange(2, 2),
            lifespan: game.rnd.integerInRange(30, 30)
        };
        for (var y=0;y<3;y++){
            var boid=new Dye.Boid(this,Dye.Utils.generateGuid(),game.world.randomX,game.world.randomY,speciesData);
            this.layers.boids.add(boid);
        }
    }

    //this.game.input.addMoveCallback(this.paint, this);
    //this.game.input.onDown.add(function(pointer){
    //    var newPaintball=new Dye.Paintball(this,null,pointer.x,pointer.y,[0,99,99,1]);
    //    this.layers.food.add(newPaintball);
    //}, this);

};
Dye.Level.prototype.constructor = Dye.Level;

Dye.Level.prototype.update=function(){
    for (var x=0;x<this.layers.boids.children.length;x++){
        this.layers.boids.children[x].update();
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
Dye=(window.Dye?window.Dye:{});
Dye.core=(function(){

    var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var height =  Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var game=new Phaser.Game(width, height, Phaser.WEBGL, '', { preload: preload, create: create, update: update, render: render },true);


    var brush;
    var clearBrush;
    var bitmapData;
    var boid;

    function preload() {
       game.load.image('brush', 'assets/brush.png');
    }

    function create() {
        //	Enable p2 physics
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.enable([], false);


        bitmapData = game.add.bitmapData(game.width, game.height);

        bitmapData.fill(30,30,30,1);
        bitmapData.ctx.beginPath();
        bitmapData.ctx.rect(0,0,1,1);
        bitmapData.ctx.fill();

        bitmapData.addToWorld();

        var level={
            game: game,
            bitmapData: bitmapData,
            debugGraphic: game.add.graphics(0,0)
        };


        brush = Dye.Utils.getBrushSprite(game,255,null,null,30).brush;
        clearBrush = Dye.Utils.getBrushSprite(this.game,30,30,30).brush;

        //boids
        boid=new Dye.Boid(level,1,400,400);
        game.add.existing(boid);

        game.input.addMoveCallback(paint, this);

    }



    function paint(pointer, x, y) {

        if (pointer.isDown)
        {
            bitmapData.draw(brush, x, y,null,null,'lighter');
        }

    }

    function update() {
        boid.update();
    }


    function render(){
        bitmapData.draw(clearBrush, boid.x, boid.y,25,25,null);
    }



    return{
        game: game,
        version: "0.1"
    }
})();
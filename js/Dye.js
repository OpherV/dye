Dye=(window.Dye?window.Dye:{});
Dye.core=(function(){

    var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var height =  Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var game=new Phaser.Game(width, height, Phaser.WEBGL, '', { preload: preload, create: create, update: update, render: render },true);

    var brush;
    var bitmapData;
    var currentLevel;

    function preload() {
       game.load.image('brush', 'assets/brush.png');
    }

    function create() {
        //game.add.plugin(Phaser.Plugin.Debug);


        //	Enable p2 physics
        game.world.setBounds(0, 0, width, height);
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.enable([], false);


        bitmapData = game.add.bitmapData(game.width, game.height);

        bitmapData.fill(30,30,30,1);
        bitmapData.ctx.beginPath();
        bitmapData.ctx.rect(0,0,1,1);
        bitmapData.ctx.fill();

        bitmapData.addToWorld();

        currentLevel=new Dye.Level(game);

    }


    function update() {
        if (currentLevel) {
            currentLevel.update();
        }
    }


    function render(){
        if (currentLevel) {
            currentLevel.render();
        }
        //bitmapData.draw(clearBrush, boid.x, boid.y,25,25,null);
    }



    return{
        game: game,
        version: "0.1"
    }
})();
Dye=(window.Dye?window.Dye:{});
Dye.gui=(window.Dye.gui?window.Dye.gui:{});
Dye.gui.Healthbar= function (game,character) {
    this.game=game;
    this.character=character;
    this.barWidth=character.width;
    Phaser.Graphics.call(this, game, 0, 0);
    
    var barHeight=3;
    var xOffset=-5;
    var yOffset=-15;

    this.redraw=function(){
        var hp=this.character.stats.energy;
        var totalHp=this.character.stats.maxEnergy;

        this.clear();
        var bgColor= Dye.Utils.rgbToHex(255,0,0);
        this.beginFill(bgColor);
        this.lineStyle(barHeight, bgColor, 0.8);
        this.moveTo(xOffset,yOffset);
        this.lineTo(this.barWidth, yOffset);
        this.endFill();


        var colour = Dye.Utils.rgbToHex(0,255,0);


        this.beginFill(colour);
        this.lineStyle(barHeight, colour, 0.8);
        this.moveTo(xOffset,yOffset);
        this.lineTo(this.barWidth * hp / totalHp, yOffset);
        this.endFill();
    };



};

Dye.gui.Healthbar.prototype = Object.create(Phaser.Graphics.prototype);
Dye.gui.Healthbar.prototype.constructor = Dye.gui.Healthbar;

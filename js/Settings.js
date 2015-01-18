Dye=(window.Dye?window.Dye:{});
Dye.Settings=function(){

    this.numFood=500;
    this.numCows=50;
    this.cowMinSize=2;
    this.cowMaxSize=7;
    this.cowMaxSpeed=1;

    this.numPredators=5;
    this.predatorMinSize=6;
    this.predatorMaxSize=18;
    this.predatorMaxSpeed=3;

    this.nutritionMultiplier=7;
    this.mutationChance=0.05;
    this.energyCostMultiplier=50;
    this.sizeMultiplier=40;
    this.showDebug=false;

    this.newBoidColor= [0,211,225];
    this.newBoidMinSize=2;
    this.newBoidMaxSize=4;
    this.newBoidMaxSpeed=2;

    this.evolve=function(){
        Dye.core.startSimulation();
    }
};

document.addEventListener("DOMContentLoaded", function(event) {
    var settings = new Dye.Settings();
    var gui = new dat.GUI();

    Dye.getGui=function(){return gui;};
    Dye.getSettings=function(){return settings;};
    gui.remember(settings);

    gui.add(settings,"numFood",0);

    var cowFolder = gui.addFolder('Cows');
    cowFolder.add(settings,"numCows").step(1).min(0);
    cowFolder.add(settings,"cowMinSize").min(1);
    cowFolder.add(settings,"cowMaxSize").min(1);
    cowFolder.add(settings,"cowMaxSpeed",1,20);

    var predatorFolder = gui.addFolder('Predators');
    predatorFolder.add(settings,"numPredators").step(1).min(0);
    predatorFolder.add(settings,"predatorMinSize").min(1);
    predatorFolder.add(settings,"predatorMaxSize").min(1);
    predatorFolder.add(settings,"predatorMaxSpeed",1,20);

    var generalFolder = gui.addFolder('General');
    generalFolder.add(settings,"nutritionMultiplier");
    generalFolder.add(settings,"mutationChance",0,1);
    generalFolder.add(settings,"energyCostMultiplier",1);
    generalFolder.add(settings,"sizeMultiplier",1).step(1);
    generalFolder.add(settings,"showDebug");

    var newBoidFolder = gui.addFolder('New Boid');
    newBoidFolder.addColor(settings,"newBoidColor");
    var newBoidMinSizeController=newBoidFolder.add(settings,"newBoidMinSize",2).step(1);
    var newBoidMaxSizeController=newBoidFolder.add(settings,"newBoidMaxSize",3).step(1).listen();
    newBoidFolder.add(settings,"newBoidMaxSpeed",1,20);

    newBoidMinSizeController.onChange(function(value){
        newBoidMaxSizeController.min(value+1);
        settings.newBoidMaxSize=value*2;
    });

    gui.add(settings, 'evolve');
});

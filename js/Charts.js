Dye=(window.Dye?window.Dye:{});
Dye.Charts=(function(){
    var self=this;

    var chart;
    this.showChart=false;
    this.showAvgSize=true;
    this.showAvgMaxSpeed=false;
    this.showAvgMinSize=false;
    this.showAvgMaxSize=false;

    document.addEventListener("DOMContentLoaded", function(event) {

        var options = {
            width: 300,
            height: 200
        };

        var data = {
            labels: [0],
            series: [
                [0]
            ]
        };


        chart=new Chartist.Line('.ct-chart', data, options);

        //setInterval(function(){
        //      data.labels.push(Math.round(Math.random()*10));
        //      data.series[0].push(Math.round(Math.random()*10));
        //      var transformedData = transformData(data);
        //      chart.update(transformedData);
        //},1000);

        document.querySelector(".chartContainer button:nth-child(1)").addEventListener("click",function(){
            document.querySelector(".chartContainer").classList.toggle("showAvgSize");
        });
        document.querySelector(".chartContainer button:nth-child(2)").addEventListener("click",function(){
            document.querySelector(".chartContainer").classList.toggle("showAvgMaxSpeed");
        });
        document.querySelector(".chartContainer button:nth-child(3)").addEventListener("click",function(){
            document.querySelector(".chartContainer").classList.toggle("showAvgMinSize");
        });
        document.querySelector(".chartContainer button:nth-child(4)").addEventListener("click",function(){
            document.querySelector(".chartContainer").classList.toggle("showAvgMaxSize");
        });

        document.querySelector(".chartContainer .tab").addEventListener("click",function(){
            self.showChart=!self.showChart;
            document.querySelector(".chartContainer").classList.toggle("open");
        });
    });

    function _update(data){
        if(self.showChart) {
            var transformedData = _transformData(data);
            chart.update(transformedData)
        }
    }

    function _transformData(data){
        var maxColumns=10;

        var transformedData={
            labels: [],
            series: [[],[],[],[]]
        };

        for (var x=0;x<maxColumns;x++){
            var index=Math.floor(x*data.labels.length/maxColumns);
            transformedData.labels.push(data.labels[index]);
            transformedData.series[0].push(data.series[0][index]);
            transformedData.series[1].push(data.series[1][index]);
            transformedData.series[2].push(data.series[2][index]);
            transformedData.series[3].push(data.series[3][index]);
        }

        return transformedData;
    }

    return{
        update: _update
    }

})();
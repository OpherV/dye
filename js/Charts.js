Dye=(window.Dye?window.Dye:{});
Dye.Charts=(function(){

    var chart;

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

    });

    function _update(data){
        var transformedData = _transformData(data);
        chart.update(transformedData)
    }

    function _transformData(data){
        var maxColumns=10;

        if (data.labels.length<maxColumns){
            return data;
        }
        var transformedData={
            labels: [],
            series: [[]]
        };

        for (var x=0;x<maxColumns;x++){;
            var index=Math.floor(x*data.labels.length/maxColumns);
            transformedData.labels.push(data.labels[index]);
            transformedData.series[0].push(data.series[0][index]);
        }

        return transformedData;
    }

    return{
        update: _update
    }

})();
/* global d3, crossfilter */
let reader = new FileReader();
var dateFmt = d3.timeParse("%Y-%m-%d");

function formatFileSize(bytes,decimalPoint) {
    if(bytes == 0) return '0 Bytes';
    var k = 1000,
        dm = decimalPoint || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
 }

function loadFile() {
    const file = document.querySelector('input[type=file]').files[0];
    reader.addEventListener("load", parseFile, false);
    if (file) {
        reader.readAsText(file);
        document.getElementById("p1").innerHTML = "File name: "+ document.getElementById('csvUploader').files[0].name;
        document.getElementById("p2").innerHTML = "File size: "+ formatFileSize(document.getElementById('csvUploader').files[0].size);
        document.getElementById("p3").innerHTML = "File type: "+ document.getElementById('csvUploader').files[0].type;
        document.getElementById("p4").innerHTML = "Last modified: "+ document.getElementById('csvUploader').files[0].lastModifiedDate;

    }
    fileName = file.name;
    
}

function parseFile(){
    var doesColumnExist = false;
    const data = d3.csv.parse(reader.result, function(d){
        doesColumnExist = d.hasOwnProperty("area");
        d.Timestamp = dateFmt(d.Timestamp);
        return d;
    });
    var lines = data.length;
    console.log(data.slice(0,2));
    var setting = {
        roots: document.querySelector('.my-js-slider'),
        type: 'range',
        step: 1,
        limits: { minLimit: 0, maxLimit: lines},
        rangeValue: {
            minValue: 0,
            maxValue: lines
        }
    };
    var slider = wRunner(setting);
    var datasort = data.sort(function(a, b) {
        return d3.ascending(a.date, b.date);
    });


    slider.onValueUpdate(function(values){
        createTable(datasort.slice(slider.getValue().minValue, slider.getValue().maxValue));
        createHeatMap(datasort.slice(slider.getValue().minValue, slider.getValue().maxValue));
        createAdjacency(datasort.slice(slider.getValue().minValue, slider.getValue().maxValue));
        createLineGraph(datasort.slice(slider.getValue().minValue, slider.getValue().maxValue));
    });


    fileInfo(data);
    createTable(data);
    createHeatMap(data);
    createAdjacency(data);
    createLineGraph(data);
    
}

function createTable(data) {

    //The columns, say "keys" to display them
    const keys = d3.keys(data[0]);

    //The rows,
    const stats = d3.select("#stats")
        .html("")

    let sortAscending = true;

    stats.append("div")
        .text("Columns: " + keys.length)

    stats.append("div")
        .text("Rows: " + data.length)

    //the making of the table.
    d3.select("#table")
        .html("")
        .append("tr")
        .attr("class","fixed")
        .selectAll("th")
        .data(keys)
        .enter().append("th")
        .text(function(d) { return d; });


    d3.select("#table")
        .selectAll("tr.row")
        .data(data)
        .enter().append("tr")
        .attr("class", "row")
        .selectAll("td")
        .data(function(d) { return keys.map(function(key) { return d[key] }) ; })
        .enter().append("td")
        .text(function(d) { return d; })


    //Sorting the table
    d3.selectAll("#table")
        .selectAll("tr.row")
        .data(data)
        .sort(function(a, b) {
                // CHANGE date TO WHAT YOU WANT TO BE SORTED!!!!!
                //Works both with alphabet and numbers
                return d3.descending(a.date, b.date);
        })
        .enter().append("tr")
        .attr("class", "row")
        .selectAll("td")
        .data(function(d) { return keys.map(function(key) { return d[key] }) ; })
        .enter().append("td")
        .text(function(d) { return d; })
}

function createHeatMap(data) {


    d3.select('#heatMap').selectAll('*').remove()

    var divHeight = document.getElementById('box1').clientHeight;
    var divWidth = divHeight;

    // Using the standard Size thing from JS does anyone know how to convert this to scale to the size of the boxes>?
    var margin = {top: 79, right: 40, bottom: 75, left: 80},
        height = divHeight - margin.top - margin.bottom - (divHeight/3.55),
        width = divHeight - margin.left - margin.right - 80;

    d3.select('#heatMap').selectAll('*').remove();

    //Printing the field, still using the margin set above.
    var svg = d3.select("#heatMap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // There is an easier way to do this by using d.fromJobTitle and taking the keys, but then it has to be sorted to make sure they are in the same order.
        // So I believe this is faster.
        var fromTitle = ["Unknown", "Employee", "Trader", "In House Lawyer", "Manager", "Managing Director", "Director", "Vice President", "President", "CEO"]
        var toTitle = ["Unknown", "Employee", "Trader", "In House Lawyer", "Manager", "Managing Director", "Director", "Vice President", "President", "CEO"]

    //This is to make the x- axis and to make the grid layout scalable But does not work
    var xAxis = d3.scaleBand()
        .range([ 0, width ])
        .domain(fromTitle)
        .padding(0.03);
    svg.append("g")
        .style("font-size", 10)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis).tickSize(10))
    .selectAll("text")
        .attr("transform", "translate(-10, 0)rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", 10)
        .style("fill", "#0163ac")
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top - 20)
        .text("From job title.");


    //This is to make the y- axis and to make the grid layout scalable But does not work
        var yAxis = d3.scaleBand()
            .range([ height, 0 ])
            .domain(toTitle)
            .padding(0.03);
        svg.append("g")
            .style("font-size", 15)
            .call(d3.axisLeft(yAxis).tickSize(10))
            .selectAll("text")
            .attr("transform", "translate(-5,-10)rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", 10)
            .style("fill", "#0163ac")
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+30)
            .attr("x", 0)
            .text("To job title.")


    //To colour in the heatmap, can someb
        var ColourHM = d3.scaleLinear()
            .range(["#ff0000", "#ffbe00","#ffffff", "#0041ff"])
            .domain([-0.07, -0.03, 0.03, 0.07])

        // For When the mouse goes on a square
        var mouseHover = d3.select("#heatMap")
            .append("div")
            .style("opacity", 0)
            .attr("class", "mouseHover")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")


        //When the mouse is over the square.
        var mouseOnSquare = function(d) {
            mouseHover
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }


        //Putting the text down
        var textDisplay = function(d) {
            mouseHover
                //d3.mean(data.filter(d => d.fromJobtitle === "Employee"), (d => d.toJobtitle === "Employee"),d => d.sentiment)
                .html( "[" + d.fromJobtitle+" : "+ d.toJobtitle + "]  <br>"+"  value: " + d.sentiment + "<br>  mean: "
                    + d3.mean(data.filter(d => d.fromJobtitle === d.fromJobtitle,
                    d.toJobtitle === d.toJobtitle),
                        d => d.sentiment))
                .attr("x", (d3.mouse(this)[0]+30))
                .attr("y", (d3.mouse(this)[1]))
                .style("color", "black")
                .style("font-family", "Verdana");

        }


        //Return it to the original form what it was before mouse hover
        var mouseOffSquare = function(d) {
            mouseHover
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

// A title for the visualization, maybe do this for all vis?
    svg.append("text")
        .style("font-size", "24px")
        .style("font-family", "Verdana")
        .text("Sentiment Heatmap")
        .attr("y", -20)
        .attr("x", width/4);

        //Adding the squares
        svg.selectAll()
            .data(data, function(d) {
                return d.fromJobtitle+':'+d.toJobtitle;
            })
            .enter()

            .append("rect")
            .attr("x", function(d) {
                return xAxis(d.fromJobtitle)
            })
            .attr("y", function(d) {
                return yAxis(d.toJobtitle)
            })

            .attr("rx", 8)
            .attr("ry", 8)

            .style("stroke-width", 3)
            .style("opacity", 0.9)

            .attr("width", xAxis.bandwidth() )
            .attr("height", yAxis.bandwidth() )

            //Using the colour heatmap function made earlier to give the squares "heat"
            .style("fill", function(d) {
                return ColourHM(d.sentiment)
            })

            //d3 built in mouse interactivity stuff
            .on("mouseover", mouseOnSquare)
            .on("mousemove", textDisplay)
            .on("mouseleave", mouseOffSquare);
}

function createAdjacency(data) {

    var divHeight = document.getElementById('box1').clientHeight;
    var divWidth = divHeight;

    // Using the standard Size thing from JS does anyone know how to convert this to scale to the size of the boxes>?
    var margin = {top: 79, right: 40, bottom: 75, left: 80},
        height = divHeight - margin.top - margin.bottom - (divHeight/3.55),
        width = divHeight - margin.left - margin.right - 80;

    d3.select('#Uniqueness').selectAll('*').remove();

    //Printing the field, still using the margin set above.
    var svg = d3.select("#Uniqueness")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // There is an easier way to do this by using d.fromJobTitle and taking the keys, but then it has to be sorted to make sure they are in the same order.
    // So I believe this is faster.
    var fromTitle = d3.map(data, function(d){return d.fromEmail;}).keys()
    var toTitle = d3.map(data, function(d){return d.toEmail;}).keys()

    var count = 0;
    for(let i=0; i<fromTitle.length; i++) {
        count++;
    }

    var count2 = 0;
    for(let i=0; i<toTitle.length; i++) {
        count2++;
    }

    //This is to make the x- axis and to make the grid layout scalable But does not work
    var xAxis = d3.scaleBand()
        .range([ 0, width ])
        .domain(fromTitle)
        .padding(0.03);
    svg.append("g")
        .style("font-size", (150/count))
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis).tickSize(2))
        .selectAll("text")
        .attr("transform", "translate(-10, 0)rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", (150/count))
        .style("fill", "#0163ac");

    //This is to make the y- axis and to make the grid layout scalable But does not work
    var yAxis = d3.scaleBand()
        .range([ height, 0 ])
        .domain(toTitle)
        .padding(0.03);
    svg.append("g")
        .style("font-size", (150/count2))
        .call(d3.axisLeft(yAxis).tickSize(2))
        .selectAll("text")
        .attr("transform", "translate(-5,-10)rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", (150/count2))
        .style("fill", "#0163ac");


    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top - 20)
        .text("From E-mail adress.");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left+30)
        .attr("x", 0)
        .text("To E-mail adress.")


    //To colour in the heatmap, can someb
    var ColourHM = d3.scaleLinear()
        .range(["#d2d2d2", "#000aff", "#ff7400", "#ff0000"])
        .domain([1, 3, 6, 9])

    // For When the mouse goes on a square
    var mouseHover = d3.select("#Uniqueness")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")


    //When the mouse is over the square.
    var mouseOnSquare = function(d) {
        mouseHover
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }


    //Putting the text down
    var textDisplay = function(d) {
        mouseHover
            .html( "[" + d.fromEmail+" : "+ d.toEmail + "]  "+"<br>  amount: " + Math.abs(Math.round(d.sentiment*100)+ 1))
            .style("left", (d3.mouse(this)[0]+70) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
            .style("color", "black")
            .style("font-family", "Verdana");

    }


    //Return it to the original form what it was before mouse hover
    var mouseOffSquare = function(d) {
        mouseHover
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)
    }



// A title for the visualization, maybe do this for all vis?
    svg.append("text")
        .style("font-size", "24px")
        .style("font-family", "Verdana")
        .text("Emails sent between adresses.")
        .attr("y", -20)
        .attr("x", width/8);


    //Adding the squares
    svg.selectAll()
        .data(data, function(d) {
            return d.fromEmail+':'+d.toEmail;
        })
        .enter()

        .append("rect")
        .attr("x", function(d) {
            return xAxis(d.fromEmail)
        })
        .attr("y", function(d) {
            return yAxis(d.toEmail)
        })

        .attr("rx", 1)
        .attr("ry", 1)


        .style("stroke-width", 1)
        .style("opacity", 0.9)

        .attr("width", xAxis.bandwidth() )
        .attr("height", yAxis.bandwidth() )

        //Using the colour heatmap function made earlier to give the squares "heat"
        .style("fill", function(d) {
            return ColourHM(Math.abs(Math.round(d.sentiment*100)+ 1))
        })



        //d3 built in mouse interactivity stuff
        .on("mouseover", mouseOnSquare)
        .on("mousemove", textDisplay)
        .on("mouseleave", mouseOffSquare);
}

function fileInfo(data){
   //Does not work for some reason?
 
     var NewUpload = d3.keys(data[0]);
     var CorrectFile = ["date", "fromId", "fromEmail", "fromJobtitle", "toId", "toEmail", "toJobtitle", "messageType", "sentiment", "Timestamp"];
    console.log(NewUpload )
     if (JSON.stringify(NewUpload) === JSON.stringify(CorrectFile)) {

    
            document.getElementById("p5").innerHTML = "The uploaded file: " + fileName + "  is in the correct format. " ;
    } else {
  
            document.getElementById("p5").innerHTML = "ERROR!! The file: " + fileName +  " Is not the correct format, this might cause issues!" ;
    }
}


function createLineGraph(data) {
    
    var parseDate = d3.timeParse("%Y-%m-%d");
    var formatMonth = d3.timeFormat("%B")
    var input = document.getElementById( 'csvUploader' );
    var fileName = input.files[0].name;


 //   ["Unknown", "Employee", "Trader", "In House Lawyer", "Manager", "Managing Director", "Director", "Vice President", "President", "CEO"]
    data100 = d3.group(data, d => d.fromJobtitle)
    
    dataA1 = data100.get("Unknown");
    dataB1 = data100.get("Employee");
    dataC1 = data100.get("Trader");
    dataD1 = data100.get("In House Lawyer");
    dataE1 = data100.get("Manager");
    dataF1 = data100.get("Managing Director");
    dataG1 = data100.get("Director");
    dataH1 = data100.get("Vice President");
    dataI1 = data100.get("President");
    dataJ1 = data100.get("CEO");

      
      data2 = d3.rollups(data,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var data22 = data2.map(function(d){
        return{
            date:parseDate(d[0]),
            sentiment:d[1]
        };
    });
    data22 = data22.slice().sort((a,b) => d3.ascending(a.date , b.date));

    var dataFilter = data22
    
    //Dataset for Unknown
      dataA2 = d3.rollups(dataA1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataA3 = dataA2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataA3 = dataA3.slice().sort((a,b) => d3.ascending(a.date , b.date));

    //Dataset for Employee
      dataB2 = d3.rollups(dataB1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataB3 = dataB2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataB3 = dataB3.slice().sort((a,b) => d3.ascending(a.date , b.date));

    //Dataset for Trader
      dataC2 = d3.rollups(dataC1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataC3 = dataC2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataC3 = dataC3.slice().sort((a,b) => d3.ascending(a.date , b.date));

    //Dataset for In House Lawyer
      dataD2 = d3.rollups(dataD1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataD3 = dataD2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataD3 = dataD3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for Manager
      dataE2 = d3.rollups(dataE1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataE3 = dataE2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataE3 = dataE3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for Managing Director
      dataF2 = d3.rollups(dataF1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataF3 = dataF2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataF3 = dataF3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for Director
      dataG2 = d3.rollups(dataG1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataG3 = dataG2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataG3 = dataG3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for Vice President
      dataH2 = d3.rollups(dataH1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataH3 = dataH2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataH3 = dataH3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for President
      dataI2 = d3.rollups(dataI1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataI3 = dataI2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataI3 = dataI3.slice().sort((a,b) => d3.ascending(a.date , b.date));

      //Dataset for CEO
      dataJ2 = d3.rollups(dataJ1,  v => d3.mean(v,d => d.sentiment), d => d.date)
      var dataJ3 = dataJ2.map(function(d){
          return{
              date:parseDate(d[0]),
              sentiment:d[1]
          };
      });
      dataJ3 = dataJ3.slice().sort((a,b) => d3.ascending(a.date , b.date));


    d3.select('#LineGraph').selectAll('*').remove();

    // Using the standard Size thing from JS does anyone know how to convert this to scale to the size of the boxes>?

    if (document.getElementById('box1').clientWidth >= document.getElementById('box2').clientHeight) {
        var divHeight = document.getElementById('box1').clientHeight;
        console.log("if");
    } else if (document.getElementById('box1').clientHeight < document.getElementById('box2').clientHeight) {
        var divHeight = document.getElementById('box2').clientHeight;
        console.log("else if");
    } else {
        var divHeight = document.getElementById('box2').clientHeight;
        console.log("else");
    }

    if (document.getElementById('box1').clientWidth >= document.getElementById('box2').clientWidth) {
        var divWidth = document.getElementById('box1').clientWidth;
        console.log("if");
    } else if (document.getElementById('box1').clientWidth < document.getElementById('box2').clientWidth) {
        var divWidth = document.getElementById('box2').clientWidth;
        console.log("else if");
    } else {
        var divWidth = document.getElementById('box2').clientWidth;
        console.log("else");
    }

    var margin = {top: 79, right: 40, bottom: 50, left: 80},
        height = divHeight - margin.top - margin.bottom - (divHeight/3.2),
        width = divWidth - margin.left - margin.right - 55;

      //add brush
      var brush = d3.brushX()
      .extent( [ [0,0], [width,height] ] )
      //.on("end", updateChart);

    //Printing the field, still using the margin set above.
    var svg = d3.select("#LineGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "white")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        var jobTitles = ["all", "Unknown", "Employee", "Trader", "In House Lawyer", "Manager", "Managing Director", "Director", "Vice President", "President", "CEO"]
            var maxDate = d3.max(data22, function(d) { return d.date;});
            var minDate = d3.min(data22, function(d) { return d.date;});
            //^ console prints <empty string> <empty string> so probably this does not work. When changed to parseDate(d.date), console prints undefined
            var maxSentiment = 0.15;
            var minSentiment = -0.15;
            
            document.getElementById("selectButton").innerHTML = "";

            d3.select("#selectButton")
                .selectAll('myOptions')
                .data(jobTitles)
                .enter()
                .append('option')
                .text(function (d) { return d; }) // text showed in the menu
                .attr("value", function (d) { return d; }) // corresponding value returned by the button

            
            
            var x = d3.scaleTime()
                .domain([minDate, maxDate])
                .range([0, width]);
            xAxis = svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .attr("stroke-width", "2")
                .call(d3.axisBottom(x))
            .selectAll("text")
                    .attr("transform", "translate(-6, 0)rotate(-25)")
                    .style("text-anchor", "end")
                    .style("font-size", 10)
                    .style("fill", "#0163ac");
            
            var y = d3.scaleLinear()
                .domain([minSentiment,maxSentiment])
                .range([height,0])
            var yAxis = d3.axisLeft(y);

            
    // Set the gradient
    svg.append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(minSentiment))
        .attr("x2", 0)
        .attr("y2", y(maxSentiment))
        .selectAll("stop")
        .data([
            {offset: "0%", color: "#ff0000"},
            {offset: "45%", color: "#ff3d00"},
            {offset: "55%", color: "#094fc7"},
            {offset: "100%", color: "#0023a8"}
        ])
        .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });

            //Getting the line no matter where the mouse
            var bisect = d3.bisector(function(d) { return d.date; }).left;

            // Indicator for where you selected data.
            var focus = svg
                .append('g')
                .append('circle')
                .style("fill", "red")
                .attr("stroke", "black")
                .attr('r', 8.5)
                .style("opacity", 0)

            // Text element maken
            var focusText = svg
                .append('g')
                .append('text')
                .style("opacity", 0)
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "middle")

            svg.append('svg')
                .attr('height','100%')
                .attr('width','100%');
                


            var line = svg.append('g')
                //.attr("clip-path", "url(#clip-path-zoom)")


                line.append("path")
                .attr("class", "line")
                .data(dataFilter)
                .attr("d", d3.svg.line()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(+d.sentiment) })
                )
        
            // Add the brushing
             line.append("g")
            .attr("class", "brush")
            .call(brush); 


            //hit box to activate mouse hover.
            svg
                .append('rect')
                .style("fill", "none")
                .style("pointer-events", "all")
                .attr('width', width)
                .attr('height', height)
                .on('mouseover', mouseover)
                .on('mousemove', mousemove)
                .on('mouseout', mouseout);

            svg.append("text")
                .style("font-size", "24px")
                .style("font-family", "Verdana")
                .text("Line graph of sentiment over time.")
                .attr("y", -20)
                .attr("x", width/10);

            svg.append('line')
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr("x1", 0.5)
                .attr("y1", 0)
                .attr("x2", 0.5)
                .attr("y2", height - 1.);

            svg.append("text")
                .style("font-size", "12px")
                .style("font-family", "Verdana")
                .text("0.15")
                .attr("y", 5)
                .attr("x", -35);

            svg.append("text")
                .style("font-size", "12px")
                .style("font-family", "Verdana")
                .text("-0.15")
                .attr("y", height + 4)
                .attr("x", -39);

            svg.append("text")
                .style("font-size", "12px")
                .style("font-family", "Verdana")
                .text("0")
                .attr("y", height/2 + 4)
                .attr("x", -20);

            svg.append('line')
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr("x1", 0)
                .attr("y1", height/2)
                .attr("x2", -10)
                .attr("y2", height/2);

            svg.append('line')
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr("x1", 0)
                .attr("y1", 1)
                .attr("x2", -6)
                .attr("y2", 1);

            svg.append('line')
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr("x1", 0)
                .attr("y1", height)
                .attr("x2", -6)
                .attr("y2", height);



    function update(selectedGroup) {

        // Create new data with the selection?
        if(selectedGroup == "Unknown"){
                dataFilter = dataA3
            } else if(selectedGroup == "Employee"){
            dataFilter = dataB3
        }  else if(selectedGroup == "Trader"){
            dataFilter = dataC3
        } else if(selectedGroup == "In House Lawyer"){
            dataFilter = dataD3
        } else if(selectedGroup == "Manager"){
            dataFilter = dataE3
        } else if(selectedGroup == "Managing Director"){
            dataFilter = dataF3
        } else if(selectedGroup == "Director"){
            dataFilter = dataG3
        } else if(selectedGroup == "Vice President"){
            dataFilter = dataH3
        } else if(selectedGroup == "President"){
            dataFilter = dataI3
        }else if(selectedGroup == "CEO"){
            dataFilter = dataJ3
        } else if(selectedGroup == "all"){
            dataFilter = data22
        }


        var x = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, width]);

        xAxis.remove()
        svg.selectAll("path").remove()
        xAxis = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("stroke-width", "2")
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(3)))
        .selectAll("text")
            .attr("transform", "translate(-6, 0)rotate(-25)")
            .style("text-anchor", "end")
            .style("font-size", 10)
            .style("fill", "#0163ac");


        line.append("path")
            .attr("class", "line")
            .datum(dataFilter)
            .attr("fill", "none")
            .attr("stroke", "url(#line-gradient)" )
            .attr("stroke-width", 2)
            .attr("d", d3.svg.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(+d.sentiment) })
            )

            bisect = d3.bisector(function(d) { return d.date; }).left;

    }


    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        update(selectedOption)
    })


            //alles zichtbaar maken.
            function mouseover() {
                focus.style("opacity", 1)
                focusText.style("opacity",1)
            }

            function mousemove() {
                // De values pakken
                var x0 = x.invert(d3.mouse(this)[0]);
                var i = bisect(dataFilter, x0, 1);
                xCord = dataFilter[i]
                var string = xCord.date.toLocaleString('en-US', {
                    weekday: 'short', // long, short, narrow
                    day: 'numeric', // numeric, 2-digit
                    year: 'numeric', // numeric, 2-digit
                    month: 'long', // numeric, 2-digit, long, short, narrow
                });
                focus
                    .attr("cx", x(xCord.date))
                    .attr("cy", y(xCord.sentiment))
                focusText
                    .html("Date: " + string + "  |  " + "Sentiment: " + Math.round(xCord.sentiment * 1000)/1000)
                    .attr("x", width/2)
                    .attr("text-anchor", "middle")
                    .attr("y", height - 10);
                    
            }

            //onzichtbaar als muis het vierkant verlaat.
            function mouseout() {
                focus.style("opacity", 0)
                focusText.style("opacity", 0)
            }

            svg.append("path")
                .datum(dataFilter)
                .attr("fill", "none")
                .attr("stroke", "url(#line-gradient)" )
                .attr("stroke-width", 2)
                .attr("d", d3.svg.line()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.sentiment) })
                )

}
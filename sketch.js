var network;
const map1 = new Map();
const timeMap = new Map();
const timeToNode = new Map();
const nameMap = new Map();
const followerMap = new Map();
const parentMap = new Map();
let slider;
var names = [];
var startpoint = 0;
let pause = false;
let adjFrame = 0;
let popsound;
let demotionVal = 1;
let demotionDen = 10;
//make restart
//pause
//click to end
//histogram
let histogram_x = 0;
let histogram_y = 0;
let histogram_width = 0;
let histogram_height = 0;
const max_bar_height = 3000;


let end_time = 0;
let bar_times = 0;
const num_bars = 150;
let hist_times = new Array(num_bars).fill(0);
let hist_heights = new Array(num_bars).fill(0);
let cur_bar = 0


function preload() {
  table = loadTable('links.csv', 'csv', 'header');
  nodes_table = loadTable('nodes.csv', 'csv', 'header');
  info_table = loadTable('nodes_t2.csv', 'csv', 'header');
  popsound = loadSound('bubl.wav');

  //ok first node may not necessarily be author watch out for that
  
}

function setup() { 
  slider = createSlider(0, 10, 0, 1);
  slider.position(windowWidth/30, windowHeight/20);
  slider.style('width', '500px');
  slider.style('height', '300px');
  restartNetwork();
  
  //histogram
  end_time = 0;
  for (let r = 0; r < nodes_table.getRowCount(); r++)
  {
    let n_time = int(parseFloat(nodes_table.getString(r,1)))
    if (end_time < n_time){
      end_time  = n_time
    }
  }

  bar_times = int( end_time/num_bars )
  hist_times = Array.from({ length: num_bars}, (_, i) => bar_times + (i * bar_times))
  histogram_x = windowWidth/30;
  histogram_y = 8*windowHeight/10;
  histogram_width = 8*windowWidth/30;
  histogram_height = 1*windowHeight/10;
} 

function mouseClicked() {

  pause = !pause;
  

}


function keyPressed(){
  if (key == ' '){ //this means space bar, since it is a space inside of the single quotes 
    restartNetwork();
    adjFrame = 0;
  }
}


function draw() { 
  background(255);
 
  timescale = 120;
  
  fill(200);
  textSize(windowHeight/40);

  text(formatTime(round(exp(adjFrame/timescale),1)), windowWidth/30, windowHeight/10);

  text("Adjust Demotion", windowWidth/30, 2*windowHeight/10);

  text("Reset [SPACE]", windowWidth/30, 3*windowHeight/10);


  if (!pause)
  {
    adjFrame++;
  network.update();
  }
  //network.displayConnections();
  network.display();
  demotionVal = slider.value();



  //histogram
  for (let i=0; i < cur_bar; i++){
    xpos = int(map(i,0,num_bars,histogram_x,histogram_x+histogram_width)) 
    y1 = histogram_y+histogram_height
    y2 = int(map(hist_heights[i],0,max_bar_height,histogram_y+histogram_height,histogram_y))
    line(xpos,y1,xpos,y2)
  }
  console.log(hist_heights[cur_bar])
  if ( (hist_times[cur_bar] - round(exp(adjFrame/timescale),1))  <= 0 ){
    cur_bar = cur_bar + 1
  }
}

function restartNetwork()
{
  //set everything to sum=0
  //unfired state
  //redo the setup function?
  //calculate distances

  scale(0.25);
  defaultradius = 32;
  timescale = 30;
  createCanvas(windowWidth,windowHeight);
  lastName = table.getString(1,0);

  network = new Network(0, 0);
  mainName = table.getString(0,1);
  minTime = 10000000;
  mainX = windowWidth/2;
  mainY = windowHeight/2;
  veryfirstguy = nodes_table.getString(nodes_table.getRowCount()-1, 0);

 var newNode = new Neuron(mainX, mainY, veryfirstguy, true, defaultradius*4);
 map1.set(veryfirstguy, newNode);

 
  for (let r = 0; r < info_table.getRowCount(); r++)
  {
    followerMap.set(info_table.getString(r, 2), info_table.getString(r,5));
    nameMap.set(info_table.getString(r, 2), info_table.getString(r,6))
  }
  for (let r = 0; r < table.getRowCount(); r++)
  {
     let id = table.getString(r,0);
     let parent = table.getString(r,1);
     parentMap.set(id, parent);
  }

  for (let r = 0; r < nodes_table.getRowCount(); r++)
  {
    id = nodes_table.getString(r,0);
    let time = int(parseFloat(nodes_table.getString(r,1)));
   // console.log(time);
    let angle = random(0, TWO_PI);
    let distance = random(40,windowHeight/2);
    if (parentMap.get(id) == veryfirstguy)
    {
     map1.set(id, new Neuron(mainX+cos(angle)*distance, mainY+sin(angle)*distance, id, true, defaultradius, time, "second"));
    }
    else if (parentMap.get(id)!=veryfirstguy)
    {
      map1.set(id, new Neuron(mainX+cos(angle)*distance, mainY+sin(angle)*distance, id, true, defaultradius, time, "other"));
    }
    timeMap.set(nodes_table.getString(r, 0), nodes_table.getString(r,1));
    timeToNode.set(nodes_table.getString(r, 1), nodes_table.getString(r,0));
    names.push(id);
  }

  map1.set(veryfirstguy, new Neuron(mainX, mainY, veryfirstguy, true, defaultradius, timeMap.get(veryfirstguy), "first"));

 




  //connect neurons using edges
  for (let r = table.getRowCount()-1; r >=0; r--)
  {
   network.connect(map1.get(table.getString(r,1)), map1.get(table.getString(r,0)), 2);
  }
  for (let i = 0; i < names.length; i++)
  {
    network.addNeuron(map1.get(names[i]));
  }


  first = map1.get(names[0]);
  console.log(first);





  //normalize distances (iterate through and make everything within a certain radius from another)

  console.log(table.getRowCount() + ' total rows in table');
  
  for (i=0; i<100;i++)
  {
  //network.orient();
  }
  network.update();
 
  network.displayConnections();
  network.display();
  network.feedforward(1, 1);
  newNode.fire();
  //fill(200,200,200);
  //rect(200, 600, 700, 700);

  cur_bar = 0
  hist_heights = new Array(num_bars).fill(0)
}

function Connection(from, to,w) {
  
  this.a = from;
  this.b = to;
  this.weight = w;
  this.sending = false;
  this.sender = null;
  this.output = 0;
  
  
  this.feedforward = function(val) {
    this.output = val*this.weight;
    this.sender = this.a.position.copy();
    this.sending = true;
    this.b.feedforward(val);
  
  }

  //make a note of when DOJA retweeted it and the big boom
  
  this.update = function() {
    if (this.sending) {
      this.sender.x = lerp(this.sender.x, this.b.position.x, 0.1);
      this.sender.y = lerp(this.sender.y, this.b.position.y, 0.1);
      var d = p5.Vector.dist(this.sender, this.b.position);
      if (d < 1) {
        this.b.feedforward(this.output);
        this.sending = false;
      }
    }
  }

  this.displayLine = function() {
    line(this.a.position.x, this.a.position.y, this.b.position.x, this.b.position.y);

  }
  
  this.display = function() {
    
    if (this.sending) {
      hasSent = true;
      fill(0);
      strokeWeight(1);
      ellipse(this.sender.x, this.sender.y, 2, 2);
    }
   
    
  }
}

function formatTime (seconds)
{
  hours = round(seconds/3600,0);
  minutes = round((seconds%3600)/60, 0); 
  finseconds = round((seconds%3600)%60, 1);
  return (hours + "hours, " + minutes + " min, "  + finseconds + " seconds after tweet");
}

function Network(x, y) {
  
  this.neurons = [];
  this.connections = [];
  this.position = createVector(x, y);
  
  this.addNeuron = function(n) {
    this.neurons.push(n);
  }
  
  this.connect = function(a, b, weight) {
    if (typeof a !== 'undefined' && typeof b !== 'undefined')
    {
    var c = new Connection(a, b, weight);
    a.addConnection(c);
    this.connections.push(c);
    }
  }
  
  this.feedforward = function() {
    for (var i = 0; i < arguments.length; i++) {
        var n = this.neurons[i];
        n.feedforward(arguments[i]);
    }
  }

  this.orient =function() {
    for(i=0; i< this.neurons.length; i++)
    {
      this.neurons[i].orient();
    }

  }
  
  this.update = function() {
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].update();
    }
    
    
    for (var i = 0; i < this.neurons.length; i++)
    {
      check = log(this.neurons[i].time)*120 - adjFrame;
     // console.log(check);
      if ( check <= 0)
      {
        //console.log("true");
        this.neurons[i].fire();
      }
    }
  }

  this.displayConnections = function() {
    push();
    translate(this.position.x, this.position.y);
    stroke(220);
    strokeWeight(2*0.4);
   
    
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].displayLine();
    }

  }
  
  this.display = function() {
    push();
    translate(this.position.x, this.position.y);
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].display();
    }

    for (var i = 0; i < this.neurons.length; i++) {
      this.neurons[i].display();
    }
    pop();
  }
}

function Neuron(x, y, name, active, radius, time, isFirst) {
  
  this.position = createVector(x, y);
  this.connections = [];
  this.sum = (isFirst == 'first'? 1: 0);
  this.r = 1;
  this.isTouched = false;
  this.name = name;
  this.active = active;
  this.time = time;
  this.isSending = false;
  this.isFirst = isFirst;
  
  this.addConnection = function(c) {
    this.connections.push(c);
  }
  
  this.feedforward = function(input) {
  //  console.log(input);
    this.sum += input;
  /*  if (this.sum > 0) {
      //this.fire();
      this.sum = 0;
      this.isTouched = true;

    }*/
  }

  this.orient = function() {
    var sumx = 0;
    var sumy = 0;
    for (j=0; j<this.connections.length; j++)
    {
      sumx = sumx+this.connections[j].b.position.x;
      sumy = sumy+this.connections[j].b.position.y;
    }
    if (sumx != 0 && sumy != 0)
    {
    this.position = createVector(sumx/this.connections.length, sumy/this.connections.length);
    }
  }
  
  this.fire = function() {
    if (!this.isSending && this.sum > 0)
    {
    //popsound.play();
    //console.log("fire!!");
    //this.r = 64;
    this.isSending = true;
    hist_heights[cur_bar]  = hist_heights[cur_bar] + 1
    for (var i = 0; i < this.connections.length; i++) {
      let rand = random(demotionDen);
      if (this.active && rand>demotionVal)
      {
       this.connections[i].feedforward(this.sum);
      }
     //  this.connections[i].isTouched = true;
    }
  }
  }
  
  this.display = function() {
    //console.log(followerMap.get(this.name));
   
    let scaler = int(followerMap.get(this.name))/1000+10;
   
   // console.log(scaler);
    //console.log(this.isTouched);
    if (this.active)
    {

   /*   if (this.isTouched)
      {
        fill(29, 161, 242);
      }*/
      noStroke();
      if (this.isSending)
      {
        fill(29, 161, 242, 100);
      if (this.isFirst =='first')
      {
        fill(200,154,222, 150);
        scaler = 200;

      }
      if (this.isFirst == 'second')
      {
        fill(218,112,214, 150);

      }
      /*if (this.connections.length > 10)
      {
      ellipse(this.position.x, this.position.y, this.r*3, this.r*3);
      }
      if (this.connections.length > 30)
      {
      ellipse(this.position.x, this.position.y, this.r*7, this.r*7);
      }
      if (this.connections.length > 100)
      {
        ellipse(this.position.x, this.position.y, this.r*9, this.r*9);
        fill(200);
        // stroke(200);
        textSize(10);
        text(this.name, this.position.x, this.position.y);
  
      }*/
     
      ellipse(this.position.x, this.position.y, scaler*this.r, scaler*this.r);
      //console.log(this.r);
     


      this.r = lerp(this.r, 0.7,0.1);


      }

    }
  
  
   
  }
}
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



function preload() {
  table = loadTable('links_tb.csv', 'csv', 'header');
  nodes_table = loadTable('nodes_tb.csv', 'csv', 'header');
  info_table = loadTable('users_tb.csv', 'csv', 'header');
  popsound = loadSound('bubl.wav');


 //ok first node may not necessarily be author watch out for that
  
}

function setup() { 
  slider = createSlider(0, 10, 0, 1);
  slider.position(200, 400);
  slider.style('width', '500px');
  slider.style('height', '300px');
  restartNetwork();
  

  
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
  textSize(80);
  text(formatTime(round(exp(adjFrame/timescale),1)), 200, 300);
  textSize(50);

  text("Adjust Demotion", 200, 620);

  text("Reset [SPACE]", 200, 700);


  if (!pause)
  {
    adjFrame++;
  network.update();
  }
  //network.displayConnections();
  network.display();
  demotionVal = slider.value();
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
  createCanvas(6000,5000);
  lastName = table.getString(1,0);

  network = new Network(0, 0);
  mainName = table.getString(0,1);
  minTime = 10000000;
  mainX = 3000;
  mainY = 2000;
  veryfirstguy = nodes_table.getString(0, 0);

 var newNode = new Neuron(mainX, mainY, veryfirstguy, true, defaultradius*4);
 map1.set(veryfirstguy, newNode);

 
  for (let r = 0; r < info_table.getRowCount(); r++)
  {
    followerMap.set(info_table.getString(r, 0), info_table.getString(r,1));
    nameMap.set(info_table.getString(r, 0), info_table.getString(r,2))
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
    let distance = random(400,2200);
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
  network.orient();
  }
  network.update();
 
  network.displayConnections();
  network.display();
  network.feedforward(1, 1);
  newNode.fire();
  //fill(200,200,200);
  //rect(200, 600, 700, 700);

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
      ellipse(this.sender.x, this.sender.y, 16, 16);
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
  this.r = radius;
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
    console.log("fire!!");
    this.r = 64;
    this.isSending = true;
  
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
   
    let scaler = int(followerMap.get(this.name))/300+20;
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
        fill(29, 161, 242, 200);
      if (this.isFirst =='first')
      {
        fill(200,154,222, 200);
        scaler = 200;

      }
      if (this.isFirst == 'second')
      {
        fill(218,112,214, 200);

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
     
      ellipse(this.position.x, this.position.y, scaler, scaler);
      
     




      }
    }

   

  
    if (this.active)
    {
    this.r = lerp(this.r,32,0.1);
    }
  }
}
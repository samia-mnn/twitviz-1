var network;
const map1 = new Map();
var names = [];


function preload() {
  table = loadTable('rts_time.csv', 'csv', 'header');
}

function setup() { 
  scale(0.25);
  defaultradius = 32;
  timescale = 30;
  createCanvas(6000,5000);
  lastName = table.getString(1,0);
  //console.log(table.getColumn('Source'));
 // console.log(lastName);
  network = new Network(0, 0);
  mainName = table.getString(0,1);
  console.log(mainName);
  maxTime = 1;
  mainX = 3000;
  mainY = 2000;
  img = loadImage("mavstweet.png");
  //console.log(mainName);

  var newNode = new Neuron(mainX, mainY, mainName, true, defaultradius*4);
  map1.set(mainName, newNode);
  map1.set(lastName, new Neuron(width/2+50, height/2+50))
  names.push(mainName);
  //create neurons
  for (let r = 2; r < table.getRowCount(); r++)
  {
    currName = table.getString(r, 0);
    time = int(table.getString(r,3));
    if (time > maxTime) {
      maxTime = time;
    }
    //everyone connected to main tweeter close to him for sure
    if (currName != lastName)
    {
      //set inner circle based just on time

      //if no time just random
      if (time==-1)
      {
      map1.set(currName, new Neuron(mainX+cos(random(0, TWO_PI))*random(300,500), mainY+sin(random(0, TWO_PI))*random(300,500), currName, false, defaultradius));
      }
      if (time!=-1)
      {
        map1.set(currName, new Neuron(mainX+cos(random(0, TWO_PI))*time/timescale, mainY+sin(random(0, TWO_PI))*time/timescale, currName, true, defaultradius));
      }
      //if it's not connected to the main tweeter, create positions based only on time and closest connection?
      //time*some scalar
      //lets see what that looks like
      if (table.getString(r, 1) != mainName)
      {
        parentNeuron= map1.get(table.getString(r,1));
        parentX = parentNeuron.position.x-mainX;
        parentY = parentNeuron.position.y-mainY;
        magnitude = sqrt(parentX*parentX+parentY*parentY);
        map1.set(currName, new Neuron(mainX+(parentX/magnitude)*time/timescale, mainY+(parentY/magnitude)*time/timescale, currName, true, defaultradius));
        if (time == -1)
        {
          map1.set(currName, new Neuron(mainX+(parentX)*1.2, mainY+parentY*1.2, currName, true, defaultradius));

        }
        
      }
      names.push(lastName);
    }
    lastName = currName;
  }
  names.push(currName);

  //connect neurons using edges
  for (let r = 1; r < table.getRowCount(); r++)
  {
   network.connect(map1.get(table.getString(r,1)), map1.get(table.getString(r,0)), table.getString(r,2));
  }
  for (let i = 0; i < names.length; i++)
  {
   // console.log(name);
    network.addNeuron(map1.get(names[i]));
  }


  first = map1.get(names[0]);
  console.log(first);
  goThrough(first, first.position.x, first.position.y, 10)



  //normalize distances (iterate through and make everything within a certain radius from another)

  console.log(table.getRowCount() + ' total rows in table');
  
  
 
} 

function draw() { 
  background(0);
  textSize(50);
  stroke(160,160,160);
  strokeWeight(4);
 // timescale = 30;
  for (var k=1; k<5; k++)
  {
  fill(0);
  ellipse(mainX,mainY, 2*maxTime/(timescale*k));
  fill(255,255,255);
  textSize(40);
  text(maxTime/k + "s", mainX - maxTime/(timescale*k),mainY)
  }
  fill(250,170,170);
  fill(170,170,170);
 // text("Tweet1", 800, 860);
 // text("Tweet2", 800, 920);
 // text("Tweet3", 800, 980);
  network.update();
  network.display();
  fill(29, 161, 242)
  stroke(29, 161, 242);
  ellipse(mainX, mainY, 100);
  line(mainX, mainY, mainX/3, mainY/2)
  rect(mainX/3, mainY/2, img.width*1.1, img.height*1.1);
  image(img, mainX/3+img.width*0.05, mainY/2+img.height*0.05);

  if (frameCount % 100 == 0) {
		network.feedforward(random(1), random(1));
  }
}


function goThrough (n, currposx, currposy, r)
{
  n.position = createVector(currposx + r*cos(random(0,2*PI)), currposy + r*cos(random(0,2*PI)));
  console.log(n);
  //console.log(n.connections);
  if (typeof n.connections !== 'undefined')
  {
  for (var i = 0; i < n.connections.length; i++) {
    goThrough(n.connections[i], n.position.x, n.position.y, r-6);
  }
}

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
  }
  
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
  
  this.display = function() {
    stroke(255);
    strokeWeight(this.weight*0.4);
   // console.log(this.a);
   // console.log(this.b);
    line(this.a.position.x, this.a.position.y, this.b.position.x, this.b.position.y);
    
    if (this.sending) {
      fill(255);
      strokeWeight(1);
      ellipse(this.sender.x, this.sender.y, 16, 16);
    }
  }
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
  
  this.update = function() {
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].update();
    }
  }
  
  this.display = function() {
    push();
    translate(this.position.x, this.position.y);
    for (var i = 0; i < this.neurons.length; i++) {
      this.neurons[i].display();
    }
    
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].display();
    }
    pop();
  }
}

function Neuron(x, y, name, active, radius) {
  
  this.position = createVector(x, y);
  this.connections = [];
  this.sum = 0;
  this.r = radius;
  this.isTouched = false;
  this.name = name;
  this.active = active;
  
  this.addConnection = function(c) {
    this.connections.push(c);
  }
  
  this.feedforward = function(input) {
    this.sum += input;
    if (this.sum > 1) {
      this.fire();
      this.sum = 0;
      this.isTouched = true;

    }
  }
  
  this.fire = function() {
    this.r = 64;
    
    for (var i = 0; i < this.connections.length; i++) {
      if (this.active)
      {
       this.connections[i].feedforward(this.sum);
      }
     //  this.connections[i].isTouched = true;
    }
  }
  
  this.display = function() {
    stroke(29, 161, 242);
    strokeWeight(1);

    var b = (29, 161, 242);
    fill(0,0,0);
    //console.log(this.isTouched);
    if (this.isTouched && this.active)
        fill(29, 161, 242);
    ellipse(this.position.x, this.position.y, this.r, this.r);
    fill(255,255,255);
    stroke(255,255,255);
    textSize(10);
    text(this.name, this.position.x, this.position.y);
    if (this.active)
    {
    this.r = lerp(this.r,32,0.1);
    }
  }
}
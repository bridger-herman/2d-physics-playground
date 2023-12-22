const Debug = false;

const TriangleRadius = 10;
const NumParticles = 1000;
const VelocityScale = 1.0;
const InitialVelocity = 0;
const MaxVelocity = 100;
const FireAccel = 50;
const SideAccel = 10;
const TargetFrameRate = 30;

const CanvasParentName = 'p5-canvas';
const Dampening = 0.000;

const SpawnLocation = 0; // pixels below bottom of screen
const ParticleLifetime = TargetFrameRate * 15; // frames to fade to black

// global variables
var lastSpawnTime = 0;
var CanvasWidth = 400;
var CanvasHeight = 400;
var particles = [];
var goalNum = 0;
var deltaTime;
var lastFrame;

class Particle {
    constructor(position, velocity, initialColor) {
        this.position = position;
        this.velocity = velocity;
        this.initialColor = initialColor;
        this.framesSinceSpawn = 0;
    }

    get heading() { return Math.atan2(this.velocity.x, -this.velocity.y); }

    draw() {
        push();
        noStroke();
        colorMode(RGB);
        // const ParticleStartColor = color(255, 0, 0);
        const ParticleEndColor = color(0, 0, 0);
        const percentThroughLifetime = this.framesSinceSpawn / ParticleLifetime;
        const particleColor = lerpColor(this.initialColor, ParticleEndColor,
            percentThroughLifetime);
        fill(particleColor);
        translate(this.position.x, this.position.y);
        rotate(this.heading);
        // triangle(
        //     -TriangleRadius * 0.5, TriangleRadius,
        //     0, -TriangleRadius,
        //     TriangleRadius * 0.5, TriangleRadius
        // );
        // fill(200, 70, 19);
        circle(0, 0, lerp(TriangleRadius, 1, percentThroughLifetime));

        // debug
        // fill(255);
        // text(this.heading.toFixed(0), 0, 0);
        pop();
    }
}

function setup() {
    // Assign canvas and parent
    let parent = document.getElementById(CanvasParentName);
    CanvasWidth = parent.clientWidth;
    CanvasHeight = parent.clientHeight;
    let theCanvas = createCanvas(CanvasWidth, CanvasHeight);
    theCanvas.parent(CanvasParentName);

    frameRate(TargetFrameRate);

    const c1 = color(255, 0, 0);
    const c2 = color(255, 100, 0);
    for (let i = 0; i < NumParticles; i++) {
        let t = i / NumParticles;
        let p = new Particle(
            // createVector(Math.random() * SpawnWidth + WallForceRadius, Math.random() * SpawnHeight + WallForceRadius),
            // createVector(Math.random() * CanvasWidth, CanvasHeight + SpawnLocation + SpawnLocation * Math.random()),
            createVector(Math.random() * CanvasWidth, SpawnLocation),
            createVector(0, Math.random() * InitialVelocity),
            lerpColor(c1, c2, t)
        );
        particles.push(p);
    }
}

function draw() {
    background(0);

    // calculate delta time for time-based animation
    const Now = new Date().getTime();
    deltaTime = Now - lastFrame;
    lastFrame = Now;
    let dt = deltaTime / 1000.0;
    document.title = `dt=${deltaTime}ms`;

    // Handle physics
    for (let p1 = 0; p1 < NumParticles; p1++) {
        // increase timeSinceSpawn
        particles[p1].framesSinceSpawn += 1;

        // If particle moved beyond top of screen, move back to bottom
        if (particles[p1].position.y > CanvasHeight)
        {
            // particles[p1].position.y = CanvasHeight + SpawnLocation + SpawnLocation * Math.random();
            particles[p1].position.y = SpawnLocation;
            particles[p1].velocity.y = Math.random() * InitialVelocity;
            particles[p1].framesSinceSpawn = 0;
        }

        let forceOnP1 = createVector(0, 0);

        // "heat" force upwards (only "release" with certain probability if it's
        // still down below)
        if (particles[p1].position.y > 0 || 
            (particles[p1].position.y <= 0 && Math.random() < 0.01))
        {
            let heatForce = createVector(0, Math.random() * FireAccel);
            forceOnP1.add(heatForce);
        }

        // some random side-to-side
        let sideForce = createVector((Math.random() * SideAccel * 2 - SideAccel), 0);
        forceOnP1.add(sideForce);

        // Apply forces to velocity
        forceOnP1.mult(dt);
        particles[p1].velocity.add(forceOnP1);

        // cap at max velocity
        if (particles[p1].velocity.x > MaxVelocity) particles[p1].velocity.x = MaxVelocity;
        if (particles[p1].velocity.y > MaxVelocity) particles[p1].velocity.y = MaxVelocity;
        if (particles[p1].velocity.z > MaxVelocity) particles[p1].velocity.z = MaxVelocity;

        // dampen velocity
        // particles[p1].velocity.mult(1.0 - Dampening);
    }


    // Update positions and headings based on velocity
    for (let p = 0; p < NumParticles; p++) {
        let velocityDeltaTime = p5.Vector.mult(particles[p].velocity, dt * VelocityScale);
        particles[p].position.add(velocityDeltaTime);
    }

    // Draw
    for (let p = 0; p < NumParticles; p++) {
        particles[p].draw();
    }
}

// function mouseClicked() {
//     console.log(mouseX / CanvasWidth, mouseY / CanvasHeight);
// }

function windowResized() {
    // Assign canvas and parent
    let parent = document.getElementById(CanvasParentName);
    CanvasWidth = parent.clientWidth;
    CanvasHeight = parent.clientHeight;
    resizeCanvas(CanvasWidth, CanvasHeight);
}
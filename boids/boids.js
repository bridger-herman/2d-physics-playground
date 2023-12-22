const Debug = false;

const TriangleRadius = 4;
const NumParticles = 100;
const VelocityScale = 1.0;
const FlockRadius = 50;
const StartingSpeed = 20;

// FORCES FOR TWEAKING
const SeparationForce = 0.75;
const CohesionForce = 0.01;
const CohesionVerticalRatio = 0.1; // height / width
const GravityForce = 10;
var WindForce = 10; // set by NOAA API
const WindForceMultiplier = 1.0;
const AlignmentForce = 0.01;
const GoalForce = 50.00;

const Dampening = 0.005;
const Randomness = 15.0;

const MaxVelocity = 30;
const TempRange = [-20, 45];
const SpeedRange = [0.1, 2.0];
var TemperatureVelocityMultiplier = 1.0; // set by NOAA API
var Temperature = 20; // set by NOAA API

const WallForceRadius = 20;
const TargetFrameRate = 30;
const CanvasParentName = 'p5-canvas';
var CanvasWidth = 400;
var CanvasHeight = 400;
var up;
var particles = [];
var goals = [];
var goalNum = 0;
var deltaTime;
var lastFrame;
var bg;

class Particle {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }

    get heading() { return Math.atan2(this.velocity.x, -this.velocity.y); }

    draw() {
        push();
        noStroke();
        fill(255, 0, 0);
        translate(this.position.x, this.position.y);
        rotate(this.heading);
        triangle(
            -TriangleRadius * 0.5, TriangleRadius,
            0, -TriangleRadius,
            TriangleRadius * 0.5, TriangleRadius
        );
        // fill(200, 70, 19);
        // circle(0, TriangleRadius * 0.5, 1);

        // debug
        // fill(255);
        // text(this.heading.toFixed(0), 0, 0);
        pop();
    }
}

function preload() {
    bg = loadImage('header.jpeg');
}

function setup() {
    // Assign canvas and parent
    let parent = document.getElementById(CanvasParentName);
    CanvasWidth = parent.clientWidth;
    CanvasHeight = parent.clientHeight;
    let theCanvas = createCanvas(CanvasWidth, CanvasHeight);
    theCanvas.parent(CanvasParentName);

    frameRate(TargetFrameRate);

    // setup goals
    goals = [
        createVector(0.029887920298879204, 0.13125),
        createVector(0.043586550435865505, 0.4625),
        createVector(0.1506849315068493, 0.41875),
        createVector(0.261519302615193, 0.18125),
        createVector(0.39975093399750933, 0.2),
        createVector(0.47198007471980075, 0.45),
        createVector(0.6400996264009963, 0.5125),
        createVector(0.6973848069738481, 0.25625),
        createVector(0.7671232876712328, 0.08125),
        createVector(0.9016189290161893, 0.16875),
        createVector(0.9427148194271482, 0.43125),
        createVector(0.9476961394769614, 0.28125),
        createVector(0.933997509339975, 0.0625),
        createVector(0.7957658779576587, 0.00625),
        createVector(0.49937733499377335, 0.175),
        createVector(0.41718555417185554, 0.28125),
        createVector(0.3125778331257783, 0.39375),
        createVector(0.199252801992528, 0.35),
        createVector(0.0448318804483188, 0.09375),
    ];

    // let p0 = new Particle(
    //     createVector(CanvasWidth / 2, CanvasHeight / 2),
    //     createVector(StartingSpeed, 0)
    // );
    // particles.push(p0);

    // const SpawnWidth = CanvasWidth - WallForceRadius * 2;
    // const SpawnHeight = CanvasHeight - WallForceRadius * 2;
    for (let i = 0; i < NumParticles; i++) {
        let p = new Particle(
            // createVector(Math.random() * SpawnWidth + WallForceRadius, Math.random() * SpawnHeight + WallForceRadius),
            createVector(Math.random() * FlockRadius + goals[0].x * CanvasWidth, Math.random() * goals[0].y * CanvasHeight),
            createVector(Math.random() * StartingSpeed - StartingSpeed / 2, Math.random() * StartingSpeed - StartingSpeed / 2)
        );
        particles.push(p);
    }


    // Get forecast for St Paul, MN
    // fetch('https://api.weather.gov/points/44.93,-93.06')
    //     .then(r => r.json())
    //     .then(j => fetch(j['properties']['forecastGridData']))
    //     .then(r => r.json())
    //     .then(j => {
    //         let temp = j['properties']['temperature']['values'][0]['value'];
    //         let windSpeed = j['properties']['windSpeed']['values'][0]['value'];
    //         console.log(`Wind speed: ${windSpeed}, temperature: ${temp}`);

    //         // set wind based on API
    //         WindForce = windSpeed;

    //         // set temperature based on API
    //         TemperatureVelocityMultiplier = map(temp, TempRange[0], TempRange[1], SpeedRange[0], SpeedRange[1]);
    //         Temperature = temp;
    //     });
}

function draw() {
    background(0);
    // background(bg);

    // calculate delta time for time-based animation
    const Now = new Date().getTime();
    deltaTime = Now - lastFrame;
    lastFrame = Now;
    let dt = deltaTime / 1000;
    document.title = `dt=${deltaTime}ms`;

    // Handle physics
    // Update velocities based on boids forces
    for (let p1 = 0; p1 < NumParticles; p1++) {
        let forceOnP1 = createVector(0, 0);

        // cohesion force
        // center of mass for all boids except this one (perceived center of mass)
        let centroid = createVector(0, 0);
        for (let p2 = 0; p2 < NumParticles; p2++) {
            if (p2 != p1) {
                centroid.add(particles[p2].position);
            }
        }
        centroid.div(NumParticles - 1);

        let cohesionForce = centroid.copy();
        cohesionForce.sub(particles[p1].position);
        cohesionForce.mult(CohesionForce);
        cohesionForce.x *= CohesionVerticalRatio;
        cohesionForce.y /= CohesionVerticalRatio;
        forceOnP1.add(cohesionForce);

        // separation
        let separationForce = createVector(0, 0);
        for (let p2 = 0; p2 < NumParticles; p2++) {
            if (p2 != p1) {
                let d = dist(
                        particles[p1].position.x,
                        particles[p1].position.y,
                        particles[p2].position.x,
                        particles[p2].position.y
                );
                let force;
                if (d > 0)
                    force = 1 / d;
                else
                    force = 1000000; // "infinite" force
                let pp = p5.Vector.sub(particles[p2].position, particles[p1].position);
                pp.normalize();
                pp.mult(force);
                separationForce.sub(pp);
            }
        }
        separationForce.mult(SeparationForce);
        forceOnP1.add(separationForce);


        // alignment
        // average velocity
        let avgVelocity = createVector(0, 0);
        for (let p2 = 0; p2 < NumParticles; p2++) {
            if (p2 != p1) {
                avgVelocity.add(particles[p2].velocity);
            }
        }
        avgVelocity.div(NumParticles - 1);

        let alignmentForce = avgVelocity.copy();
        alignmentForce.sub(particles[p1].velocity);
        alignmentForce.mult(AlignmentForce);
        forceOnP1.add(alignmentForce);

        // wall-avoidance force (clamp at 0)
        let wallForces = createVector(0, 0);
        let leftWallForce = Math.exp(-particles[p1].position.x - WallForceRadius);
        let rightWallForce = Math.exp(particles[p1].position.x - CanvasWidth - WallForceRadius);
        let topWallForce = Math.exp(-particles[p1].position.y - WallForceRadius);
        let bottomWallForce = Math.exp(particles[p1].position.y - CanvasHeight - WallForceRadius);

        if (leftWallForce > 0) {
            wallForces.x += leftWallForce;
        }
        if (rightWallForce > 0) {
            wallForces.x -= rightWallForce;
        }
        if (topWallForce > 0) {
            wallForces.y += topWallForce;
        }
        if (bottomWallForce > 0) {
            wallForces.y -= bottomWallForce;
        }

        forceOnP1.add(wallForces);

        // goal force
        // let goalForce = createVector(mouseX, mouseY);
        let goalPos = createVector(goals[goalNum].x * CanvasWidth, goals[goalNum].y * CanvasHeight);
        let goalForce = goalPos.copy();
        goalForce.sub(particles[p1].position);
        goalForce.normalize();
        // increment goal if goal passed
        if (dist(goalPos.x, goalPos.y, centroid.x, centroid.y) < FlockRadius) {
            goalNum = (goalNum + 1) % goals.length;
        }
        goalForce.mult(GoalForce);
        forceOnP1.add(goalForce);

        // Add gravity
        let gravityForce = createVector(0, GravityForce);
        forceOnP1.add(gravityForce);

        // Add wind
        // let windForce = createVector(WindForce, 0);
        // windForce.mult(WindForceMultiplier);
        // forceOnP1.add(windForce);

        // Add a randomness to the force
        let randomForce = createVector(Math.random() - 0.5, Math.random() - 0.5);
        randomForce.mult(Randomness);
        forceOnP1.add(randomForce);

        if (Debug && p1 == 0)
        {
            // draw goal
            push();
                translate(goalPos);
                fill(255, 255, 0);
                circle(0, 0, 10);
            pop();

            // draw forces on p1
            push();
            translate(particles[p1].position.x, particles[p1].position.y);

            stroke(0, 0, 0);
            noFill();
            circle(0, 0, FlockRadius);

            stroke(255, 0, 0);
            line(0, 0, cohesionForce.x / CohesionForce, cohesionForce.y / CohesionForce);

            stroke(0, 255, 0);
            line(0, 0, separationForce.x / SeparationForce, separationForce.y / SeparationForce);

            stroke(0, 0, 255);
            line(0, 0, alignmentForce.x / AlignmentForce, alignmentForce.y / AlignmentForce);

            stroke(0, 255, 255);
            line(0, 0, goalForce.x / GoalForce, goalForce.y / GoalForce);

            stroke(255, 0, 255);
            line(0, 0, gravityForce.x / GravityForce, gravityForce.y / GravityForce);

            stroke(255, 255, 0);
            line(0, 0, windForce.x / WindForce, windForce.y / WindForce);
            pop();
        }

        // Apply forces to velocity
        forceOnP1.mult(dt);
        particles[p1].velocity.add(forceOnP1);

        // cap at max velocity
        if (particles[p1].velocity.x > MaxVelocity) particles[p1].velocity.x = MaxVelocity;
        if (particles[p1].velocity.y > MaxVelocity) particles[p1].velocity.y = MaxVelocity;
        if (particles[p1].velocity.z > MaxVelocity) particles[p1].velocity.z = MaxVelocity;

        // dampen velocity
        particles[p1].velocity.mult(1.0 - Dampening);
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

    // draw a wind arrow
    // push();
    // translate(CanvasWidth - WallForceRadius, CanvasHeight - WallForceRadius);
    // noFill();
    // stroke(180);
    // circle(0, 0, 20);
    // fill(180);
    // triangle(-10, 0, 0, 10, 0, -10);
    // line(0, 0, 10, 0);
    // noStroke();
    // textAlign(RIGHT, CENTER);
    // // text(`temp: ${Temperature.toFixed(0)}C`, -20, -20)
    // text(`wind: ${WindForce.toFixed(0)} km/h`, -20, 0)
    // pop();
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
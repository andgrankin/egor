class Creature {
    constructor(x, y, antennaType, speed, viewRange) {
        this.x = x;
        this.y = y;
        this.antennaType = antennaType; // 'round' or 'square'
        this.speed = speed;
        this.viewRange = viewRange;
        this.hunger = 50; // starts at 50% hunger
        this.thirst = 50; // starts at 50% thirst
        this.targetX = null;
        this.targetY = null;
        this.state = 'wandering'; // wandering, seeking_food, seeking_water
    }

    update(apples, pond) {
        // Increase hunger and thirst over time
        this.hunger = Math.min(100, this.hunger + 0.1);
        this.thirst = Math.min(100, this.thirst + 0.1);

        // Decide what to do based on needs
        if (this.hunger >= 70 && this.hunger > this.thirst) {
            this.state = 'seeking_food';
            this.findNearestApple(apples);
        } else if (this.thirst >= 70) {
            this.state = 'seeking_water';
            this.targetX = pond.x;
            this.targetY = pond.y;
        } else if (!this.targetX || !this.targetY) {
            this.state = 'wandering';
            this.setRandomTarget();
        }

        this.move();
    }

    findNearestApple(apples) {
        let nearestApple = null;
        let nearestDistance = Infinity;

        apples.forEach(tree => {
            tree.apples.forEach(apple => {
                const distance = Math.hypot(this.x - apple.x, this.y - apple.y);
                if (distance < nearestDistance && distance <= this.viewRange) {
                    nearestDistance = distance;
                    nearestApple = apple;
                }
            });
        });

        if (nearestApple) {
            this.targetX = nearestApple.x;
            this.targetY = nearestApple.y;
        } else {
            this.setRandomTarget();
        }
    }

    move() {
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance > this.speed) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = null;
                this.targetY = null;
            }
        }
    }

    setRandomTarget() {
        this.targetX = Math.random() * 760 + 20; // Keep within canvas bounds
        this.targetY = Math.random() * 560 + 20;
    }

    draw(ctx) {
        // Draw view range area as a sector
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.beginPath();
        
        // Calculate view direction based on movement
        let viewAngle = 0;
        if (this.targetX !== null && this.targetY !== null) {
            viewAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        }
        
        // Draw a sector (90-degree field of view)
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.viewRange, viewAngle - Math.PI/4, viewAngle + Math.PI/4);
        ctx.lineTo(this.x, this.y);
        ctx.fill();

        // Draw body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw legs (only two)
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            const angle = (i * Math.PI) + Math.sin(Date.now() / 200) * 0.2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * 15,
                this.y + Math.sin(angle) * 15
            );
            ctx.stroke();
        }

        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 2, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw antennas
        ctx.strokeStyle = '#8B4513';
        if (this.antennaType === 'round') {
            ctx.beginPath();
            ctx.arc(this.x - 8, this.y - 12, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 8, this.y - 12, 3, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.rect(this.x - 10, this.y - 14, 4, 4);
            ctx.rect(this.x + 6, this.y - 14, 4, 4);
            ctx.stroke();
        }

        // Draw status bars
        this.drawStatusBar(ctx, this.hunger, '#ff0000', -20);
        this.drawStatusBar(ctx, this.thirst, '#0000ff', -15);
    }

    drawStatusBar(ctx, value, color, yOffset) {
        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 10, this.y + yOffset, 20, 3);
        // Draw filled portion with semi-transparent background
        ctx.fillStyle = color;
        const barWidth = value / 5;
        ctx.fillRect(this.x - 10, this.y + yOffset, barWidth, 3);
        // Add highlight when full
        if (value >= 100) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x - 10, this.y + yOffset, barWidth, 3);
            ctx.globalAlpha = 1.0;
        }
    }
}

class AppleTree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.apples = [];
        this.maxApples = 3;
        this.initApples();
    }

    initApples() {
        while (this.apples.length < this.maxApples) {
            this.addApple();
        }
    }

    addApple() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20 + 10;
        this.apples.push({
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance
        });
    }

    update(creatures) {
        creatures.forEach(creature => {
            this.apples = this.apples.filter(apple => {
                const distance = Math.hypot(creature.x - apple.x, creature.y - apple.y);
                if (distance < 10 && creature.hunger > 50) {
                    creature.hunger = 0;
                    setTimeout(() => {
                        if (this.apples.length < this.maxApples) {
                            this.addApple();
                        }
                    }, 10000);
                    return false;
                }
                return true;
            });
        });
    }

    draw(ctx) {
        // Draw tree trunk
        ctx.fillStyle = '#4B2810';
        ctx.fillRect(this.x - 5, this.y - 10, 10, 40);

        // Draw tree crown
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 30, 0, Math.PI * 2);
        ctx.fill();

        // Draw apples
        ctx.fillStyle = '#FF0000';
        this.apples.forEach(apple => {
            ctx.beginPath();
            ctx.arc(apple.x, apple.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class Pond {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    update(creatures) {
        creatures.forEach(creature => {
            const distance = Math.hypot(creature.x - this.x, creature.y - this.y);
            if (distance < this.radius && creature.thirst > 50) {
                creature.thirst = 0;
            }
        });
    }

    draw(ctx) {
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add some water effect
        ctx.strokeStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.creatures = [];
        this.trees = [];
        this.pond = new Pond(600, 300, 40);

        // Create creatures
        for (let i = 0; i < 5; i++) {
            this.creatures.push(new Creature(
                Math.random() * 700 + 50,
                Math.random() * 500 + 50,
                Math.random() < 0.5 ? 'round' : 'square',
                Math.random() * 2 + 1,
                Math.random() * 100 + 100
            ));
        }

        // Create apple trees
        this.trees.push(new AppleTree(200, 200));
        this.trees.push(new AppleTree(400, 400));

        this.gameLoop();
    }

    update() {
        this.creatures.forEach(creature => creature.update(this.trees, this.pond));
        this.trees.forEach(tree => tree.update(this.creatures));
        this.pond.update(this.creatures);
    }

    draw() {
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.trees.forEach(tree => tree.draw(this.ctx));
        this.pond.draw(this.ctx);
        this.creatures.forEach(creature => creature.draw(this.ctx));
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => new Game();
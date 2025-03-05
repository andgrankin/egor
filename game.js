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
        
        // Load the character sprite
        this.sprite = new Image();
        this.sprite.src = 'character.png';
        this.spriteSize = 30; // Adjust this based on your sprite size
    }

    update(apples, pond) {
        // Increase hunger and thirst over time
        this.hunger = Math.min(100, this.hunger + 0.1);
        this.thirst = Math.min(100, this.thirst + 0.1);

        // Check for death condition
        if (this.hunger >= 100 || this.thirst >= 100) {
            return false; // Creature dies
        }

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
        return true; // Creature survives
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
        ctx.fillStyle = 'rgba(173,216,230, 0.3)';
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

        // Draw the character sprite
        ctx.drawImage(
            this.sprite,
            this.x - this.spriteSize/2,
            this.y - this.spriteSize/2,
            this.spriteSize,
            this.spriteSize
        );

        
        // Draw status bars
        this.drawStatusBar(ctx, this.hunger, '#ff0000', -this.spriteSize/2 - 10);
        this.drawStatusBar(ctx, this.thirst, '#0000ff', -this.spriteSize/2 - 5);
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
        
        // Load tree sprite
        this.treeSprite = new Image();
        this.treeSprite.src = 'tree.png';
        this.treeSpriteSize = 60;
        
        // Load apple sprite
        this.appleSprite = new Image();
        this.appleSprite.src = 'apple.png';
        this.appleSpriteSize = 10;
        
        this.initApples();
    }

    initApples() {
        while (this.apples.length < this.maxApples) {
            this.addApple();
        }
    }

    addApple() {
        // Position apples in the upper portion of the tree crown
        const angle = Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // Angle range from -40° to +40°
        const distance = Math.random() * 15 + 5; // Shorter distance range
        const verticalOffset = -this.treeSpriteSize * 0.7; // Place apples in upper portion
        this.apples.push({
            x: this.x + Math.cos(angle) * distance,
            y: this.y + verticalOffset + Math.sin(angle) * distance
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
        // Draw tree sprite
        ctx.drawImage(
            this.treeSprite,
            this.x - this.treeSpriteSize/2,
            this.y - this.treeSpriteSize,
            this.treeSpriteSize,
            this.treeSpriteSize
        );

        // Draw apples using sprite
        this.apples.forEach(apple => {
            ctx.drawImage(
                this.appleSprite,
                apple.x - this.appleSpriteSize/2,
                apple.y - this.appleSpriteSize/2,
                this.appleSpriteSize,
                this.appleSpriteSize
            );
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

        // Create multiple apple trees (5-7)
        const numTrees = Math.floor(Math.random() * 3) + 5; // Random number between 5-7
        for (let i = 0; i < numTrees; i++) {
            let x, y, validPosition;
            do {
                x = Math.random() * (this.canvas.width - 100) + 50;
                y = Math.random() * (this.canvas.height - 100) + 50;
                validPosition = true;
                
                // Check distance from other trees
                for (let tree of this.trees) {
                    if (Math.hypot(x - tree.x, y - tree.y) < 100) {
                        validPosition = false;
                        break;
                    }
                }
            } while (!validPosition);
            
            this.trees.push(new AppleTree(x, y));
        }

        // Create multiple ponds (2-3)
        const numPonds = Math.floor(Math.random() * 2) + 2; // Random number between 2-3
        this.ponds = [this.pond]; // Convert single pond to array, keeping the original pond
        
        for (let i = 1; i < numPonds; i++) {
            let x, y, validPosition;
            do {
                x = Math.random() * (this.canvas.width - 100) + 50;
                y = Math.random() * (this.canvas.height - 100) + 50;
                validPosition = true;
                
                // Check distance from trees and other ponds
                for (let tree of this.trees) {
                    if (Math.hypot(x - tree.x, y - tree.y) < 80) {
                        validPosition = false;
                        break;
                    }
                }
                for (let pond of this.ponds) {
                    if (Math.hypot(x - pond.x, y - pond.y) < 100) {
                        validPosition = false;
                        break;
                    }
                }
            } while (!validPosition);
            
            this.ponds.push(new Pond(x, y, 40));
        }

        this.gameLoop();
    }

    update() {
        // Remove dead creatures
        this.creatures = this.creatures.filter(creature => creature.update(this.trees, this.pond));

        // Handle reproduction
        if (this.creatures.length < 10 && Math.random() < 0.002) {
            const parent = this.creatures[Math.floor(Math.random() * this.creatures.length)];
            if (parent && parent.hunger < 50 && parent.thirst < 50) {
                this.creatures.push(new Creature(
                    parent.x + (Math.random() * 40 - 20),
                    parent.y + (Math.random() * 40 - 20),
                    parent.antennaType,
                    Math.max(1, parent.speed + (Math.random() * 0.4 - 0.2)),
                    Math.max(50, parent.viewRange + (Math.random() * 20 - 10))
                ));
            }
        }

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
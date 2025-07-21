class Battle {
    constructor (enemies, playerHealth, playerResistances) {
        this.enemies = enemies;
        this.playerHealth = playerHealth;
        this.playerResistances = playerResistances;
    }
    delete(){
        this.enemies = [];
    }
    enemyTurn(){
        this.enemies.forEach(enemy => {
            this.playerHealth -= enemy.turn(this.playerResistances);
        });
    }
    playerTurn(attackQueue){
        attackQueue.forEach
    }
}

class PlayerAttack {
    constructor (targets) {

    }
}
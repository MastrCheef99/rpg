class Fighter {
    constructor(texture) {
        this.texture = texture;
        this.hit = new Attack("hit", "fight", 0.5, 10, 20, 0.1, 0.2, 1, 1);
        this.slash = new Attack("slash", "cut", 0.25, 40, 60, 0.05, 0.5, 5, 5);
    }
    turn(playerResistances){
        return Math.random() < 0.25 ? this.slash.calculate(playerResistances) : this.hit.calculate(playerResistances);
    }
}

class Attack {
    constructor(name, type, resistanceFactor, baseDamage, critDamage, critChance, missChance, baseAttackVariance, critVariance){
        this.name = name; 
        this.type = type; //type of damage. for resistances
        this.resistanceFactor = resistanceFactor; //the factor by which a resistance reduces damage (ex. 0.5 for half the damage if they resist)
        this.baseDamage = baseDamage; //the base amount of damage this does to a non-resistant player
        this.critDamage = critDamage; //the base amount of damage this does to a non-resistant player if the attack crits
        this.critChance = critChance; //the chance the attack crits
        this.missChance = missChance; //the chance the attack misses
        this.baseAttackVariance = baseAttackVariance; // a base attack will do a range of damage between baseDamange-this and baseDamage+this
        this.critVariance = critVariance; // same as baseAttackVariance but for crits
    }
    calculate(playerResistances) {
        if (Math.random() < this.missChance) return 0;
        let damage;
        Math.random() < this.critChance
            ? damage = this.critChance + getRndInteger(-this.critVariance, this.critVariance)
            : damage = this.baseDamage + (-this.baseAttackVariance, this.baseAttackVariance);
        if (playerResistances.includes(this.type)) damage *= this.resistanceFactor;
        return damage;
    }
}
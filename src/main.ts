import * as readline from 'readline';

// --- UTILITY: For handling console input ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompts the user for input and returns it as a promise.
 * @param query The question to ask the user.
 * @returns A promise that resolves to the user's input string.
 */
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * A helper function to get a non-negative integer from the user.
 * @param query The question to ask.
 * @returns A promise that resolves to a valid number.
 */
async function getNumberInput(query: string): Promise<number> {
    while (true) {
        const answer = await askQuestion(query);
        const number = parseInt(answer, 10);
        if (!isNaN(number) && number >= 0) {
            return number;
        }
        console.log("Invalid input. Please enter a non-negative number.");
    }
}


// --- CONFIGURATION: Game parameters ---
const STARTING_CASH = 50.00;
const SIMULATION_DAYS = 7;

// --- DATA STRUCTURES: Defining game objects ---

interface Inventory {
    cups: number;
    lemons: number;
    sugar: number; // in cups
    ice: number; // in cubes
}

interface Recipe {
    lemonsPerCup: number;
    sugarPerCup: number;
    icePerCup: number;
}

// --- CORE CLASS: Represents the Lemonade Stand ---

class LemonadeStand {
    cash: number;
    inventory: Inventory;
    recipe: Recipe;
    pricePerCup: number;

    constructor(startingCash: number) {
        this.cash = startingCash;
        this.inventory = { cups: 0, lemons: 0, sugar: 0, ice: 0 };
        this.recipe = { lemonsPerCup: 1, sugarPerCup: 1, icePerCup: 4 }; // 1 lemon, 1 cup sugar, 4 ice cubes per cup
        this.pricePerCup = 0.50; // 50 cents per cup
    }

    /** Displays the current status of the stand */
    displayStatus(): void {
        console.log("\n--- Current Stand Status ---");
        console.log(`Cash: $${this.cash.toFixed(2)}`);
        console.log("Inventory:");
        console.log(`  Cups: ${this.inventory.cups}`);
        console.log(`  Lemons: ${this.inventory.lemons}`);
        console.log(`  Sugar: ${this.inventory.sugar} cups`);
        console.log(`  Ice: ${this.inventory.ice} cubes`);
        console.log("--------------------------\n");
    }

    /**
     * Buys supplies and updates inventory and cash.
     * @param item The item to buy.
     * @param quantity The amount to buy.
     * @param price The price per item.
     * @returns True if purchase was successful, false otherwise.
     */
    buySupplies(item: keyof Inventory, quantity: number, price: number): boolean {
        const totalCost = quantity * price;
        if (totalCost > this.cash) {
            console.log(`\n!!! Not enough cash to buy ${quantity} ${item}. You only have $${this.cash.toFixed(2)}.`);
            return false;
        }
        this.cash -= totalCost;
        this.inventory[item] += quantity;
        console.log(`> Bought ${quantity} ${item} for $${total_cost.toFixed(2)}.`);
        return true;
    }

    /**
     * Sells one cup of lemonade if supplies are sufficient.
     * @returns True if a cup was sold, false otherwise.
     */
    sellCup(): boolean {
        const hasSupplies =
            this.inventory.cups > 0 &&
            this.inventory.lemons >= this.recipe.lemonsPerCup &&
            this.inventory.sugar >= this.recipe.sugarPerCup &&
            this.inventory.ice >= this.recipe.icePerCup;

        if (hasSupplies) {
            this.inventory.cups--;
            this.inventory.lemons -= this.recipe.lemonsPerCup;
            this.inventory.sugar -= this.recipe.sugarPerCup;
            this.inventory.ice -= this.recipe.icePerCup;
            this.cash += this.pricePerCup;
            return true;
        }
        return false;
    }
}

// --- GAME LOGIC CLASS: Manages the simulation ---

class Game {
    private stand: LemonadeStand;
    private day: number;

    constructor() {
        this.stand = new LemonadeStand(STARTING_CASH);
        this.day = 1;
    }

    /** Starts the main game loop */
    async start() {
        console.log("========================================");
        console.log("=== Welcome to the Lemonade Stand Sim! ===");
        console.log("========================================");
        this.stand.displayStatus();

        while (this.day <= SIMULATION_DAYS) {
            await this.playDay();
            this.day++;
        }

        console.log("\n--- Game Over! ---");
        console.log(`You finished with $${this.stand.cash.toFixed(2)}.`);
        rl.close();
    }

    /** Simulates a single day in the game */
    private async playDay() {
        console.log(`\n---------- Day ${this.day} ----------`);

        // 1. Generate daily conditions
        const weather = this.generateWeather();
        const prices = this.generatePrices();
        console.log(`Today's weather is: ${weather}`);
        console.log("Today's prices are:");
        console.log(`  Cups: $${prices.cups.toFixed(2)} each`);
        console.log(`  Lemons: $${prices.lemons.toFixed(2)} each`);
        console.log(`  Sugar: $${prices.sugar.toFixed(2)} per cup`);
        console.log(`  Ice: $${prices.ice.toFixed(2)} per 100 cubes`);


        // 2. Player buys supplies
        console.log("\nHow much would you like to buy?");
        const cupsToBuy = await getNumberInput("  Cups: ");
        this.stand.buySupplies("cups", cupsToBuy, prices.cups);
        
        const lemonsToBuy = await getNumberInput("  Lemons: ");
        this.stand.buySupplies("lemons", lemonsToBuy, prices.lemons);

        const sugarToBuy = await getNumberInput("  Cups of Sugar: ");
        this.stand.buySupplies("sugar", sugarToBuy, prices.sugar);

        const iceToBuy = await getNumberInput("  Ice Cubes (in 100s): ");
        this.stand.buySupplies("ice", iceToBuy * 100, prices.ice / 100);

        this.stand.displayStatus();

        // 3. Simulate sales
        const customers = this.calculatePotentialCustomers(weather);
        let cupsSold = 0;
        for (let i = 0; i < customers; i++) {
            if (this.stand.sellCup()) {
                cupsSold++;
            } else {
                console.log("\n!!! Ran out of supplies! Couldn't sell any more lemonade.");
                break;
            }
        }

        // 4. End of day report
        console.log("\n--- End of Day Report ---");
        console.log(`You sold ${cupsSold} cups of lemonade.`);
        this.stand.displayStatus();
    }

    private generateWeather(): 'Cloudy' | 'Sunny' | 'Hot' {
        const roll = Math.random();
        if (roll < 0.33) return 'Cloudy';
        if (roll < 0.66) return 'Sunny';
        return 'Hot';
    }

    private generatePrices() {
        // Prices fluctuate a bit each day
        return {
            cups: 0.05 + Math.random() * 0.02, // $0.05 - $0.07
            lemons: 0.20 + Math.random() * 0.10, // $0.20 - $0.30
            sugar: 0.10 + Math.random() * 0.05, // $0.10 - $0.15
            ice: 0.01 + Math.random() * 0.01 // $0.01 - $0.02 per 100
        };
    }

    private calculatePotentialCustomers(weather: 'Cloudy' | 'Sunny' | 'Hot'): number {
        switch (weather) {
            case 'Cloudy': return 20 + Math.floor(Math.random() * 10); // 20-29
            case 'Sunny': return 40 + Math.floor(Math.random() * 20); // 40-59
            case 'Hot': return 60 + Math.floor(Math.random() * 40); // 60-99
        }
    }
}


// --- ENTRY POINT: Start the game ---
const game = new Game();
game.start();
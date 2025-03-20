// prismaSingleton.js
const { PrismaClient } = require('@prisma/client');

class PrismaSingleton {
  constructor() {
    if (!PrismaSingleton.instance) {
      PrismaSingleton.instance = new PrismaClient();
    }
  }

  getClient() {
    return PrismaSingleton.instance;
  }
}

module.exports = new PrismaSingleton(); // Xuất đối tượng singleton

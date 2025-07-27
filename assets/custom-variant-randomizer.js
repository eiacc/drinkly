console.log('custom-variant-randomizer.js');
const TAGS_TO_MATCH = ["Sweet", "Citrus", "Rich"];

// Mockup or replace with parsed JSON
const cocktails = [
  { title: "Margarita", tags: ["Citrus", "Tequila"] },
  { title: "Old Fashioned", tags: ["Rich", "Whiskey"] },
  { title: "Whiskey Sour", tags: ["Citrus", "Whiskey"] },
  { title: "Espresso Martini", tags: ["Rich", "Sweet", "Coffee"] },
  { title: "Negroni", tags: ["Bitter", "Gin"] },
  { title: "Cosmopolitan", tags: ["Citrus", "Sweet"] }
];

function matchesTag(product) {
  return product.tags.some(tag => TAGS_TO_MATCH.includes(tag));
}

function pickRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomizeCocktails() {
  const filtered = cocktails.filter(matchesTag);
  const selected = pickRandomItems(filtered, 3);

  const resultDiv = document.getElementById("cocktailResults");
  resultDiv.innerHTML = selected.map(c => `<p>${c.title}</p>`).join("");
}
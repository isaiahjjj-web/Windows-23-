// Automatically import all wav and mp3 files from the folder
const clickSoundsModules = import.meta.glob('../assets/sounds/*.{wav,mp3}', { eager: true });

const clickSounds = Object.values(clickSoundsModules).map((mod) => mod.default);

// Function to pick a random click
export function getRandomClickSound() {
  const randomIndex = Math.floor(Math.random() * clickSounds.length);
  return clickSounds[randomIndex];
}

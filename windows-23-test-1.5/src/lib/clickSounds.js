// Automatically detect all .wav and .mp3 files (no eager loading)
const clickSoundsModules = import.meta.glob('../assets/sounds/*.{wav,mp3}');

// Function to pick a random click dynamically
export async function playRandomClickSound() {
  const keys = Object.keys(clickSoundsModules);
  if (keys.length === 0) return;

  // Pick a random file path
  const randomPath = keys[Math.floor(Math.random() * keys.length)];

  // Dynamically import that file
  const module = await clickSoundsModules[randomPath]();
  const soundSrc = module.default;

  // Play it
  const audio = new Audio(soundSrc);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

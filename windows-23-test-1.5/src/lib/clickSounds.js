// src/lib/clickSounds.js

// Automatically detect all .wav and .mp3 files in the folder (lazy, no eager loading)
const clickSoundsModules = import.meta.glob('../assets/sounds/*.{wav,mp3}');

// Function to pick and play a random click dynamically
export async function playRandomClickSound() {
  const soundPaths = Object.keys(clickSoundsModules);
  if (soundPaths.length === 0) return;

  // Pick a random file path
  const randomPath = soundPaths[Math.floor(Math.random() * soundPaths.length)];

  try {
    // Dynamically import the chosen file
    const module = await clickSoundsModules[randomPath]();
    const soundSrc = module.default;

    // Create audio instance and play
    const audio = new Audio(soundSrc);
    audio.currentTime = 0;
    await audio.play();
  } catch (err) {
    console.error("Failed to play click sound:", err);
  }
}

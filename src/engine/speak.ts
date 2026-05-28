/**
 * Speak a piece of text using the Web Speech API.
 * If already speaking, cancels and starts fresh.
 */
export function speak(text: string, lang = 'en-US') {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.85;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking() {
  window.speechSynthesis.cancel();
}

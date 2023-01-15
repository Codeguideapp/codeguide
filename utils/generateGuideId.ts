import { customAlphabet } from 'nanoid';

export function generateGuideId() {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 9);
  return nanoid();
}

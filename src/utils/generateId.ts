import { ulid } from 'ulid';

let lastTimestamp = 0;
export function generateId() {
  // ensure that the timestamp is always increasing
  // for example if you generate 2 ids in the same millisecond
  // (happens in synchronous execution)

  let newTimestamp = Date.now();
  if (newTimestamp <= lastTimestamp) {
    newTimestamp = lastTimestamp + 1;
  }
  lastTimestamp = newTimestamp;
  return ulid(newTimestamp);
}

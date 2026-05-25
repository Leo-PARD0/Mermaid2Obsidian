import { nanoid } from 'nanoid';

export function createId(prefix = '') {
  const id = nanoid(12);
  return prefix ? `${prefix}-${id}` : id;
}

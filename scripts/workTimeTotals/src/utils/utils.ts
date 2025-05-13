export const getElementsAtIndices = (array: any[], indices: number[]) => {
  const result: any[] = [];
  for (const index of indices) {
    if (index >= 0 && index < array.length) {
      result.push(array[index]);
    }
  }
  return result;
}

/**
 * Generate a list of patch operations (add/remove) by comparing two arrays
 * @param {Array} oldItems - The original array of items
 * @param {Array} newItems - The new array of items
 * @param {Function} compareFunc - Function to determine if items are equal
 * @returns {Array} - Array of patch operations
 */
const getPatch = (oldItems, newItems, compareFunc) => {
  // Items to remove (in old but not in new)
  const toRemove = oldItems.filter(oldItem => 
    !newItems.some(newItem => compareFunc(oldItem, newItem))
  );
  
  // Items to add (in new but not in old)
  const toAdd = newItems.filter(newItem => 
    !oldItems.some(oldItem => compareFunc(oldItem, newItem))
  );

  const operations = [];
  
  if (toRemove.length > 0) {
    operations.push({
      type: 'remove',
      items: toRemove
    });
  }
  
  if (toAdd.length > 0) {
    operations.push({
      type: 'add',
      items: toAdd
    });
  }
  
  return operations;
};

export default {
  getPatch
}; 
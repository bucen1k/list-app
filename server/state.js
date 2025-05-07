let appState = {
    selectedItems: [],
    customOrder: null
  };
  
  module.exports = {
    getState: () => ({ ...appState }),
    updateState: (newState) => {
      appState = { ...appState, ...newState };
      return appState;
    }
  };
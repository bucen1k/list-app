let state = {
  selectedItems: [],
  customOrder: null,
  inputData: {} 
};

function getState() {
  return state;
}

function updateState(newState) {
  state = { ...state, ...newState };
}

module.exports = { getState, updateState };

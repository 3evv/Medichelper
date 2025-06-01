// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "getSuggestions") {
//     const fieldValue = request.fieldValue;
//     // Here you would fetch your predefined inputs from a server or local storage
//     const suggestions = getPredefinedInputs(fieldValue);
//     sendResponse({ suggestions: suggestions });
//   }
// });

// function getPredefinedInputs(value) {
//   // Define your list of predefined inputs here
//   return [
//     "Option 1",
//     "Option 2",
//     "Option 3"
//   ];
// }

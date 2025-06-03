function  handleAField(){
  let Afield = document.getElementsByName("skladniki_procedury_4350")[0];
  Afield.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (Afield.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  Afield.getBoundingClientRect().top + 'px';
  parent.style.width = '27%';
  parent.style.display = 'flex';
  parent.style.flexDirection = 'column';
  parent.style.justifyContent = 'center';

  popup = document.createElement('div');
  popup.style.position = 'relative';
  popup.style.backgroundColor = 'gray';
  popup.style.gap = '5px';
  popup.style.padding = '3px';
  popup.style.borderRadius = '5px';
  popup.style.display = 'flex';
  popup.style.flexGrow = '1'; 
  popup.style.flexDirection = 'column';
  popup.style.justifyContent = 'space-around';
  popup.style.alignContent = 'center';

  let kontakt = true;
  let oddział = 'Kliniki Neurochirurgii';
  let pasted_mode= false; 

  const suggestionText = document.createElement('div');
  suggestionText.style.display = 'flex';
  suggestionText.style.flexDirection = 'column';
  suggestionText.style.flexGrow = 1;
  suggestionText.style.justifyContent = 'space-between';
  suggestionText.style.alignContent = 'center';
  suggestionText.style.padding = '2px';

  function generateSuggestionText() { 
  suggestionText.innerHTML = `
  <div style= "gap: 10px;">
  <div class="info">  <span id=kontakt_status>${kontakt? 'Pełen kontakt słowno-logiczny.' : 'Kontakt słowno-logiczny utrudniony.'}</span></div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "kontakt_status":
        kontakt = !kontakt;
        break;
      case "paste_button":
        pasted_mode = !pasted_mode; 
        break;
      };

      generateSuggestionText();
      if(pasted_mode){
      copySuggestion();
      }

  };

   if(Afield.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `${kontakt? 'Pełen kontakt słowno-logiczny.' : 'Kontakt słowno-logiczny utrudniony.'}
 `;
  Afield.value = tempInput;
  }

  
  function disableCopy() {
    pasted_mode = false;
    generateSuggestionText();

  };

  suggestionText.style.color = 'black'; // Optional styling for the text color
  suggestionText.style.whiteSpace = 'whiteSpace'; // Add this line to enable multiline text
  
  popup.appendChild(suggestionText);
  parent.appendChild(popup);

    function updateFieldHeight() {
    marg_bottom = parseFloat(window.getComputedStyle(Afield).marginBottom);
    parent.style.left = (Afield.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = Afield.getBoundingClientRect.top + 'px';
    if (Afield.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = Afield.getBoundingClientRect().height + 'px';
    } else {
      if(Afield.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = Afield.getBoundingClientRect().height + 'px';
      } else {
       Afield.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = Afield.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (Afield.getBoundingClientRect().right + 20) + 'px';
  };

  window.onclick = updateFieldHeight;
  Afield.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  Afield.onkeydown = disableCopy;

}	;
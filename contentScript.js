  const inputs = document.querySelectorAll('input, textarea, select');
  let poleBadaniePrzedmiotowe = document.getElementById('badanie_przedmiotowe');

  // while(!poleBadaniePrzedmiotowe){
    
  // };
  poleBadaniePrzedmiotowe.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (poleBadaniePrzedmiotowe.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  poleBadaniePrzedmiotowe.getBoundingClientRect().top + 'px';
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

  let PESEL = document.getElementById('pesel').innerHTML;
  function calculateAge(){
    PESEL = PESEL.replace(/[^0-9]/g, '');
    PESEL = PESEL.substring(0, 6);
    // console.log(PESEL);
    let year = parseInt(PESEL.substring(0,2));
    let month = parseInt(PESEL.substring(2,4));
    if (month > 20) {
      year += 1999;
    } else {
      year += 1900;
      month -= 20;
    }
    let day = parseInt(PESEL.substring(4,6));
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;
    let currentDay = currentDate.getDate();
    let age = currentYear - year;
    if (currentMonth < month || (currentMonth == month && currentDay < day)) {
      age--;
    }
    return age;
  };

  let age = calculateAge();
  let tryb = true;
  let oddział = 'Kliniki Neurochirurgii';
  let cel_przyjecia = '';
  let choroby_przewlekle = true;
  let leki = true;
  let operacje = true;
  let papierosy = false;
  let alkohol = true;
  let alergie = false;
  let pasted_podmiotowe = false; 

  const suggestionText = document.createElement('div');
  suggestionText.style.display = 'flex';
  suggestionText.style.flexDirection = 'column';
  suggestionText.style.flexGrow = 1;
  suggestionText.style.justifyContent = 'space-between';
  suggestionText.style.alignContent = 'center';
  suggestionText.style.padding = '2px';
  // suggestionText.style.select

  // suggestionText.style.flexGrow = 1;

  function generateSuggestionText() { 
  suggestionText.innerHTML = `
  <div style= "gap: 10px;">
  <div class="info"> Pacjent lat: ${age} przyjęty w trybie <span id=tryb_status>${tryb? 'planowym' : 'pilnym'}</span> do ${oddział} celem ${cel_przyjecia}. Pacjent zgłasza następujące dolegliwości: </div>
  <div class="info" id="choroby_status"> ${choroby_przewlekle? "Choroby przewlekłe:" : "Nie choruje przewlekle"} </div>
  <div class="info" id="leki_status"> ${leki? "Przyjmuje następujące leki:" : "Nie przyjmuje leków na stałe."} </div>
  <div class="info" id="alergie_status"> ${alergie? "!Alergie: " : "Alergie neguje."} </div>
  <div class="info" id="operacje_status"> ${operacje? "Operacje chirurgiczne w przeszłości:" : "Operacje chirurgiczne w przeszłości neguje."}  </div>
  <div class="info" id="fajki_status"> ${papierosy? "Pali papierosy, ok. X dziennie.":"Nie pali papierosów."} </div>
  <div class="info" id="alko_status" > ${alkohol? "Spożywa alkohol okazjonalnie.":"Nie spożywa alkoholu."} </div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_podmiotowe?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

    suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "alko_status":
        alkohol = !alkohol;
        break;
      case "fajki_status":
        papierosy = !papierosy;
        break;
      case "operacje_status":
        operacje = !operacje;
        break;
      case "leki_status":
        leki = !leki;
        break;
      case "tryb_status":
        tryb = !tryb;
        break;
      case "choroby_status":
        choroby_przewlekle = !choroby_przewlekle;
        break;
      case "alergie_status":
        alergie = !alergie
        break;
      case "paste_button":
        pasted_podmiotowe = !pasted_podmiotowe; 
        break;
      };

      generateSuggestionText();
      if(pasted_podmiotowe){
      copySuggestion();
      }

  };
  
  if(poleBadaniePrzedmiotowe.value == ""){
    pasted_podmiotowe = true;
    copySuggestion();
  };
  generateSuggestionText();
    
     
  function copySuggestion() {
    let tempInput = `Pacjent lat: ${age} przyjęty w trybie ${tryb? 'planowym' : 'pilnym'} do ${oddział} celem ${cel_przyjecia}. Pacjent zgłasza następujące dolegliwości: 
${choroby_przewlekle? "Choroby przewlekłe:" : "Nie choruje przewlekle."} 
${leki? "Przyjmuje następujące leki:" : "Nie przyjmuje leków na stałe."}  
${alergie? "!Alergie: " : "Alergie neguje."}
${operacje? "Operacje chirurgiczne w przeszłości:" : "Operacje chirurgiczne w przeszłości neguje."}  
${papierosy? "Pali papierosy, ok. X dziennie.":"Nie pali papierosów."} ${alkohol? "Spożywa alkohol okazjonalnie.":"Nie spożywa alkoholu."} `;
  poleBadaniePrzedmiotowe.value = tempInput;
  }

  suggestionText.style.color = 'black'; // Optional styling for the text color
  suggestionText.style.whiteSpace = 'whiteSpace'; // Add this line to enable multiline text
  
  popup.appendChild(suggestionText);
  parent.appendChild(popup);




  function updateFieldHeight() {
    marg_bottom = parseFloat(window.getComputedStyle(poleBadaniePrzedmiotowe).marginBottom);
    parent.style.left = (poleBadaniePrzedmiotowe.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = poleBadaniePrzedmiotowe.getBoundingClientRect.top + 'px';
    if (poleBadaniePrzedmiotowe.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height - marg_bottom + 'px';
    } else {
      if(poleBadaniePrzedmiotowe.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height - marg_bottom + 'px';
      } else {
       poleBadaniePrzedmiotowe.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height - marg_bottom + 'px'
      }
    }
    parent.style.left = (poleBadaniePrzedmiotowe.getBoundingClientRect().right + 20) + 'px';
  };
  
  
  window.onclick = updateFieldHeight;
  poleBadaniePrzedmiotowe.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();

 

  inputs.forEach(input => {
    input.addEventListener('input', function(event) {
      chrome.runtime.sendMessage({ type: "getSuggestions", fieldValue: event.target.value }, (response) => {
        if (response && response.suggestions) {
          // Display suggestions in a popup or some UI element
          console.log(response.suggestions);
        }
      });
    });
});
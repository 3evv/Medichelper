// ==UserScript==
// @name        Medichelper
// @namespace   Violentmonkey Scripts
// @match       http://localhost:8000/*, https://medicus.usk/*, http://medicus.usk/*
// @grant       none
// @version     1.1
// @author      3evv
// @description 6/8/2025, 10:37:03 PM
// ==/UserScript==

if (document.readyState !== 'loading') {
    console.log('document is already ready, just execute code here');
    fireExt();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('document was not ready, place code here');
        fireExt();
  });
}

function fireExt(){
    const typ_strony = document.getElementsByName("x_procedura_id")[0]?.value;
    console.log("Skrypt Medichelper działa. " + typ_strony);


    if(typ_strony !== undefined){
    switch(typ_strony){
      case '1740':
          handleBadaniePodmiotowe();
          handleOcenaStanuPsychicznego();
          handleOcenaStanuSpołecznego();
      break;
      case '252':
        handlePlanDiagnostyczny();
        handlePlanTerapeutyczny();
        handleOczekiwaneEfekty();
        selectOpisujący();
      break;
      default:
        console.log("Inny typ strony: " + typ_strony);
      };
    };
};

  function handleBadaniePodmiotowe(){
  let poleBadaniePrzedmiotowe = document.getElementsByName("skladniki_procedury_4335")[0];

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

  const patientInfos = document.querySelectorAll('#header .templateEditPageSubTitle b');
  let personal_data = patientInfos[0].innerHTML;
  let date_of_procedure = patientInfos[1].innerHTML;

  beg_of_PESEL = personal_data.indexOf('(') + 1;
  end_of_PESEL = personal_data.indexOf(')');
  let PESEL = personal_data.substring(beg_of_PESEL, end_of_PESEL);

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

  function disableCopy() {
    pasted_podmiotowe = false;
    generateSuggestionText();

  };

  suggestionText.style.color = 'black'; // Optional styling for the text color
  suggestionText.style.whiteSpace = 'whiteSpace'; // Add this line to enable multiline text

  popup.appendChild(suggestionText);
  parent.appendChild(popup);




  function updateFieldHeight() {
    marg_bottom = parseFloat(window.getComputedStyle(poleBadaniePrzedmiotowe).marginBottom);
    parent.style.left = (poleBadaniePrzedmiotowe.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = poleBadaniePrzedmiotowe.getBoundingClientRect.top + 'px';
    if (poleBadaniePrzedmiotowe.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height + 'px';
    } else {
      if(poleBadaniePrzedmiotowe.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height + 'px';
      } else {
       poleBadaniePrzedmiotowe.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = poleBadaniePrzedmiotowe.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (poleBadaniePrzedmiotowe.getBoundingClientRect().right + 20) + 'px';
  };


  window.onclick = updateFieldHeight;
  poleBadaniePrzedmiotowe.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  poleBadaniePrzedmiotowe.onkeydown = disableCopy;

};

function  handleOcenaStanuPsychicznego(){
  let OcenaStanuPsychicznego = document.getElementsByName("skladniki_procedury_4350")[0];
  OcenaStanuPsychicznego.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (OcenaStanuPsychicznego.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  OcenaStanuPsychicznego.getBoundingClientRect().top + 'px';
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
  let zorientowany = true;
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
  <div class="info">  <span id=kontakt_status>${kontakt? 'Pełen kontakt słowno-logiczny.' : 'Kontakt słowno-logiczny utrudniony.'}</span> <span id=zorientowany_status>${zorientowany? 'Zorientowany auto i allopsychicznie.' : 'Niezorientowany auto oraz allopsychicznie.'}</span></div>
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
      case "zorientowany_status":
        zorientowany = !zorientowany;
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

   if(OcenaStanuPsychicznego.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `${kontakt? 'Pełen kontakt słowno-logiczny. ' : 'Kontakt słowno-logiczny utrudniony. '}${zorientowany? 'Zorientowany auto i allopsychicznie.' : 'Niezorientowany auto oraz allopsychicznie.'}
    `;
  OcenaStanuPsychicznego.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(OcenaStanuPsychicznego).marginBottom);
    parent.style.left = (OcenaStanuPsychicznego.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = OcenaStanuPsychicznego.getBoundingClientRect.top + 'px';
    if (OcenaStanuPsychicznego.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = OcenaStanuPsychicznego.getBoundingClientRect().height + 'px';
    } else {
      if(OcenaStanuPsychicznego.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = OcenaStanuPsychicznego.getBoundingClientRect().height + 'px';
      } else {
       OcenaStanuPsychicznego.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = OcenaStanuPsychicznego.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (OcenaStanuPsychicznego.getBoundingClientRect().right + 20) + 'px';
  };


  window.onclick = updateFieldHeight;
  OcenaStanuPsychicznego.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  OcenaStanuPsychicznego.onkeydown = disableCopy;

}	;

function  handleOcenaStanuSpołecznego(){
  let OcenaStanuSpołecznego = document.getElementsByName("skladniki_procedury_4290")[0];
  OcenaStanuSpołecznego.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (OcenaStanuSpołecznego.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  OcenaStanuSpołecznego.getBoundingClientRect().top + 'px';
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
  <div class="info">  <span id=spoleczny_status> Bez zastrzeżeń </span> </div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "paste_button":
        pasted_mode = !pasted_mode;
        break;
      };

      generateSuggestionText();
      if(pasted_mode){
      copySuggestion();
      }

  };

   if(OcenaStanuSpołecznego.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `Bez zastrzeżeń.
 `;
  OcenaStanuSpołecznego.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(OcenaStanuSpołecznego).marginBottom);
    parent.style.left = (OcenaStanuSpołecznego.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = OcenaStanuSpołecznego.getBoundingClientRect.top + 'px';
    if (OcenaStanuSpołecznego.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = OcenaStanuSpołecznego.getBoundingClientRect().height + 'px';
    } else {
      if(OcenaStanuSpołecznego.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = OcenaStanuSpołecznego.getBoundingClientRect().height + 'px';
      } else {
       OcenaStanuSpołecznego.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = OcenaStanuSpołecznego.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (OcenaStanuSpołecznego.getBoundingClientRect().right + 20) + 'px';
  };

  window.onclick = updateFieldHeight;
  OcenaStanuSpołecznego.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  OcenaStanuSpołecznego.onkeydown = disableCopy;

}	;

function  handlePlanDiagnostyczny(){
  let polePlanDiagnostyczny = document.getElementsByName("skladniki_procedury_2243")[0];
  polePlanDiagnostyczny.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (polePlanDiagnostyczny.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  polePlanDiagnostyczny.getBoundingClientRect().top + 'px';
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

  let oddział = 'Kliniki Neurochirurgii';
  let pasted_mode= false;
  let badanie = true;
  let laboratoryjne = true;
  let obrazowe = true;

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
  <div class="info">  <span id=badanie_status style='${badanie? '' : 'text-decoration: line-through; color: #6F0001;'}'> Badanie podmiotowe i przedmiotowe. </span></div>
  <div class="info">  <span id=laboratoryjne_status style='${laboratoryjne? '' : 'text-decoration: line-through; color: #6F0001;'}'> Badania laboratoryjne. </span></div>
  <div class="info">  <span id=obrazowe_status style='${obrazowe? '' : 'text-decoration: line-through; color: #6F0001;'}'> Badania obrazowe. </span></div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

        case "badanie_status":
        badanie = !badanie;
        break;

      case "laboratoryjne_status":
        laboratoryjne = !laboratoryjne;
        break;

      case "obrazowe_status":
        obrazowe = !obrazowe;
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

   if(polePlanDiagnostyczny.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `${badanie? 'Badanie podmiotowe i przedmiotowe.' : ""}
${laboratoryjne? 'Badania laboratoryjne.'  : ""}
${obrazowe? 'Badania obrazowe.' : ""}
 `;
  polePlanDiagnostyczny.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(polePlanDiagnostyczny).marginBottom);
    parent.style.left = (polePlanDiagnostyczny.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = polePlanDiagnostyczny.getBoundingClientRect.top + 'px';
    if (polePlanDiagnostyczny.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = polePlanDiagnostyczny.getBoundingClientRect().height + 'px';
    } else {
      if(polePlanDiagnostyczny.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = polePlanDiagnostyczny.getBoundingClientRect().height + 'px';
      } else {
       polePlanDiagnostyczny.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = polePlanDiagnostyczny.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (polePlanDiagnostyczny.getBoundingClientRect().right + 20) + 'px';
  };


  window.onclick = updateFieldHeight;
  polePlanDiagnostyczny.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  polePlanDiagnostyczny.onkeydown = disableCopy;

}	;

function  handlePlanTerapeutyczny(){
  let polePlanTerapeutyczny = document.getElementsByName("skladniki_procedury_2244")[0];
  polePlanTerapeutyczny.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (polePlanTerapeutyczny.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  polePlanTerapeutyczny.getBoundingClientRect().top + 'px';
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
  <div class="info">  <span id=kontakt_status> Operacja chirurgiczna - </span></div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "paste_button":
        pasted_mode = !pasted_mode;
        break;
      };

      generateSuggestionText();
      if(pasted_mode){
      copySuggestion();
      }

  };

   if(polePlanTerapeutyczny.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
  let tempInput = `Operacja chirurgiczna -`;
  polePlanTerapeutyczny.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(polePlanTerapeutyczny).marginBottom);
    parent.style.left = (polePlanTerapeutyczny.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = polePlanTerapeutyczny.getBoundingClientRect.top + 'px';
    if (polePlanTerapeutyczny.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = polePlanTerapeutyczny.getBoundingClientRect().height + 'px';
    } else {
      if(polePlanTerapeutyczny.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = polePlanTerapeutyczny.getBoundingClientRect().height + 'px';
      } else {
       polePlanTerapeutyczny.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = polePlanTerapeutyczny.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (polePlanTerapeutyczny.getBoundingClientRect().right + 20) + 'px';
  };


  window.onclick = updateFieldHeight;
  polePlanTerapeutyczny.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  polePlanTerapeutyczny.onkeydown = disableCopy;

}	;

function  handleOczekiwaneEfekty(){
  let poleOczekiwaneEfekty = document.getElementsByName("skladniki_procedury_2245")[0];
  poleOczekiwaneEfekty.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (poleOczekiwaneEfekty.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  poleOczekiwaneEfekty.getBoundingClientRect().top + 'px';
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

  let rokowanie = true;

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
  <div class="info">  <span id=kontakt_status>${rokowanie? 'Rokowanie pomyślne. Poprawa stanu zdrowia i zmniejszenie dolegliwości. ' : 'Rokowanie niepomyślne. Poprawa stanu zdrowia i zmniejszenie dolegliwości. '}</span></div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "kontakt_status":
        rokowanie = !rokowanie;
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

   if(poleOczekiwaneEfekty.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `${rokowanie? 'Rokowanie pomyślne. Poprawa stanu zdrowia i zmniejszenie dolegliwości. ' : 'Rokowanie niepomyślne. Poprawa stanu zdrowia i zmniejszenie dolegliwości. '}
 `;
  poleOczekiwaneEfekty.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(poleOczekiwaneEfekty).marginBottom);
    parent.style.left = (poleOczekiwaneEfekty.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = poleOczekiwaneEfekty.getBoundingClientRect.top + 'px';
    if (poleOczekiwaneEfekty.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = poleOczekiwaneEfekty.getBoundingClientRect().height + 'px';
    } else {
      if(poleOczekiwaneEfekty.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = poleOczekiwaneEfekty.getBoundingClientRect().height + 'px';
      } else {
       poleOczekiwaneEfekty.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = poleOczekiwaneEfekty.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (poleOczekiwaneEfekty.getBoundingClientRect().right + 20) + 'px';
  };


  window.onclick = updateFieldHeight;
  poleOczekiwaneEfekty.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  poleOczekiwaneEfekty.onkeydown = disableCopy;

};

function selectOpisujący(){
  if(document.getElementsByName("rola_3733")[0].hasAttribute('selected')){
    document.getElementsByName("rola_3733_default_values_button")[0].click();
  }
};

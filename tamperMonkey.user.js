// ==UserScript==
// @name        Medichelper
// @namespace   Violentmonkey Scripts
// @match       http://localhost:8000/*
// @match       http*://medicus.usk/*
// @grant       none
// @version     1.14
// @author      3evv
// @description 6/8/2025, 10:37:03 PM
// @icon	https://raw.githubusercontent.com/3evv/Medichelper/main/images/icon128.jpeg	
// @homepageURL	https://github.com/3evv/Medichelper/blob/main/tamperMonkey.user.js
// @downloadURL https://github.com/3evv/Medichelper/raw/main/tamperMonkey.user.js
// ==/UserScript==

// node.innerHTML = GM_getResourceText("settings.html");

if (document.readyState !== 'loading') {
    fireExt();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        fireExt();
  });
}

function fireExt(){
      const nazwa_headera = document.getElementById("header").querySelector('.templateEditPageTitle').textContent;
      console.log(nazwa_headera);
      switch(nazwa_headera){
        case 'Zlecenie badań':
        handleBadaniaLaboratoryjne();
        break;
        case 'Badanie podmiotowe i przedmiotowe - Neurochirurgii':
          handleNeurochirurgia();
          break;

          
        case 'Badanie podmiotowe i przedmiotowe - Klinika Kardiologii i Chorób Wewnętrznych':
          handleInterna();
          break;
        case 'Proponowany plan diagnostyczno-terapeutyczny':
          handlePlanDiagnostycznoTerapeutyczny();
          break;
        case 'Ocena ryzyka związanego ze stanem odżywiania (NRS 2002)':
          handleNRS();
          break;
        case 'Obserwacje lekarskie':
          handleObserwacje();
          break;
        case 'Zlecenie leku':
          handleZlecenieLekow();
          break;
        default:
          console.log("Inny typ strony: " + nazwa_headera);
      }
};

function handleNeurochirurgia(){
          handleBadaniePodmiotoweNeurochirurgia();
          handleOcenaStanuPsychicznego();
          handleOcenaStanuSpołecznego();
};
function handleInterna(){
        handleBadaniePodmiotoweInterna();
        handleOcenaStanuPsychicznegoInterna();
        handleOcenaStanuSpołecznegoInterna();
}

function handlePlanDiagnostycznoTerapeutyczny(){
        handlePlanDiagnostyczny();
        handlePlanTerapeutyczny();
        handleOczekiwaneEfekty();
        selectOpisujący();
}

  function handleBadaniePodmiotoweNeurochirurgia(){
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
    let tempInput = `Pacjent lat ${age} przyjęty w trybie ${tryb? 'planowym' : 'pilnym'} do ${oddział} celem ${cel_przyjecia}. Pacjent zgłasza następujące dolegliwości:
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

function handleBadaniePodmiotoweInterna(){
  let poleBadaniePrzedmiotowe = document.getElementsByName("skladniki_procedury_4187")[0];

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
  let oddział = 'Oddziału Kardiologii';
  let cel_przyjecia = 'wykonania koronarografii';
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
  <div class="info"> ${age}-letni pacjent przyjęty w trybie <span id=tryb_status>${tryb? 'planowym' : 'pilnym'}</span> do ${oddział} celem ${cel_przyjecia}. Pacjent zgłasza następujące dolegliwości: </div>
  <div class="info" id="choroby_status"> ${choroby_przewlekle? "Choroby przewlekłe:" : "Choroby przewlekłe neguje."} </div>
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
    let tempInput = `${age}-letni pacjent przyjęty w trybie ${tryb? 'planowym' : 'pilnym'} do ${oddział} celem ${cel_przyjecia}. Pacjent zgłasza następujące dolegliwości:
${choroby_przewlekle? "Choroby przewlekłe:" : "Choroby przewlekłe neguje."}
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

function handleBadaniaLaboratoryjne(){
  let Afield = document.getElementsByName("skierowanie_opis_skierowania")[0];
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


  let przyjety = false;
  let podstawowy_zestaw = false;
  let kardiografia_zestaw = false;
  let pielegniarskie_zestaw = false;
  let pasted_mode = false; 
  let hemodynamika_zestaw = false;
  let id_do_klikniecia_podstawowe = ['wykonanie_poz_pak_290443', 'wykonanie_poz_pak_290583', 'wykonanie_poz_pak_290627', 'wykonanie_poz_pak_290544', 'wykonanie_poz_pak_290590', 'wykonanie_poz_pak_290408', 'wykonanie_poz_pak_290472', 'wykonanie_poz_pak_290518', 'wykonanie_poz_pak_290603'];
  let id_do_klikniecia_koronarografia = ['wykonanie_poz_pak_290583', 'wykonanie_poz_pak_290544', 'wykonanie_poz_pak_290590', 'wykonanie_poz_pak_290408', 'wykonanie_poz_pak_290472', 'wykonanie_poz_pak_290518', 'wykonanie_poz_pak_290603', 'wykonanie_poz_pak_290586', 'wykonanie_poz_pak_290607', 'wykonanie_poz_pak_290651', 'wykonanie_poz_pak_290584', 'wykonanie_poz_pak_290524'];
  let id_do_klikniecia_pielegniarskie = ['wykonanie_poz_pak_252588', 'wykonanie_poz_pak_252587'];
  let id_do_klikniecia_hemodynamika =  ['wykonanie_poz_pak_252570', 'wykonanie_poz_pak_252591', 'wykonanie_poz_pak_252590', 'wykonanie_poz_pak_252573'];

  
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
  <div class="info">  <span id=przyjecie_status style='${przyjety? '' : 'text-decoration: line-through; color: #6F0001;'}'>Badania kontrolne przy przyjęciu na oddział.</span></div>
  </div>
  <div style= "gap: 5px; display: flex; flex-direction: column; width: 100%; justify-content: center;">
  <div style="width: 100%"> <button id="badania_podstawowe_button" style="width: 100%">  ${podstawowy_zestaw?  "Odklikaj podstawowy zestaw" : "Zleć podstawowy zestaw" } </button> </div>
  <div style="width: 100%"> <button id="badania_kardiografia_button" style="width: 100%">  ${kardiografia_zestaw?  "Odklikaj zestaw koronarografii" : "Zleć zestaw do koronarografii" } </button> </div>
  <div style="width: 100%"> <button id="badania_pielegniarskie_button" style="width: 100%">  ${pielegniarskie_zestaw?  "Odklikaj zestaw pielegniarski" : "Zleć zestaw do pielegniarski" } </button> </div>
  <div style="width: 100%"> <button id="hemodynamika_button" style="width: 100%">  ${hemodynamika_zestaw?  "Odklikaj hemodynamike" : "Zleć hemodynamike" } </button> </div>
  </div>
  `
  };


  function click_badanie(przymiarka_bool,id_do_klikniecia){
    
    for (let id in id_do_klikniecia){
      let clicked_element = document.getElementById(id_do_klikniecia[id]);
      if(clicked_element.hasAttribute('uwzg') != przymiarka_bool){
        clicked_element.click();
      }
      // console.log(id_do_klikniecia[id]);
    }
  }


  function select_case(target){
    switch (target) {

      case "przyjecie_status":
        przyjety = !przyjety;
        break;
      case "badania_podstawowe_button":
        podstawowy_zestaw = !podstawowy_zestaw;
        click_badanie(podstawowy_zestaw, id_do_klikniecia_podstawowe);
        break;
      case "badania_kardiografia_button":
        kardiografia_zestaw = !kardiografia_zestaw;
        click_badanie(kardiografia_zestaw, id_do_klikniecia_koronarografia);
        break;
      case "badania_pielegniarskie_button":
        pielegniarskie_zestaw = !pielegniarskie_zestaw;
        click_badanie(pielegniarskie_zestaw, id_do_klikniecia_pielegniarskie);
        break;
      case "hemodynamika_button":
        hemodynamika_zestaw = !hemodynamika_zestaw;
        click_badanie(hemodynamika_zestaw, id_do_klikniecia_hemodynamika);
        break;
      
      default:
        
      }
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      select_case(e.target.id);
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
    let tempInput = `${przyjety? 'Badania kontrolne przy przyjęciu na oddział.' : ''}
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
    parent.style.top = Afield.clientHeight.top + 'px';

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


};

function selectOpisujący(){
  if(document.getElementsByName("rola_3733")[0].hasAttribute('selected')){
    document.getElementsByName("rola_3733_default_values_button")[0].click();
  }
};

function handleNRS(){
  button_panel = document.getElementById('buttons');
  button_panel.querySelector('ul').innerHTML += `<li style="margin-left:0;margin-right:10px;display:inline;">
  <button id="nrs" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color: #B2F797; border-radius:4px;"> Wszystko ok </button>
  </li>`;

  document.getElementById('nrs').onclick = automate_NRS;

  function automate_NRS(){
  document.getElementsByName("karta_zywienia_asystujacy_l_user_id_default_values_button")[0].click();
  document.getElementsByName("karta_zywienia_dataczas_default_values_button")[0].click();
  document.getElementById("karta_zywienia_nrs_pogorszenie_stanu_dozyw1").click();
  document.getElementById("karta_zywienia_nrs_nasilenie_choroby1").click();
  document.getElementsByName("btn_ok")[0].click();
  };
}

function  handleOcenaStanuPsychicznegoInterna(){
  let OcenaStanuPsychicznego = document.getElementsByName("skladniki_procedury_4202")[0];
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

   if(OcenaStanuPsychicznego.value == "Pełny"){
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

function  handleOcenaStanuSpołecznegoInterna(){
  let OcenaStanuSpołecznego = document.getElementsByName("skladniki_procedury_4142")[0];
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

function handleObserwacje(){
  let Obserwacjefield = document.getElementsByName("raport_tresc")[0];
  Obserwacjefield.style.position = 'relative';
  let parent = document.createElement('div');
  parent.style.position = 'absolute';
  parent.style.backgroundColor = 'invisible';
  parent.style.borderRadius = '2px';
  parent.style.left = (Obserwacjefield.getBoundingClientRect().right + 20) + 'px';
  parent.style.top =  Obserwacjefield.getBoundingClientRect().top + 'px';
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

  let stan_dobry = true;
  let stan_wydolnosci = true;
 let stan_lekiibadania = true;
 let stan_zgody = true;
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
  <div class="info">  <span id=stan_status>${stan_dobry? 'Przy przyjęciu stan ogólny dość dobry.' : 'Przy przyjęciu stan ogólny średni.'}</span></div>
  <div class="info">  <span id=wydolnosci_status>${stan_wydolnosci? 'Wydolny k-o.' : 'Niewydolny k-o.'}</span></div>
  <div class="info">  <span id=stan_lekiibadania>${stan_lekiibadania? 'Leki zlecono, badania zlecono.' : 'Leków nie zlecono.'}</span></div>
  <div class="info">  <span id=stan_zgody style='${stan_zgody? '' : 'text-decoration: line-through; color: #6F0001;'}'>Wyraził zgodę na zabieg.</span></div>
  </div>
  <div style="display: flex; justify-content: flex-end ;"> <button id="paste_button">  ${pasted_mode?  "Wyłącz auto-wklej": "<<< Wklej <<<" } </button> </div>
  `
  };

  generateSuggestionText();

      suggestionText.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {

      case "stan_status":
        stan_dobry = !stan_dobry;
        break;
      case "wydolnosci_status":
        stan_wydolnosci = !stan_wydolnosci;
        break;
      case "stan_lekiibadania":
        stan_lekiibadania = !stan_lekiibadania;
        break;
      case "stan_zgody":
        stan_zgody = !stan_zgody;
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

   if(Obserwacjefield.value == ""){
    pasted_mode = true;
    copySuggestion();
  };
  generateSuggestionText();

  function copySuggestion() {
    let tempInput = `${stan_dobry?  'Przy przyjęciu stan ogólny dość dobry. ' : 'Przy przyjęciu stan ogólny średni. '}${stan_wydolnosci? 'Wydolny k-o. ' : 'Niewydolny k-o. '}${stan_lekiibadania? 'Leki zlecono, badania zlecono.' : 'Leków nie zlecono.'}${stan_zgody? 'Wyraził zgodę na zabieg.' : ''}`;
  Obserwacjefield.value = tempInput;
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
    marg_bottom = parseFloat(window.getComputedStyle(Obserwacjefield).marginBottom);
    parent.style.left = (Obserwacjefield.getBoundingClientRect.right + 20) + 'px';
    parent.style.top = Obserwacjefield.getBoundingClientRect.top + 'px';
    if (Obserwacjefield.getBoundingClientRect().height > popup.getBoundingClientRect().height){
    popup.style.height = Obserwacjefield.getBoundingClientRect().height + 'px';
    } else {
      if(Obserwacjefield.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = Obserwacjefield.getBoundingClientRect().height + 'px';
      } else {
       Obserwacjefield.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + 'px';
       popup.style.height = Obserwacjefield.getBoundingClientRect().height + 'px'
      }
    }
    parent.style.left = (Obserwacjefield.getBoundingClientRect().right + 20) + 'px';
  };

  window.onclick = updateFieldHeight;
  Obserwacjefield.onclick = updateFieldHeight;
  document.body.appendChild(parent);
  let minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
  updateFieldHeight();
  Obserwacjefield.onkeydown = disableCopy;

};

function handleZlecenieLekow(){
  button_panel = document.getElementById('buttons');
  button_panel.innerHTML += `<button id="leki_nchir" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color: #B2F797; border-radius:4px;"> Standardowe leki N.chirurgia </button>`;

  let tabelaleków = document.getElementById('leki').querySelector('tbody').children;
  // console.log(tabelaleków);
  for (let row of tabelaleków){
    // row.style.backgroundColor = 'black';
    let insert = document.createElement('div');
    insert.innerHTML = `<button type="button">here</button>`
    // row.appendChild(insert);
  };
}
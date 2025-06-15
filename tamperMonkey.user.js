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
const cleanup_page = true;


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
        // case 'Zlecenie leku':
        //   handleZlecenieLekow();
        //   break;
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
  <div class="info">  <span id=stan_status>${stan_dobry? 'Przy przyjęciu stan ogólny dość dobry.' : 'Stan ogólny dobry.'}</span></div>
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
    let tempInput = `${stan_dobry?  'Przy przyjęciu stan ogólny dość dobry. ' : 'Stan ogólny dobry.'}${stan_wydolnosci? 'Wydolny k-o. ' : 'Niewydolny k-o. '}${stan_lekiibadania? 'Leki zlecono, badania zlecono.' : 'Leków nie zlecono.'}${stan_zgody? 'Wyraził zgodę na zabieg.' : ''}`;
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



// function handleZlecenieLekow(){

//   class ZlecenieLeku {
//     constructor(row) {
//       this.row = row;
//       this.Liczba_porzadkowa_element = row.children[0];
//       this.Lek_Schemat_podania_element = row.children[1];
//       this.lek_dzień_I = row.children[2];
//       this.lek_dzień_II = row.children[3];
//       this.lek_dzień_III = row.children[4];

      
//       this.Liczba_porzadkowa = this.Liczba_porzadkowa_element.textContent.trim();
//       this.row_id = 'zlecTmpTblAO_' + this.Liczba_porzadkowa;
//       this.local_drug_id = document.getElementsByName(this.row_id + '_jm')[0];
//       this.local_add_schematic = document.getElementsByName(this.row_id + '_schemat_button')[0];
//       this.local_remove_schematic = document.getElementsByName(this.row_id + '_schemat_clear')[0];
//       this.local_schematic_container = document.querySelector('.simpl' + this.Liczba_porzadkowa);
//       var opis_href_text = `a[href="javascript:toggle(\'${this.row_id}_opis_zlec\');"]`;
//       this.opis_href = document.querySelector(opis_href_text);
//       this.opis_zlecenia = document.getElementById(this.row_id + '_opis_zlec');
//       this.dorazny_checkbox = document.getElementById(this.row_id + '_dorazny');
//       let lek_dzień_I = row.children[2];
//       let lek_dzień_II = row.children[3];
//       let lek_dzień_III = row.children[4];
//       // Dzień 1:
//       this.akceptacja_dnia_I = lek_dzień_I.querySelector(`.btn_dzien_akcja[value="-"]`);
//       this.odstawienie_dnia_I = lek_dzień_I.querySelector(`.btn_dzien_akcja[value="x"]`);
//       this.schemat_dnia_I = lek_dzień_I.querySelector(`.simpl`+ this.Liczba_porzadkowa +`_1`);
//       // Dzień 2: 
//       this.akceptacja_dnia_II = lek_dzień_II.querySelector(`.btn_dzien_akcja[value="-"]`);
//       this.odstawienie_dnia_II = lek_dzień_II.querySelector(`.btn_dzien_akcja[value="x"]`);
//       this.schemat_dnia_II = lek_dzień_II.querySelector(`.simpl`+ this.Liczba_porzadkowa +`_2`);
//       // Dzień 3: 
//       this.akceptacja_dnia_III = lek_dzień_III.querySelector(`.btn_dzien_akcja[value="-"]`);
//       this.odstawienie_dnia_III = lek_dzień_III.querySelector(`.btn_dzien_akcja[value="x"]`);
//       this.schemat_dnia_III = lek_dzień_III.querySelector(`.simpl`+ this.Liczba_porzadkowa +`_3`);
//       // console.log(odstawienie_dnia_I);
//     }
//         // let Liczba_porzadkowa = row.children[0];
//     // let Lek_Schemat_podania = row.children[1];
//     // let lek_dzień_I = row.children[2];
//     // let lek_dzień_II = row.children[3];
//     // let lek_dzień_III = row.children[4];

//     // let row_id = 'zlecTmpTblAO_' + Liczba_porzadkowa.textContent.trim();
//     // console.log(row_id);
//     // let local_drug_id = document.getElementsByName(row_id + '_jm')[0];
//     // if (local_drug_id != null){
//     // console.log(local_drug_id.value);
//     // let local_add_schematic = document.getElementsByName(row_id + '_schemat_button')[0];
//     // let local_remove_schematic = document.getElementsByName(row_id + '_schemat_clear')[0];
//     // let local_schematic_container = document.getElementsByName('simpl' + Liczba_porzadkowa.textContent.trim())
//     // let opis_zlecenia = document.getElementById(row_id + '_opis_zlec');
//     // let dorazny_checkbox = document.getElementById(row_id + '_dorazny');

//     // // Dzień 1:
//     // let akceptacja_dnia_I = lek_dzień_I.querySelector(`.btn_dzien_akcja[value="-"]`);
//     // let odstawienie_dnia_I = lek_dzień_I.querySelector(`.btn_dzien_akcja[value="x"]`);
//     // let schemat_dnia_I = lek_dzień_I.querySelector(`.simpl`+ Liczba_porzadkowa.textContent.trim() +`_1`);
//     // // Dzień 2:  
//     // let akceptacja_dnia_II = lek_dzień_II.querySelector(`.btn_dzien_akcja[value="-"]`);
//     // let odstawienie_dnia_II = lek_dzień_II.querySelector(`.btn_dzien_akcja[value="x"]`);
//     // let schemat_dnia_II = lek_dzień_II.querySelector(`.simpl`+ Liczba_porzadkowa.textContent.trim() +`_1`);
//     // // Dzień 3: 
//     // let akceptacja_dnia_III = lek_dzień_III.querySelector(`.btn_dzien_akcja[value="-"]`);
//     // let odstawienie_dnia_III = lek_dzień_III.querySelector(`.btn_dzien_akcja[value="x"]`);
//     // let schemat_dnia_III = lek_dzień_III.querySelector(`.simpl`+ Liczba_porzadkowa.textContent.trim() +`_1`);
//     // // console.log(odstawienie_dnia_I);
//     // }
//   }

//   button_panel = document.getElementById('buttons');
//   button_panel.innerHTML += `<button id="leki_nchir" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color:rgb(247, 151, 151); border-radius:4px; text-decoration: line-through"> Standardowe leki N.chirurgia </button>`; //background-color: #B2F797
//   // button_panel.innerHTML += `<button id="toggle_experymentalnych" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color:rgb(165, 164, 164); border-radius:4px; text-decoration: line-through"> Funkcje eksperymentalne </button>`;




//   let tabelaleków = document.getElementById('leki').querySelector('tbody').children;
//   // console.log(tabelaleków);

//   let array_zleceń_leków = [];

//   for (let row of tabelaleków){
//     // row.style.backgroundColor = 'black';
//     if(row.querySelector('font').textContent == 'Zlecenie leku z apteczki pacjenta'){
//       break;
//     }

//     let tempclass = new ZlecenieLeku(row);
//     array_zleceń_leków.push(tempclass);
    
    
//     // console.log(Lek_Schemat_podania);
//     // Lek_Schemat_podania.appendChild(insert);
//   };

//   function addButtons(){
//       for (let zlecenie of array_zleceń_leków){
//   let domyślne_schematy = document.createElement('div');
//   const orginal_html = zlecenie.local_schematic_container.innerHTML;

//   interpret_scheme(zlecenie.local_schematic_container.innerHTML, zlecenie.local_schematic_container); //zamiana stringa z lekami hh:mm/dosage.sub(podanie)
//   zlecenie.opis_href.click();
//   interpret_scheme(zlecenie.schemat_dnia_I?.innerHTML, zlecenie.schemat_dnia_I);
//   interpret_scheme(zlecenie.schemat_dnia_II?.innerHTML, zlecenie.schemat_dnia_II);
//   interpret_scheme(zlecenie.schemat_dnia_III?.innerHTML, zlecenie.schemat_dnia_III);
//   declutter(zlecenie);
  


//   // domyślne_schematy.innerHTML = `<button type="button" id='fix_button'> 8:00 </button> 
//   // <button type="button" id='fix_button'> 13:00 </button> 
//   // <button type="button" id='fix_button'> 18:00 </button> 
//   // <button type="button" id='fix_button'> 21:00 </button> `
//   // // console.log(zlecenie.Liczba_porzadkowa)
//   // console.log(zlecenie.local_schematic_container);
//   zlecenie.local_schematic_container.appendChild(domyślne_schematy);

//   zlecenie.local_add_schematic;
  
//   var niepełne_zlecenie = zlecenie.lek_dzień_I?.querySelector('span[style="color:red; font-size:0.6em; text-align:center;"][title="nieokreślono podawania leku lub brak schematu"]');

//   if(niepełne_zlecenie != undefined && cleanup_page){
//     niepełne_zlecenie.style.display = 'none';
//   };


//   let popraw_godziny = document.createElement('div');
//   popraw_godziny.innerHTML = `<button type="button" id='fix_button'> Popraw godziny </button>`
//   popraw_godziny.style.gap = '10px';
//   zlecenie.lek_dzień_I.appendChild(popraw_godziny);
//   };
//   }



// function declutter(target){
//   var href = target.opis_href.getAttribute('href');
//   var fixed_opis = document.createElement('div');
//   fixed_opis.type = 'checkbox';
//   fixed_opis.setAttribute('href',href);
//   fixed_opis.onclick = function() {href};
//   fixed_opis.innerHTML = '<input type="checkbox" checked><label> Opis </label>'
//   target.opis_href.replaceWith(fixed_opis);
  
// }














//   const way_of_administration_selector_HTML = `<select style="width: 100%;" name="schemat_1_sposob" option="selected">
//   <option value=""></option>
// 	<option value="IV">Dożylnie </option>
// 	<option value="PO">Doustnie</option>
//   <option value="SC">Podskórnie</option>
//   <option value="WZ">Wziew</option>
// 	<option value="WC">Wkłucie centralne</option>
// 	<option value="IM">Domięśniowo</option>
// 	<option value="PEG">PEG</option>
//   <option value="WCI">Wlew Ciągły</option>
// 	<option value="WK">Wlew Kroplowy</option>
// 	<option value="DO">Do oczu</option>
// 	<option value="PV">Dopochwowo</option>
// 	<option value="NS">Na skórę</option>
// 	<option value="PA">Doodbytniczo</option>
// 	<option value="TD">Śródskórnie</option>
// 	<option value="IN">Donosowo</option>
// 	<option value="OS">Do worka spojówkowego</option>
// 	<option value="kru">Kruszone</option>
// 	<option value="BO">BOLUS</option>
// 	<option value="ZOP">Do cewnika ZOP</option>
// 	<option value="DIAL">Do dializy</option>
// 	<option value="DN">Do nosa</option>
// 	<option value="PM">Do płukania pęcherza moczowego</option>
// 	<option value="PŻ">Do płukania żołądka</option>
// 	<option value="DSO">Do sondy</option>
// 	<option value="DUCH">Do ucha</option>
// 	<option value="I">Implant</option>
// 	<option value="NAS">Nasiękowo</option>
// 	<option value="NEB">Nebulizacja</option>
// 	<option value="PJU">Pędzlowanie jamy ustnej</option>
// 	<option value="PJ">Podjęzykowo</option>
// 	<option value="P Ż-T">Przetoka Żylno-Tętnicza</option>
// 	<option value="PS">Przezskórnie</option>
// </select>`




//   function interpret_scheme(scheme, parent){
//     console.log(scheme);
//     if(scheme != undefined){
//     let parts_array = scheme.split('<br>').filter(part => part !== '');
    
//     let schematic_table = document.createElement('div');
//     schematic_table.style.border = '1px solid black';
//     schematic_table.style.borderRadius = '2px';
//     schematic_table.style.backgroundColor = '#C6C8CD';
//     schematic_table.style.width = '100%';
//     schematic_table.style.overflow = 'hidden';
//     let header = document.createElement('div');
//     // header.style.border = '1px solid black';
//     header.style.borderTopLeftRadius = '2px;'
//     header.style.borderTopRightRadius = '2px;'
//     header.style.display = 'flex';
//     header.style.flexDirection = 'row';
//     header.innerHTML = `<span style="width: 33.3%; border: 1px solid black; border-top-left-radius: 2px;"> Godzina </span> <span style="width: 33.3%; border: 1px solid black;"> Dawka </span> <span style="width: 33.3%; border:1px solid black;  border-top-right-radius: 2px;"> Droga podania </span>
//     `
//     schematic_table.appendChild(header);

//     console.log(parts_array);
//     var iterator = 0;
//     for (let linijka of parts_array){
//     let row_of_schematic = document.createElement('div');
//     // row_of_schematic.style.border = '1px solid black';
//     row_of_schematic.style.display = 'flex';
//     row_of_schematic.style.flex = '1';
//     row_of_schematic.style.flexDirection = 'row';
    
//     let hour = document.createElement('div');
//     var h_text = parts_array[iterator].substring(0,parts_array[iterator].indexOf('/'));
//     hour.innerHTML = `<input type=text value=${h_text} style="width:95%; text-align="center";">
//     `;
//     // hour.innerHTML += h_text;
//     let dosage = document.createElement('div');
//     var d_text = parts_array[iterator].substring(parts_array[iterator].indexOf('/') + 1, parts_array[iterator].indexOf('('));
//     dosage.innerHTML = `<input type=text value=${d_text} style="width:95%; text-align="center";">`; 
     
//     let way_of_administration = document.createElement('div');
    
//     var w_text = parts_array[iterator].substring(parts_array[iterator].indexOf('(') + 1, parts_array[iterator].indexOf(')'));
    
    
//     way_of_administration.innerHTML += way_of_administration_selector_HTML;
//     way_of_administration.children[0].setAttribute('option', w_text);
//     way_of_administration.querySelector(`select option[value="${w_text}"]`).setAttribute('selected', '');
//     iterator++;

//     hour.style.width = '33.3%';
//     hour.style.border = '0.5px solid black';
//     dosage.style.width = '33.3%';
//     dosage.style.border = '0.5px solid black';
//     way_of_administration.style.width = '33.3%';
//      way_of_administration.style.border = '0.5px solid black';

//     row_of_schematic.appendChild(hour);
//     row_of_schematic.appendChild(dosage)
//     row_of_schematic.appendChild(way_of_administration)
//     schematic_table.appendChild(row_of_schematic);
//     }
//     let footer = document.createElement('div');
//     footer.style.borderTopLeftRadius = '2px;'
//     footer.style.borderTopRightRadius = '2px;'
//     footer.style.display = 'flex';
//     footer.style.flexDirection = 'row';
//     footer.style.justifyContent = 'space-evenly';
//     footer.style.paddingTop = '2px';
//     footer.style.paddingBottom = '2px';
//     footer.innerHTML = `<button type="button"> Anuluj </button> <button> Dodaj </button  type="button"> <button> Schematy </button  type="button"> <button> Zastosuj </button  type="button">
//     `
//     schematic_table.appendChild(footer);
//     parent.innerHTML = '';
//     parent.appendChild(schematic_table);
//   }
//   }
//   addButtons();
  
  
// }
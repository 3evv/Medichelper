// ==UserScript==
// @name        Medichelper
// @namespace   Violentmonkey Scripts
// @match       http://localhost:8000/*
// @match       http*://medicus.usk/*
// @version     1.200
// @author      3evv
// @description 6/8/2025, 10:37:03 PM
// @icon	https://raw.githubusercontent.com/3evv/Medichelper/main/images/icon128.jpeg
// @homepageURL	https://github.com/3evv/Medichelper/blob/main/tamperMonkey.user.js
// @downloadURL https://github.com/3evv/Medichelper/raw/main/tamperMonkey.user.js
// @grant       GM_getValue
// @grant       GM_getValues
// @grant       GM_setValue
// @grant       GM_setValues
// @grant       GM_deleteValue
// @grant       GM_deleteValues
// @grant       GM_listValues
// @grant       GM_addValueChangeListener
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_xmlhttpRequest
// @grant window.close
// @grant window.focus
// ==/UserScript==

(function () {
  "use strict";

  // Define a function to get or initialize the settings value
  function getSettings() {
    let settings = GM_getValue("settings", undefined);
    if (settings === undefined) {
      settings = {};
      GM_setValue("settings", settings);
    }
    return settings;
  }

  // Check if the settings need to be updated from the HTML link
  function updateSettingsFromLink() {
    const link = "https://raw.githubusercontent.com/3evv/Medichelper/refs/heads/main/userSettings.json";
    fetch(link)
      .then((response) => response.text())
      .then((data) => {
        let jsonData;
        try {
          jsonData = JSON.parse(data);
          if (typeof jsonData === "object" && jsonData !== null) {
            const settings = getSettings();
            Object.assign(settings, jsonData); // Merge new data into existing settings
            GM_setValue("settings", settings); // Update the stored settings
          } else {
            console.error("The fetched data is not valid JSON.");
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }

  // Check if settings are undefined and update them if necessary
  const settings = getSettings();
  if (Object.keys(settings).length === 0) {
    updateSettingsFromLink();
  }
})();

// console.log(GM_getValue("fixedViews"))
if (GM_getValue("fixedViews") == undefined) {
  GM_setValue(
    "fixedViews",
    JSON.parse(`{
    "ODDZIAŁ KARDIOLOGICZNY (49042) ": true,
    "Klinika Neurochirurgii ": true
  }`)
  );
}

if (document.title == "Mój widok") {
  if (GM_getValue(["settings"], false)["optimize"]) {
    // console.log("here");
    fixMyView();
  }
} else {
  handleHeader();
}

function handleHeader() {
  const nazwa_headera = document.getElementById("header").querySelector(".templateEditPageTitle").textContent;
  let known_fields = GM_getValue(["settings"])["fields_with_autocomplete"];

  const fieldIndex = known_fields.findIndex((item) => item.header_name === nazwa_headera);
  if (fieldIndex != -1) {
    if (known_fields[fieldIndex].suggest_text) {
      //  console.log('suggest text');
      autofill_text_fields(known_fields[fieldIndex]);
    }
    if (known_fields[fieldIndex].autofill_checkboxes) {
      autofill_checkboxes(known_fields[fieldIndex]);
    }
  } else {
    switch (nazwa_headera) {
      case "Ocena ryzyka związanego ze stanem odżywiania (NRS 2002)":
        handleNRS();
        break;
      default:
        console.log("Inny typ strony: " + nazwa_headera);
    }
  }

  detectEmptyInputFields();
  if (GM_getValue(["settings"])["optimize"]) {
    optimizePageLayout();
  }
}

function configurePopupParent(fieldOfIntrest) {
  const parent = document.createElement("div");
  parent.classList += "MedhelperSuggestion";
  parent.style.position = "absolute";
  parent.style.backgroundColor = "invisible";
  parent.style.borderRadius = "0.1rem";
  parent.style.left = fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + +"px";
  parent.style.top = fieldOfIntrest.getBoundingClientRect().top + window.scrollY + "px";
  parent.style.width = "27%";
  parent.style.display = "flex";
  parent.style.flexDirection = "column";
  parent.style.justifyContent = "center";
  return parent;
}

function configurePopup() {
  popup = document.createElement("div");
  popup.style.position = "relative";
  popup.style.backgroundColor = "#b1b1b1";
  popup.style.padding = "0rem";
  popup.style.borderRadius = "0.1rem";
  popup.style.display = "flex";
  popup.style.flexGrow = "1";
  popup.style.flexDirection = "column";
  popup.style.justifyContent = "space-around";
  popup.style.alignContent = "center";
  return popup;
}

function calculateAge() {
  const patientInfos = document.querySelectorAll("#header .templateEditPageSubTitle b");
  let personal_data = patientInfos[0].innerHTML;
  beg_of_PESEL = personal_data.indexOf("(") + 1;
  end_of_PESEL = personal_data.indexOf(")");
  let PESEL = personal_data.substring(beg_of_PESEL, end_of_PESEL);
  PESEL = PESEL.replace(/[^0-9]/g, "");
  PESEL = PESEL.substring(0, 6);
  // console.log(PESEL);
  let year = parseInt(PESEL.substring(0, 2));
  let month = parseInt(PESEL.substring(2, 4));
  if (month > 20) {
    year += 1999;
  } else {
    year += 1900;
    month -= 20;
  }
  let day = parseInt(PESEL.substring(4, 6));
  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth() + 1;
  let currentDay = currentDate.getDate();
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth == month && currentDay < day)) {
    age--;
  }
  return age - 1;
}

function findTenarySwitch(input) {
  searchString = ":";
  const regex = new RegExp(`\\B${searchString}\\B`, "g");
  const tempText = input.replace(regex, "|");
  return tempText.indexOf("|");
}

function configureSuggestion(fieldOfIntrest, json_lines) {
  // console.log( Object.values(json_lines));

  const suggestionElement = document.createElement("div");
  suggestionElement.id = "MH__suggestiontext";
  suggestionElement.style.display = "flex";
  suggestionElement.style.flexDirection = "column";
  suggestionElement.style.height = "100%";
  // suggestionElement.style.justifyContent = 'space-between';
  suggestionElement.style.alignContent = "flex-start";
  // suggestionElement.style.padding = '2px';
  let boolArray = {};
  let pasted_input = false;
  let append_mode = false;
  const suggestionText = document.createElement("div");
  suggestionText.style.display = "flex";
  suggestionText.style.flexDirection = "column";
  suggestionText.style.flexWrap = "wrap";
  suggestionText.style.flexGrow = 1;
  suggestionText.style.justifyContent = "flex-start";
  suggestionText.style.alignContent = "flex-start";
  suggestionText.style.padding = "0.1rem";
  suggestionText.style.color = "black"; // Optional styling for the text color
  suggestionText.style.whiteSpace = "whiteSpace"; // Add this line to enable multiline text

  function generateSuggestionText() {
    const sortedKeys = Object.keys(json_lines).sort();
    const regex = /\{[^{}]*\?[^}]*:[^}]*\}/;
    for (let key of sortedKeys) {
      let line = json_lines[key];
      if (line.includes("${calculateAge()}")) {
        line = line.replace("${calculateAge()}", calculateAge());
      }
      let local_index = 0;

      while (regex.test(line)) {
        if (regex.test(line)) {
          const variableStart = line.indexOf("${");
          const variableEnd = line.indexOf("}");
          let modifiedFragment = line.substring(variableStart, variableEnd);
          const tenaryIndex = findTenarySwitch(modifiedFragment);
          const trueVariant = modifiedFragment
            .substring(modifiedFragment.indexOf("?") + 1, tenaryIndex)
            .replaceAll("'", "");
          const falseVariant = modifiedFragment.substring(tenaryIndex + 1).replaceAll("'", "");
          const textBool = true;
          if (boolArray[key + "_" + local_index] == undefined) {
            boolArray[key + "_" + local_index] = {
              textBool,
              trueVariant,
              falseVariant,
            };
          }
          let output = `<span style="color:#ffffc2; font-style:oblique;" id="${key + "_" + local_index}"> [${boolArray[key + "_" + local_index].textBool ? trueVariant : falseVariant
            }]</span>`;
          // if(trueVariant == '  '){
          //   output = `<span style="text-decoration: line-through; color: #6F0001;" id="${key + '_' + local_index}"> </span> [${falseVariant}]`;
          //   boolArray[key + '_' + local_index].textBool = false;
          // }
          line = line.substring(0, variableStart) + output + line.substring(variableEnd + 1);
          local_index += 1;
        }
      }
      suggestionText.innerHTML += "<div>" + line + "\n" + "</div>";
    }

    // suggestionTextString = temp;
    suggestionElement.appendChild(suggestionText);
    let suggestionButtons = document.createElement("div");
    suggestionButtons.innerHTML = `
    <div style="display: flex; flex-drection:row; justify-content: flex-end ;">
    <button style="display:none" id="append_button">Doklej</button>
    <button id="paste_button" style="min-width:50%;max-height: 1.5rem;">  ${pasted_input ? "Wyłącz auto-wklej" : " Auto-wklej"
      } </button>
    <img id="config" style="max-width: 1.5rem;max-height: 1.5rem; filter: opacity(0.75);" src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/settings_icon.png" alt="Konfiguruj auto-uzupełnianie"></div>
    `;
    suggestionElement.appendChild(suggestionButtons);
  }

  function updateSuggestionText(targetId) {
    const target = suggestionElement.querySelector(`#${targetId}`);
    target.innerHTML = ` [${boolArray[targetId].textBool ? boolArray[targetId].trueVariant : boolArray[targetId].falseVariant
      }]`;
  }
  function updatePasteButton() {
    const target = suggestionElement.querySelector(`#paste_button`);
    target.innerHTML = `${pasted_input ? "Wyłącz auto-wklej" : " Auto-wklej"}`;
  }

  generateSuggestionText();

  suggestionElement.onclick = (e) => {
    e.stopPropagation();
    console.log(e.target.id);
    // console.log(boolArray[e.target.id]);
    if (boolArray[e.target.id] !== undefined) {
      boolArray[e.target.id].textBool = !boolArray[e.target.id].textBool;
      updateSuggestionText(e.target.id);
    } else {
      switch (e.target.id) {
        case "paste_button":
          pasted_input = !pasted_input;
          break;
        case "append_button":
          append_mode = !append_mode;
          break;
        case "config":
          synthesiseJSON((target_name = fieldOfIntrest.name));
          break;
        default:
      }
    }
    if (e.target.id !== "") {
      if (pasted_input) {
        copySuggestion();
      }
      updatePasteButton();
    }
  };

  // if (fieldOfIntrest.value == "" && json_lines.disableAutoCopy != true) {
  //   pasted_input = true;
  //   copySuggestion();
  //   updatePasteButton();
  // }

  function copySuggestion() {
    let textInputSuggestion = fieldOfIntrest.value;
    const textChildren = suggestionText.children;
    // console.log(textChildren);
    for (let line of textChildren) {
      //remove old line
      let localText = line.textContent;
      let localHTML = line.innerHTML;
      let replacementLine = "";
      let overwriteIndex = -1;
      while (localHTML.indexOf(`<span style="color:#ffffc2; font-style:oblique;" id="`) != -1) {
        const beginingReplace = localHTML.indexOf(`<span style="color:#ffffc2; font-style:oblique;" id="`);
        let replacementHTML = localHTML.substring(beginingReplace);
        const endingReplace = localHTML.indexOf("</span>") + "</span>".length;
        replacementHTML = localHTML.substring(0, endingReplace);
        targetId = replacementHTML.substring(
          replacementHTML.indexOf(`id="`) + `id="`.length,
          replacementHTML.indexOf(`"`, replacementHTML.indexOf(`id="`) + `id="`.length)
        );
        let inverseValue = `${!boolArray[targetId].textBool ? boolArray[targetId].trueVariant : boolArray[targetId].falseVariant
          }`;
        // console.log(line.innerHTML);
        replacementLine = localHTML.substring(0, beginingReplace) + inverseValue + localHTML.substring(endingReplace);
        replacementLine = replacementLine.replaceAll("[", "").replaceAll("]", "").replace(/\s+/g, " ").trim();
        localHTML = replacementLine;
        // console.log(replacementLine);
      }
      console.log(localHTML);
      if (textInputSuggestion.indexOf(localHTML) != -1) {
        console.log("Replacingu: ");
        replacementLine = localText.replaceAll("[", "").replaceAll("]", "").replace(/\s+/g, " ").trim();
        // textInputSuggestion = textInputSuggestion.substring(textInputSuggestion.indexOf(localHTML)) + replacementLine + textInputSuggestion.substring(textInputSuggestion.substring(textInputSuggestion.indexOf(localHTML) + replacementLine.length));
        textInputSuggestion = textInputSuggestion.replace(localHTML, replacementLine);
      } else {
        replacementLine = localText.replaceAll("[", "").replaceAll("]", "").replace(/\s+/g, " ").trim();
      }
      if (textInputSuggestion.indexOf(replacementLine) == -1) {
        textInputSuggestion += replacementLine;
        textInputSuggestion += "\n";
      }
      //inject new one
    }
    fieldOfIntrest.value = textInputSuggestion;
  }

  function appendSuggestion() {
    //stub
    let tempInput = ``;
    fieldOfIntrest.value = +tempInput;
  }

  // copySuggestion()

  function disableCopy() {
    pasted_input = false;
    updatePasteButton();
  }

  fieldOfIntrest.onkeydown = disableCopy;
  return suggestionElement;
}

function updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height) {
  marg_bottom = parseFloat(window.getComputedStyle(fieldOfIntrest).marginBottom);
  parent.style.left = fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + "px";
  parent.style.top = fieldOfIntrest.getBoundingClientRect().top + window.scrollY + "px";
  if (fieldOfIntrest.getBoundingClientRect().height > popup.getBoundingClientRect().height) {
    popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
  } else {
    if (fieldOfIntrest.getBoundingClientRect().height > minimal_przedmiotowe_suggestion_height) {
      popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
    } else {
      fieldOfIntrest.style.height = minimal_przedmiotowe_suggestion_height + marg_bottom + "px";
      popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
    }
  }
  parent.style.left = fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + "px";
  if (GM_getValue(["settings"])["optimize"]) {
    resizeTextarea(fieldOfIntrest);
  }
}

function autofill_text_fields(fieldJson) {
  // console.log(fieldJson);
  for (let fieldNamesArray of Object.values(fieldJson.user_configurable_text)) {
    for (let fieldName of Object.keys(fieldNamesArray)) {
      const fieldOfIntrest = document.getElementsByName(fieldName)[0];
      if (fieldOfIntrest == undefined) {
        return;
      }
      fieldOfIntrest.style.position = "relative";
      fieldOfIntrest.classList = "MedhelperSuggestion";
      const parent = configurePopupParent(fieldOfIntrest);
      const popup = configurePopup();
      const suggestionText = configureSuggestion(fieldOfIntrest, fieldNamesArray[fieldName]);

      const min_width = "45%";
      const max_width = "57%";
      fieldOfIntrest.style.minWidth = min_width;
      fieldOfIntrest.style.maxWidth = max_width;
      popup.appendChild(suggestionText);
      parent.appendChild(popup);

      window.addEventListener("resize", function () {
        updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
      });
      window.addEventListener("onclick", function () {
        updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
      });
      fieldOfIntrest.addEventListener("resize", function () {
        updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
      });
      document.body.appendChild(parent);

      const minimal_przedmiotowe_suggestion_height = popup.getBoundingClientRect().height;
      updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);

      const resizeObserver = new ResizeObserver((entries) => {
        window.dispatchEvent(new Event("resize"));
      });

      resizeObserver.observe(fieldOfIntrest);
    }
  }
}

function handleNRS() {
  button_panel = document.getElementById("buttons");
  button_panel.querySelector("ul").innerHTML += `<li style="margin-left:0;margin-right:10px;display:inline;">
  <button id="nrs" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color: #B2F797; border-radius:4px;"> Wszystko ok </button>
  </li>`;

  document.getElementById("nrs").onclick = automate_NRS;

  function automate_NRS() {
    // document.getElementsByName("rola_3733_default_values_button")[0].click();
    document.getElementsByName("karta_zywienia_asystujacy_l_user_id_default_values_button")[0].click();
    document.getElementsByName("karta_zywienia_dataczas_default_values_button")[0].click();
    document.getElementById("karta_zywienia_nrs_pogorszenie_stanu_dozyw1").click();
    document.getElementById("karta_zywienia_nrs_nasilenie_choroby1").click();
    document.getElementsByName("btn_ok")[0].click();
  }
}

function autofill_checkboxes(fieldJson) {
  const buttonmount = document.getElementById("skierowanie_opis_skierowania_all");
  const textField = buttonmount.querySelector('textarea[name="skierowanie_opis_skierowania"]');

  buttonmount.style.display = "flex";
  buttonmount.style.flexDirection = "column";
  buttonmount.style.width = "50%";

  textField.style.height = "2rem";

  const buttonpanel = document.createElement("div");
  // buttonpanel.style.width = '100%';
  buttonpanel.style.minHeight = "2rem";
  buttonpanel.style.display = "flex";
  buttonpanel.style.padding = "0.2rem";
  buttonpanel.style.gap = "0.2rem";
  buttonpanel.style.flexDirection = "row";
  buttonpanel.style.justifyContent = "space-evenly";
  buttonpanel.style.alignContent = "center";
  buttonpanel.style.background = "#bbbbbb";
  buttonpanel.style.borderRadius = "0.4rem";
  buttonpanel.style.marginTop = "0.5rem";
  // buttonpanel.innerHTML = "<button>Badania podstawowe</button><button>Koronarografia</button><button>TSH + FT3 + FT4</button><button>B-HCG</button>";

  buttonmount.append(buttonpanel);
  let boolArray = {};

  function findIdArrayByName(data, name) {
    for (const key in data.user_defined_packets) {
      const packets = data.user_defined_packets[key];
      for (const packet of packets) {
        if (packet.name === name && packet.enabled) {
          // console.log(packet.id_array)
          return JSON.parse(packet.id_array.replaceAll("'", '"'));
        }
      }
    }
    return null; // Return null if the name is not found or enabled status is false
  }

  function allChecked(local_id) {
    const fieldArray = findIdArrayByName(fieldJson, local_id);
    let allChecked = true; // Assume all fields are initially checked
    for (let field of fieldArray) {
      let clicked_element = document.getElementById(field);
      if (!clicked_element.hasAttribute("uwzg")) {
        allChecked = false; // Found an unchecked element, so not all are checked
        break; // No need to check further elements
      }
    }
    return allChecked;
  }
  function clickPacket(targetid) {
    const fieldArray = findIdArrayByName(fieldJson, targetid);
    for (let field of fieldArray) {
      let clicked_element = document.getElementById(field);
      if (clicked_element.hasAttribute("uwzg") != boolArray[targetid]) {
        clicked_element.click();
      }
    }
  }

  function updateButtonState() {
    for (let packet of Object.keys(boolArray)) {
      if (boolArray[packet] != allChecked(packet)) {
        clickPacket(packet);
      }
      const button = document.getElementById(packet);
      button.style.background = `${boolArray[packet] ? "#ccff99" : ""}`;
    }
  }

  const testCategoryElement = document
    .getElementById("skierowanie_typ_procedury_all")
    .querySelector('select[name="skierowanie_typ_procedury"]')
    .querySelector("[selected]");
  if (fieldJson["user_defined_packets"][testCategoryElement.value] != undefined) {
    for (let packet of Object.values(fieldJson["user_defined_packets"][testCategoryElement.value])) {
      let local_id = packet.name;

      boolArray[local_id] = allChecked(local_id);

      buttonpanel.innerHTML += `<button id='${local_id}' type="button">${packet.name}</button>`;
      updateButtonState(local_id);
    }
  }

  buttonpanel.onclick = (e) => {
    e.stopPropagation();
    if (document.getElementById(e.target.id) !== undefined) {
      boolArray[e.target.id] = !boolArray[e.target.id];
      clickPacket(e.target.id);
      updateButtonState();
    }
  };
}

function clickHREF(data, selector) {
  data.querySelector(selector).target = "_blank";
  data.querySelector(selector).click();
}

function checkPrintability(data, target, selector, id) {
  let printable = false;

  function Check() {
    if (data.querySelector(selector) != undefined) {
      target.querySelector(`[id=${id}]`).style.display = "block";
      return true;
    } else {
      target.querySelector(`[id=${id}]`).style.display = "none";
      return false;
    }
  }

  Check();

  //    var time = new Date().getTime();
  //      $(document.body).bind("mousemove keypress", function(e) {
  //          time = new Date().getTime();

  //      });

  function refresh() {
    printable = Check();
    if (!printable) {
      clearInterval(a);
      // console.log(target);
    }
  }

  let a = setInterval(refresh, 5000);

}

function optimizePageLayout() {
  const mainTable = document?.querySelector(
    'table[border="1"][cellspacing="0"][cellpadding="2"][bgcolor="#d3d3d3"][class="templateEditTable"]'
  );
  // console.log(mainTable);
  mainTable.style.minWidth = "95%";
}

function createAdmissionPanelInterna(dataSource, admissionPanel) {
  admissionPanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__planDiagTerPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__planDiagTer" type="button"> Proponowany plan diagnostyczno-terapeutyczny </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__zgodaKoroPrint"          src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__zgodaKoro" type="button"> Zgoda na koronarografię </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__capriniPrint"            src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__caprini" type="button"> Skala Padewska </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__zakazeniePrzyjeciePrint" src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__zakazeniePrzyjecie" type="button"> Ryzyko zakażenia przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__skalaNRSPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__skalaNRS" type="button"> Skala NRS </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);
  let addmissionDone = true;
  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=252"]',
      "MH__planDiagTerPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=16740"]',
      "MH__zgodaKoroPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]',
      "MH__badPodPrzedPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=4188"]',
      "MH__capriniPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1400"]',
      "MH__zakazeniePrzyjeciePrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.karta_zywienia_list"]'[(href$ = "x_procedura_id=1400")],
      "MH__skalaNRSPrint"
    );

    // const printARRAY = [
    //   "MH__planDiagTerPrint",
    //   "MH__zgodaKoroPrint",
    //   "MH__badPodPrzedPrint",
    //   "MH__capriniPrint",
    //   "MH__zakazeniePrzyjeciePrint",
    // ];

    // for (let id of printARRAY) {
    //   if (documentsPanel.querySelector(`img[id=${id}]`).style.display == "none") {
    //     addmissionDone = false;
    //   }
    // }
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__planDiagTer":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=252"]');
        break;
      case "MH__planDiagTerPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=252"]');
        break;
      case "MH__zgodaKoro":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=16740"]');
        break;
      case "MH__zgodaKoroPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=16740"]');
        break;
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1739"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]');
        break;
      case "MH__caprini":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=4188"]');
        break;
      case "MH__capriniPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=4188"]');
        break;
      case "MH__zakazeniePrzyjecie":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1400"]');
        break;
      case "MH__zakazeniePrzyjeciePrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1400"]');
        break;
      case "MH__skalaNRS":
        clickHREF(dataSource, 'a[href^="app.karta_zywienia_list"]');
        break;
        // case "MH__skalaNRSPrint":
        //   clickHREF(dataSource, 'a[href^="app.karta_zywienia_list_dr"][href$="x_procedura_id=1400"]');
        break;
      default:
    }
    // <a href="app.karta_zywienia_list?x_context=karta_zywienia,sub,,20,,first,0,0,0,2097;…ial&x_jednostka_id=590&x_kontakt_id=1653375&jfo=&x_data_kontakt=2025-06-17">Karty&nbsp;żywienia&nbsp;pozajelit.</a>
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Zlecenia leków </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Zlecenia badań </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__operativeplanning" type="button"> Zlecenia operacji </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__observationpanel" type="button"> Obserwacje lekarskie </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__previousStay" type="button"> Lista hospitalizacji pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientFiles" type="button"> Pliki pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__nurseQuestionarre" type="button"> Wywiad pielęgniarski przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientDrugs" type="button"> Leki z apteczki pacjenta </div></div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__previousStay":
        clickHREF(dataSource, 'a[href^="app.kontakt_list"]'); //x_historia_choroby=true

        break;
      case "MH__patientFiles":
        clickHREF(dataSource, 'a[href^="app.BadaniePodstawa"][href$="x_tryb=K"]');
        break;
      case "MH__nurseQuestionarre":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=251"]');
        break;
      case "MH__patientDrugs":
        clickHREF(dataSource, 'a[href^="app.dokument_apteczka_list"]');
        break;
      default:
    }
  };
  mainPanel.append(utilitiesPanel);

  admissionPanel.append(mainPanel);
  checkIfPrintable();
  return addmissionDone;
}

function createStayPanelInterna(dataSource, stayPanel) {
  stayPanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__infectionRiskPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__infectionRisk" type="button"> Ocena ryzyka zakażenia</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__bloodTransfusionPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__bloodTransfusion" type="button"> Karta zapotrzebowania na krew </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__procedureConsentPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__procedureConsent" type="button"> Zgoda na zabieg</div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);

  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]',
      "MH__badPodPrzedPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]',
      "MH__infectionRiskPrint"
    );
    checkPrintability(dataSource, documentsPanel, 'a[href^="app.dokument_zap_bk_dr"]', "MH__bloodTransfusionPrint");
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProcedury_dr"][href$="x_procedura_id=393"]',
      "MH__procedureConsentPrint"
    );
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1739"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]');
        break;
      case "MH__infectionRisk":
        clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_edit"][href$="x_procedura_id=1401"]');
        break;
      case "MH__infectionRiskPrint":
        clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]');
        break;
      case "MH__bloodTransfusion":
        clickHREF(dataSource, 'a[href^="app.dokument_zap_bk_list"]');
        break;
      case "MH__bloodTransfusionPrint":
        // clickHREF(dataSource, 'a[href^="app.dokument_zap_bk_list"][href$="x_procedura_id=393"]');
        break;
      case "MH__procedureConsent":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_list"][href$="x_procedura_id=393"]');
        break;
      case "MH__procedureConsentPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_dr"][href$="x_procedura_id=393"]');
        break;
      default:
    }
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Zlecenia leków </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Zlecenia badań </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__operativeplanning" type="button"> Zlecenia operacji </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__observationpanel" type="button"> Obserwacje lekarskie </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__previousStay" type="button"> Lista hospitalizacji pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientFiles" type="button"> Pliki pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__nurseQuestionarre" type="button"> Wywiad pielęgniarski przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientDrugs" type="button"> Leki z apteczki pacjenta </div></div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__previousStay":
        clickHREF(dataSource, 'a[href^="app.kontakt_list"]'); //x_historia_choroby=true

        break;
      case "MH__patientFiles":
        clickHREF(dataSource, 'a[href^="app.BadaniePodstawa"][href$="x_tryb=K"]');
        break;
      case "MH__nurseQuestionarre":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=251"]');
        break;
      case "MH__patientDrugs":
        clickHREF(dataSource, 'a[href^="app.dokument_apteczka_list"]');
        break;
      default:
    }
  };
  mainPanel.append(utilitiesPanel);
  stayPanel.append(mainPanel);

  checkIfPrintable();
}

function createDischargePanelInterna(dataSource, dischargePanel) {
  dischargePanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__dischargePrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__discharge" type="button"> Wypis </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);

  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]',
      "MH__badPodPrzedPrint"
    );
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1739"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1739"]');
        break;
      case "MH__discharge":
        clickHREF(dataSource, 'a[href^="app.wypis_edit"]');
        break;
      case "MH__dischargePrint":
        // clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]');
        break;
      default:
    }
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Recepty </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Skierowania zewnętrzne </div></div>
  <hr class="MH__divider">

  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };
  let grouper_rozliczony = false;
  if (
    dataSource.querySelector('div[style="font-style:italic; color:green;"]') != "Nie wybrano grupy." &&
    dataSource.querySelector('div[style="font-style:italic; color:green;"]') != undefined
  ) {
    grouper_rozliczony = true;
  }

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__gruper" type="button"> Gruper </div> <div style='width:3rem;'></div> <div id='MH__gruperStatus'> </div>  </div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__gruper":
        clickHREF(dataSource, 'a[href^="app.Gruper_popup_tv"]'); //x_historia_choroby=true
        break;
      default:
    }
  };

  mainPanel.append(utilitiesPanel);
  dischargePanel.append(mainPanel);

  const grouperStatus = utilitiesPanel.querySelector('div[id="MH__gruperStatus"]');
  if (grouper_rozliczony) {
    grouperStatus.innerHTML = "Rozliczony: ";
    grouperStatus.innerHTML += dataSource
      .querySelector('div[style="font-style:italic; color:green;"]')
      .innerHTML.replaceAll(/\&nbsp;/g, " ");
    grouperStatus.style.color = "green";
  } else {
    grouperStatus.innerHTML = "Nierozliczony";
    grouperStatus.style.color = "red";
  }

  // Nie wybrano grupy.
  checkIfPrintable();
}

function createAdmissionPanelNchir(dataSource, admissionPanel) {
  admissionPanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__planDiagTerPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__planDiagTer" type="button"> Proponowany plan diagnostyczno-terapeutyczny </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__procedureConsentPrint"          src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__procedureConsent" type="button"> Zgoda na zabieg </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__capriniPrint"            src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__caprini" type="button"> Skala Capriniego </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__zakazeniePrzyjeciePrint" src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__zakazeniePrzyjecie" type="button"> Ryzyko zakażenia przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__skalaNRSPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__skalaNRS" type="button"> Skala NRS </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);

  let addmissionDone = true;

  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=252"]',
      "MH__planDiagTerPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProcedury_dr"][href*="x_procedura_id=393"]',
      "MH__procedureConsentPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]',
      "MH__badPodPrzedPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=4190"]',
      "MH__capriniPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1400"]',
      "MH__zakazeniePrzyjeciePrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.karta_zywienia_list"][href$="x_procedura_id=1400"]',
      "MH__skalaNRSPrint"
    );

    // const printARRAY = [
    //   "MH__planDiagTerPrint",
    //   "MH__procedureConsentPrint",
    //   "MH__badPodPrzedPrint",
    //   "MH__capriniPrint",
    //   "MH__zakazeniePrzyjeciePrint",
    // ];

    // for (let id of printARRAY) {
    //   if (documentsPanel.querySelector(`img[id=${id}]`).style.display == "none") {
    //     addmissionDone = false;
    //   }
    // }
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__planDiagTer":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=252"]');
        break;
      case "MH__planDiagTerPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=252"]');
        break;
      case "MH__procedureConsent":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_list"][href$="x_procedura_id=393"]');
        break;
      case "MH__procedureConsentPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_dr"][href*="x_procedura_id=393"]');
        break;
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1740"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]');
        break;
      case "MH__caprini":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=4190"]');
        break;
      case "MH__capriniPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=4190"]');
        break;
      case "MH__zakazeniePrzyjecie":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1400"]');
        break;
      case "MH__zakazeniePrzyjeciePrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1400"]');
        break;
      case "MH__skalaNRS":
        clickHREF(dataSource, 'a[href^="app.karta_zywienia_list"]');
        break;
        // case "MH__skalaNRSPrint":
        //   clickHREF(dataSource, 'a[href^="app.karta_zywienia_list_dr"][href$="x_procedura_id=1400"]');
        break;
      default:
    }

    // <a href="app.karta_zywienia_list?x_context=karta_zywienia,sub,,20,,first,0,0,0,2097;…ial&x_jednostka_id=590&x_kontakt_id=1653375&jfo=&x_data_kontakt=2025-06-17">Karty&nbsp;żywienia&nbsp;pozajelit.</a>
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Zlecenia leków </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Zlecenia badań </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__operativeplanning" type="button"> Zlecenia operacji </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__observationpanel" type="button"> Obserwacje lekarskie </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__previousStay" type="button"> Lista hospitalizacji pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientFiles" type="button"> Pliki pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__nurseQuestionarre" type="button"> Wywiad pielęgniarski przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientDrugs" type="button"> Leki z apteczki pacjenta </div></div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__previousStay":
        clickHREF(dataSource, 'a[href^="app.kontakt_list"]'); //x_historia_choroby=true

        break;
      case "MH__patientFiles":
        clickHREF(dataSource, 'a[href^="app.BadaniePodstawa"][href$="x_tryb=K"]');
        break;
      case "MH__nurseQuestionarre":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=251"]');
        break;
      case "MH__patientDrugs":
        clickHREF(dataSource, 'a[href^="app.dokument_apteczka_list"]');
        break;
      default:
    }
  };
  mainPanel.append(utilitiesPanel);

  admissionPanel.append(mainPanel);
  checkIfPrintable();

  return addmissionDone;
}

function createStayPanelNchir(dataSource, stayPanel) {
  stayPanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__infectionRiskPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__infectionRisk" type="button"> Ocena ryzyka zakażenia</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__bloodTransfusionPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__bloodTransfusion" type="button"> Karta zapotrzebowania na krew </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__procedureConsentPrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__procedureConsent" type="button"> Zgoda na zabieg</div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);

  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]',
      "MH__badPodPrzedPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]',
      "MH__infectionRiskPrint"
    );
    checkPrintability(dataSource, documentsPanel, 'a[href^="app.dokument_zap_bk_dr"]', "MH__bloodTransfusionPrint");
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProcedury_dr"][href*="x_procedura_id=393"]',
      "MH__procedureConsentPrint"
    );
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1740"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]');
        break;
      case "MH__infectionRisk":
        clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_edit"][href$="x_procedura_id=1401"]');
        break;
      case "MH__infectionRiskPrint":
        clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]');
        break;
      case "MH__bloodTransfusion":
        clickHREF(dataSource, 'a[href^="app.dokument_zap_bk_list"]');
        break;
      case "MH__bloodTransfusionPrint":
        // clickHREF(dataSource, 'a[href^="app.dokument_zap_bk_list"][href$="x_procedura_id=393"]');
        break;
      case "MH__procedureConsent":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_list"][href$="x_procedura_id=393"]');
        break;
      case "MH__procedureConsentPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProcedury_dr"][href*="x_procedura_id=393"]');
        break;
      default:
    }
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Zlecenia leków </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Zlecenia badań </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__operativeplanning" type="button"> Zlecenia operacji </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__observationpanel" type="button"> Obserwacje lekarskie </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__previousStay" type="button"> Lista hospitalizacji pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientFiles" type="button"> Pliki pacjenta </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__nurseQuestionarre" type="button"> Wywiad pielęgniarski przy przyjęciu </div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__patientDrugs" type="button"> Leki z apteczki pacjenta </div></div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__previousStay":
        clickHREF(dataSource, 'a[href^="app.kontakt_list"]'); //x_historia_choroby=true

        break;
      case "MH__patientFiles":
        clickHREF(dataSource, 'a[href^="app.BadaniePodstawa"][href$="x_tryb=K"]');
        break;
      case "MH__nurseQuestionarre":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=251"]');
        break;
      case "MH__patientDrugs":
        clickHREF(dataSource, 'a[href^="app.dokument_apteczka_list"]');
        break;
      default:
    }
  };
  mainPanel.append(utilitiesPanel);
  stayPanel.append(mainPanel);

  checkIfPrintable();
}

function createDischargePanelNchir(dataSource, dischargePanel) {
  dischargePanel.style.height = "100%";
  const mainPanel = document.createElement("div");
  mainPanel.style.display = "flex";
  mainPanel.style.minHeight = "5rem";
  mainPanel.style.alignContent = "center";
  mainPanel.style.justifyContent = "space-between";
  mainPanel.style.fontSize = "1.25rem";
  mainPanel.style.border = "1px solid rgb(190,195,199)";
  // mainPanel.style.borderTop = '';
  mainPanel.style.paddingRight = "1.25rem";
  mainPanel.style.paddingTop = "2rem";
  mainPanel.style.paddingBottom = "1.5rem";
  mainPanel.style.position = "relative";
  mainPanel.style.zIndex = "0";
  mainPanel.style.background = "rgb(241, 241, 241)";
  const documentsPanel = document.createElement("div");
  documentsPanel.style.width = "fit-content";
  documentsPanel.style.height = "100%";
  documentsPanel.style.display = "flex";
  documentsPanel.style.flexDirection = "column";
  documentsPanel.style.marginLeft = "0.3rem";
  documentsPanel.style.marginRight = "5rem";

  documentsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__badPodPrzedPrint"        src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__badPodPrzed" type="button"> Badanie podmiotowe i przedmiotowe</div></div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__printer" type="button"> <img id="MH__dischargePrint"           src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/print.png""> </div><div class="MH_documentLink" id="MH__discharge" type="button"> Wypis </div></div>
  <hr class="MH__divider">
  `;

  mainPanel.append(documentsPanel);

  function checkIfPrintable() {
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]',
      "MH__badPodPrzedPrint"
    );
    checkPrintability(
      dataSource,
      documentsPanel,
      'a[href^="app.wypis_edit"][href$="x_procedura_id=1740"]',
      "MH__dischargePrint"
    );
  }

  documentsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__badPodPrzed":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_edit"][href$="x_procedura_id=1740"]');
        break;
      case "MH__badPodPrzedPrint":
        clickHREF(dataSource, 'a[href^="app.DodatkoweProceduryHistChoroby_dr"][href$="x_procedura_id=1740"]');
        break;
      case "MH__discharge":
        clickHREF(dataSource, 'a[href^="app.wypis_edit"]');
        break;
      case "MH__dischargePrint":
        // clickHREF(dataSource, 'a[href^="app.ocena_ryzyka_zakazenia_dr"][href$="x_procedura_id=1401"]');
        break;
      default:
    }
  };

  const prescriptionsPanel = document.createElement("div");
  prescriptionsPanel.style.width = "fit-content";
  prescriptionsPanel.style.height = "100%";
  prescriptionsPanel.style.marginLeft = "5rem";
  prescriptionsPanel.style.marginRight = "5rem";
  // prescriptionsPanel.style.background = '#c6c6c67a';

  prescriptionsPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__drugsprescription" type="button"> Recepty </div> </div>
  <hr class="MH__divider">
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__diagnosticplanning" type="button"> Skierowania zewnętrzne </div></div>
  <hr class="MH__divider">

  `;

  mainPanel.append(prescriptionsPanel);

  prescriptionsPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__drugsprescription":
        clickHREF(dataSource, 'a[href^="app.Zlecenia_lekow"]');
        break;
      case "MH__diagnosticplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=Z"]');
        break;
      case "MH__operativeplanning":
        clickHREF(dataSource, 'a[href^="app.skierowanie_list"][href$="x_typ_skierowania=O"]');
        break;
      case "MH__observationpanel":
        clickHREF(dataSource, 'a[href^="app.raport_list"]');
        break;
      default:
    }
  };
  let grouper_rozliczony = false;
  if (
    dataSource.querySelector('div[style="font-style:italic; color:green;"]') != "Nie wybrano grupy." &&
    dataSource.querySelector('div[style="font-style:italic; color:green;"]') != undefined
  ) {
    grouper_rozliczony = true;
  }

  const utilitiesPanel = document.createElement("div");
  utilitiesPanel.style.width = "fit-content";
  utilitiesPanel.style.height = "100%";
  utilitiesPanel.style.marginLeft = "5rem";
  utilitiesPanel.style.marginRight = "0.7rem";
  utilitiesPanel.innerHTML = `
  <div class="MH_documentRow"><div class="MH__spacer"></div><div class="MH_documentLink" id="MH__gruper" type="button"> Gruper </div> <div style='width:3rem;'></div> <div id='MH__gruperStatus'> </div>  </div>
  <hr class="MH__divider">
  `;
  utilitiesPanel.onclick = (e) => {
    e.stopPropagation();
    switch (e.target.id) {
      case "MH__gruper":
        clickHREF(dataSource, 'a[href^="app.Gruper_popup_tv"]'); //x_historia_choroby=true
        break;
      default:
    }
  };

  mainPanel.append(utilitiesPanel);
  dischargePanel.append(mainPanel);

  const grouperStatus = utilitiesPanel.querySelector('div[id="MH__gruperStatus"]');
  if (grouper_rozliczony) {
    grouperStatus.innerHTML = "Rozliczony: ";
    grouperStatus.innerHTML += dataSource
      .querySelector('div[style="font-style:italic; color:green;"]')
      .innerHTML.replaceAll(/\&nbsp;/g, " ");
    grouperStatus.style.color = "green";
  } else {
    grouperStatus.innerHTML = "Nierozliczony";
    grouperStatus.style.color = "red";
  }

  // Nie wybrano grupy.
  checkIfPrintable();
}

function rebuildCategoryButtons() {
  //Extract buttons hrefs
  const orginalButtonHolder = document.querySelectorAll('table[class="menuRowTable"]');
  let hrefElementsList = [];
  for (let row of orginalButtonHolder) {
    row.style.display = "none";
    for (let button of row.querySelectorAll("a[href]")) {
      hrefElementsList.push(button);
    }
  }

  //Create new panel
  let extendDrawer = false;
  const categoryPanel = document.createElement("div");
  categoryPanel.classList.add("MH__myViewcategoryPanel");
  const displayedPanel = document.createElement("div");
  displayedPanel.classList = "MH__myViewDisplayedPanel";
  function generateButtons() {
    for (let button of displayedPanel.querySelectorAll(".MH__myViewCategoryButton")) {
      button.remove();
    }

    for (let grabbedElement of hrefElementsList
      .filter((grabbedElement) => GM_getValue("config_" + grabbedElement.textContent, false)) //filter list and order it them based on user defined config
      .sort((a, b) => {
        const aOrder = GM_getValue("config_" + a.textContent + "_orderNumber", 12);
        const bOrder = GM_getValue("config_" + b.textContent + "_orderNumber", 12);
        return aOrder - bOrder;
      })) {
      const categoryButton = document.createElement("button");
      categoryButton.type = "button";
      categoryButton.classList = "MH__myViewCategoryButton";
      categoryButton.textContent = grabbedElement.textContent;
      categoryButton.onclick = function () {
        grabbedElement.click();
      };
      displayedPanel.append(categoryButton);
    }
  }

  generateButtons();
  categoryPanel.append(displayedPanel);
  if (displayedPanel.querySelector(".MH__myViewCategoryButton") === null) {
    // if no button configured extend configuration panel
    extendDrawer = true;
  }

  const configurationPanel = document.createElement("div");
  configurationPanel.classList = "MH__menuBar";
  configurationPanel.style.backgroundColor = "rgb(132, 145, 155)";

  const configurationPanelSpan = document.createElement("div");
  configurationPanelSpan.innerHTML =
    ' <img class="MH__menu__icon" src="https://github.com/3evv/Medichelper/raw/main/images/settings_icon.png"></img>Konfiguracja panelu ';
  // configurationPanelSpan.style.fontSize = "0.75rem";
  configurationPanelSpan.style.display = "flex";
  configurationPanelSpan.style.height = "1.5rem";
  // configurationPanelSpan.style.width = "21rem";
  configurationPanelSpan.style.justifySelf = "flex-end";
  configurationPanelSpan.style.marginRight = "0.2rem";
  configurationPanelSpan.style.textAlign = "flex-start";
  configurationPanelSpan.classList = "MH__menu";

  configurationPanelSpan.addEventListener("click", () => {
    extendDrawer = !extendDrawer;
    drawerPanel.style.display = extendDrawer ? "grid" : "none";
    drawerPanelDescription.style.display = extendDrawer ? "grid" : "none";
  });

  configurationPanel.append(configurationPanelSpan);

  const drawerPanel = document.createElement("div");
  drawerPanel.classList = "MH__myViewConfigurationPanel";
  drawerPanel.style.display = extendDrawer ? "grid" : "none";

  for (let button of hrefElementsList) {
    const configurationDiv = document.createElement("div");
    configurationDiv.style.display = "flex";
    configurationDiv.style.width = "100%";
    configurationDiv.classList = "MH__myViewConfigurationPanel__ConfigurationList";
    configurationDiv.style.paddingBottom = "0.5rem";

    const inputElement = document.createElement("input");
    inputElement.type = "checkbox";
    inputElement.checked = GM_getValue("config_" + button.textContent, false);
    inputElement.style.marginRight = "0.75rem";
    inputElement.addEventListener("change", () => {
      GM_setValue("config_" + button.textContent, inputElement.checked);
      generateButtons();
    });
    const labelElement = document.createElement("label");
    labelElement.textContent = button.textContent.trim();
    labelElement.classList = "MH__myViewConfigurationPanel__label";
    labelElement.style.flexGrow = "1";
    labelElement.style.textAlign = "left";

    labelElement.onclick = function () {
      button.click();
    };

    const orderElement = document.createElement("input");
    orderElement.type = "number";
    // orderElement.style.overflow = 'always-visible';
    orderElement.value = GM_getValue("config_" + button.textContent + "_orderNumber", 12);
    orderElement.style.width = "2rem";
    orderElement.style.marginRight = "0.25rem";
    // orderElement.style.placeSelf = "right";

    orderElement.addEventListener("change", () => {
      GM_setValue("config_" + button.textContent + "_orderNumber", orderElement.value);
      generateButtons();
    });
    configurationDiv.appendChild(inputElement);
    configurationDiv.appendChild(labelElement);
    configurationDiv.appendChild(orderElement);
    drawerPanel.appendChild(configurationDiv);
  }
  const drawerPanelDescription = document.createElement("span");
  drawerPanelDescription.innerHTML =
    "Zaznacz pożądane elementy wyświetlane ciągle na górze strony za pomocą tickmarka. Liczba w prawym rogu oznacza kolejność wyświetlania, gdzie niższe wartości będą pozycjonować przyski bliżej lewej krawędzi. <br> Kliknięcie na nazwę przenosi na odpowiednią stronę/odnośnik.";
  drawerPanelDescription.style.fontSize = "1.1rem";
  drawerPanelDescription.style.paddingTop = "0.5rem";
  drawerPanelDescription.style.paddingLeft = "0.5rem";
  drawerPanelDescription.style.textAlign = "left";
  drawerPanelDescription.style.display = extendDrawer ? "grid" : "none";
  drawerPanelDescription.style.marginLeft = "0.5rem";

  configurationPanel.append(drawerPanelDescription);
  configurationPanel.append(drawerPanel);

  categoryPanel.appendChild(displayedPanel);
  categoryPanel.appendChild(configurationPanel);
  document
    .querySelector('table[class="menuRowTable"]')
    .parentNode.insertBefore(categoryPanel, document.querySelector('table[class="menuRowTable"]'));
  // Create drawer with hidden elements and configuration
}

function rebuildSearchBarAndBottomBar() {
  let upperBarHTMLREF = [];
  const firstUpperBarElement = document
    .querySelector("table > tbody > tr[style='height:4px;'] > td[class='menu_c_et']")
    .closest("table"); //  tbody[style="height:4px;"] > tr[class="menu_c_et"]
  upperBarHTMLREF.push(firstUpperBarElement);
  let element = firstUpperBarElement.nextSibling;

  const lastUpperBarElement = document.querySelector('div[class="navigPositionDiv"]');
  // console.log(lastUpperBarElement);
  while (element != lastUpperBarElement) {
    upperBarHTMLREF.push(element);
    element = element.nextSibling;
  }
  upperBarHTMLREF.push(lastUpperBarElement);

  upperBarHTMLREF.forEach((element) => {
    if (element.style) {
      element.style.display = "none";
    }
  });

  let lowerBarHTMLREF = [];
  const lowerBarElementsStart = document.querySelector('table[class="templateListTable"]');
  const lowerBarElementsEnd = document.querySelector('a[class="contextHelpElementA"]').closest("table");
  element = lowerBarElementsStart.nextSibling;
  while (element != lowerBarElementsEnd) {
    element = element.nextSibling;
    lowerBarHTMLREF.push(element);
    if (element.style) {
      element.style.display = "none";
    }
  }

  // const toolBar = document.createElement("div"); todo: implement
  // toolBar.clas = "MH__toolbar"
  // toolBar.textContent = "here";
  // document.body.append(toolBar);
}

function fixMyView() {
  const tableHeader = document.querySelector("body > center > form > table.templateListTable");
  const wardName = tableHeader
    .querySelector("legend")
    .parentElement.querySelector("select[name=filter_jedn_options]")
    .querySelector("[selected]").textContent;

  const logoutButton = document.body.querySelector('a[class="logoutElementA"]').parentElement;
  const enableMyView = document.createElement("button");
  enableMyView.type = 'button';
  enableMyView.textContent = GM_getValue("fixedViews", {})[wardName] ? "Wyłącz optymalizację strony" : "Włącz optymalizację strony";
  enableMyView.style.background = GM_getValue("fixedViews", {})[wardName] ? "#89e786" : "#953e4d";
  enableMyView.style.marginRight = '0.5rem';
  logoutButton.insertBefore(enableMyView, logoutButton.firstChild);
  enableMyView.addEventListener("click", () => {
    fixedViews[wardName] = !fixedViews[wardName];
    GM_setValue("fixedViews", fixedViews);
    location.reload();
  });

  let fixedViews = GM_getValue("fixedViews", {});
  if (!fixedViews[wardName]) {
    return;
  }

  document.body.style.removeProperty("background-color");
  const style = document.createElement("style");
  style.textContent = `
  .MH__toolbar{
  background-color: rgba(103, 0, 0, 1);
  width: 100%

  }
  body {
  display: flex;
  flex-direction: column;
  }
  body, tr {
  background-color: rgba(225, 223, 223, 1);
  }

  form {
  width:100%;
  display:flex;
  flex-direction: column;

  }
  .MH__myViewCategoryButton {
  background-color: rgb(147, 159, 168); /* Todo 3evv: fix colors */
  padding: 1rem;
  border: none;
  border-radius: 0.25rem 0.25rem 0 0;
  margin-right: 0.15rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 1);
  }
  .MH__myViewCategoryButton:hover {
  background-color: #0082bc;
  }
  .MH__myViewcategoryPanel{
  background-color: rgba(225, 223, 223, 1);
  }
  .MH__myViewConfigurationPanel{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 1.1rem;
  padding: 0.5rem;
  background-color: rgb(132, 145, 155);
  justify-items: start;
  padding-left: 1rem;
  padding-right: 1rem;
  }
  .MH__myViewConfigurationPanel__label:hover {
    color: #0082bc;
  }


  .MH_documentRow {
  display: flex;
  flex-direction: row;
  height: 2rem;
  min-width: 15vw;
  align-items: flex-end;
  }
  .MH_documentLink:hover {
    color: blue;
  }
   .MH__printer {
          display: block;
          flex-direction: row;
          height: 1.25rem;
          position: relative;
          width: 2.75rem;
          height: 1.5rem;
          filter: brightness(0.4);
          align-self:center;
        }
        .MH__printer img {
            display: block;
            width: 2rem; /* Set your image width */
            height: 2rem; /* Maintain aspect ratio */
            transition: .5s ease;
        }
        .MH__printer:hover {
        filter: brightness(0);
        filter: drop-shadow(1px 1px 1px blue);
        }
         .MH__divider {
        height: 2px;
        background-color:rgb(154, 154, 154);
        border: 0;
        width: 100%;
        margin-top: 0.2rem;
        margin-left: 0.3rem;
        margin-right: 0.3rem;
        margin-bottom: 0.2rem;
        }
         .MH__spacer {
        width: 0.32rem;
        height: 0.5rem;
         }
        .MH__tab{
        position: absolute;
        z-index: 0;
        padding-bottom: 3px;
        border-bottom: 5px;
        background:white;
        border: 1px solid rgb(190,195,199);
        padding-top: 0.10rem;
        padding-bottom: 0.27rem;
        border-bottom: unset;
        margin-top: 0.04rem;
        margin-right: 0.04rem;

        }
        .MH__tab1{
        }
        .MH__tab2{
        left: 5.6rem;
        }
        .MH__tab3{
        left: 14.8rem;
        }
        .MH__tab_selected{
        position: absolute;
        z-index: 1;
        padding-bottom: 5px;
        border-bottom: 5px;
        background:white;
        border: 2px solid rgb(190,195,199);
        border-bottom: unset;
        }
        .MH__selected_tab{
        background-color: rgb(241, 241, 241);
        padding-bottom: 0.27rem;
        z-index: 1;
        }
        .MH__gruperStatus{
        justify-self:flex-end;
        }
         .MH__fixedMainPage__nameplatelegend{
         width: auto;
        height: 1.5rem;
        font-size: 1.25rem;
        margin-top: 0.25rem;
        margin-bottom: 0.05rem;
        padding: 0.25rem;
        padding-left: 0.75rem;
        background:rgb(44, 187, 111);
        color:rgb(231, 231, 225);
        border-top: 0.15rem solid #434656;
        border: 0.15rem solid transparent;
        font-weight: bold;
        }
        .MH__fixedMainPage__nameplate{
        width: auto;
        height: 1.5rem;
        font-size: 1.25rem;
        margin-top: 0.1rem;
        margin-bottom: 0.05rem;
        padding: 0.25rem;
        padding-left: 0.75rem;
        background:rgb(44, 187, 111);
        color:rgb(231, 231, 225);
        border-top: 0.15rem solid #434656;
        border: 0.15rem solid transparent;
        margin-left: 0.05em;
        margin-right: 0.05rem;
        }
        .MH__fixedMainPage__nameplate:hover {
        color: #000000ff;
        border: 0.15rem solid #000000ff;
        background:rgba(213, 213, 213, 1);

         }
        .MH__buttonPanel{
        background:rgb(132, 145, 155);
        padding: 0.2rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        align-items: center;
        margin-left: 0.15rem;
        margin-right: 0.15rem;
        }
        .MH___orginalFilterpanel{
        background-color: rgba(153, 167, 177, 1);
        }

        .MH__menu{
        background-color: #00000017;
        color: rgba(255, 255, 255, 1);
        font-size: 1.15rem;
        align-text: center;
        
        }
        .MH__menu__icon {
        height: 1.15rem;
        width: 1.15rem;
        margin-right: 0.15rem;
		    // mask-image: url("https://github.com/3evv/Medichelper/raw/main/images/menu_drawer.png");
        // mask-mode: alpha;
		    // mask-size: cover;
		    //background-color: #ffffffff;
        align-self: center;
        }
        .MH__menu:hover {
        background-color: #0082bc;
        }
        .MH__filterPanel{
        display:flex;
        width:auto;
        padding: 0.5rem;
        justify-content:space-between;
        align-items:center;
        background-color: rgba(153, 167, 177, 1);
        height:3rem;
        font-size:1rem;
        color: rgba(255, 255, 255, 0.94);
        margin-left: 0.15rem;
        margin-right: 0.15rem;
        }
        .MH__filterPanelElement{
        display:flex;
        justify-content: space-between;
        align-content: center;
        }
        .MH__filterPanelSpan{
        padding-right: 0.3rem;
        }
        .rowlist {
        display:flex;
          width:100%;
        }
        .templateListColumnTd {
        display:flex;
        width:100%;
        flex-direction: column;
        }
        .MH__myViewDisplayedPanel {
         margin-left: 0.15rem;
        margin-right: 0.15rem;
        }
        .MH__menuBar{
         margin-left: 0.15rem;
        margin-right: 0.15rem;
        } `;
  document.head.appendChild(style);
  // document.body.style.display = "flex";
  // document.body.style.flexDirection = "column";
  if (GM_getValue("fixHeader", true)) {
    rebuildCategoryButtons();
    rebuildSearchBarAndBottomBar();
  }


  tableHeader.style.display = 'flex';
  tableHeader.style.flexDirection = 'column';
  tableHeader.style.width = '99.99999%';

  const tableRows = tableHeader.querySelectorAll("tr.rowlist");

  // tableHeader.style.background = "#30b27e";

  function rebuildFilterPanel() {
    const oldFiltersContainer = document.querySelector(".MH___orginalFilterpanel");
    oldFiltersContainer.style.display = GM_getValue("ShowoldFiltersContainer", false) ? "table-row" : "none";
    const newFilterPanelElement = document.createElement("div");
    newFilterPanelElement.classList = "MH__filterPanel";
    const wardChoosingElement = document.createElement("div");
    wardChoosingElement.classList = "MH__filterPanelElement";
    const wardNameSpan = document.createElement("span");
    wardNameSpan.textContent = 'Oddział:';
    wardNameSpan.classList = "MH__filterPanelSpan";
    const wardDropdownElement = document.querySelector('select[name="filter_jedn_options"]'); //its stupid
    wardDropdownElement.style.width = "20rem";
    wardChoosingElement.append(wardNameSpan, wardDropdownElement);
    newFilterPanelElement.appendChild(wardChoosingElement);
    const appointedMChoosingElement = document.createElement("div");
    appointedMChoosingElement.classList = "MH__filterPanelElement";
    const MDNameSpan = document.createElement("span");
    MDNameSpan.classList = "MH__filterPanelSpan";
    MDNameSpan.textContent = "Lekarz prowadzący: ";
    const filterByAppointedMD = document.querySelector('select[name="filter_fpersonelProwadz"]'); //its stupid
    filterByAppointedMD.style.width = "15rem";
    const myPatients = document.querySelector('input[id="filter_ogolOpts1"]').parentElement;
    appointedMChoosingElement.append(MDNameSpan, filterByAppointedMD, myPatients);
    newFilterPanelElement.appendChild(appointedMChoosingElement);
    const filterByStatus = document.createElement("div");
    filterByStatus.classList = "MH__filterPanelElement";
    const filterByStatusNameSpan = document.createElement("span");
    filterByStatusNameSpan.classList = "MH__filterPanelSpan";
    filterByStatusNameSpan.textContent = "Status hospitalizacji: ";
    const filterByStatusDropdown = document.createElement("select");
    const statusOptions = ["Wszystkie", "Trwające", "Zakończone", "Zakończone bez JGP"];
    let iterator = 1;
    for (const option of statusOptions) {
      filterByStatusDropdown.options.add(new Option(option, "filter_hospOpts" + iterator));
      iterator += 1;
    }
    // filter_hospOpts1
    const OptionsElements = document.querySelectorAll('input[type="radio"][name="filter_hospOpts"]');
    for (let element of OptionsElements) {
      // console.log(element);
      if (element.hasAttribute("checked")) {
        // console.log(String(element.id)[String(element.id).length - 1]);
        let selectedIdNumber = Number(String(element.id)[String(element.id).length - 1]);
        filterByStatusDropdown.options.selectedIndex = selectedIdNumber - 1;
      }
    }
    filterByStatusDropdown.addEventListener("change", function () {
      document.querySelector(`input[id="${filterByStatusDropdown.value}"]`).click();
    });

    filterByStatus.append(filterByStatusNameSpan, filterByStatusDropdown);
    newFilterPanelElement.appendChild(filterByStatus);
    showOldFiltersButton = document.createElement("button");
    showOldFiltersButton.classList = "MH__filterPanelElement";
    showOldFiltersButton.textContent = "Pokaż stare filtry";
    showOldFiltersButton.type = "button";
    showOldFiltersButton.style.justifySelf = "flex-end";
    showOldFiltersButton.addEventListener("click", function () {
      GM_setValue("ShowoldFiltersContainer", !GM_getValue("ShowoldFiltersContainer", false));
      oldFiltersContainer.style.display = GM_getValue("ShowoldFiltersContainer", false) ? "table-row" : "none";
    });
    newFilterPanelElement.appendChild(showOldFiltersButton);

    return newFilterPanelElement;
  }

  const Filtertable = document.querySelector('[class="templateListTableHeaderTr"]');
  Filtertable.style.removeProperty("background-color");

  Filtertable.classList += " MH___orginalFilterpanel";
  Filtertable.querySelector("tr").classList.add("MH___orginalFilterpanel");

  if (GM_getValue("fixHeader", true)) {
    Filtertable.insertAdjacentElement("beforebegin", rebuildFilterPanel());
  }
  const button_panel = document.createElement("div");
  button_panel.classList = "MH__buttonPanel";

  const disableHeaderChange = document.createElement("input");
  disableHeaderChange.classList = "MH__toggleHeader";
  disableHeaderChange.setAttribute("type", "checkbox");
  disableHeaderChange.checked = GM_getValue("fixHeader", true);
  disableHeaderChange.style.margin = "0.2rem";
  const disableHeaderChangeDescription = document.createElement("span");
  disableHeaderChangeDescription.textContent = `Zmiana widoku nagłówka`;
  disableHeaderChangeDescription.style.textAlign = "center";
  disableHeaderChangeDescription.style.color = "rgba(255, 255, 255, 1)";
  disableHeaderChangeDescription.style.paddingRight = '0.4rem';

  button_panel.appendChild(disableHeaderChange);
  button_panel.appendChild(disableHeaderChangeDescription);

  disableHeaderChange.addEventListener("change", () => {
    GM_setValue('fixHeader', disableHeaderChange.checked);
    location.reload();
  });

  const disableButton = document.createElement("input");
  disableButton.classList = "MH__toggleOpti";
  disableButton.setAttribute("type", "checkbox");
  disableButton.checked = GM_getValue("fixedViews", {})[wardName];
  disableButton.style.margin = "0.2rem";
  const disableDescription = document.createElement("span");
  disableDescription.textContent = `Zmiana widoku listy pacjentów`;
  disableDescription.style.textAlign = "center";
  disableDescription.style.color = "rgba(255, 255, 255, 1)";
  button_panel.appendChild(disableButton);
  button_panel.appendChild(disableDescription);

  Filtertable.insertAdjacentElement("afterEnd", button_panel);




  // disableButton.style.background = GM_getValue("fixedViews", {})[wardName] ? "#89e786" : "#953e4d";

  disableButton.onclick = (e) => {
    e.stopPropagation();

    let fixedViews = GM_getValue("fixedViews", {});
    fixedViews[wardName] = !fixedViews[wardName];
    GM_setValue("fixedViews", fixedViews);
    for (let button of document.querySelectorAll('button[id="MH__revert_button"]')) {
      button.click();
    }

    // disableButton.style.background = GM_getValue("fixedViews", {})[wardName] ? "#89e786" : "#953e4d";
    if (GM_getValue("fixedViews", {})[wardName]) {
      declutterNameplates();
      autoRefresh();
    } else {
      restoreView();
      document.body.querySelector('.MH__fixedMainPage__nameplatelegend').remove();
    }
    disableButton.checked = GM_getValue("fixedViews", {})[wardName];
  };

  // forceButton.onclick = (e) => {
  //   e.stopPropagation();
  //   for (let cleanupElement of document.querySelectorAll(
  //     ".MH__fixedMainPage"
  //   )) {
  //     cleanupElement.parentElement.removeChild(cleanupElement);
  //   }
  //   restoreView();
  //   declutterNameplates();
  //   autoRefresh();
  // };

  function capitalizeName(str) {
    if (!str) return ""; // Check for non-empty string
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function declutterNameplates() {
    const firstfixedRow = document.createElement("div");
    firstfixedRow.style.backgroundColor = " #2da173ff";
    let margin = "0.15rem";
    firstfixedRow.style.marginLeft = margin;
    firstfixedRow.style.marginRight = margin;
    // firstfixedRow.style.marginLeft = "0.65rem";
    firstfixedRow.className = "MH__fixedMainPage__nameplatelegend";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = "Imię i nazwisko, wiek";
    nameSpan.style.width = "25rem";

    const peselSpan = document.createElement("span");
    peselSpan.textContent = "Pesel";
    peselSpan.style.width = "12rem";
    firstfixedRow.style.display = "flex";

    firstfixedRow.appendChild(nameSpan);
    firstfixedRow.appendChild(peselSpan);

    const roomSpan = document.createElement("span");
    // roomSpan.textContent = PeselData + " ";
    roomSpan.style.width = "25rem";
    roomSpan.textContent = "Sala";
    firstfixedRow.appendChild(roomSpan);
    const appointedMDSpan = document.createElement("span");
    // appointedMDSpan.textContent = PeselData + " ";
    appointedMDSpan.style.width = "25rem";
    appointedMDSpan.style.overflowY = "hidden";
    appointedMDSpan.textContent = "Prowadzący";
    firstfixedRow.appendChild(appointedMDSpan);
    const plannedDischarge = document.createElement("span");
    // plannedDischarge.style.width = "1rem";
    plannedDischarge.classList = "MH__plannedDischarge";
    firstfixedRow.appendChild(plannedDischarge);

    document.querySelector('div[class="MH__buttonPanel"]').insertAdjacentElement("afterEnd", firstfixedRow);

    for (let row of tableRows) {
      if (row.style) {
        row.style.removeProperty("background-color");
      }
      blackBar = row.querySelector("td").querySelector('table[class="pobytTable"]');
      blackBar.style.display = "none";
      greenBar = row.querySelector("td").querySelector('table:nth-child(2)[class="pobytTable"]');
      greenBar.setAttribute("MH__danepobytu", "");
      greenBar.style.display = "none";
      // console.log(greenBar);
      PESELlenght = 11;
      const namedataString = blackBar.textContent;
      const name = capitalizeName(
        namedataString
          .substring(
            namedataString.indexOf("Przyjęcie do szpitala:") + "Przyjęcie do szpitala:".length,
            namedataString.indexOf(",") - PESELlenght
          )
          .trim()
      );
      const PeselData = namedataString
        .substring(namedataString.indexOf(",") - PESELlenght, namedataString.indexOf(","))
        .trim();
      const age = namedataString
        .substring(namedataString.indexOf("wiek:") + "wiek:".length, namedataString.indexOf(".") - 1)
        .trim();
      // console.log(age);

      // console.log(namedataString);
      const fixedRow = document.createElement("div");
      // fixedRow.style.background = "rgb(91, 187, 104)";
      fixedRow.className = "MH__fixedMainPage__nameplate";
      // fixedRow.innerHTML = name + " " + age + " " + PeselData;
      const nameSpan = document.createElement("span");
      nameSpan.textContent = name + ", " + age + " lat";
      nameSpan.style.width = "25rem";
      // const ageSpan = document.createElement("span");
      // ageSpan.textContent = age + " ";
      // ageSpan.style.width = "25rem";
      const peselSpan = document.createElement("span");
      peselSpan.textContent = PeselData + " ";
      peselSpan.style.width = "12rem";
      fixedRow.style.display = "flex";

      fixedRow.appendChild(nameSpan);
      // fixedRow.appendChild(ageSpan);
      fixedRow.appendChild(peselSpan);

      const roomSpan = document.createElement("span");
      // roomSpan.textContent = PeselData + " ";
      roomSpan.style.width = "25rem";
      roomSpan.classList = "MH__roomSpan";
      fixedRow.appendChild(roomSpan);
      const appointedMDSpan = document.createElement("span");
      // appointedMDSpan.textContent = PeselData + " ";
      appointedMDSpan.style.width = "25rem";
      appointedMDSpan.style.overflowY = "hidden";
      appointedMDSpan.classList = "MH__appointedMDSpan";
      fixedRow.appendChild(appointedMDSpan);
      const plannedDischarge = document.createElement("span");
      // plannedDischarge.style.width = "1rem";
      plannedDischarge.classList = "MH__plannedDischarge";
      fixedRow.appendChild(plannedDischarge);

      row.querySelector("td").appendChild(fixedRow);

      greenBar.click();

      fixedRow.addEventListener("click", () => {
        greenBar.click();

        if (row.querySelector(".MH__fixedMainPage__data").style.display == "block") {
          row.querySelector(".MH__fixedMainPage__data").style.display = "none";
        } else {
          // console.log("here");
          row.querySelector(".MH__fixedMainPage__data").style.display = "block";
        }
      });
    }
  }

  for (let row of tableRows) {
    //activate scripts load
    const greenBar = row.querySelector("td").querySelector('table:nth-child(2)[class="pobytTable"] > tbody > tr > th');
    greenBar.click();
    greenBar.click();
  }

  function restoreView() {
    for (let newNameplate of document.querySelectorAll(".MH__fixedMainPage__nameplate")) {
      newNameplate.style.display = "none";
    }

    for (let row of tableRows) {
      const blackBar = row.querySelector("td").querySelector('table[class="pobytTable"]');
      blackBar.style.display = "table";

      const greenBar = row.querySelector("td").querySelector('table:nth-child(2)[class="pobytTable"]');
      greenBar.style.display = "table";
    }
  }

  function autoRefresh() {
    if (GM_getValue("fixedViews")[wardName] != undefined && GM_getValue("fixedViews")[wardName] == true) {
      for (let row of tableRows) {
        const dataDIV = row?.querySelector("[MH__danepobytu]").querySelector("td > div");

        if (!dataDIV || !dataDIV.innerHTML) continue; // Skip if dataDIV is not found or empty

        optimize(dataDIV, row);

        const observer = new MutationObserver((mutationsList, observer) => {
          for (let mutation of mutationsList) {
            if (mutation.type === "childList") {
              // console.log('here')
              optimize(dataDIV, row);
            }
          }
        });

        observer.observe(dataDIV, {
          childList: true,
          attributes: true,
        });
      }
    }
  }

  if (GM_getValue("fixedViews")[wardName] != undefined && GM_getValue("fixedViews")[wardName] == true) {
    declutterNameplates();
    autoRefresh();
  }

  function optimize(dataDIV, row) {
    // for (let cleanupElement of row.parentElement.querySelectorAll(
    //   '[class="MH__fixedMainPage__data"]'
    // )) {
    //   cleanupElement.parentElement.removeChild(cleanupElement);
    // }

    // dataDIV.classList += "MH__Optimized";
    dataDIV.style.display = "none";

    const overlay = document.createElement("div");
    overlay.style.minHeight = "10rem";
    overlay.classList = "MH__fixedMainPage__data";
    const controlPanel = document.createElement("div");
    controlPanel.style.background = "rgb(190,195,199)";
    controlPanel.style.display = "flex";
    controlPanel.style.flexDirection = "row-reverse";
    controlPanel.style.justifyContent = "space-between";
    controlPanel.innerHTML = `<button id="MH__revert_button" type="button"> Oryginalny widok </button>`;
    const bed = "";
    controlPanel.innerHTML += `<span id="MH__bed"> ${bed} </span>`;
    controlPanel.innerHTML += `<div style="height:100%; min-width: 33%;">
        <button class="MH__tab MH__tab1" id="MH__addmission_button" type="button"> Przyjęcie </button>
        <button class="MH__tab MH__tab2 MH__selected_tab" id="MH__stay_button" type="button"> Prowadzenie Pacjenta </button>
        <button class="MH__tab MH__tab3" id="MH__discharge_button" type="button"> Wypis do domu </button>
        </div>`;
    overlay.append(controlPanel);
    const admissionPanel = document.createElement("div");
    const stayPanel = document.createElement("div");
    const dischargePanel = document.createElement("div");
    if (wardName == "ODDZIAŁ KARDIOLOGICZNY (49042) ") {
      const admissionDone = createAdmissionPanelInterna(dataDIV, admissionPanel);
      createStayPanelInterna(dataDIV, stayPanel);
      createDischargePanelInterna(dataDIV, dischargePanel);
      if (admissionDone == false) {
        controlPanel.querySelector("button[id='MH__addmission_button']").style.background = "#f1ff00";
      }
    }
    if (wardName == "Klinika Neurochirurgii ") {
      const admissionDone = createAdmissionPanelNchir(dataDIV, admissionPanel);
      createStayPanelNchir(dataDIV, stayPanel);
      createDischargePanelNchir(dataDIV, dischargePanel);
      if (admissionDone == false) {
        controlPanel.querySelector("button[id='MH__addmission_button']").style.background = "#f1ff00";
      }
    }

    if (dataDIV?.querySelector('td[class*="sdw"] > table > tbody')?.querySelectorAll("th")) {
      const informationSpans = dataDIV.querySelector('td[class*="sdw"] > table > tbody').querySelectorAll("th");
      // console.log(informationSpans);
      const namePlate = dataDIV.closest('tr[class="rowlist"]').querySelector("div[class='MH__fixedMainPage__nameplate']");
      for (let info of informationSpans) {
        switch (info.textContent) {
          case "Sala:":
            namePlate.querySelector('span[class="MH__roomSpan"]').textContent =
              info.parentElement.querySelector("td").textContent;
            break;
          case "Data wypisu:": //todo 3evv fix to apriopriate type?
            namePlate.querySelector('span[class="MH__plannedDischarge"]').textContent =
              info.parentElement.querySelector("td").textContent;
            break;
        }
      }
      if (dataDIV
        ?.querySelector('td[class*="sdw"] > table > tbody')
        ?.querySelector('a[href] > font[color="#1b29ff"]')
        ?.closest("tr")) {
        const appointedMDelement = dataDIV
          .querySelector('td[class*="sdw"] > table > tbody')
          .querySelector('a[href] > font[color="#1b29ff"]')
          .closest("tr");
        // console.log(appointedMDelement);
        let appointedMDvalue = appointedMDelement.querySelector("td").textContent;
        appointedMDvalue = appointedMDvalue.substring(0, appointedMDvalue.indexOf("PWZ:"));

        namePlate.querySelector('span[class="MH__appointedMDSpan"]').textContent = appointedMDvalue;
      }
    }



    overlay.append(admissionPanel);
    overlay.append(stayPanel);
    overlay.append(dischargePanel);

    admissionPanel.style.display = "none";
    stayPanel.style.display = "block";
    dischargePanel.style.display = "none";

    controlPanel.onclick = (e) => {
      e.stopPropagation();
      switch (e.target.id) {
        case "MH__revert_button":
          overlay.parentElement.removeChild(overlay);
          dataDIV.style.display = "block";
          dataDIV.classList -= "MH__Optimized";
          // console.log(dataDIV.closest("tr[class='rowlist']"));
          dataDIV.closest("tr[class='rowlist']").querySelector(".MH__fixedMainPage__nameplate").style.display = "none";
          dataDIV
            .closest("tr[class='rowlist']")
            .querySelector("td")
            .querySelector('table[class="pobytTable"]').style.display = "table";
          dataDIV
            .closest("tr[class='rowlist']")
            .querySelector("td")
            .querySelector('table:nth-child(2)[class="pobytTable"]').style.display = "table";

          break;
        case "MH__addmission_button":
          admissionPanel.style.display = "block";
          stayPanel.style.display = "none";
          dischargePanel.style.display = "none";
          controlPanel.querySelector('[class*="MH__selected_tab"]').classList.remove("MH__selected_tab");
          controlPanel.querySelector(`[id="${e.target.id}"]`).classList += " MH__selected_tab";
          break;
        case "MH__stay_button":
          admissionPanel.style.display = "none";
          stayPanel.style.display = "block";
          dischargePanel.style.display = "none";
          controlPanel.querySelector('[class*="MH__selected_tab"]').classList.remove("MH__selected_tab");
          controlPanel.querySelector(`[id="${e.target.id}"]`).classList += " MH__selected_tab";
          break;
        case "MH__discharge_button":
          admissionPanel.style.display = "none";
          stayPanel.style.display = "none";
          dischargePanel.style.display = "block";
          controlPanel.querySelector('[class*="MH__selected_tab"]').classList.remove("MH__selected_tab");
          controlPanel.querySelector(`[id="${e.target.id}"]`).classList += " MH__selected_tab";
          break;
      }
    };
    // console.log(row);
    overlay.style.display = "none";
    row.querySelector('div[class="MH__fixedMainPage__nameplate"]').parentElement.appendChild(overlay);
  }
}

function detectEmptyInputFields() {
  const emptyFields = document.querySelectorAll("textarea");
  const nazwa_headera = document.getElementById("header").querySelector(".templateEditPageTitle").textContent;

  // console.log(emptyFields);
  for (let field of emptyFields) {
    if (!field.classList.contains("MedhelperSuggestion")) {
      if (GM_getValue(["settings"])["optimize"]) {
        resizeTextarea(field);
      }
      addSettingCog(field);
    }
  }
}

function configureJson(target_name = undefined) {
  const parent = document.createElement("div");
  parent.style.padding = "3rem";
  const nazwa_headera = document.getElementById("header").querySelector(".templateEditPageTitle").textContent;
  const fieldIndex = GM_getValue(["settings"])["fields_with_autocomplete"].findIndex(
    (item) => item.header_name === nazwa_headera
  );
  let configured = false;
  if (fieldIndex != -1) {
    configured = true;
  }
  const savedValues = GM_getValue(["settings"])["fields_with_autocomplete"][fieldIndex];
  const titleDiv = document.createElement("div");
  titleDiv.style.height = "3rem";
  titleDiv.style.fontSize = "2rem";
  titleDiv.innerHTML += `<span style='${configured ? "color: green" : "color: red"
    };'> Skonfigurowane: </span> <span style="color: black;"> ${savedValues.header_name} </span>`;
  parent.append(titleDiv);
  const autofillCheckbox = document.createElement("input");
  // autofillCheckbox.type = 'checkbox';
  // autofillCheckbox.checked = savedValues.suggest_text;
  // const label = document.createElement('label');
  // label.htmlFor = 'suggestText';
  // label.textContent = 'Sugeruj tekst na stronie';

  // autofillCheckbox.addEventListener('change', function () {
  //   savedValues.suggest_text = this.checked;
  // });
  // parent.append(autofillCheckbox);
  // parent.appendChild(label);
  const drawer = document.createElement("div");
  let jsonData = "";
  // console.log(savedValues.user_configurable_text);
  console.log(savedValues.user_configurable_text[0][target_name]);
  if (JSON.stringify(savedValues.user_configurable_text[0][target_name], null, 2) != undefined) {
    jsonData = JSON.stringify(savedValues.user_configurable_text[0][target_name], null, 2);
  } else {
    jsonData = `{
    "line1" : "Twoja pierwsza autosugestia",
    "line2" : "Naciśnij zapisz by ją zapamiętać w systemie",
    "line3" : "\${ zapisałem ? 'Udało się zapisać' : ' Jak widzisz ten napis poza dialogiem konfiguracji to udało się zapisać.'}",
    "line4" : "Jak chcesz się tego całkowicie pozbyć to zostaw pusty nawias {} bez linijek."
}`;
  }
  drawer.style.gap = "0.5rem";
  drawer.style.padding = "0.5rem";
  drawer.style.height = "max-content";
  drawer.innerHTML = ` <div class="drawer" id="drawer"> <textarea id="jsonTextArea" style="width: 100%; min-height:30rem;">${jsonData}</textarea>
    <div style="display:flex;gap:2rem;font-size:1.5rem;"><button style="height:2rem;" id="checkjson">Sprawdź składnie i zapisz</button> <span id="mistake" style="display:none; color:red"> Niepoprawny JSON!</span> <span id="approved" style="display:none; color:green"> JSON zapisany</span><button style="height:2rem;" id="removejson">Usuń autosugestie</button></div>
    </div>`;
  const instruction = document.createElement("div");
  instruction.style.background = "white";
  instruction.style.width = "fit-content";
  instruction.style.padding = "0.5rem";
  instruction.style.marginTop = "1rem";
  instruction.innerHTML = `<div> Krótka instrukcja pisania JSON: </div>
    <div> Każda nowa linijka musi się zaczynać od "lineX": , pod X podstawić numer linijki. Nazwy linijek nie mogą się powtarzać! </div>
    <div> Dalej definiujemy swoją linijkę wewnątrz cudzysłowia "". Jeżeli ma być to tylko wartość tekstowa to wystarczy po prostu wpisać. "Bardzo lubię autosugestie" </div>
    <div> Przykład: "line99" : "Bardzo lubię autosugestie"</div>
    <div>  Jeżeli ma być to wartość typu prawda albo fałsz, należy umieścić ją w następujący sposób: </div>
    <div> "\${ dowolna_nazwa ? 'Domyślna wartość tekstu.' : ' Alternatywna wartość tekstu.'}" </div>
    <div> Przykład: "line98" : "\${ lubie_sugestie ? 'Bardzo lubię autosugestie.' : ' Nie lubię autosugestii.'}" </div>
    <div> Na koniec należy upewnić się że wszystkie linijki Z WYŁĄCZENIEM OSTATNIEJ zawierające "lineX" : "tekst" są zakończone przecinkiem.  </div>
    <div> Przycisk "Sprawdź składnie i zapisz" nie zapisze jeżeli input nie będzie dobrym JSON, wyświetli komunikat że coś jest nie tak. </div>
    <div> Żeby zamknąć to okno wystarczy kliknąć na ciemne szare pole dookoła. </div>`;
  drawer.append(instruction);
  parent.append(drawer);

  // json_lines.disableAutoCopy

  return parent;
}
function isValidJson(jsonString) {
  try {
    JSON.parse(jsonString);
    return true; // Parsing succeeded
  } catch (error) {
    console.error("Invalid JSON format:", error);
    return false; // Parsing failed
  }
}

function synthesiseJSON(target_name = undefined) {
  const existingDialog = document.querySelector(".MD__json_dialog");
  if (existingDialog) {
    document.removeChild(existingDialog);
  }

  const dialogElement = document.createElement("dialog");
  dialogElement.style =
    "border: 1px solid purple; background: rgba(0, 0, 0, 0.4); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;";
  dialogElement.addEventListener("click", () => {
    const cleanup = document.querySelectorAll('div[id="MH__suggestiontext"]');
    for (let element of cleanup) {
      element.parentNode.classList -= "MedhelperSuggestion";
      element.parentNode.removeChild(element);
    }

    const cleanupEmpty = document.querySelectorAll('div[id="MH__emptyfield"]');
    for (let element of cleanupEmpty) {
      element.parentNode.parentNode.classList -= "MedhelperSuggestion";
      element.parentNode.removeChild(element);
    }
    const cleanupClass = document.querySelectorAll('textarea[class="MedhelperSuggestion"]');
    for (let element of cleanupClass) {
      element.classList -= "MedhelperSuggestion";
    }

    dialogElement.close();
    dialogElement.remove();
    handleHeader();
  });
  document.body.append(dialogElement);
  const dialogInnerElement = document.createElement("div");
  dialogInnerElement.style =
    "width: 80%; height: 80%; background: #DDD; display: flex; flex-direction: column; border: 1px solid black;";
  dialogInnerElement.addEventListener("click", (event) => event.stopPropagation());
  const dialogContent = configureJson(target_name);
  dialogInnerElement.append(dialogContent);
  dialogElement.append(dialogInnerElement);
  dialogElement.showModal();

  const checkButton = document.getElementById("checkjson");
  const removeButton = document.getElementById("removejson");
  removeButton.onclick = (e) => {
    e.stopPropagation();
    const nazwa_headera = document.getElementById("header").querySelector(".templateEditPageTitle").textContent;
    const fieldIndex = GM_getValue(["settings"])["fields_with_autocomplete"].findIndex(
      (item) => item.header_name === nazwa_headera
    );
    let oldSettings = GM_getValue("settings", {});
    oldSettings["fields_with_autocomplete"][fieldIndex]["user_configurable_text"][0][target_name] = undefined;
    // oldSettings = oldSettings.filter(obj => obj["fields_with_autocomplete"][fieldIndex]["user_configurable_text"][0] !== target_name);
    GM_setValue("settings", oldSettings); // Save back to storage.
    document.getElementById("approved").style.display = "block";
  };
  checkButton.onclick = (e) => {
    e.stopPropagation();
    const tableInput = document.getElementById("jsonTextArea").value;
    // console.log(tableInput);
    if (isValidJson(tableInput)) {
      document.getElementById("mistake").style.display = "none";
      const nazwa_headera = document.getElementById("header").querySelector(".templateEditPageTitle").textContent;
      const fieldIndex = GM_getValue(["settings"])["fields_with_autocomplete"].findIndex(
        (item) => item.header_name === nazwa_headera
      );
      if (fieldIndex != -1) {
        // Construct the path as a string
        // let path = 'settings["fields_with_autocomplete"][${fieldIndex}]["user_configurable_text"][0]["${target_name}"]';
        // path = path.replace("${fieldIndex}", fieldIndex);
        // path = path.replace("${target_name}", target_name);
        let oldSettings = GM_getValue("settings", {});
        oldSettings["fields_with_autocomplete"][fieldIndex]["user_configurable_text"][0][target_name] =
          JSON.parse(tableInput);
        GM_setValue("settings", oldSettings); // Save back to storage.
        document.getElementById("approved").style.display = "block";
      }
    } else {
      document.getElementById("mistake").style.display = "block";
      document.getElementById("approved").style.display = "none";
    }
  };
}

function resizeTextarea(textarea) {
  // Set the minimum height to ensure at least some text is visible
  const maxHeight = 1000;
  const min_width = "45%";
  const max_width = "45%";

  textarea.style.minHeight = "20px"; // Adjust as needed

  // Calculate the height of the content including padding and borders
  var scrollHeight = textarea.scrollHeight;

  // Ensure the height does not exceed a certain limit to prevent overflow
  if (scrollHeight > maxHeight) {
    // Adjust this value based on your design
    scrollHeight = maxHeight; // Maximum height, adjust as needed
  }
  textarea.style.maxWidth = max_width;
  textarea.style.minWidth = min_width;
  textarea.style.minHeight = scrollHeight + "px"; // Set the new height of the textarea
}

function addSettingCog(fieldOfIntrest) {
  fieldOfIntrest.style.position = "relative";
  fieldOfIntrest.classList = "MedhelperSuggestion";
  const parent = document.createElement("div");
  parent.id = "MH__emptyfield";
  parent.classList = "MedhelperSuggestion";
  parent.style.position = "absolute";
  parent.style.backgroundColor = "invisible";
  parent.style.borderRadius = "0.1rem";
  parent.style.left = fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + +"px";
  parent.style.top = fieldOfIntrest.getBoundingClientRect().top + window.scrollY + "px";
  parent.style.minWidth = "fit-content";
  parent.style.display = "flex";
  parent.style.flexDirection = "column";
  parent.style.justifyContent = "center";

  popup = document.createElement("div");
  popup.style.position = "relative";
  // popup.style.backgroundColor = "#b1b1b1";
  popup.style.padding = "0rem";
  popup.style.borderRadius = "0.1rem";
  popup.style.display = "flex";
  popup.style.flexShrink = "1";
  popup.style.flexDirection = "reverse-row";
  popup.style.justifyContent = "center";
  popup.style.alignContent = "center";

  const suggestionText = document.createElement("div");
  suggestionText.style.display = "flex";
  suggestionText.style.flexDirection = "column";
  suggestionText.style.flexWrap = "wrap";
  suggestionText.style.justifyContent = "center";
  suggestionText.style.alignContent = "center";
  suggestionText.style.padding = "0.1rem";
  suggestionText.style.maxHeight = "2rem";
  suggestionText.style.maxWidth = "2rem";
  suggestionText.style.backgroundColor = "#b1b1b1";

  suggestionText.innerHTML =
    '<img style="max-width: 2rem;max-height: 2rem; filter: opacity(0.5);" src="https://raw.githubusercontent.com/3evv/Medichelper/main/images/settings_icon.png" alt="Konfiguruj auto-uzupełnianie">';
  popup.appendChild(suggestionText);
  parent.appendChild(popup);

  suggestionText.onclick = (e) => {
    e.stopPropagation();
    synthesiseJSON(fieldOfIntrest.name);
  };

  window.addEventListener("resize", function () {
    updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
  });
  window.addEventListener("onclick", function () {
    updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
  });
  fieldOfIntrest.addEventListener("resize", function () {
    updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);
  });
  document.body.appendChild(parent);

  const minimal_przedmiotowe_suggestion_height = 0;
  updateFieldHeight(fieldOfIntrest, parent, popup, minimal_przedmiotowe_suggestion_height);

  const resizeObserver = new ResizeObserver((entries) => {
    window.dispatchEvent(new Event("resize"));
  });

  resizeObserver.observe(fieldOfIntrest);
}

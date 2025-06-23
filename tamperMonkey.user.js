// ==UserScript==
// @name        Medichelper
// @namespace   Violentmonkey Scripts
// @match       http://localhost:8000/*
// @match       http*://medicus.usk/*
// @version     1.17
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
    const link =
      "https://raw.githubusercontent.com/3evv/Medichelper/refs/heads/main/userSettings.json";
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

// if(GM_getValue(['settings']) == undefined){
//   GM_setValue(['settings']) = JSON();
// }

if (document.title == 'Mój widok') {
  if (GM_getValue(["settings"])["optimize"]) {
    // fixMyView();
  }
} else {
  handleHeader();
}


function handleHeader() {
  const nazwa_headera = document
    .getElementById("header")
    .querySelector(".templateEditPageTitle").textContent;
  let known_fields = GM_getValue(["settings"])["fields_with_autocomplete"];

  const fieldIndex = known_fields.findIndex(
    (item) => item.header_name === nazwa_headera
  );
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

  if (GM_getValue(["settings"])["optimize"]) {
    optimizePageLayout();
  }
}

function configurePopupParent(fieldOfIntrest) {
  const parent = document.createElement("div");
  parent.style.position = "absolute";
  parent.style.backgroundColor = "invisible";
  parent.style.borderRadius = "0.1rem";
  parent.style.left =
    fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + +"px";
  parent.style.top =
    fieldOfIntrest.getBoundingClientRect().top + window.scrollY + "px";
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
  const patientInfos = document.querySelectorAll(
    "#header .templateEditPageSubTitle b"
  );
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
  return age;
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
  suggestionText.style.justifyContent = "space-between";
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
          const falseVariant = modifiedFragment
            .substring(tenaryIndex + 1)
            .replaceAll("'", "");
          const textBool = true;
          if (boolArray[key + "_" + local_index] == undefined) {
            boolArray[key + "_" + local_index] = {
              textBool,
              trueVariant,
              falseVariant,
            };
          }
          let output = `<span style="color:#ffffc2; font-style:oblique;" id="${key + "_" + local_index
            }"> [${boolArray[key + "_" + local_index].textBool
              ? trueVariant
              : falseVariant
            }]</span>`;
          // if(trueVariant == '  '){
          //   output = `<span style="text-decoration: line-through; color: #6F0001;" id="${key + '_' + local_index}"> </span> [${falseVariant}]`;
          //   boolArray[key + '_' + local_index].textBool = false;
          // }
          line =
            line.substring(0, variableStart) +
            output +
            line.substring(variableEnd + 1);
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
    <button id="paste_button" style="min-width:50%;">  ${pasted_input ? "Wyłącz auto-wklej" : " Auto-wklej"
      } </button> </div>`;
    suggestionElement.appendChild(suggestionButtons);
  }

  function updateSuggestionText(targetId) {
    const target = suggestionElement.querySelector(`#${targetId}`);
    target.innerHTML = ` [${boolArray[targetId].textBool
      ? boolArray[targetId].trueVariant
      : boolArray[targetId].falseVariant
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

  if (fieldOfIntrest.value == "" && json_lines.disableAutoCopy != true) {
    pasted_input = true;
    copySuggestion();
    updatePasteButton();
  }

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
      while (
        localHTML.indexOf(
          `<span style="color:yellow; font-style:oblique;" id="`
        ) != -1
      ) {
        const beginingReplace = localHTML.indexOf(
          `<span style="color:yellow; font-style:oblique;" id="`
        );
        let replacementHTML = localHTML.substring(beginingReplace);
        const endingReplace = localHTML.indexOf("</span>") + "</span>".length;
        replacementHTML = localHTML.substring(0, endingReplace);
        targetId = replacementHTML.substring(
          replacementHTML.indexOf(`id="`) + `id="`.length,
          replacementHTML.indexOf(
            `"`,
            replacementHTML.indexOf(`id="`) + `id="`.length
          )
        );
        let inverseValue = `${!boolArray[targetId].textBool
          ? boolArray[targetId].trueVariant
          : boolArray[targetId].falseVariant
          }`;
        // console.log(line.innerHTML);
        replacementLine =
          localHTML.substring(0, beginingReplace) +
          inverseValue +
          localHTML.substring(endingReplace);
        replacementLine = replacementLine
          .replaceAll("[", "")
          .replaceAll("]", "")
          .replace(/\s+/g, " ")
          .trim();
        localHTML = replacementLine;
        // console.log(replacementLine);
      }
      if (textInputSuggestion.indexOf(localHTML) != -1) {
        // console.log('Replacingu: ');
        replacementLine = localText
          .replaceAll("[", "")
          .replaceAll("]", "")
          .replace(/\s+/g, " ")
          .trim();
        // textInputSuggestion = textInputSuggestion.substring(textInputSuggestion.indexOf(localHTML)) + replacementLine + textInputSuggestion.substring(textInputSuggestion.substring(textInputSuggestion.indexOf(localHTML) + replacementLine.length));
        textInputSuggestion = textInputSuggestion.replace(
          localHTML,
          replacementLine
        );
      } else {
        replacementLine = localText
          .replaceAll("[", "")
          .replaceAll("]", "")
          .replace(/\s+/g, " ")
          .trim();
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

function updateFieldHeight(
  fieldOfIntrest,
  parent,
  popup,
  minimal_przedmiotowe_suggestion_height
) {
  marg_bottom = parseFloat(
    window.getComputedStyle(fieldOfIntrest).marginBottom
  );
  parent.style.left =
    fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + "px";
  parent.style.top =
    fieldOfIntrest.getBoundingClientRect().top + window.scrollY + "px";
  if (
    fieldOfIntrest.getBoundingClientRect().height >
    popup.getBoundingClientRect().height
  ) {
    popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
  } else {
    if (
      fieldOfIntrest.getBoundingClientRect().height >
      minimal_przedmiotowe_suggestion_height
    ) {
      popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
    } else {
      fieldOfIntrest.style.height =
        minimal_przedmiotowe_suggestion_height + marg_bottom + "px";
      popup.style.height = fieldOfIntrest.getBoundingClientRect().height + "px";
    }
  }
  parent.style.left =
    fieldOfIntrest.getBoundingClientRect().right + 20 + window.scrollX + "px";
}

function autofill_text_fields(fieldJson) {
  for (let fieldNamesArray of Object.values(fieldJson.user_configurable_text)) {
    for (let fieldName of Object.keys(fieldNamesArray)) {
      const fieldOfIntrest = document.getElementsByName(fieldName)[0];
      fieldOfIntrest.style.position = "relative";

      const parent = configurePopupParent(fieldOfIntrest);
      const popup = configurePopup();

      const suggestionText = configureSuggestion(
        fieldOfIntrest,
        fieldNamesArray[fieldName]
      );

      const min_width = "60%";
      fieldOfIntrest.style = `min-width:${min_width};`;
      popup.appendChild(suggestionText);
      parent.appendChild(popup);

      window.addEventListener("resize", function () {
        updateFieldHeight(
          fieldOfIntrest,
          parent,
          popup,
          minimal_przedmiotowe_suggestion_height
        );
      });
      window.addEventListener("onclick", function () {
        updateFieldHeight(
          fieldOfIntrest,
          parent,
          popup,
          minimal_przedmiotowe_suggestion_height
        );
      });
      fieldOfIntrest.addEventListener("resize", function () {
        updateFieldHeight(
          fieldOfIntrest,
          parent,
          popup,
          minimal_przedmiotowe_suggestion_height
        );
      });
      document.body.appendChild(parent);

      const minimal_przedmiotowe_suggestion_height =
        popup.getBoundingClientRect().height;
      updateFieldHeight(
        fieldOfIntrest,
        parent,
        popup,
        minimal_przedmiotowe_suggestion_height
      );

      const resizeObserver = new ResizeObserver((entries) => {
        window.dispatchEvent(new Event("resize"));
      });

      resizeObserver.observe(fieldOfIntrest);
    }
  }
}

function handleNRS() {
  button_panel = document.getElementById("buttons");
  button_panel.querySelector(
    "ul"
  ).innerHTML += `<li style="margin-left:0;margin-right:10px;display:inline;">
  <button id="nrs" class="mdl-button editTemplateButtons mdl-js-button mdl-button--raised mdl-js-ripple-effect" type="button" style="background-color: #B2F797; border-radius:4px;"> Wszystko ok </button>
  </li>`;

  document.getElementById("nrs").onclick = automate_NRS;

  function automate_NRS() {
    // document.getElementsByName("rola_3733_default_values_button")[0].click();
    document
      .getElementsByName(
        "karta_zywienia_asystujacy_l_user_id_default_values_button"
      )[0]
      .click();
    document
      .getElementsByName("karta_zywienia_dataczas_default_values_button")[0]
      .click();
    document
      .getElementById("karta_zywienia_nrs_pogorszenie_stanu_dozyw1")
      .click();
    document.getElementById("karta_zywienia_nrs_nasilenie_choroby1").click();
    document.getElementsByName("btn_ok")[0].click();
  }
}

function autofill_checkboxes(fieldJson) {
  const buttonmount = document.getElementById(
    "skierowanie_opis_skierowania_all"
  );
  const textField = buttonmount.querySelector(
    'textarea[name="skierowanie_opis_skierowania"]'
  );

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
  if (
    fieldJson["user_defined_packets"][testCategoryElement.value] != undefined
  ) {
    for (let packet of Object.values(
      fieldJson["user_defined_packets"][testCategoryElement.value]
    )) {
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

function optimizePageLayout() {
  const mainTable = document?.querySelector(
    'table[border="1"][cellspacing="0"][cellpadding="2"][bgcolor="#d3d3d3"][class="templateEditTable"]'
  );
  // console.log(mainTable);
  mainTable.style = "min-width:95%;";
}

function fixMyView() {
  const tableHeader = document.querySelector('body > center > form > table.templateListTable');
  const tableRows = tableHeader.querySelectorAll('tr.rowlist');
  // console.log(tableRows);
  for (let row of tableRows) {
    const dataDIV = row.querySelector('td > table:nth-child(2) > tbody > tr:nth-child(2) > td > div');
    if (dataDIV.textContent != '') {
      // console.log(row.querySelector('td > table:nth-child(2) > tbody > tr:nth-child(2) > td > div').textContent);
      // row.style.background = 'red';
      const leftCollumn = dataDIV.querySelector('td[class="templateListColumnTd mdl-data-table__cell--non-numeric templateListSeparatorColumn sdw"]');
      const middleCollumn = dataDIV.querySelector('td[class="templateListColumnTd mdl-data-table__cell--non-numeric templateListSeparatorColumn sdr"]');
      const rightCollumn = dataDIV.querySelector('td[class="templateListColumnTd mdl-data-table__cell--non-numeric templateListSeparatorColumn sbp"]');
      const lowerDrawer = dataDIV.querySelector('td[colspan="3"][class="templateListColumnTd mdl-data-table__cell--non-numeric templateListSeparatorColumn sl"]');
      // console.log(lowerDrawer);
      // leftCollumn.style.background = 'yellow';
      // middleCollumn.style.background = 'green';
      // rightCollumn.style.background = 'blue';
      // lowerDrawer.style.background = 'gray';
    }
  }
} 
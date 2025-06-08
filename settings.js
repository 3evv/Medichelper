const drugs_storage = localStorage.getItem('Drugs');
console.log(drugs_storage)
//  localStorage.setItem('Enable_plugin', "false");

document.addEventListener('DOMContentLoaded', function() {
    
        
        let drugs_settings = [];
        if(drugs_storage) {
            Object.assign(drugs_settings, JSON.parse(drugs_storage));
            redrawTable();
        };
        let editIndex = -1; // Index of the entry being edited, -1 means no editing

        function addEntry() {
            const tableBody = document.querySelector('#drugTable tbody');
            const newRow = tableBody.insertRow();
            newRow.innerHTML = `
                <td><input type="text" id="id_leku${drugs_settings.length}" class="editable"></td>
                <td><input type="text" id="nazwa_leku${drugs_settings.length}" class="editable"></td>
                <td><input type="checkbox" onclick="toggleDangerous(this, ${drugs_settings.length})"></td>
                <td><input type="checkbox" onclick="toggleDangerous(this, ${drugs_settings.length})"></td>
                <td> <button onclick="moveDown(${drugs_settings.length})">Schemat</button></td>
                <td>
                    <button onclick="removeEntry(${drugs_settings.length})">Usuń</button>
                    <button onclick="moveUp(${drugs_settings.length})">W górę</button>
                    <button onclick="moveDown(${drugs_settings.length})">W dół</button>
                </td>
            `;
            
            drugs_settings.push({ id: '', name: '', autoprescribe: false, dorazny: false, default_scheme: [], index: drugs_settings.length});
        }

        function removeEntry(index) {
            const tableBody = document.querySelector('#drugTable tbody');
            tableBody.deleteRow(index + 1); // +1 because of the header
            drugs_settings.splice(index, 1);
        }

        function moveUp(index) {
            if (index > 0) {
                const temp = drugs_settings[index];
                drugs_settings[index] = drugs_settings[index - 1];
                drugs_settings[index - 1] = temp;
                redrawTable();
            }
        }

        function moveDown(index) {
            if (index < drugs_settings.length - 1) {
                const temp = drugs_settings[index];
                drugs_settings[index] = drugs_settings[index + 1];
                drugs_settings[index + 1] = temp;
                redrawTable();
            }
        }

        function toggleAutoprescribe(checkbox, index) {
            drugs_settings[index].autoprescribe = checkbox.checked;
        }

        function saveChanges() {
            console.log('Saving changes:', drugs_settings);
            localStorage.setItem("Drugs", JSON.stringify(drugs_settings));
            alert('Zapisane.');
        }

        function discardChanges() {
            const drugs_storage = localStorage.getItem('Drugs'); // Reset to backup
            if(drugs_storage) {
            Object.assign(drugs_settings, JSON.parse(drugs_storage));
            } else {
                drugs_settings = [];
                addEntry();
            }
            
            redrawTable();
        }

        function redrawTable() {
            const tableBody = document.querySelector('#drugTable tbody');
            tableBody.innerHTML = ''; // Clear the current body content
            drugs_settings.forEach((drug, index) => {
                const newRow = tableBody.insertRow();
                newRow.innerHTML = `
                    <td><input type="text" value="${drug.id}" class="editable"></td>
                    <td><input type="text" value="${drug.name}" class="editable"></td>
                    <td><input type="checkbox" ${drug.autoprescribe ? 'checked' : ''}" onclick="toggleDangerous(this, ${index})"></td>
                    <td><input type="checkbox" onclick="toggleDangerous(this, ${index})"></td>
                    <td> <button onclick="openPrescriptionSchedule(${index})">Schemat</button></td>
                    
                    <td>
                        <button onclick="removeEntry(${index})">Usuń</button>
                        <button onclick="moveUp(${index})">W górę</button>
                        <button onclick="moveDown(${index})">W dół</button>
                    </td>
                `;
            });
        }

        document.getElementById('AddDrugButton').addEventListener('click', () => {
            addEntry();
        });
        document.getElementById('saveChangesButton').addEventListener('click', () => {
            saveChanges();
        });
        document.getElementById('DiscardButton').addEventListener('click', () => {
            discardChanges();
        });


        // Initial setup, add an entry when the page loads
        // drugs_settings.push({ id: '1', name: 'Drug A', autoprescribe: true });
        // drugs_settings.push({ id: '2', name: 'Drug B', autoprescribe: false });

        if(drugs_settings.length === 0) {
                addEntry();
        };
        
        document.getElementById('drugTable').onchange = function() {
            console.log('here');
        };
        const drugs_settingsBackup = JSON.parse(JSON.stringify(drugs_settings)); // Backup for discard changes
        redrawTable();

})
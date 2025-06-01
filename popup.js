document.addEventListener('DOMContentLoaded', function() {
    // Pre-fill the text field when the popup loads
    let poleBadaniePrzedmiotowe = document.getElementById('badanie_przedmiotowe');
    poleBadaniePrzedmiotowe.value = 'Wstępne dane do badania';
    
    // Display a message next to the input field
    var statusMessageElement = document.getElementById('statusMessage');
    statusMessageElement.textContent = 'Text filled';  // This will show "Text filled" next to the input field
});

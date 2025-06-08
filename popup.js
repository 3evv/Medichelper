document.addEventListener('DOMContentLoaded', function() {


    let logo = document.getElementById("Logo");
    let Logo_holder = document.getElementById("Logo_holder");
    // popupbox.style.backgroundColor = "#0d228a";

    // JavaScript to handle the on/off functionality (optional)
        // console.log(localStorage.getItem('Enable_plugin'));
        // console.log( "false" != localStorage.getItem('Enable_plugin'));
        const toggleSwitch = document.getElementById('toggleSwitch');

        toggleSwitch.checked = ("false" != localStorage.getItem('Enable_plugin'));

        if (toggleSwitch.checked) {
            logo.style.filter = 'none';
        } else {
            logo.style.filter = 'grayscale()';
        }

        toggleSwitch.addEventListener('change', function() {
            if(this.checked) {
                localStorage.setItem('Enable_plugin', 'true');
                // window.enablePlugin = localStorage.getItem('Enable_plugin');
            } else {
                localStorage.setItem('Enable_plugin', "false");
                // window.enablePlugin = localStorage.getItem('Enable_plugin');
                // background-color: #0d228a;
                // console.log('dis');
            }
            logo.style.filter = this.checked ? 'none' : 'grayscale()';
            // console.log(localStorage.getItem('Enable_plugin'));
        });

            document.getElementById("Settings")
           Logo_holder.addEventListener('mouseover', function() {
                // document.getElementById('content').style.display = 'block'; // Show content
                logo.style.filter = 'blur(1.5px)';
                logo.style.transition = 'all 0.25s ease-in-out';
                document.getElementById("Settings").style.display = 'block';
            });

            Logo_holder.addEventListener('mouseout', function() {
                logo.style.filter = '';
                document.getElementById("Settings").style.display = 'none'; // Hide content
            });

            Logo_holder.addEventListener('click', function() {
                window.open('settings.html')
            });
});

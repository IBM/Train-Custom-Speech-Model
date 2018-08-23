function checkLMStatus() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let result = JSON.parse(this.responseText);
      document.getElementById('model').innerHTML = result.name;
      document.getElementById('baseModel').innerHTML = result.base_model_name;
      document.getElementById("dialect").innerHTML = result.dialect;
      document.getElementById('language').innerHTML = result.language;
      document.getElementById('status').innerHTML = result.status;
      let button = document.getElementById('formButton');
      if (result.status === 'available') {
        button.innerHTML = 'Try it';
        button.disabled = false;
      } else {
        let text = button.innerHTML.concat('.');
        if (text.length > 4) {
          text = '.';
        }
        button.innerHTML = text;
        setTimeout(checkLMStatus, 2000);
      }
    }
  };
  xhttp.open("GET", "/api/getModel", true);
  xhttp.send();
}
